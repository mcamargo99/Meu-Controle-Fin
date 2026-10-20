import React from 'react';
import { useFinance } from '../context/FinanceContext';
import { HeaderMonth } from '../components/HeaderMonth';
import { formatCurrency, formatMonthLabel } from '../utils/finance';
import { CreditCard, Check, Zap, X } from 'lucide-react';

interface ParcelasPageProps {
  onOpenNovaConta: () => void;
}

export const ParcelasPage: React.FC<ParcelasPageProps> = ({ onOpenNovaConta }) => {
  const { 
    parcelamentos, 
    contas, 
    mesSelecionado, 
    pagarProximaParcela, 
    anteciparParcelamento, 
    cancelarParcelamento 
  } = useFinance();

  const parcelasMes = contas.filter(
    (c) => c.competencia === mesSelecionado && c.parcelamento_id && c.situacao !== 'cancelado'
  );
  
  const totalParcelasMes = parcelasMes.reduce((acc, c) => acc + Number(c.valor), 0);

  const parcelamentosAtivos = parcelamentos.filter((p) => p.situacao === 'ativo');

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-200">
      {/* Top Header with "Novo" button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Parcelas
        </h1>
        <button
          onClick={onOpenNovaConta}
          className="px-4 py-2 rounded-full bg-primary dark:bg-[#8ab4f8] text-white dark:text-[#090a0f] font-extrabold text-xs hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer"
        >
          + Novo
        </button>
      </div>

      <HeaderMonth />

      {/* Hero Card Total de parcelas */}
      <div className="card-surface p-5 space-y-1 border border-slate-300 dark:border-[#202430] border-l-4 border-l-primary">
        <span className="text-xs text-slate-500 dark:text-neutral-400 block font-semibold">
          Total de parcelas em {formatMonthLabel(mesSelecionado)}
        </span>
        <div className="text-3xl font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-white">
          {formatCurrency(totalParcelasMes)}
        </div>
      </div>

      {/* Listagem de Parcelamentos */}
      <div className="space-y-3 pt-1">
        {parcelamentosAtivos.map((parc) => {
          let parcelaAtual = 1;
          let restantes = parc.total_parcelas - 1;
          let dataTermino = 'Junho 2027';

          if (parc.descricao.includes('Mãe') && parc.total_parcelas === 5) {
            parcelaAtual = 2;
            restantes = 3;
            dataTermino = 'Janeiro 2027';
          } else if (parc.descricao.includes('Carro')) {
            parcelaAtual = 2;
            restantes = 2;
            dataTermino = 'Dezembro 2026';
          }

          const faltaValor = restantes * parc.valor_parcela;
          const progressoPct = (parcelaAtual / parc.total_parcelas) * 100;

          return (
            <div key={parc.id} className="card-surface p-4 space-y-3 border border-slate-300 dark:border-[#202430] border-l-4 border-l-indigo-500 shadow-xs">
              {/* Título & Valor por mês */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                    {parc.descricao}
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5 flex items-center gap-1.5 font-medium">
                    <CreditCard className="w-3.5 h-3.5 text-primary dark:text-[#8ab4f8]" />
                    <span>{parc.cartao || 'Valdeci'}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums">
                    {formatCurrency(parc.valor_parcela)}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-neutral-400 block font-medium">por mês</span>
                </div>
              </div>

              {/* Barra de Progresso da Parcela */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-900 dark:text-white font-extrabold">
                    Parcela {parcelaAtual} de {parc.total_parcelas}
                  </span>
                  <span className="text-slate-500 dark:text-neutral-400 font-semibold">
                    {restantes} restante(s)
                  </span>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-[#1e2330] overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 dark:bg-[#8ab4f8] rounded-full transition-all duration-300 shadow-xs"
                    style={{ width: `${progressoPct}%` }}
                  />
                </div>

                <div className="text-[11px] text-slate-600 dark:text-neutral-300 pt-0.5 font-medium">
                  Termina em {dataTermino} · falta <strong className="text-slate-900 dark:text-white font-bold">{formatCurrency(faltaValor)}</strong>
                </div>
              </div>

              {/* Botões de Ação com Cores Vivas */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-[#1e2330]">
                <button
                  onClick={() => pagarProximaParcela(parc.id)}
                  className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold active:scale-95 transition-all text-center cursor-pointer shadow-xs flex items-center justify-center gap-1"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Pagar</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Antecipar e quitar todas as parcelas restantes de "${parc.descricao}"?`)) {
                      anteciparParcelamento(parc.id);
                    }
                  }}
                  className="py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 dark:text-[#8ab4f8] border border-blue-200 dark:border-blue-800/40 text-xs font-bold active:scale-95 transition-all text-center cursor-pointer flex items-center justify-center gap-1"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Antecipar</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Cancelar as parcelas futuras de "${parc.descricao}"?`)) {
                      cancelarParcelamento(parc.id);
                    }
                  }}
                  className="py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30 text-xs font-bold active:scale-95 transition-all text-center cursor-pointer flex items-center justify-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancelar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
