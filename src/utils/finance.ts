import { Conta, Entrada, ResumoFinanceiro, SituacaoConta } from '../types/finance';

// Formatação monetária padrão BRL (R$ 1.234,56)
const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export const formatCurrency = (val: number | string | null | undefined): string => {
  return currencyFormatter.format(Number(val ?? 0));
};

// Data atual no fuso horário de Brasília (YYYY-MM-DD)
export const getTodayBR = (): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
  }).format(new Date());
};

// Mês atual YYYY-MM
export const getCurrentMonth = (): string => {
  return getTodayBR().slice(0, 7);
};

// Formatar competência para nome amigável (ex: 2026-10 -> "Outubro de 2026")
export const formatMonthLabel = (mesYYYYMM: string): string => {
  if (!mesYYYYMM || mesYYYYMM.length < 7) return mesYYYYMM;
  const [year, month] = mesYYYYMM.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  const monthName = date.toLocaleDateString('pt-BR', { month: 'long' });
  return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${year}`;
};

// Formatar data abreviada DD/MM
export const formatDateShort = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  const parts = dateStr.slice(0, 10).split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return dateStr;
};

// Formatar data completa DD/MM/AAAA
export const formatDateFull = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '—';
  const parts = dateStr.slice(0, 10).split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

// Calcular período (dia 10 ou dia 20) com base no dia do vencimento e fechamento da família
export const getPeriodo = (dateStr: string, fechamentoDia: number = 15): number => {
  const day = Number(dateStr.slice(8, 10));
  return day <= fechamentoDia ? 10 : 20;
};

// Resolver situação efetiva da conta (considerando se venceu e ainda está pendente)
export const getSituacaoEfetiva = (conta: Conta, hoje: string = getTodayBR()): SituacaoConta => {
  if (conta.situacao === 'pago' || conta.situacao === 'cancelado') {
    return conta.situacao;
  }
  return conta.vencimento < hoje ? 'atrasado' : 'pendente';
};

// Adicionar meses a uma data YYYY-MM-DD
export const addMonthsToDate = (dateStr: string, monthsToAdd: number): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const targetDate = new Date(year, month - 1 + monthsToAdd, day);
  return targetDate.toISOString().slice(0, 10);
};

// Calcular resumo financeiro de um mês
export const calcularResumoMes = (
  contas: Conta[],
  entradas: Entrada[],
  mes: string,
  fechamentoDia: number = 15,
  saldoInicialMesAnterior: number = 0
): ResumoFinanceiro => {
  const hoje = getTodayBR();

  // Entradas da competência
  const entradasMes = entradas.filter((e) => e.competencia === mes);
  const entradasTotal = entradasMes.reduce((acc, curr) => acc + Number(curr.valor), 0);
  const entradasRecebidas = entradasMes
    .filter((e) => e.situacao === 'recebido')
    .reduce((acc, curr) => acc + Number(curr.valor), 0);
  const entradasPendentes = entradasMes
    .filter((e) => e.situacao === 'previsto')
    .reduce((acc, curr) => acc + Number(curr.valor), 0);

  // Despesas da competência (excluindo canceladas)
  const contasMes = contas.filter(
    (c) => c.competencia === mes && c.situacao !== 'cancelado'
  );

  const totalMes = contasMes.reduce((acc, curr) => acc + Number(curr.valor), 0);
  const totalPago = contasMes
    .filter((c) => c.situacao === 'pago')
    .reduce((acc, curr) => acc + Number(curr.valor), 0);
  const totalPendente = totalMes - totalPago;

  // Divisão por períodos (dia 10 vs dia 20)
  const dia10 = contasMes
    .filter((c) => getPeriodo(c.vencimento, fechamentoDia) === 10)
    .reduce((acc, curr) => acc + Number(curr.valor), 0);
  const dia20 = totalMes - dia10;

  // Contas vencidas
  const vencidas = contasMes.filter((c) => getSituacaoEfetiva(c, hoje) === 'atrasado').length;

  // Saldos
  // Saldo Atual = Saldo Inicial + Entradas Efetivamente Recebidas - Despesas Efetivamente Pagas
  const saldoAtual = saldoInicialMesAnterior + entradasRecebidas - totalPago;
  // Saldo Projetado = Saldo Inicial + Total de Entradas Previstas - Total de Despesas Previstas
  const saldoProjetado = saldoInicialMesAnterior + entradasTotal - totalMes;

  const progresso = totalMes > 0 ? Math.min(100, (totalPago / totalMes) * 100) : 0;

  return {
    saldoInicial: saldoInicialMesAnterior,
    saldoAtual,
    saldoProjetado,
    entradasTotal,
    entradasRecebidas,
    entradasPendentes,
    totalMes,
    totalPago,
    totalPendente,
    dia10,
    dia20,
    vencidas,
    progresso,
  };
};

export const getPrevMonth = (mes: string): string => {
  const [y, m] = mes.split('-').map(Number);
  const prevDate = new Date(y, m - 2, 1);
  return `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
};

export const getNextMonth = (mes: string): string => {
  const [y, m] = mes.split('-').map(Number);
  const nextDate = new Date(y, m, 1);
  return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Calcula o saldo inicial de qualquer mês específico de forma encadeada.
 * O saldo final de um mês M-1 (Saldo Inicial + Entradas - Despesas) se torna
 * automaticamente o saldo inicial do mês seguinte M.
 */
export const calcularSaldoInicialDoMes = (
  targetMonth: string,
  contas: Conta[],
  entradas: Entrada[],
  manualSaldos: Record<string, number>
): number => {
  // De Janeiro a Agosto/2026 sem movimentações: zerado por padrão
  if (targetMonth < '2026-09') {
    if (manualSaldos[targetMonth] !== undefined && manualSaldos[targetMonth] !== null) {
      return Number(manualSaldos[targetMonth]);
    }
    return 0;
  }

  // Ponto de partida cronológico: para novas famílias começa em 0 (Matheus possui {'2026-09': 595.26} salvo na família)
  const baseMonth = '2026-09';
  const defaultBaseInitial = 0;

  // Gera a sequência de meses ordenados de baseMonth até targetMonth
  const months: string[] = [];
  let curr = baseMonth;
  while (curr <= targetMonth) {
    months.push(curr);
    curr = getNextMonth(curr);
  }

  let running = manualSaldos[baseMonth] !== undefined ? Number(manualSaldos[baseMonth]) : defaultBaseInitial;

  for (let i = 0; i < months.length; i++) {
    const m = months[i];

    // Se houver ajuste manual para este mês específico, ele substitui o saldo inicial
    if (manualSaldos[m] !== undefined && manualSaldos[m] !== null) {
      running = Number(manualSaldos[m]);
    }

    // Se alcançamos o mês alvo, este é o saldo inicial dele
    if (m === targetMonth) {
      return Math.round(running * 100) / 100;
    }

    // Caso contrário, calcula o resultado final líquido do mês m para compor o início do próximo
    const entTotal = entradas
      .filter((e) => e.competencia === m)
      .reduce((acc, curr) => acc + Number(curr.valor), 0);
    const despTotal = contas
      .filter((c) => c.competencia === m && c.situacao !== 'cancelado')
      .reduce((acc, curr) => acc + Number(curr.valor), 0);

    const saldoFinalDoMes = running + entTotal - despTotal;
    running = saldoFinalDoMes;
  }

  return Math.round(running * 100) / 100;
};

