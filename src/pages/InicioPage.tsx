import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  ChevronRight, 
  AlertCircle, 
  TrendingDown, 
  TrendingUp, 
  Clock, 
  ArrowDownCircle, 
  Calendar, 
  Sparkles,
  Send,
  Check,
  Edit3,
  Wallet
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDateShort, getSituacaoEfetiva, getTodayBR } from '../utils/finance';
import { HeaderMonth } from '../components/HeaderMonth';
import { Conta } from '../types/finance';
import { gerarTextoAlertasWhatsApp, gerarLinkWhatsApp } from '../utils/notifications';

interface InicioPageProps {
  onNavigateToContas: (filter?: 'todos' | 'pendentes' | 'pagos', tab?: 'contas' | 'entradas') => void;
  onEditConta: (conta: Conta) => void;
  onOpenNovaConta: () => void;
}

const CHART_COLORS = [
  '#2563eb', // Azul vibrante
  '#10b981', // Verde esmeralda
  '#f59e0b', // Âmbar
  '#ef4444', // Vermelho rose
  '#8b5cf6', // Roxo indigo
  '#06b6d4', // Ciano
  '#f97316', // Laranja
  '#64748b', // Slate
];

export const InicioPage: React.FC<InicioPageProps> = ({
  onNavigateToContas,
  onEditConta,
  onOpenNovaConta,
}) => {
  const { 
    family, 
    resumo, 
    contas, 
    entradas,
    mesSelecionado, 
    marcarContaComoPaga,
    alertasAtivos,
    saldoInicial,
    setSaldoInicial
  } = useFinance();

  const [isEditingSaldo, setIsEditingSaldo] = useState(false);
  const [saldoInput, setSaldoInput] = useState('');

  const handleSalvarSaldo = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(saldoInput.replace(',', '.'));
    if (!isNaN(val)) {
      setSaldoInicial(val);
    }
    setIsEditingSaldo(false);
  };

  const hoje = getTodayBR();

  // Contas do mês ordenadas por vencimento
  const contasDoMes = useMemo(() => {
    return contas
      .filter((c) => c.competencia === mesSelecionado && c.situacao !== 'cancelado')
      .sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  }, [contas, mesSelecionado]);

  // Contas vencidas / atrasadas do mês e de períodos anteriores
  const contasVencidas = useMemo(() => {
    return contas.filter(
      (c) => c.situacao !== 'pago' && c.situacao !== 'cancelado' && c.vencimento < hoje
    );
  }, [contas, hoje]);

  const totalVencido = useMemo(() => {
    return contasVencidas.reduce((acc, c) => acc + Number(c.valor), 0);
  }, [contasVencidas]);

  // Próximas pendentes do mês selecionado
  const pendentes = useMemo(() => {
    return contasDoMes.filter(
      (c) => getSituacaoEfetiva(c, hoje) !== 'pago'
    );
  }, [contasDoMes, hoje]);

  // Despesas agrupadas por categoria para o gráfico Donut
  const despesasPorCategoria = useMemo(() => {
    const map = new Map<string, number>();
    contasDoMes.forEach((c) => {
      const cat = c.categoria || 'Sem categoria';
      map.set(cat, (map.get(cat) || 0) + Number(c.valor));
    });
    return Array.from(map.entries())
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor);
  }, [contasDoMes]);

  // Cálculo dos arcos do Donut SVG
  const totalDespesas = resumo.totalMes || despesasPorCategoria.reduce((acc, c) => acc + c.valor, 0);

  // Geração das coordenadas SVG dos arcos
  let acumulado = 0;
  const fatiasDonut = despesasPorCategoria.map((item, index) => {
    const percentual = totalDespesas > 0 ? item.valor / totalDespesas : 0;
    const dashLength = percentual * 100;
    const dashOffset = 100 - acumulado + 25; // Começa no topo (12 horas)
    acumulado += dashLength;
    return {
      ...item,
      color: CHART_COLORS[index % CHART_COLORS.length],
      percentual: (percentual * 100).toFixed(1),
      strokeDasharray: `${dashLength} ${100 - dashLength}`,
      strokeDashoffset: dashOffset,
    };
  });

  const handleDispararWhatsApp = () => {
    const savedPhone = localStorage.getItem('mcf_whatsapp_phone') || '';
    const texto = gerarTextoAlertasWhatsApp(family.nome, alertasAtivos);
    const link = gerarLinkWhatsApp(texto, savedPhone);
    window.open(link, '_blank');
  };

  return (
    <div className="space-y-4 pb-6 animate-in fade-in duration-200">
      {/* Top Greeting com botão direto de WhatsApp */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-500 dark:text-neutral-400 font-semibold">
            Olá, Matheus Augusto de Camargo
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Seu mês
          </h1>
        </div>

        <button
          onClick={handleDispararWhatsApp}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-600/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100 transition-all active:scale-95 cursor-pointer shadow-xs"
          title="Disparar aviso das 4 regras para WhatsApp"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Avisos WhatsApp</span>
        </button>
      </div>

      {/* Month Bar */}
      <HeaderMonth />

      {/* Alerta de Contas Vencidas se houver */}
      {contasVencidas.length > 0 && (
        <div
          onClick={() => onNavigateToContas('pendentes', 'contas')}
          className="card-surface p-4 border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400 cursor-pointer flex items-center justify-between transition-all hover:bg-rose-100/70 dark:hover:bg-rose-500/15 active:scale-[0.99] shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-500 shrink-0" />
            <div className="text-xs font-semibold">
              <span className="font-bold text-rose-700 dark:text-rose-400">
                {contasVencidas.length} conta{contasVencidas.length > 1 ? 's' : ''} vencida{contasVencidas.length > 1 ? 's' : ''}
              </span>
              <span className="text-slate-600 dark:text-neutral-300">
                {' '}· {formatCurrency(totalVencido)} — toque para ver
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
        </div>
      )}

      {/* Main Saldo Atual Card */}
      <div className="card-surface p-5 space-y-4">
        <div>
          <span className="text-xs text-slate-500 dark:text-neutral-400 block mb-1 font-semibold">
            Saldo atual
          </span>
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight tabular-nums">
            {formatCurrency(resumo.saldoAtual)}
          </div>
        </div>

        <div className="space-y-1.5 pt-1 text-xs">
          <div 
            onClick={() => {
              setSaldoInput(saldoInicial.toString());
              setIsEditingSaldo(true);
            }}
            className="flex items-center justify-between text-slate-600 dark:text-neutral-300 p-1.5 -mx-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#1a1e27] cursor-pointer group transition-all"
            title="Toque para alterar o saldo inicial"
          >
            <div className="flex items-center gap-1.5">
              <span>Saldo inicial (vindo do mês anterior)</span>
              <Edit3 className="w-3.5 h-3.5 text-blue-600 dark:text-[#8ab4f8] opacity-70 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="font-bold text-slate-900 dark:text-white tabular-nums group-hover:text-blue-600 dark:group-hover:text-[#8ab4f8] transition-colors flex items-center gap-1">
              {formatCurrency(resumo.saldoInicial)}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600 dark:text-neutral-300">
            <span>Projetado fim do mês</span>
            <span className={`font-bold tabular-nums ${
              resumo.saldoProjetado >= 0 ? 'text-emerald-700 dark:text-[#4ade80]' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {formatCurrency(resumo.saldoProjetado)}
            </span>
          </div>
        </div>

        {/* Barra de Contas Pagas */}
        <div className="pt-2">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-slate-600 dark:text-neutral-400 font-medium">Contas pagas</span>
            <span className="font-bold text-slate-900 dark:text-white tabular-nums">
              {Math.round(resumo.progresso)}% ({formatCurrency(resumo.totalPago)} de {formatCurrency(resumo.totalMes)})
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-[#1e2330] overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-500 shadow-xs"
              style={{ width: `${resumo.progresso}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid de Resumo Completo com "A receber" */}
      <div className="grid grid-cols-2 gap-3">
        {/* Entradas do mês */}
        <div 
          onClick={() => onNavigateToContas('todos', 'entradas')}
          className="card-surface p-4 cursor-pointer active:scale-[0.98] transition-all group hover:border-emerald-500"
          title="Ver todas as entradas do mês"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-600 dark:text-neutral-400 font-semibold">
              Entradas do mês
            </span>
            <ArrowDownCircle className="w-4 h-4 text-emerald-600 dark:text-[#22c55e]" />
          </div>
          <div className="text-lg font-extrabold text-emerald-700 dark:text-[#22c55e] tabular-nums">
            {formatCurrency(resumo.entradasTotal)}
          </div>
        </div>

        {/* Pendente à receber / A receber (Destaque com cores ricas no tema claro e escuro) */}
        <div 
          onClick={() => onNavigateToContas('pendentes', 'entradas')}
          className="card-surface p-4 cursor-pointer active:scale-[0.98] transition-all border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/[0.04] group hover:border-emerald-500 shadow-xs"
          title="Ver entradas com situação 'previsto' a receber"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
              A receber
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 font-extrabold border border-emerald-300 dark:border-emerald-500/30">
              Previsto
            </span>
          </div>
          <div className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
            {formatCurrency(resumo.entradasPendentes)}
          </div>
        </div>

        {/* Despesas do mês */}
        <div 
          onClick={() => onNavigateToContas('todos', 'contas')}
          className="card-surface p-4 cursor-pointer active:scale-[0.98] transition-all hover:border-primary"
          title="Ver total de despesas"
        >
          <span className="text-xs text-slate-600 dark:text-neutral-400 block mb-1 font-semibold">
            Despesas do mês
          </span>
          <div className="text-lg font-extrabold text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(resumo.totalMes)}
          </div>
        </div>

        {/* Pendente (Despesas a pagar) */}
        <div 
          onClick={() => onNavigateToContas('pendentes', 'contas')}
          className="card-surface p-4 cursor-pointer active:scale-[0.98] transition-all hover:border-amber-500"
          title="Ver despesas pendentes"
        >
          <span className="text-xs text-slate-600 dark:text-neutral-400 block mb-1 font-semibold">
            Pendente
          </span>
          <div className="text-lg font-extrabold text-amber-600 dark:text-[#f59e0b] tabular-nums">
            {formatCurrency(resumo.totalPendente)}
          </div>
        </div>

        {/* Pago (Despesas já pagas) */}
        <div 
          onClick={() => onNavigateToContas('pagos', 'contas')}
          className="card-surface p-4 cursor-pointer active:scale-[0.98] transition-all hover:border-emerald-500"
          title="Ver despesas já pagas"
        >
          <span className="text-xs text-slate-600 dark:text-neutral-400 block mb-1 font-semibold">
            Pago
          </span>
          <div className="text-lg font-extrabold text-emerald-700 dark:text-[#22c55e] tabular-nums">
            {formatCurrency(resumo.totalPago)}
          </div>
        </div>

        {/* Recebido (Entradas já recebidas) */}
        <div 
          onClick={() => onNavigateToContas('pagos', 'entradas')}
          className="card-surface p-4 cursor-pointer active:scale-[0.98] transition-all hover:border-sky-500"
          title="Ver entradas já recebidas"
        >
          <span className="text-xs text-slate-600 dark:text-neutral-400 block mb-1 font-semibold">
            Recebido
          </span>
          <div className="text-lg font-extrabold text-sky-600 dark:text-[#38bdf8] tabular-nums">
            {formatCurrency(resumo.entradasRecebidas)}
          </div>
        </div>

        {/* Contas do dia 10 */}
        <div 
          onClick={() => onNavigateToContas('todos', 'contas')}
          className="card-surface p-4 cursor-pointer active:scale-[0.98] transition-all hover:border-primary"
          title="Contas com vencimento até dia 15"
        >
          <span className="text-xs text-slate-600 dark:text-neutral-400 block mb-1 font-semibold">
            Contas do dia 10
          </span>
          <div className="text-lg font-extrabold text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(resumo.dia10)}
          </div>
        </div>

        {/* Contas do dia 20 */}
        <div 
          onClick={() => onNavigateToContas('todos', 'contas')}
          className="card-surface p-4 cursor-pointer active:scale-[0.98] transition-all hover:border-primary"
          title="Contas com vencimento após dia 15"
        >
          <span className="text-xs text-slate-600 dark:text-neutral-400 block mb-1 font-semibold">
            Contas do dia 20
          </span>
          <div className="text-lg font-extrabold text-slate-900 dark:text-white tabular-nums">
            {formatCurrency(resumo.dia20)}
          </div>
        </div>
      </div>

      {/* Próximos Vencimentos */}
      <div className="card-surface p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Próximos vencimentos</h3>
          <button 
            onClick={() => onNavigateToContas('pendentes', 'contas')}
            className="text-xs text-primary dark:text-[#8ab4f8] font-bold hover:underline cursor-pointer"
          >
            Ver todas
          </button>
        </div>

        {pendentes.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500 dark:text-neutral-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            Nenhum vencimento pendente neste mês!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-[#1e2330]">
            {pendentes.slice(0, 4).map((conta) => {
              const status = getSituacaoEfetiva(conta, hoje);
              const isAtrasado = status === 'atrasado';

              return (
                <div 
                  key={conta.id} 
                  onClick={() => onEditConta(conta)}
                  className="py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-[#161820]/50 rounded-xl px-1 transition-all"
                  title="Clique para editar este lançamento"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {conta.nome}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                      {formatDateShort(conta.vencimento)}
                      {conta.categoria && ` · ${conta.categoria}`}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
                      {formatCurrency(conta.valor)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        marcarContaComoPaga(conta.id);
                      }}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold active:scale-95 transition-all cursor-pointer ${
                        isAtrasado
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30 hover:bg-rose-200'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-[#f59e0b] border border-amber-300 dark:border-amber-500/30 hover:bg-amber-200'
                      }`}
                      title="Marcar como paga"
                    >
                      {isAtrasado ? 'Atrasado' : 'Pendente'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Despesas por Categoria (Gráfico Donut e Legenda) */}
      {despesasPorCategoria.length > 0 && (
        <section className="card-surface p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">Despesas por categoria</h2>
            <span className="text-xs text-slate-600 dark:text-neutral-400 font-bold tabular-nums">
              {formatCurrency(totalDespesas)}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
            {/* SVG Donut Chart */}
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg className="w-36 h-36 -rotate-90" viewBox="0 0 36 36">
                {/* Background Ring */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  className="stroke-slate-200 dark:stroke-[#1c202a]"
                  strokeWidth="4.5"
                />
                {/* Category Arcs */}
                {fatiasDonut.map((fatia) => (
                  <circle
                    key={fatia.nome}
                    cx="18"
                    cy="18"
                    r="14"
                    fill="none"
                    stroke={fatia.color}
                    strokeWidth="4.5"
                    strokeDasharray={fatia.strokeDasharray}
                    strokeDashoffset={fatia.strokeDashoffset}
                    className="transition-all duration-500"
                  />
                ))}
              </svg>

              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[10px] text-slate-500 dark:text-neutral-400 uppercase tracking-wider font-bold">Total</span>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white tabular-nums">
                  {despesasPorCategoria.length} cat.
                </span>
              </div>
            </div>

            {/* Legenda das categorias */}
            <ul className="flex-1 w-full space-y-2 text-xs">
              {fatiasDonut.slice(0, 6).map((item) => (
                <li key={item.nome} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" 
                      style={{ backgroundColor: item.color }} 
                    />
                    <span className="truncate font-semibold text-slate-800 dark:text-white">
                      {item.nome}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-neutral-400 tabular-nums">
                      {item.percentual}%
                    </span>
                  </div>
                  <span className="font-extrabold text-slate-900 dark:text-white tabular-nums shrink-0">
                    {formatCurrency(item.valor)}
                  </span>
                </li>
              ))}
              {fatiasDonut.length > 6 && (
                <li className="text-[11px] text-slate-500 dark:text-neutral-400 text-right pt-0.5">
                  + {fatiasDonut.length - 6} outras categorias
                </li>
              )}
            </ul>
          </div>
        </section>
      )}

      {/* Modal para Alterar Saldo Inicial */}
      {isEditingSaldo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm card-surface p-5 space-y-4 shadow-2xl relative border border-slate-300 dark:border-[#202430]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1e2330] pb-2">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-blue-600 dark:text-[#8ab4f8]" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Saldo Inicial de {mesSelecionado.split('-')[1] === '09' ? 'Setembro' : mesSelecionado.split('-')[1] === '10' ? 'Outubro' : mesSelecionado.split('-')[1] === '11' ? 'Novembro' : mesSelecionado.split('-')[1] === '12' ? 'Dezembro' : mesSelecionado}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingSaldo(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
              Altera o saldo inicial <strong>apenas deste mês</strong>. Os meses anteriores não serão modificados, e os próximos meses calcularão o saldo inicial automaticamente a partir do fechamento final deste mês:
            </p>

            <form onSubmit={handleSalvarSaldo} className="space-y-3">
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">R$</span>
                <input
                  type="number"
                  step="0.01"
                  autoFocus
                  value={saldoInput}
                  onChange={(e) => setSaldoInput(e.target.value)}
                  placeholder="0.00"
                  className="w-full input-surface pl-9 pr-3 py-2 text-base font-extrabold tabular-nums focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditingSaldo(false)}
                  className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1e2330] dark:hover:bg-[#283042] text-xs font-bold text-slate-700 dark:text-neutral-300 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Salvar Saldo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
