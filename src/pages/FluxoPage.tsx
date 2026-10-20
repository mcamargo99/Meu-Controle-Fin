import React, { useState } from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  Calendar,
  Edit3
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { HeaderMonth } from '../components/HeaderMonth';
import { 
  formatCurrency, 
  formatDateFull, 
  getPeriodo 
} from '../utils/finance';

interface Movimentacao {
  id: string;
  data: string;
  nome: string;
  valor: number;
  realizado: boolean;
  entrada: boolean;
  saldoApos?: number;
}

export const FluxoPage: React.FC = () => {
  const { contas, entradas, mesSelecionado, family, resumo, saldoInicial, setSaldoInicial } = useFinance();
  const [dataConsulta, setDataConsulta] = useState<string>('');
  const [isEditingSaldo, setIsEditingSaldo] = useState<boolean>(false);
  const [saldoInput, setSaldoInput] = useState<string>('');

  const fechamentoDia = family.fechamento_dia || 15;

  // Filtrar e unificar movimentos do mês
  const entradasMes = entradas
    .filter((e) => e.competencia === mesSelecionado)
    .map((e) => ({
      id: e.id,
      data: e.data_recebida || e.data_prevista,
      nome: e.descricao,
      valor: Number(e.valor),
      realizado: e.situacao === 'recebido',
      entrada: true,
    }));

  const contasMes = contas
    .filter((c) => c.competencia === mesSelecionado && c.situacao !== 'cancelado')
    .map((c) => ({
      id: c.id,
      data: c.situacao === 'pago' && c.data_pagamento ? c.data_pagamento : c.vencimento,
      nome: c.nome,
      valor: -Number(c.valor),
      realizado: c.situacao === 'pago',
      entrada: false,
    }));

  // Ordenar cronologicamente
  const todosMovimentos: Movimentacao[] = [...entradasMes, ...contasMes].sort((a, b) => {
    const cmp = a.data.localeCompare(b.data);
    if (cmp !== 0) return cmp;
    return Number(b.entrada) - Number(a.entrada);
  });

  // Calcular saldo acumulado
  let saldoAcumulado = resumo.saldoInicial;
  const movimentosComSaldo = todosMovimentos.map((m) => {
    saldoAcumulado += m.valor;
    return { ...m, saldoApos: saldoAcumulado };
  });

  // Consulta de saldo em dia específico
  const saldoNoDiaConsulta = dataConsulta
    ? movimentosComSaldo.filter((m) => m.data <= dataConsulta).at(-1)?.saldoApos ?? resumo.saldoInicial
    : null;

  // Dividir por períodos
  const periodo10 = movimentosComSaldo.filter(
    (m) => getPeriodo(m.data, fechamentoDia) === 10
  );
  const periodo20 = movimentosComSaldo.filter(
    (m) => getPeriodo(m.data, fechamentoDia) === 20
  );

  return (
    <div className="space-y-4 pb-6">
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
        Fluxo de caixa
      </h1>

      <HeaderMonth />

      {/* Saldo Inicial do Mês */}
      <div className="card-surface p-4 space-y-2 border border-slate-300 dark:border-[#202430]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800 dark:text-neutral-200">Saldo inicial do mês</span>
            <button
              onClick={() => {
                setSaldoInput(saldoInicial.toString());
                setIsEditingSaldo(!isEditingSaldo);
              }}
              className="p-1 rounded-lg text-blue-600 dark:text-[#8ab4f8] hover:bg-slate-100 dark:hover:bg-[#1e2330] transition-colors cursor-pointer"
              title="Alterar saldo inicial"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
          <span className="text-sm font-extrabold tabular-nums text-slate-900 dark:text-white">
            {formatCurrency(resumo.saldoInicial)}
          </span>
        </div>

        {isEditingSaldo && (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const val = parseFloat(saldoInput.replace(',', '.'));
              if (!isNaN(val)) setSaldoInicial(val);
              setIsEditingSaldo(false);
            }}
            className="flex gap-2 pt-2 border-t border-slate-100 dark:border-[#1e2330] animate-in fade-in"
          >
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">R$</span>
              <input
                type="number"
                step="0.01"
                autoFocus
                value={saldoInput}
                onChange={(e) => setSaldoInput(e.target.value)}
                className="w-full input-surface pl-8 pr-2 py-1.5 text-xs font-bold tabular-nums"
                placeholder="0.00"
                required
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setIsEditingSaldo(false)}
              className="px-2 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
            >
              Cancelar
            </button>
          </form>
        )}
      </div>

      {/* Simulador de Saldo no Dia */}
      <div className="card-surface p-3.5 flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <input
            type="date"
            value={dataConsulta}
            min={`${mesSelecionado}-01`}
            max={`${mesSelecionado}-31`}
            onChange={(e) => setDataConsulta(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#161820] border border-slate-200 dark:border-[#262c3b] text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:border-primary dark:focus:border-[#8ab4f8]"
          />
        </div>
        <div className="text-right shrink-0">
          <span className="text-[11px] text-neutral-400 block">Saldo previsto no dia</span>
          <span className={`text-sm font-extrabold tabular-nums ${
            (saldoNoDiaConsulta ?? 0) < 0 ? 'text-rose-500' : 'text-slate-900 dark:text-white'
          }`}>
            {saldoNoDiaConsulta === null ? '—' : formatCurrency(saldoNoDiaConsulta)}
          </span>
        </div>
      </div>

      {/* Período do Dia 10 (até dia 15) */}
      <div className="space-y-3 pt-1">
        <div className="text-xs font-bold text-neutral-400 tracking-wider uppercase px-1">
          PERÍODO DO DIA 10 (ATÉ DIA {fechamentoDia})
        </div>

        <div className="relative pl-6 space-y-3">
          {/* Vertical Track Line */}
          <div className="absolute left-2.5 top-3 bottom-3 w-0.5 bg-slate-200 dark:bg-[#1e2330]" />

          {periodo10.map((mov) => {
            const dotColor = mov.entrada
              ? 'bg-[#22c55e]'
              : mov.realizado
              ? 'bg-primary dark:bg-[#8ab4f8]'
              : 'bg-[#f59e0b]';

            return (
              <div key={mov.id} className="relative">
                {/* Timeline Dot */}
                <div
                  className={`absolute -left-[20px] top-4 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#090a0f] ${dotColor} z-10`}
                />

                {/* Card */}
                <div className="card-surface p-3.5 flex items-center gap-3">
                  {/* Arrow Icon in circle */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      mov.entrada
                        ? 'bg-emerald-50 dark:bg-[#112a1a] text-emerald-600 dark:text-[#4ade80] border border-emerald-200 dark:border-[#22c55e]/30'
                        : 'bg-rose-50 dark:bg-[#381014] text-rose-600 dark:text-[#f87171] border border-rose-200 dark:border-[#ef4444]/30'
                    }`}
                  >
                    {mov.entrada ? (
                      <ArrowDown className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {mov.nome}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {formatDateFull(mov.data)} · {mov.realizado ? 'Realizado' : 'Previsto'}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`text-sm font-extrabold tabular-nums ${
                      mov.entrada ? 'text-emerald-600 dark:text-[#4ade80]' : 'text-slate-900 dark:text-white'
                    }`}>
                      {mov.entrada ? '' : '-'}
                      {formatCurrency(Math.abs(mov.valor))}
                    </div>
                    <div className="text-[11px] text-neutral-400 tabular-nums mt-0.5">
                      Saldo {formatCurrency(mov.saldoApos)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Período do Dia 20 (após dia 15) */}
      {periodo20.length > 0 && (
        <div className="space-y-3 pt-3">
          <div className="text-xs font-bold text-neutral-400 tracking-wider uppercase px-1">
            PERÍODO DO DIA 20 (APÓS DIA {fechamentoDia})
          </div>

          <div className="relative pl-6 space-y-3">
            <div className="absolute left-2.5 top-3 bottom-3 w-0.5 bg-slate-200 dark:bg-[#1e2330]" />

            {periodo20.map((mov) => {
              const dotColor = mov.entrada
                ? 'bg-[#22c55e]'
                : mov.realizado
                ? 'bg-primary dark:bg-[#8ab4f8]'
                : 'bg-[#f59e0b]';

              return (
                <div key={mov.id} className="relative">
                  <div
                    className={`absolute -left-[20px] top-4 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#090a0f] ${dotColor} z-10`}
                  />

                  <div className="card-surface p-3.5 flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        mov.entrada
                          ? 'bg-emerald-50 dark:bg-[#112a1a] text-emerald-600 dark:text-[#4ade80] border border-emerald-200 dark:border-[#22c55e]/30'
                          : 'bg-rose-50 dark:bg-[#381014] text-rose-600 dark:text-[#f87171] border border-rose-200 dark:border-[#ef4444]/30'
                      }`}
                    >
                      {mov.entrada ? (
                        <ArrowDown className="w-4 h-4 stroke-[2.5]" />
                      ) : (
                        <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {mov.nome}
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {formatDateFull(mov.data)} · {mov.realizado ? 'Realizado' : 'Previsto'}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className={`text-sm font-extrabold tabular-nums ${
                        mov.entrada ? 'text-emerald-600 dark:text-[#4ade80]' : 'text-slate-900 dark:text-white'
                      }`}>
                        {mov.entrada ? '' : '-'}
                        {formatCurrency(Math.abs(mov.valor))}
                      </div>
                      <div className="text-[11px] text-neutral-400 tabular-nums mt-0.5">
                        Saldo {formatCurrency(mov.saldoApos)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
