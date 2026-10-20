const fs = require('fs');
const path = require('path');

const csvRaw = `Conta,Categoria,Tipo,Competência,Vencimento,Valor,Situação,Pagamento
Taxa Banco,Moradia,Fixa,2026-09,07/09/2026,16,pago,07/09/2026
Dif. Cartão - Tio Nicole (1/4),Carro,Imprevisto,2026-09,10/09/2026,103.54,pago,07/09/2026
Faculdade - Nicole,Educação,Fixa,2026-09,10/09/2026,257.43,pago,07/09/2026
Perfume - Matheus,Outros,Variável,2026-09,10/09/2026,114.32,pago,07/09/2026
Cartão Atacadão,Cartão,Variável,2026-09,10/09/2026,2420.19,pago,07/09/2026
Condomínio,Moradia,Fixa,2026-09,10/09/2026,426.24,pago,07/09/2026
Financiamento AP,Moradia,Variável,2026-09,13/09/2026,617.32,pago,07/09/2026
Conserto Carro (1/4),Carro,Imprevisto,2026-09,15/09/2026,201.27,pago,07/09/2026
Celular Nicole,Plano Celular,Fixa,2026-09,20/09/2026,35.68,pago,18/09/2026
Cartão Atacadão Mãe,Cartão,Variável,2026-09,20/09/2026,2732.8,pago,18/09/2026
Seguro,Carro,Fixa,2026-09,20/09/2026,120.75,pago,18/09/2026
IPTU,Moradia,Fixa,2026-09,20/09/2026,55.22,pago,18/09/2026
Internet,Internet,Fixa,2026-09,20/09/2026,89.9,pago,18/09/2026
DAS,CNPJ,Fixa,2026-09,21/09/2026,86.05,pago,18/09/2026
Celular Matheus,Plano Celular,Fixa,2026-09,25/09/2026,52.94,pago,21/09/2026
CPFL,Energia,Fixa,2026-09,26/09/2026,170.98,pago,21/09/2026
Multas,Carro,Imprevisto,2026-09,30/09/2026,264.32,pago,07/10/2026
Licenciamento 2026,Carro,Variável,2026-09,30/09/2026,179.26,pago,07/10/2026
Devolução Empréstimo - Mãe (1/5),Carro,Imprevisto,2026-09,30/09/2026,1040,pago,07/10/2026
Doces Personalizados,Aniversário Maitê,Variável,2026-10,03/10/2026,79,pago,03/10/2026
Costureira - Jose,Outros,Imprevisto,2026-10,06/10/2026,35,pago,06/10/2026
Taxa Banco,Moradia,Fixa,2026-10,07/10/2026,16,pago,07/10/2026
Cartão Atacadão,Cartão,Variável,2026-10,10/10/2026,2016.51,pago,07/10/2026
Faculdade - Nicole,Educação,Fixa,2026-10,10/10/2026,257.43,pago,07/10/2026
Condomínio,Moradia,Fixa,2026-10,10/10/2026,426.78,pago,07/10/2026
Dif. Cartão - Tio Nicole (2/4),Carro,Imprevisto,2026-10,10/10/2026,103.54,pago,08/10/2026
Financiamento AP,Moradia,Variável,2026-10,13/10/2026,618.35,pago,07/10/2026
Conserto Carro (2/4),Carro,Imprevisto,2026-10,15/10/2026,201.27,pago,08/10/2026
IPTU,Moradia,Fixa,2026-10,20/10/2026,55.22,pendente,—
Cartão Atacadão Mãe,Cartão,Variável,2026-10,20/10/2026,2531.25,pendente,—
Seguro,Carro,Fixa,2026-10,20/10/2026,120.75,pendente,—
Internet,Internet,Fixa,2026-10,20/10/2026,89.9,pendente,—
Celular Nicole,Internet,Fixa,2026-10,20/10/2026,35.68,pendente,—
DAS,Outros,Imprevisto,2026-10,21/10/2026,86.05,pendente,—
Celular Matheus,Plano Celular,Fixa,2026-10,25/10/2026,52.94,pendente,—
CPFL,Energia,Fixa,2026-10,26/10/2026,170.98,pendente,—
Taxa Banco,Moradia,Fixa,2026-11,07/11/2026,16,pendente,—
Taxa Banco,Moradia,Fixa,2026-11,07/11/2026,16,pendente,—
Condomínio,Moradia,Fixa,2026-11,10/11/2026,426.24,pendente,—
Faculdade - Nicole,Educação,Fixa,2026-11,10/11/2026,257.43,pendente,—
Cartão Atacadão,,Variável,2026-11,10/11/2026,2116.11,pendente,—
Dif. Cartão - Tio Nicole (3/4),Carro,Imprevisto,2026-11,10/11/2026,103.54,pendente,—
Financiamento AP,Moradia,Variável,2026-11,13/11/2026,617.32,pendente,—
Conserto Carro (3/4),Carro,Imprevisto,2026-11,15/11/2026,201.27,pendente,—
IPTU,Moradia,Fixa,2026-11,20/11/2026,55.22,pendente,—
Cartão Atacadão Mãe,,Variável,2026-11,20/11/2026,2822.8,pendente,—
Celular Nicole,Internet,Fixa,2026-11,20/11/2026,35.68,pendente,—
Seguro,Carro,Fixa,2026-11,20/11/2026,120.75,pendente,—
Internet,Internet,Fixa,2026-11,20/11/2026,89.9,pendente,—
DAS,Outros,Imprevisto,2026-11,21/11/2026,86.05,pendente,—
Celular Matheus,Plano Celular,Fixa,2026-11,25/11/2026,52.94,pendente,—
CPFL,Energia,Fixa,2026-11,26/11/2026,170.98,pendente,—
Devolução Empréstimo - Mãe (2/5),Carro,Imprevisto,2026-11,30/11/2026,1040,pendente,—
Devolução Empréstimo - Mãe (3/5),Carro,Imprevisto,2026-11,30/11/2026,1040,pendente,—
Taxa Banco,Moradia,Fixa,2026-12,07/12/2026,16,pendente,—
Taxa Banco,Moradia,Fixa,2026-12,07/12/2026,16,pendente,—
Condomínio,Moradia,Fixa,2026-12,10/12/2026,426.24,pendente,—
Cartão Atacadão,,Variável,2026-12,10/12/2026,2420.19,pendente,—
Dif. Cartão - Tio Nicole (4/4),Carro,Imprevisto,2026-12,10/12/2026,103.54,pendente,—
Faculdade - Nicole,Educação,Fixa,2026-12,10/12/2026,257.43,pendente,—
Financiamento AP,Moradia,Variável,2026-12,13/12/2026,617.32,pendente,—
Conserto Carro (4/4),Carro,Imprevisto,2026-12,15/12/2026,201.27,pendente,—
Cartão Atacadão Mãe,,Variável,2026-12,20/12/2026,2822.8,pendente,—
Internet,Internet,Fixa,2026-12,20/12/2026,89.9,pendente,—
IPTU,Moradia,Fixa,2026-12,20/12/2026,55.22,pendente,—
Celular Nicole,Internet,Fixa,2026-12,20/12/2026,35.68,pendente,—
Seguro,Carro,Fixa,2026-12,20/12/2026,120.75,pendente,—
DAS,Outros,Imprevisto,2026-12,21/12/2026,86.05,pendente,—
Celular Matheus,Plano Celular,Fixa,2026-12,25/12/2026,52.94,pendente,—
CPFL,Energia,Fixa,2026-12,26/12/2026,170.98,pendente,—
Devolução Empréstimo - Mãe (4/5),Carro,Imprevisto,2026-12,30/12/2026,1040,pendente,—`;

