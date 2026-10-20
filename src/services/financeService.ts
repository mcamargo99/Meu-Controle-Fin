import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { 
  Family, 
  FamilyMember, 
  Categoria, 
  Conta, 
  Entrada, 
  Parcelamento 
} from '../types/finance';
import { 
  MATHEUS_FAMILY, 
  MATHEUS_MEMBERS, 
  MATHEUS_CATEGORIAS, 
  MATHEUS_CONTAS, 
  MATHEUS_ENTRADAS, 
  MATHEUS_PARCELAMENTOS,
  MATHEUS_RECORRENTES
} from '../data/matheusData';

export interface AppUser {
  id: string;
  uid: string;
  email: string;
  nome: string;
  family_id: string;
  user_metadata?: {
    nome?: string;
  };
}

// Categorias padrão para novas famílias criadas por outros usuários
export const DEFAULT_NEW_CATEGORIAS = [
  { id: 'cat-moradia', nome: 'Moradia', tipo: 'Fixa' },
  { id: 'cat-alimentacao', nome: 'Alimentação', tipo: 'Variável' },
  { id: 'cat-transporte', nome: 'Transporte', tipo: 'Variável' },
  { id: 'cat-saude', nome: 'Saúde', tipo: 'Variável' },
  { id: 'cat-educacao', nome: 'Educação', tipo: 'Fixa' },
  { id: 'cat-lazer', nome: 'Lazer', tipo: 'Variável' },
  { id: 'cat-outros', nome: 'Outros', tipo: 'Imprevisto' },
];

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Gera um ID determinístico e seguro a partir do e-mail
export function getUserIdFromEmail(email: string): string {
  const clean = email.toLowerCase().trim();
  if (clean === 'mc.camargo99@gmail.com') {
    return 'usr-matheus-camargo';
  }
  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    const chr = clean.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  const safeEmail = clean.replace(/[^a-z0-9]/g, '_').slice(0, 24);
  return `usr_${safeEmail}_${Math.abs(hash).toString(36)}`;
}

// Hash determinístico para validação de senha no Firestore
export function hashPassword(password: string, email: string): string {
  const str = `${email.toLowerCase().trim()}::mcf_salt_2026::${password}`;
  let h1 = 0xdeadbeef ^ str.length;
  let h2 = 0x41c6ce57 ^ str.length;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36) + '_' + Math.abs(h1).toString(16);
}

// 1. Login Real Validado no Banco de Dados Firestore
export async function loginWithDatabase(email: string, pass: string): Promise<AppUser> {
  const emailLower = email.toLowerCase().trim();
  if (!emailLower || !pass) {
    throw new Error('Preencha seu e-mail e senha.');
  }

  // Tenta Firebase Auth primeiro se estiver ativo no console
  try {
    await signInWithEmailAndPassword(auth, emailLower, pass);
  } catch (e: any) {
    // Se for erro de credencial explícito do Firebase Auth
    if (e?.code === 'auth/wrong-password' || e?.code === 'auth/invalid-credential') {
      throw new Error('E-mail ou senha incorretos.');
    }
  }

  const userId = getUserIdFromEmail(emailLower);
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  const expectedHash = hashPassword(pass, emailLower);

  // Caso especial: Conta proprietária do Matheus (mc.camargo99@gmail.com)
  if (emailLower === 'mc.camargo99@gmail.com') {
    if (!userSnap.exists()) {
      // Inicializa a conta oficial do Matheus e semeia os dados da Família Camargo no Firestore
      await ensureMatheusFamilySeeded(userId, emailLower, expectedHash);
      return {
        id: userId,
        uid: userId,
        email: emailLower,
        nome: 'Matheus Augusto de Camargo',
        family_id: 'fam-camargo',
        user_metadata: { nome: 'Matheus Augusto de Camargo' },
      };
    } else {
      const data = userSnap.data();
      if (data.password_hash && data.password_hash !== expectedHash) {
        throw new Error('E-mail ou senha incorretos.');
      }
      // Se ainda não tinha hash salvo, salva agora
      if (!data.password_hash) {
        await updateDoc(userRef, { password_hash: expectedHash });
      }
      await ensureMatheusFamilySeeded(userId, emailLower, expectedHash);
      return {
        id: userId,
        uid: userId,
        email: emailLower,
        nome: data.nome || 'Matheus Augusto de Camargo',
        family_id: data.family_id || 'fam-camargo',
        user_metadata: { nome: data.nome || 'Matheus Augusto de Camargo' },
      };
    }
  }

  // Para qualquer outro usuário: PRECISA existir no banco de dados!
  if (!userSnap.exists()) {
    throw new Error('Conta não encontrada! Clique em "Criar conta" abaixo para cadastrar sua família.');
  }

  const userData = userSnap.data();
  if (userData.password_hash !== expectedHash) {
    throw new Error('E-mail ou senha incorretos.');
  }

  return {
    id: userData.id,
    uid: userData.id,
    email: userData.email,
    nome: userData.nome,
    family_id: userData.family_id,
    user_metadata: { nome: userData.nome },
  };
}

