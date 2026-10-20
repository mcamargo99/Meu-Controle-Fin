import { Conta, Entrada, Parcelamento } from '../types/finance';
import { formatCurrency, getTodayBR, formatDateShort } from './finance';

export interface AlertaNotificacao {
  id: string;
  tipo: 'danger' | 'warn' | 'info' | 'success';
  titulo: string;
  texto: string;
  categoria?: string;
  valor?: number;
  data?: string;
  diasRestantes?: number;
  tipoItem?: 'conta' | 'entrada' | 'saldo' | 'parcelamento';
}

/**
 * Calcula todos os alertas financeiros em tempo real com as 4 regras solicitadas:
 * 1. Contas em atraso (vencidas e não pagas)
 * 2. Dia do vencimento (vence hoje)
 * 3. 3 dias antes do vencimento (vence em 1 a 3 dias)
 * 4. Data de receber pagamentos (entradas previstas para hoje ou próximos dias)
 */
export function calcularAlertasFinanceiros(
  contas: Conta[],
  entradas: Entrada[],
  parcelamentos: Parcelamento[],
  saldoProjetado: number
): AlertaNotificacao[] {
  const hoje = getTodayBR();
  const alertas: AlertaNotificacao[] = [];

  const hojeTime = new Date(hoje + 'T00:00:00').getTime();

  // 1. Contas em atraso
  const atrasadas = contas.filter(
    (c) => c.situacao !== 'pago' && c.situacao !== 'cancelado' && c.vencimento < hoje
  );
  for (const c of atrasadas) {
    const vencTime = new Date(c.vencimento + 'T00:00:00').getTime();
    const diasAtraso = Math.max(1, Math.round((hojeTime - vencTime) / (1000 * 60 * 60 * 24)));
    alertas.push({
      id: `atr-${c.id}`,
      tipo: 'danger',
      titulo: 'Conta em Atraso',
      texto: `${c.nome} venceu em ${formatDateShort(c.vencimento)} (${diasAtraso}d atrás) — ${formatCurrency(c.valor)}`,
      categoria: c.categoria,
      valor: Number(c.valor),
      data: c.vencimento,
      diasRestantes: -diasAtraso,
      tipoItem: 'conta',
    });
  }

  // 2. Contas que vencem hoje e 3. Contas que vencem em até 3 dias
  const pendentes = contas.filter(
    (c) => c.situacao !== 'pago' && c.situacao !== 'cancelado' && c.vencimento >= hoje
  );

  for (const c of pendentes) {
    const vencTime = new Date(c.vencimento + 'T00:00:00').getTime();
    const diffDias = Math.round((vencTime - hojeTime) / (1000 * 60 * 60 * 24));

    if (diffDias === 0) {
      alertas.push({
        id: `hoje-${c.id}`,
        tipo: 'warn',
        titulo: 'Vence Hoje',
        texto: `${c.nome} vence HOJE — ${formatCurrency(c.valor)}`,
        categoria: c.categoria,
        valor: Number(c.valor),
        data: c.vencimento,
        diasRestantes: 0,
        tipoItem: 'conta',
      });
    } else if (diffDias > 0 && diffDias <= 3) {
      alertas.push({
        id: `prox-${c.id}-${diffDias}`,
        tipo: 'info',
        titulo: 'Vence em 3 Dias ou Menos',
        texto: `${c.nome} vence em ${diffDias} dia${diffDias > 1 ? 's' : ''} (${formatDateShort(c.vencimento)}) — ${formatCurrency(c.valor)}`,
        categoria: c.categoria,
        valor: Number(c.valor),
        data: c.vencimento,
        diasRestantes: diffDias,
        tipoItem: 'conta',
      });
    }
  }

  // 4. Data de receber pagamentos (Entradas previstas para hoje ou nos próximos 3 dias)
  const entradasPrevistas = entradas.filter(
    (e) => e.situacao === 'previsto' && !e.data_recebida
  );

  for (const e of entradasPrevistas) {
    const dataPrev = e.data_prevista || hoje;
    const prevTime = new Date(dataPrev + 'T00:00:00').getTime();
    const diffDias = Math.round((prevTime - hojeTime) / (1000 * 60 * 60 * 24));

    if (diffDias <= 0) {
      // Data de receber hoje ou já passou e ainda não confirmou
      alertas.push({
        id: `rec-hoje-${e.id}`,
        tipo: 'success',
        titulo: 'Recebimento Previsto',
        texto: `${e.descricao}: ${formatCurrency(e.valor)} previsto para receber hoje (${formatDateShort(dataPrev)})`,
        categoria: 'Receita',
        valor: Number(e.valor),
        data: dataPrev,
        diasRestantes: diffDias,
        tipoItem: 'entrada',
      });
    } else if (diffDias <= 3) {
      alertas.push({
        id: `rec-prox-${e.id}`,
        tipo: 'success',
        titulo: 'Recebimento Próximo',
        texto: `${e.descricao}: ${formatCurrency(e.valor)} a receber em ${diffDias} dia${diffDias > 1 ? 's' : ''} (${formatDateShort(dataPrev)})`,
        categoria: 'Receita',
        valor: Number(e.valor),
        data: dataPrev,
        diasRestantes: diffDias,
        tipoItem: 'entrada',
      });
    }
  }

  // Alerta extra: Saldo projetado negativo
  if (saldoProjetado < 0) {
    alertas.push({
      id: `saldo-negativo`,
      tipo: 'danger',
      titulo: 'Saldo Negativo Projetado',
      texto: `Atenção: Seu saldo projetado para o fim do mês é negativo (${formatCurrency(saldoProjetado)})`,
      tipoItem: 'saldo',
    });
  }

  return alertas;
}