function parseBRDate(str) {
  if (!str || str === '—' || str.trim() === '') return undefined;
  const parts = str.trim().split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return undefined;
}

const lines = csvRaw.trim().split('\n').slice(1);
const contas = [];

const RECORRENTES = [
  'Taxa Banco',
  'Faculdade - Nicole',
  'Cartão Atacadão',
  'Condomínio',
  'Financiamento AP',
  'Celular Nicole',
  'Cartão Atacadão Mãe',
  'Seguro',
  'IPTU',
  'Internet',
  'DAS',
  'Celular Matheus',
  'CPFL',
];

lines.forEach((line, index) => {
  const parts = line.split(',');
  if (parts.length < 8) return;
  const [nome, categoriaRaw, tipoRaw, competencia, vencimentoRaw, valorRaw, situacaoRaw, pagamentoRaw] = parts;

  const vencimento = parseBRDate(vencimentoRaw);
  if (!vencimento) return;
  const dia = parseInt(vencimento.split('-')[2], 10);
  const periodo = dia <= 15 ? 10 : 20;

  let categoria = categoriaRaw.trim();
  if (!categoria) {
    if (nome.includes('Cartão Atacadão')) categoria = 'Cartão';
    else categoria = 'Outros';
  }

  let tipo = 'variavel';
  const t = tipoRaw.trim().toLowerCase();
  if (t === 'fixa') tipo = 'fixa';
  else if (t === 'imprevisto') tipo = 'imprevisto';
  else tipo = 'variavel';

  const valor = parseFloat(valorRaw);
  const situacao = situacaoRaw.trim().toLowerCase() === 'pago' ? 'pago' : 'pendente';
  const data_pagamento = parseBRDate(pagamentoRaw);

  const isRecorrente = RECORRENTES.some((r) => nome.toLowerCase().includes(r.toLowerCase()));

  // Extrair parcelamento se houver (ex: (1/4))
  let parcelamento_id = undefined;
  let descricao = undefined;
  if (nome.includes('Tio Nicole')) {
    parcelamento_id = 'parc-tio-nicole';
    descricao = 'Parcelamento Cartão Tio Nicole';
  } else if (nome.includes('Conserto Carro')) {
    parcelamento_id = 'parc-carro-valdeci';
    descricao = 'Conserto Carro mecânica';
  } else if (nome.includes('Devolução Empréstimo - Mãe')) {
    parcelamento_id = 'parc-emprestimo-mae';
    descricao = 'Devolução Empréstimo Mãe';
  }

  contas.push({
    id: `cnt-user-${index + 1}`,
    family_id: 'fam-camargo',
    nome: nome.trim(),
    descricao,
    categoria,
    tipo,
    valor,
    vencimento,
    competencia,
    periodo,
    situacao,
    data_pagamento,
    recorrente: isRecorrente,
    parcelamento_id,
  });
});

