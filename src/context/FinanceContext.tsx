import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { 
  Conta, 
  Entrada, 
  Parcelamento, 
  Family, 
  Categoria, 
  ResumoFinanceiro,
  FamilyMember
} from '../types/finance';
import { 
  calcularResumoMes, 
  calcularSaldoInicialDoMes,
  getTodayBR, 
  getPeriodo, 
} from '../utils/finance';
import { 
  calcularAlertasFinanceiros, 
  solicitarPermissaoNotificacoes, 
  dispararNotificacaoNativa, 
  AlertaNotificacao 
} from '../utils/notifications';
import { 
  AppUser,
  DEFAULT_NEW_CATEGORIAS,
  subscribeToFamily,
  subscribeToMembers,
  subscribeToCategorias,
  subscribeToContas,
  subscribeToEntradas,
  subscribeToParcelamentos,
  dbAddConta,
  dbUpdateConta,
  dbDeleteConta,
  dbAddEntrada,
  dbUpdateEntrada,
  dbDeleteEntrada,
  dbAddCategoria,
  dbDeleteCategoria,
  dbAddMember,
  dbDeleteMember,
  dbUpdateParcelamento,
  dbUpdateFamilySaldos,
  dbUpdateFamilyRecorrentes,
  dbUpdateFamilyDetails,
  dbJoinFamilyByCode,
  logoutUser
} from '../services/financeService';
import { 
  MATHEUS_FAMILY, 
  MATHEUS_CATEGORIAS, 
  MATHEUS_ENTRADAS, 
  MATHEUS_CONTAS, 
  MATHEUS_PARCELAMENTOS,
  MATHEUS_RECORRENTES,
  MATHEUS_MEMBERS
} from '../data/matheusData';

interface FinanceContextType {
  user: AppUser | null;
  setUser: (user: AppUser | null) => void;
  logout: () => Promise<void>;
  family: Family;
  membros: FamilyMember[];
  categorias: Categoria[];
  contas: Conta[];
  entradas: Entrada[];
  parcelamentos: Parcelamento[];
  recorrentes: string[];
  mesSelecionado: string;
  setMesSelecionado: (mes: string) => void;
  saldoInicial: number;
  setSaldoInicial: (novoSaldo: number) => void;
  setSaldoInicialDoMes: (mes: string, novoSaldo: number) => void;
  resumo: ResumoFinanceiro;
  alertasAtivos: AlertaNotificacao[];
  isSyncing: boolean;
  modoEscuro: boolean;
  toggleModoEscuro: () => void;
  notificacoesAtivas: boolean;
  setNotificacoesAtivas: (v: boolean) => void;
  testarNotificacaoNativa: () => Promise<{ success: boolean; message: string }>;
  addConta: (data: Omit<Conta, 'id' | 'family_id' | 'periodo' | 'competencia'>) => Promise<void>;
  updateConta: (id: string, data: Partial<Conta>) => Promise<void>;
  deleteConta: (id: string) => Promise<void>;
  marcarContaComoPaga: (id: string, dataPagamento?: string) => Promise<void>;
  desfazerPagamentoConta: (id: string) => Promise<void>;
  addEntrada: (data: Omit<Entrada, 'id' | 'family_id' | 'competencia'>) => Promise<void>;
  updateEntrada: (id: string, data: Partial<Entrada>) => Promise<void>;
  deleteEntrada: (id: string) => Promise<void>;
  marcarEntradaComoRecebida: (id: string) => Promise<void>;
  desfazerRecebimentoEntrada: (id: string) => Promise<void>;
  pagarProximaParcela: (parcelamentoId: string) => Promise<void>;
  anteciparParcelamento: (parcelamentoId: string) => Promise<void>;
  cancelarParcelamento: (parcelamentoId: string) => Promise<void>;
  updateFamily: (data: Partial<Family>) => Promise<void>;
  updateFamilySettings: (nome: string, fechamentoDia: number) => Promise<void>;
  gerarNovoCodigoConvite: () => Promise<string>;
  addCategoria: (nome: string, tipo?: 'Fixa' | 'Variável' | 'Imprevisto') => Promise<void>;
  deleteCategoria: (id: string) => Promise<void>;
  encerrarRecorrente: (nome: string) => Promise<void>;
  addMembro: (nome: string, email?: string, role?: 'Administrador' | 'Membro') => Promise<void>;
  removeMembro: (id: string) => Promise<void>;
  adicionarMembro: (nome: string, role?: 'Administrador' | 'Membro') => Promise<void>;
  removerMembro: (id: string) => Promise<void>;
  entrarEmOutraFamilia: (codigo: string) => Promise<{ success: boolean; message: string }>;
  syncFromSupabase: () => Promise<void>;
}