// 2. Cadastro Real de Novo Usuário + Criação de Família Isolada no Firestore
export async function registerWithDatabase(email: string, pass: string, nome: string): Promise<AppUser> {
  const emailLower = email.toLowerCase().trim();
  const nomeClean = nome.trim() || emailLower.split('@')[0];

  if (!emailLower || !pass) {
    throw new Error('Preencha todos os campos obrigatórios.');
  }
  if (pass.length < 6) {
    throw new Error('A senha deve ter pelo menos 6 caracteres.');
  }

  const userId = getUserIdFromEmail(emailLower);
  const userRef = doc(db, 'users', userId);
  const existingSnap = await getDoc(userRef);

  if (existingSnap.exists()) {
    throw new Error('Este e-mail já possui cadastro. Faça login com sua senha.');
  }

  // Tenta criar no Firebase Auth caso provedor esteja ativo
  try {
    const res = await createUserWithEmailAndPassword(auth, emailLower, pass);
    if (res.user && nomeClean) {
      await updateProfile(res.user, { displayName: nomeClean });
    }
  } catch (e) {
    // Segue com registro isolado no Firestore
  }

  const passHash = hashPassword(pass, emailLower);

  // Se for o próprio Matheus criando a conta
  if (emailLower === 'mc.camargo99@gmail.com') {
    await ensureMatheusFamilySeeded(userId, emailLower, passHash);
    return {
      id: userId,
      uid: userId,
      email: emailLower,
      nome: 'Matheus Augusto de Camargo',
      family_id: 'fam-camargo',
      user_metadata: { nome: 'Matheus Augusto de Camargo' },
    };
  }

  // Criar UMA NOVA FAMÍLIA 100% ZERADA E ISOLADA para este novo cliente
  const familyId = `fam_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const inviteCode = generateInviteCode();

  const famRef = doc(db, 'families', familyId);
  await setDoc(famRef, {
    id: familyId,
    nome: `Família de ${nomeClean}`,
    owner_uid: userId,
    invite_code: inviteCode,
    fechamento_dia: 15,
    manual_saldos: {},
    recorrentes: [],
    created_at: new Date().toISOString(),
  });

  // Semear apenas categorias básicas e o próprio membro administrador (SEM contas do Matheus!)
  await seedNewFamilyData(familyId, userId, nomeClean, emailLower);

  // Salvar usuário no Firestore
  await setDoc(userRef, {
    id: userId,
    email: emailLower,
    nome: nomeClean,
    password_hash: passHash,
    family_id: familyId,
    created_at: new Date().toISOString(),
  });

  return {
    id: userId,
    uid: userId,
    email: emailLower,
    nome: nomeClean,
    family_id: familyId,
    user_metadata: { nome: nomeClean },
  };
}

export async function resetPassword(email: string) {
  const emailLower = email.toLowerCase().trim();
  const userId = getUserIdFromEmail(emailLower);
  const snap = await getDoc(doc(db, 'users', userId));
  if (!snap.exists() && emailLower !== 'mc.camargo99@gmail.com') {
    throw new Error('Não encontramos nenhuma conta cadastrada com este e-mail.');
  }
  try {
    await sendPasswordResetEmail(auth, emailLower);
  } catch (e) {}
}

export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (e) {}
}

// Garante que a Família Camargo do Matheus está salva no Firestore
export async function ensureMatheusFamilySeeded(userId: string, email: string, passHash?: string) {
  const familyId = 'fam-camargo';
  const famRef = doc(db, 'families', familyId);
  const famSnap = await getDoc(famRef);

  if (!famSnap.exists()) {
    await setDoc(famRef, {
      id: familyId,
      nome: MATHEUS_FAMILY.nome,
      owner_uid: userId,
      invite_code: '740C23',
      fechamento_dia: 15,
      manual_saldos: { '2026-09': 595.26 },
      recorrentes: MATHEUS_RECORRENTES,
      created_at: new Date().toISOString(),
    });

    await seedMatheusData(familyId, userId);
  }

  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      id: userId,
      email,
      nome: 'Matheus Augusto de Camargo',
      password_hash: passHash || '',
      family_id: familyId,
      created_at: new Date().toISOString(),
    });
  }
}

// Semeadura de dados do Matheus (para a Família Camargo)
async function seedMatheusData(familyId: string, ownerUid: string) {
  const batch = writeBatch(db);

  MATHEUS_MEMBERS.forEach((m) => {
    const ref = doc(db, 'families', familyId, 'members', m.id);
    batch.set(ref, { ...m, family_id: familyId, created_at: new Date().toISOString() });
  });

  MATHEUS_CATEGORIAS.forEach((c) => {
    const ref = doc(db, 'families', familyId, 'categorias', c.id);
    batch.set(ref, { ...c, family_id: familyId, created_at: new Date().toISOString() });
  });

  MATHEUS_PARCELAMENTOS.forEach((p) => {
    const ref = doc(db, 'families', familyId, 'parcelamentos', p.id);
    batch.set(ref, { ...p, family_id: familyId, created_at: new Date().toISOString() });
  });

  MATHEUS_CONTAS.forEach((c) => {
    const ref = doc(db, 'families', familyId, 'contas', c.id);
    batch.set(ref, { ...c, family_id: familyId, created_by: ownerUid });
  });

  MATHEUS_ENTRADAS.forEach((e) => {
    const ref = doc(db, 'families', familyId, 'entradas', e.id);
    batch.set(ref, { ...e, family_id: familyId });
  });

  await batch.commit();
}

// Semeadura de dados limpos para um novo usuário qualquer
async function seedNewFamilyData(familyId: string, uid: string, nome: string, email: string) {
  const batch = writeBatch(db);

  const memberId = `mem_${uid.slice(0, 10)}`;
  const memberRef = doc(db, 'families', familyId, 'members', memberId);
  batch.set(memberRef, {
    id: memberId,
    family_id: familyId,
    uid,
    nome,
    email,
    role: 'Administrador',
    created_at: new Date().toISOString(),
  });

  DEFAULT_NEW_CATEGORIAS.forEach((cat) => {
    const catRef = doc(db, 'families', familyId, 'categorias', cat.id);
    batch.set(catRef, {
      ...cat,
      family_id: familyId,
      created_at: new Date().toISOString(),
    });
  });

  await batch.commit();
}

// 3. Subscrições em Tempo Real (Firestore Listeners) por familyId
export function subscribeToFamily(
  familyId: string, 
  onUpdate: (fam: Family, manualSaldos: Record<string, number>, recorrentes: string[]) => void
) {
  const ref = doc(db, 'families', familyId);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      onUpdate(
        {
          id: snap.id,
          nome: data.nome || 'Minha Família',
          invite_code: data.invite_code || '',
          fechamento_dia: data.fechamento_dia || 15,
        },
        data.manual_saldos || {},
        data.recorrentes || []
      );
    }
  });
}

export function subscribeToMembers(familyId: string, onUpdate: (members: FamilyMember[]) => void) {
  const col = collection(db, 'families', familyId, 'members');
  return onSnapshot(col, (snap) => {
    const items = snap.docs.map((d) => ({ ...d.data(), id: d.id } as FamilyMember));
    onUpdate(items);
  });
}

export function subscribeToCategorias(familyId: string, onUpdate: (cats: Categoria[]) => void) {
  const col = collection(db, 'families', familyId, 'categorias');
  return onSnapshot(col, (snap) => {
    const items = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Categoria));
    onUpdate(items);
  });
}

export function subscribeToContas(familyId: string, onUpdate: (contas: Conta[]) => void) {
  const col = collection(db, 'families', familyId, 'contas');
  return onSnapshot(col, (snap) => {
    const items = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Conta));
    onUpdate(items);
  });
}

export function subscribeToEntradas(familyId: string, onUpdate: (entradas: Entrada[]) => void) {
  const col = collection(db, 'families', familyId, 'entradas');
  return onSnapshot(col, (snap) => {
    const items = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Entrada));
    onUpdate(items);
  });
}

export function subscribeToParcelamentos(familyId: string, onUpdate: (parcs: Parcelamento[]) => void) {
  const col = collection(db, 'families', familyId, 'parcelamentos');
  return onSnapshot(col, (snap) => {
    const items = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Parcelamento));
    onUpdate(items);
  });
}

// 4. Operações de Escrita Isoladas por familyId no Firestore
export async function dbAddConta(familyId: string, conta: Conta) {
  const ref = doc(db, 'families', familyId, 'contas', conta.id);
  const clean = JSON.parse(JSON.stringify(conta));
  await setDoc(ref, clean);
}

export async function dbUpdateConta(familyId: string, id: string, updates: Partial<Conta>) {
  const ref = doc(db, 'families', familyId, 'contas', id);
  const clean = JSON.parse(JSON.stringify(updates));
  await updateDoc(ref, clean);
}

export async function dbDeleteConta(familyId: string, id: string) {
  const ref = doc(db, 'families', familyId, 'contas', id);
  await deleteDoc(ref);
}

export async function dbAddEntrada(familyId: string, entrada: Entrada) {
  const ref = doc(db, 'families', familyId, 'entradas', entrada.id);
  const clean = JSON.parse(JSON.stringify(entrada));
  await setDoc(ref, clean);
}

export async function dbUpdateEntrada(familyId: string, id: string, updates: Partial<Entrada>) {
  const ref = doc(db, 'families', familyId, 'entradas', id);
  const clean = JSON.parse(JSON.stringify(updates));
  await updateDoc(ref, clean);
}

export async function dbDeleteEntrada(familyId: string, id: string) {
  const ref = doc(db, 'families', familyId, 'entradas', id);
  await deleteDoc(ref);
}

export async function dbAddCategoria(familyId: string, cat: Categoria) {
  const ref = doc(db, 'families', familyId, 'categorias', cat.id);
  await setDoc(ref, JSON.parse(JSON.stringify(cat)));
}

export async function dbDeleteCategoria(familyId: string, id: string) {
  const ref = doc(db, 'families', familyId, 'categorias', id);
  await deleteDoc(ref);
}

export async function dbAddMember(familyId: string, member: FamilyMember) {
  const ref = doc(db, 'families', familyId, 'members', member.id);
  await setDoc(ref, JSON.parse(JSON.stringify(member)));
}

export async function dbDeleteMember(familyId: string, id: string) {
  const ref = doc(db, 'families', familyId, 'members', id);
  await deleteDoc(ref);
}

export async function dbUpdateParcelamento(familyId: string, id: string, updates: Partial<Parcelamento>) {
  const ref = doc(db, 'families', familyId, 'parcelamentos', id);
  await updateDoc(ref, JSON.parse(JSON.stringify(updates)));
}

export async function dbUpdateFamilySaldos(familyId: string, manualSaldos: Record<string, number>) {
  const ref = doc(db, 'families', familyId);
  await updateDoc(ref, { manual_saldos: manualSaldos });
}

export async function dbUpdateFamilyRecorrentes(familyId: string, recorrentes: string[]) {
  const ref = doc(db, 'families', familyId);
  await updateDoc(ref, { recorrentes });
}

export async function dbUpdateFamilyDetails(familyId: string, updates: Partial<Family>) {
  const ref = doc(db, 'families', familyId);
  await updateDoc(ref, JSON.parse(JSON.stringify(updates)));
}

// Entrar em outra família usando o código de convite
export async function dbJoinFamilyByCode(
  userUid: string, 
  userNome: string, 
  userEmail: string, 
  inviteCode: string
): Promise<{ success: boolean; message: string; familyId?: string }> {
  const code = inviteCode.trim().toUpperCase();
  const q = query(collection(db, 'families'), where('invite_code', '==', code));
  const snap = await getDocs(q);

  if (snap.empty) {
    return { success: false, message: 'Código de convite não encontrado no banco de dados.' };
  }

  const targetDoc = snap.docs[0];
  const targetFamilyId = targetDoc.id;
  const targetFamilyData = targetDoc.data();

  // Atualizar perfil do usuário para apontar para a nova família
  await updateDoc(doc(db, 'users', userUid), { family_id: targetFamilyId });

  // Adicionar usuário na subcoleção de membros da família
  const memberId = `mem_${userUid.slice(0, 10)}`;
  const memberRef = doc(db, 'families', targetFamilyId, 'members', memberId);
  await setDoc(memberRef, {
    id: memberId,
    family_id: targetFamilyId,
    uid: userUid,
    nome: userNome,
    email: userEmail,
    role: 'Membro',
    created_at: new Date().toISOString(),
  });

  return { 
    success: true, 
    message: `Conectado com sucesso à ${targetFamilyData.nome}!`,
    familyId: targetFamilyId
  };
}