console.log(`Parsed ${contas.length} contas across Setembro, Outubro, Novembro, Dezembro!`);

// Entradas mensais
const entradas = [
  // --- Setembro 2026 ---
  {
    id: 'ent-set-1',
    family_id: 'fam-camargo',
    descricao: 'Hora Extra',
    valor: 94.23,
    data_prevista: '2026-09-06',
    data_recebida: '2026-09-06',
    competencia: '2026-09',
    tipo: 'extra',
    pessoa: 'Matheus',
    situacao: 'recebido',
  },
  {
    id: 'ent-set-2',
    family_id: 'fam-camargo',
    descricao: 'Salário Matheus',
    valor: 2407.04,
    data_prevista: '2026-09-06',
    data_recebida: '2026-09-06',
    competencia: '2026-09',
    tipo: 'salario',
    pessoa: 'Matheus',
    situacao: 'recebido',
  },
  {
    id: 'ent-set-3',
    family_id: 'fam-camargo',
    descricao: 'Salário Nicole',
    valor: 2050.00,
    data_prevista: '2026-09-06',
    data_recebida: '2026-09-06',
    competencia: '2026-09',
    tipo: 'salario',
    pessoa: 'Nicole',
    situacao: 'recebido',
  },
  {
    id: 'ent-set-4',
    family_id: 'fam-camargo',
    descricao: 'Freelance',
    valor: 600.00,
    data_prevista: '2026-09-06',
    data_recebida: '2026-09-06',
    competencia: '2026-09',
    tipo: 'extra',
    pessoa: 'Matheus',
    situacao: 'recebido',
  },
  {
    id: 'ent-set-5',
    family_id: 'fam-camargo',
    descricao: 'Renda Extra / Bônus Setembro',
    valor: 3038.14,
    data_prevista: '2026-09-25',
    data_recebida: '2026-09-25',
    competencia: '2026-09',
    tipo: 'extra',
    pessoa: 'Família',
    situacao: 'recebido',
  },

  // --- Outubro 2026 ---
  {
    id: 'ent-1',
    family_id: 'fam-camargo',
    descricao: 'Hora Extra',
    valor: 94.23,
    data_prevista: '2026-10-06',
    data_recebida: '2026-10-06',
    competencia: '2026-10',
    tipo: 'extra',
    pessoa: 'Matheus',
    situacao: 'recebido',
  },
  {
    id: 'ent-2',
    family_id: 'fam-camargo',
    descricao: 'Salário Matheus',
    valor: 2407.04,
    data_prevista: '2026-10-06',
    data_recebida: '2026-10-06',
    competencia: '2026-10',
    tipo: 'salario',
    pessoa: 'Matheus',
    situacao: 'recebido',
  },
  {
    id: 'ent-3',
    family_id: 'fam-camargo',
    descricao: 'Salário Nicole',
    valor: 2050.00,
    data_prevista: '2026-10-06',
    data_recebida: '2026-10-06',
    competencia: '2026-10',
    tipo: 'salario',
    pessoa: 'Nicole',
    situacao: 'recebido',
  },
  {
    id: 'ent-4',
    family_id: 'fam-camargo',
    descricao: 'Freelance',
    valor: 600.00,
    data_prevista: '2026-10-06',
    data_recebida: '2026-10-06',
    competencia: '2026-10',
    tipo: 'extra',
    pessoa: 'Matheus',
    situacao: 'recebido',
  },
  {
    id: 'ent-5',
    family_id: 'fam-camargo',
    descricao: 'Renda Extra / Bônus',
    valor: 3038.14,
    data_prevista: '2026-10-25',
    competencia: '2026-10',
    tipo: 'extra',
    pessoa: 'Família',
    situacao: 'previsto',
  },

  // --- Novembro 2026 ---
  {
    id: 'ent-nov-1',
    family_id: 'fam-camargo',
    descricao: 'Salário Matheus',
    valor: 2407.04,
    data_prevista: '2026-11-06',
    competencia: '2026-11',
    tipo: 'salario',
    pessoa: 'Matheus',
    situacao: 'previsto',
  },
  {
    id: 'ent-nov-2',
    family_id: 'fam-camargo',
    descricao: 'Salário Nicole',
    valor: 2050.00,
    data_prevista: '2026-11-06',
    competencia: '2026-11',
    tipo: 'salario',
    pessoa: 'Nicole',
    situacao: 'previsto',
  },
  {
    id: 'ent-nov-3',
    family_id: 'fam-camargo',
    descricao: 'Freelance',
    valor: 600.00,
    data_prevista: '2026-11-06',
    competencia: '2026-11',
    tipo: 'extra',
    pessoa: 'Matheus',
    situacao: 'previsto',
  },

  // --- Dezembro 2026 ---
  {
    id: 'ent-dez-1',
    family_id: 'fam-camargo',
    descricao: 'Salário Matheus',
    valor: 2407.04,
    data_prevista: '2026-12-06',
    competencia: '2026-12',
    tipo: 'salario',
    pessoa: 'Matheus',
    situacao: 'previsto',
  },
  {
    id: 'ent-dez-2',
    family_id: 'fam-camargo',
    descricao: 'Salário Nicole',
    valor: 2050.00,
    data_prevista: '2026-12-06',
    competencia: '2026-12',
    tipo: 'salario',
    pessoa: 'Nicole',
    situacao: 'previsto',
  },
  {
    id: 'ent-dez-3',
    family_id: 'fam-camargo',
    descricao: 'Freelance',
    valor: 600.00,
    data_prevista: '2026-12-06',
    competencia: '2026-12',
    tipo: 'extra',
    pessoa: 'Matheus',
    situacao: 'previsto',
  },
];