const EMPTY_FAMILY: Family = {
  id: '',
  nome: 'Minha Família',
  invite_code: '------',
  fechamento_dia: 15,
};

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => {
    localStorage.removeItem('mcf_local_user');
    sessionStorage.removeItem('mcf_local_user');

    const local = localStorage.getItem('mcf_auth_user_v2');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {}
    }
    const session = sessionStorage.getItem('mcf_auth_user_v2');
    if (session) {
      try {
        return JSON.parse(session);
      } catch (e) {}
    }
    return null;
  });

  const logout = async () => {
    await logoutUser();
    localStorage.removeItem('mcf_auth_user_v2');
    localStorage.removeItem('mcf_manter_conectado');
    sessionStorage.removeItem('mcf_auth_user_v2');
    setUser(null);
  };

  // Modo Escuro Funcional
  const [modoEscuro, setModoEscuro] = useState<boolean>(() => {
    const saved = localStorage.getItem('mcf_theme');
    return saved !== null ? saved === 'dark' : true;
  });

  useEffect(() => {
    localStorage.setItem('mcf_theme', modoEscuro ? 'dark' : 'light');
    if (modoEscuro) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [modoEscuro]);

  const toggleModoEscuro = () => {
    setModoEscuro((prev) => !prev);
  };

  const activeFamilyId = user?.family_id || '';
  const isMatheusFamily = activeFamilyId === 'fam-camargo';

  const [family, setFamily] = useState<Family>(() => (isMatheusFamily ? MATHEUS_FAMILY : EMPTY_FAMILY));
  const [membros, setMembros] = useState<FamilyMember[]>(() => (isMatheusFamily ? MATHEUS_MEMBERS : []));
  const [categorias, setCategorias] = useState<Categoria[]>(() => (isMatheusFamily ? MATHEUS_CATEGORIAS : []));
  const [contas, setContas] = useState<Conta[]>(() => (isMatheusFamily ? MATHEUS_CONTAS : []));
  const [entradas, setEntradas] = useState<Entrada[]>(() => (isMatheusFamily ? MATHEUS_ENTRADAS : []));
  const [parcelamentos, setParcelamentos] = useState<Parcelamento[]>(() => (isMatheusFamily ? MATHEUS_PARCELAMENTOS : []));
  const [recorrentes, setRecorrentes] = useState<string[]>(() => (isMatheusFamily ? MATHEUS_RECORRENTES : []));
  const [manualSaldos, setManualSaldos] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = isMatheusFamily ? { '2026-09': 595.26 } : {};
    return init;
  });

  const [mesSelecionado, setMesSelecionado] = useState<string>('2026-10');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Sincronização em tempo real com o Firestore exclusiva para a família do usuário logado
  useEffect(() => {
    if (!activeFamilyId) {
      setFamily(EMPTY_FAMILY);
      setMembros([]);
      setCategorias([]);
      setContas([]);
      setEntradas([]);
      setParcelamentos([]);
      setRecorrentes([]);
      setManualSaldos({});
      return;
    }

    setIsSyncing(true);

    if (activeFamilyId === 'fam-camargo') {
      setFamily(MATHEUS_FAMILY);
      setMembros(MATHEUS_MEMBERS);
      setCategorias(MATHEUS_CATEGORIAS);
      setContas(MATHEUS_CONTAS);
      setEntradas(MATHEUS_ENTRADAS);
      setParcelamentos(MATHEUS_PARCELAMENTOS);
      setRecorrentes(MATHEUS_RECORRENTES);
      setManualSaldos({ '2026-09': 595.26 });
    } else {
      setFamily({
        id: activeFamilyId,
        nome: `Família de ${user?.nome || 'Usuário'}`,
        invite_code: '------',
        fechamento_dia: 15,
      });
      setMembros([]);
      setCategorias(DEFAULT_NEW_CATEGORIAS as Categoria[]);
      setContas([]);
      setEntradas([]);
      setParcelamentos([]);
      setRecorrentes([]);
      setManualSaldos({});
    }

    const unsubFam = subscribeToFamily(activeFamilyId, (famData, saldos, recs) => {
      setFamily(famData);
      setManualSaldos(saldos);
      setRecorrentes(recs);
      setIsSyncing(false);
    });

    const unsubMembers = subscribeToMembers(activeFamilyId, (items) => {
      setMembros(items);
    });

    const unsubCats = subscribeToCategorias(activeFamilyId, (items) => {
      if (items.length > 0) {
        setCategorias(items);
      }
    });

    const unsubContas = subscribeToContas(activeFamilyId, (items) => {
      setContas(items);
      setIsSyncing(false);
    });

    const unsubEntradas = subscribeToEntradas(activeFamilyId, (items) => {
      setEntradas(items);
    });

    const unsubParcs = subscribeToParcelamentos(activeFamilyId, (items) => {
      setParcelamentos(items);
    });

    return () => {
      unsubFam();
      unsubMembers();
      unsubCats();
      unsubContas();
      unsubEntradas();
      unsubParcs();
    };
  }, [activeFamilyId]);

  const setSaldoInicialDoMes = (mes: string, novoSaldo: number) => {
    if (!activeFamilyId) return;
    const num = isNaN(novoSaldo) ? 0 : Math.round(novoSaldo * 100) / 100;
    setManualSaldos((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((k) => {
        if (k > mes) {
          delete updated[k];
        }
      });
      updated[mes] = num;
      dbUpdateFamilySaldos(activeFamilyId, updated).catch(console.warn);
      return updated;
    });
  };

  const setSaldoInicial = (novoSaldo: number) => {
    setSaldoInicialDoMes(mesSelecionado, novoSaldo);
  };

  const saldoInicial = useMemo(() => {
    return calcularSaldoInicialDoMes(mesSelecionado, contas, entradas, manualSaldos);
  }, [mesSelecionado, contas, entradas, manualSaldos]);

  // Notificações no Aparelho / Celular
  const [notificacoesAtivas, setNotificacoesAtivasState] = useState<boolean>(() => {
    const saved = localStorage.getItem('mcf-notif');
    return saved !== null ? saved === '1' : true;
  });

  const setNotificacoesAtivas = (v: boolean) => {
    setNotificacoesAtivasState(v);
    localStorage.setItem('mcf-notif', v ? '1' : '0');
  };

  const syncFromSupabase = async () => {};

  const resumo = useMemo(() => {
    return calcularResumoMes(contas, entradas, mesSelecionado, family.fechamento_dia, saldoInicial);
  }, [contas, entradas, mesSelecionado, family.fechamento_dia, saldoInicial]);

  const alertasAtivos = useMemo(() => {
    return calcularAlertasFinanceiros(contas, entradas, parcelamentos, resumo.saldoProjetado);
  }, [contas, entradas, parcelamentos, resumo.saldoProjetado]);

  const testarNotificacaoNativa = async (): Promise<{ success: boolean; message: string }> => {
    const granted = await solicitarPermissaoNotificacoes();
    if (!granted) {
      return {
        success: false,
        message: 'Permissão de notificação não concedida ou bloqueada no navegador. O envio pelo WhatsApp continua 100% ativo!'
      };
    }

    const totalAlertas = alertasAtivos.length;
    const corpo = totalAlertas > 0
      ? `Você possui ${totalAlertas} conta(s) precisando de atenção (vencendo ou em atraso).`
      : 'Tudo em dia! Seus alertas financeiros estão configurados e funcionando no aparelho.';

    const disparou = dispararNotificacaoNativa('🔔 Meu Controle Financeiro', corpo);
    return {
      success: disparou,
      message: disparou
        ? 'Notificação enviada para o seu aparelho com sucesso!'
        : 'Permissão concedida! As notificações estão ativas.'
    };
  };

  // CRUD Contas no Firestore
  const addConta = async (newContaData: Omit<Conta, 'id' | 'family_id' | 'periodo' | 'competencia'>) => {
    if (!activeFamilyId) return;
    const competencia = newContaData.vencimento.slice(0, 7);
    const periodo = getPeriodo(newContaData.vencimento, family.fechamento_dia);
    const newId = `cnt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const novaConta: Conta = {
      ...newContaData,
      id: newId,
      family_id: activeFamilyId,
      competencia,
      periodo,
    };

    setContas((prev) => [...prev, novaConta]);
    await dbAddConta(activeFamilyId, novaConta);

    if (newContaData.recorrente) {
      const exists = recorrentes.some((r) => r.toLowerCase() === newContaData.nome.toLowerCase());
      if (!exists) {
        const updatedRecs = [...recorrentes, newContaData.nome];
        setRecorrentes(updatedRecs);
        await dbUpdateFamilyRecorrentes(activeFamilyId, updatedRecs);
      }
    }
  };

  const updateConta = async (id: string, updates: Partial<Conta>) => {
    if (!activeFamilyId) return;
    let computedUpdates = { ...updates };
    if (updates.vencimento) {
      computedUpdates.competencia = updates.vencimento.slice(0, 7);
      computedUpdates.periodo = getPeriodo(updates.vencimento, family.fechamento_dia);
    }

    setContas((prev) => prev.map((c) => (c.id === id ? { ...c, ...computedUpdates } : c)));
    await dbUpdateConta(activeFamilyId, id, computedUpdates);
  };

  const deleteConta = async (id: string) => {
    if (!activeFamilyId) return;
    setContas((prev) => prev.filter((c) => c.id !== id));
    await dbDeleteConta(activeFamilyId, id);
  };

  const marcarContaComoPaga = async (id: string, dataPagamento?: string) => {
    const data_pagamento = dataPagamento || getTodayBR();
    await updateConta(id, {
      situacao: 'pago',
      data_pagamento,
    });
  };

  const desfazerPagamentoConta = async (id: string) => {
    await updateConta(id, {
      situacao: 'pendente',
      data_pagamento: null,
    });
  };

  // CRUD Entradas no Firestore
  const addEntrada = async (newEntradaData: Omit<Entrada, 'id' | 'family_id' | 'competencia'>) => {
    if (!activeFamilyId) return;
    const competencia = newEntradaData.data_prevista.slice(0, 7);
    const newId = `ent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const novaEntrada: Entrada = {
      ...newEntradaData,
      id: newId,
      family_id: activeFamilyId,
      competencia,
    };

    setEntradas((prev) => [...prev, novaEntrada]);
    await dbAddEntrada(activeFamilyId, novaEntrada);
  };

  const updateEntrada = async (id: string, updates: Partial<Entrada>) => {
    if (!activeFamilyId) return;
    let computedUpdates = { ...updates };
    if (updates.data_prevista) {
      computedUpdates.competencia = updates.data_prevista.slice(0, 7);
    }

    setEntradas((prev) => prev.map((e) => (e.id === id ? { ...e, ...computedUpdates } : e)));
    await dbUpdateEntrada(activeFamilyId, id, computedUpdates);
  };

  const deleteEntrada = async (id: string) => {
    if (!activeFamilyId) return;
    setEntradas((prev) => prev.filter((e) => e.id !== id));
    await dbDeleteEntrada(activeFamilyId, id);
  };

  const marcarEntradaComoRecebida = async (id: string) => {
    const hoje = getTodayBR();
    await updateEntrada(id, {
      situacao: 'recebido',
      data_recebida: hoje,
    });
  };

  const desfazerRecebimentoEntrada = async (id: string) => {
    await updateEntrada(id, {
      situacao: 'previsto',
      data_recebida: null,
    });
  };

  // Parcelamentos no Firestore
  const pagarProximaParcela = async (parcelamentoId: string) => {
    if (!activeFamilyId) return;
    const parc = parcelamentos.find((p) => p.id === parcelamentoId);
    if (!parc) return;

    const contasDoParc = contas
      .filter((c) => c.parcelamento_id === parcelamentoId)
      .sort((a, b) => (a.parcela_numero || 0) - (b.parcela_numero || 0));

    const proximaPendente = contasDoParc.find((c) => c.situacao !== 'pago');
    if (proximaPendente) {
      await marcarContaComoPaga(proximaPendente.id);

      const pagasCount = contasDoParc.filter((c) => c.situacao === 'pago').length + 1;
      if (pagasCount >= parc.total_parcelas) {
        setParcelamentos((prev) =>
          prev.map((p) => (p.id === parcelamentoId ? { ...p, situacao: 'finalizado' } : p))
        );
        await dbUpdateParcelamento(activeFamilyId, parcelamentoId, { situacao: 'finalizado' });
      }
    }
  };

  const anteciparParcelamento = async (parcelamentoId: string) => {
    if (!activeFamilyId) return;
    const hoje = getTodayBR();
    const pendentes = contas.filter(
      (c) => c.parcelamento_id === parcelamentoId && c.situacao !== 'pago' && c.situacao !== 'cancelado'
    );
    for (const c of pendentes) {
      await updateConta(c.id, { situacao: 'pago', data_pagamento: hoje });
    }
    setParcelamentos((prev) =>
      prev.map((p) => (p.id === parcelamentoId ? { ...p, situacao: 'finalizado' } : p))
    );
    await dbUpdateParcelamento(activeFamilyId, parcelamentoId, { situacao: 'finalizado' });
  };

  const cancelarParcelamento = async (parcelamentoId: string) => {
    if (!activeFamilyId) return;
    const pendentes = contas.filter(
      (c) => c.parcelamento_id === parcelamentoId && c.situacao !== 'pago'
    );
    for (const c of pendentes) {
      await updateConta(c.id, { situacao: 'cancelado' });
    }
    setParcelamentos((prev) =>
      prev.map((p) => (p.id === parcelamentoId ? { ...p, situacao: 'finalizado' } : p))
    );
    await dbUpdateParcelamento(activeFamilyId, parcelamentoId, { situacao: 'finalizado' });
  };

  const updateFamily = async (updates: Partial<Family>) => {
    if (!activeFamilyId) return;
    setFamily((prev) => ({ ...prev, ...updates }));
    await dbUpdateFamilyDetails(activeFamilyId, updates);
  };

  const updateFamilySettings = async (nome: string, fechamentoDia: number) => {
    await updateFamily({ nome, fechamento_dia: fechamentoDia });
  };

  const gerarNovoCodigoConvite = async (): Promise<string> => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let novoCodigo = '';
    for (let i = 0; i < 6; i++) {
      novoCodigo += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    await updateFamily({ invite_code: novoCodigo });
    return novoCodigo;
  };

  const addCategoria = async (nome: string, tipo: 'Fixa' | 'Variável' | 'Imprevisto' = 'Variável') => {
    if (!activeFamilyId) return;
    const novaCat: Categoria = {
      id: `cat-${Date.now()}`,
      family_id: activeFamilyId,
      nome: nome.trim(),
      tipo,
    };
    setCategorias((prev) => [...prev, novaCat]);
    await dbAddCategoria(activeFamilyId, novaCat);
  };

  const deleteCategoria = async (id: string) => {
    if (!activeFamilyId) return;
    setCategorias((prev) => prev.filter((c) => c.id !== id));
    await dbDeleteCategoria(activeFamilyId, id);
  };

  const encerrarRecorrente = async (nome: string) => {
    if (!activeFamilyId) return;
    const updated = recorrentes.filter((r) => r !== nome);
    setRecorrentes(updated);
    await dbUpdateFamilyRecorrentes(activeFamilyId, updated);
  };

  const addMembro = async (nome: string, email?: string, role: 'Administrador' | 'Membro' = 'Membro') => {
    if (!activeFamilyId) return;
    const novo: FamilyMember = {
      id: `mem-${Date.now()}`,
      family_id: activeFamilyId,
      nome: nome.trim(),
      email: email?.trim() || undefined,
      role,
    };
    setMembros((prev) => [...prev, novo]);
    await dbAddMember(activeFamilyId, novo);
  };

  const adicionarMembro = async (nome: string, role: 'Administrador' | 'Membro' = 'Membro') => {
    await addMembro(nome, undefined, role);
  };

  const removeMembro = async (id: string) => {
    if (!activeFamilyId) return;
    setMembros((prev) => prev.filter((m) => m.id !== id));
    await dbDeleteMember(activeFamilyId, id);
  };

  const removerMembro = async (id: string) => {
    await removeMembro(id);
  };

  const entrarEmOutraFamilia = async (codigo: string): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return { success: false, message: 'Faça login para entrar em uma família.' };
    }
    const codLimpo = codigo.trim().toUpperCase();
    if (!codLimpo) {
      return { success: false, message: 'Digite um código de 6 dígitos válido.' };
    }

    if (family.invite_code?.toUpperCase() === codLimpo) {
      return { success: true, message: 'Você já faz parte desta família!' };
    }

    const res = await dbJoinFamilyByCode(user.id, user.nome, user.email, codLimpo);
    if (res.success && res.familyId) {
      const updatedUser: AppUser = { ...user, family_id: res.familyId };
      setUser(updatedUser);
      if (localStorage.getItem('mcf_manter_conectado') === 'true') {
        localStorage.setItem('mcf_auth_user_v2', JSON.stringify(updatedUser));
      } else {
        sessionStorage.setItem('mcf_auth_user_v2', JSON.stringify(updatedUser));
      }
    }
    return { success: res.success, message: res.message };
  };

  return (
    <FinanceContext.Provider
      value={{
        user,
        setUser,
        logout,
        family,
        membros,
        categorias,
        contas,
        entradas,
        parcelamentos,
        recorrentes,
        mesSelecionado,
        setMesSelecionado,
        saldoInicial,
        setSaldoInicial,
        setSaldoInicialDoMes,
        resumo,
        alertasAtivos,
        isSyncing,
        modoEscuro,
        toggleModoEscuro,
        notificacoesAtivas,
        setNotificacoesAtivas,
        testarNotificacaoNativa,
        addConta,
        updateConta,
        deleteConta,
        marcarContaComoPaga,
        desfazerPagamentoConta,
        addEntrada,
        updateEntrada,
        deleteEntrada,
        marcarEntradaComoRecebida,
        desfazerRecebimentoEntrada,
        pagarProximaParcela,
        anteciparParcelamento,
        cancelarParcelamento,
        updateFamily,
        updateFamilySettings,
        gerarNovoCodigoConvite,
        addCategoria,
        deleteCategoria,
        encerrarRecorrente,
        addMembro,
        removeMembro,
        adicionarMembro,
        removerMembro,
        entrarEmOutraFamilia,
        syncFromSupabase,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