/**
 * Gera texto formatado para envio no WhatsApp com as regras completas
 */
export function gerarTextoAlertasWhatsApp(
  nomeFamilia: string,
  alertas: AlertaNotificacao[]
): string {
  const atrasadas = alertas.filter((a) => a.tipo === 'danger' && a.tipoItem === 'conta');
  const vencemHoje = alertas.filter((a) => a.tipo === 'warn' && a.tipoItem === 'conta');
  const proximas = alertas.filter((a) => a.tipo === 'info' && a.tipoItem === 'conta');
  const pagamentosReceber = alertas.filter((a) => a.tipoItem === 'entrada');

  const totalPagarUrgente = [...atrasadas, ...vencemHoje].reduce((acc, a) => acc + (a.valor || 0), 0);
  const totalReceber = pagamentosReceber.reduce((acc, a) => acc + (a.valor || 0), 0);

  if (atrasadas.length === 0 && vencemHoje.length === 0 && proximas.length === 0 && pagamentosReceber.length === 0) {
    return `Olá! 🌟\n\nNenhuma conta em atraso ou vencendo nos próximos 3 dias na família *${nomeFamilia}*. Todas as contas e pagamentos estão em dia!\n\n_Meu Controle Financeiro_`;
  }

  let msg = `🔔 *AVISO FINANCEIRO DIÁRIO*\n`;
  msg += `*Família:* ${nomeFamilia}\n`;
  msg += `*Data:* ${formatDateShort(getTodayBR())}\n`;
  msg += `─────────────────────\n\n`;

  // 1. Contas em atraso
  if (atrasadas.length > 0) {
    msg += `🚨 *CONTAS EM ATRASO (${atrasadas.length}):*\n`;
    atrasadas.forEach((a) => {
      msg += `• ${a.texto}\n`;
    });
    msg += `\n`;
  }

  // 2. Vencem hoje
  if (vencemHoje.length > 0) {
    msg += `⏰ *VENCENDO HOJE (${vencemHoje.length}):*\n`;
    vencemHoje.forEach((a) => {
      msg += `• ${a.texto}\n`;
    });
    msg += `\n`;
  }

  // 3. Vencimento em até 3 dias
  if (proximas.length > 0) {
    msg += `⏳ *VENCIMENTO EM ATÉ 3 DIAS (${proximas.length}):*\n`;
    proximas.forEach((a) => {
      msg += `• ${a.texto}\n`;
    });
    msg += `\n`;
  }

  // 4. Data de receber pagamentos
  if (pagamentosReceber.length > 0) {
    msg += `💰 *PAGAMENTOS A RECEBER (${pagamentosReceber.length}):*\n`;
    pagamentosReceber.forEach((a) => {
      msg += `• ${a.texto}\n`;
    });
    msg += `\n`;
  }

  msg += `─────────────────────\n`;
  if (totalPagarUrgente > 0) {
    msg += `*Total a pagar imediato:* ${formatCurrency(totalPagarUrgente)}\n`;
  }
  if (totalReceber > 0) {
    msg += `*Total previsto a receber:* ${formatCurrency(totalReceber)}\n`;
  }
  msg += `\nAcesse o app para confirmar pagamentos e recebimentos: https://fincamargo.lovable.app/`;

  return msg;
}

/**
 * Gera URL direta para o WhatsApp com número de destino opcional
 */
export function gerarLinkWhatsApp(texto: string, telefone?: string): string {
  const cleanPhone = telefone ? telefone.replace(/\D/g, '') : '';
  const encoded = encodeURIComponent(texto);
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone}?text=${encoded}`;
  }
  return `https://api.whatsapp.com/send?text=${encoded}`;
}

/**
 * Diagnóstico de notificações do navegador
 */
export function verificarStatusNotificacoesNativas(): {
  suportado: boolean;
  permissao: NotificationPermission | 'nao-suportado';
  detalhe: string;
} {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return {
      suportado: false,
      permissao: 'nao-suportado',
      detalhe: 'Navegador atual ou visualização em iframe não suporta Web Notifications nativas. Use o WhatsApp para alertas 100% garantidos.',
    };
  }

  return {
    suportado: true,
    permissao: Notification.permission,
    detalhe:
      Notification.permission === 'granted'
        ? 'Notificações autorizadas pelo aparelho.'
        : Notification.permission === 'denied'
        ? 'Notificações bloqueadas nas configurações do navegador/celular.'
        : 'Permissão ainda não concedida. Clique para ativar.',
  };
}

/**
 * Solicita permissão para notificações no navegador / celular
 */
export async function solicitarPermissaoNotificacoes(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  try {
    const result = await Notification.requestPermission();
    return result === 'granted';
  } catch (e) {
    console.warn('Erro ao solicitar permissão de notificações:', e);
    return false;
  }
}

/**
 * Dispara notificação nativa com fallback e áudio suave
 */
export function dispararNotificacaoNativa(
  titulo: string,
  corpo: string,
  tag?: string
): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    const notif = new Notification(titulo, {
      body: corpo,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: tag || 'fincamargo-alerta',
      requireInteraction: false,
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
    };

    return true;
  } catch (e) {
    console.warn('Erro ao disparar notificação nativa:', e);
    return false;
  }
}