// Write to matheusData.ts
const targetFile = path.resolve(__dirname, '../src/data/matheusData.ts');

const fullTsContent = `import { Family, FamilyMember, Categoria, Conta, Entrada, Parcelamento } from '../types/finance';

export const MATHEUS_FAMILY: Family = {
  id: 'fam-camargo',
  nome: 'Família Camargo',
  fechamento_dia: 15,
  invite_code: '740C23',
};

export const MATHEUS_MEMBERS: FamilyMember[] = [
  {
    id: 'mem-matheus',
    family_id: 'fam-camargo',
    nome: 'Matheus Augusto',
    role: 'Administrador',
  },
  {
    id: 'mem-nicole',
    family_id: 'fam-camargo',
    nome: 'Nicole',
    role: 'Membro',
  },
];

export const MATHEUS_CATEGORIAS: Categoria[] = [
  { id: 'cat-1', family_id: 'fam-camargo', nome: 'Água', tipo: 'Fixa' },
  { id: 'cat-2', family_id: 'fam-camargo', nome: 'Aniversário Maitê', tipo: 'Variável' },
  { id: 'cat-3', family_id: 'fam-camargo', nome: 'Carro', tipo: 'Variável' },
  { id: 'cat-4', family_id: 'fam-camargo', nome: 'Cartão', tipo: 'Variável' },
  { id: 'cat-5', family_id: 'fam-camargo', nome: 'CNPJ', tipo: 'Fixa' },
  { id: 'cat-6', family_id: 'fam-camargo', nome: 'Educação', tipo: 'Fixa' },
  { id: 'cat-7', family_id: 'fam-camargo', nome: 'Energia', tipo: 'Fixa' },
  { id: 'cat-8', family_id: 'fam-camargo', nome: 'Internet', tipo: 'Fixa' },
  { id: 'cat-9', family_id: 'fam-camargo', nome: 'Lazer', tipo: 'Variável' },
  { id: 'cat-10', family_id: 'fam-camargo', nome: 'Mercado', tipo: 'Variável' },
  { id: 'cat-11', family_id: 'fam-camargo', nome: 'Moradia', tipo: 'Fixa' },
  { id: 'cat-12', family_id: 'fam-camargo', nome: 'Outros', tipo: 'Imprevisto' },
  { id: 'cat-13', family_id: 'fam-camargo', nome: 'Plano Celular', tipo: 'Fixa' },
  { id: 'cat-14', family_id: 'fam-camargo', nome: 'Transporte', tipo: 'Variável' },
];

export const MATHEUS_RECORRENTES = [
  'Taxa Banco',
  'Faculdade - Nicole',
  'Cartão Atacadão',
  'Condomínio',
  'Financiamento AP',
  'Celular Nicole',
  'Cartão Atacadão Mãe',
  'Seguro',
  'IPTU',
  'Internet',
  'DAS',
  'Celular Matheus',
  'CPFL',
];

export const MATHEUS_ENTRADAS: Entrada[] = ${JSON.stringify(entradas, null, 2)};

export const MATHEUS_CONTAS: Conta[] = ${JSON.stringify(contas, null, 2)};

export const MATHEUS_PARCELAMENTOS: Parcelamento[] = [
  {
    id: 'parc-carro-valdeci',
    family_id: 'fam-camargo',
    descricao: 'Conserto Carro mecânica',
    cartao: 'Valdeci',
    valor_total: 805.08,
    valor_parcela: 201.27,
    total_parcelas: 4,
    parcela_atual: 2,
    data_primeira: '2026-09-15',
    situacao: 'ativo',
  },
  {
    id: 'parc-tio-nicole',
    family_id: 'fam-camargo',
    descricao: 'Dif. Cartão - Tio Nicole',
    cartao: 'Nicole',
    valor_total: 414.16,
    valor_parcela: 103.54,
    total_parcelas: 4,
    parcela_atual: 2,
    data_primeira: '2026-09-10',
    situacao: 'ativo',
  },
  {
    id: 'parc-emprestimo-mae',
    family_id: 'fam-camargo',
    descricao: 'Devolução Empréstimo - Mãe',
    cartao: 'Mãe',
    valor_total: 5200.00,
    valor_parcela: 1040.00,
    total_parcelas: 5,
    parcela_atual: 2,
    data_primeira: '2026-09-30',
    situacao: 'ativo',
  },
];
`;

fs.writeFileSync(targetFile, fullTsContent, 'utf8');
console.log('Successfully written complete matheusData.ts with Setembro, Outubro, Novembro and Dezembro!');
