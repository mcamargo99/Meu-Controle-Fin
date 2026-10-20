export type SituacaoConta = 'pendente' | 'pago' | 'cancelado' | 'atrasado';
export type TipoConta = 'fixa' | 'variavel' | 'cartao' | 'imprevisto';
export type SituacaoEntrada = 'previsto' | 'recebido';
export type TipoEntrada = 'salario' | 'extra' | 'investimento' | 'outro';
export type SituacaoParcelamento = 'ativo' | 'finalizado';

export interface FamilyMember {
  id: string;
  family_id: string;
  nome: string;
  email?: string;
  role: 'Administrador' | 'Membro';
  created_at?: string;
}

export interface Family {
  id: string;
  nome: string;
  invite_code?: string;
  fechamento_dia: number; // default 15
  created_at?: string;
}

export interface Profile {
  id: string;
  nome: string;
  email: string;
  family_id: string;
  created_at?: string;
}

export interface Categoria {
  id: string;
  family_id: string;
  nome: string;
  tipo?: string;
  created_at?: string;
}

export interface Conta {
  id: string;
  family_id: string;
  created_by?: string;
  nome: string;
  descricao?: string | null;
  categoria: string;
  tipo: TipoConta;
  valor: number;
  vencimento: string; // YYYY-MM-DD
  competencia: string; // YYYY-MM
  periodo: number; // 10 ou 20
  situacao: SituacaoConta;
  data_pagamento?: string | null;
  observacao?: string | null;
  recorrente?: boolean;
  frequencia?: string | null;
  repeticoes?: number | null;
  origem?: string;
  parcelamento_id?: string | null;
  parcela_numero?: number | null;
  comprovante_path?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Entrada {
  id: string;
  family_id: string;
  descricao: string;
  valor: number;
  data_prevista: string; // YYYY-MM-DD
  data_recebida?: string | null;
  competencia: string; // YYYY-MM
  tipo: TipoEntrada;
  pessoa?: string | null;
  situacao: SituacaoEntrada;
  observacao?: string | null;
  created_at?: string;
}

export interface Parcelamento {
  id: string;
  family_id: string;
  descricao: string;
  cartao?: string | null;
  valor_parcela: number;
  valor_total?: number;
  total_parcelas: number;
  parcela_atual?: number;
  parcela_inicial?: number;
  data_primeira: string;
  dia_vencimento?: number;
  situacao: SituacaoParcelamento;
  observacao?: string | null;
  created_at?: string;
}

export interface ResumoFinanceiro {
  saldoInicial: number;
  saldoAtual: number;
  saldoProjetado: number;
  entradasTotal: number;
  entradasRecebidas: number;
  entradasPendentes: number; // A receber (previsto)
  totalMes: number;
  totalPago: number;
  totalPendente: number;
  dia10: number;
  dia20: number;
  vencidas: number;
  progresso: number;
}
