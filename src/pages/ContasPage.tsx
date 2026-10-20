import React, { useState } from 'react';
import { 
  Search, 
  RotateCcw, 
  Check, 
  MoreVertical, 
  Trash2, 
  Edit3, 
  Plus, 
  CheckCircle2, 
  Copy 
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { HeaderMonth } from '../components/HeaderMonth';
import { formatCurrency, formatDateFull, getSituacaoEfetiva, getTodayBR } from '../utils/finance';
import { Conta, Entrada } from '../types/finance';

interface ContasPageProps {
  initialFilter?: 'todos' | 'pendentes' | 'pagos';
  initialTab?: 'contas' | 'entradas';
  onEditConta: (conta: Conta) => void;
  onEditEntrada: (entrada: Entrada) => void;
  onOpenNovaConta: () => void;
  onOpenNovaEntrada: () => void;
}

export const ContasPage: React.FC<ContasPageProps> = ({
  initialFilter = 'todos',
  initialTab = 'contas',
  onEditConta,
  onEditEntrada,
  onOpenNovaConta,
  onOpenNovaEntrada,
}) => {
  const { 
    contas, 
    entradas, 
    categorias,
    mesSelecionado, 
    marcarContaComoPaga, 
    desfazerPagamentoConta,
    deleteConta,
    marcarEntradaComoRecebida,
    desfazerRecebimentoEntrada,
    deleteEntrada,
    addConta
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'contas' | 'entradas'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('todas');
  const [selectedTipo, setSelectedTipo] = useState('todos');
  const [selectedSituacao, setSelectedSituacao] = useState<'todos' | 'pendentes' | 'pagos'>(initialFilter);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const hoje = getTodayBR();

  // Filtrar Contas
  const contasDoMes = contas
    .filter((c) => c.competencia === mesSelecionado && c.situacao !== 'cancelado')
    .filter((c) => {
      const matchSearch = c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.descricao || '').toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchSearch) return false;

      if (selectedCategoria !== 'todas' && c.categoria !== selectedCategoria) return false;
      if (selectedTipo !== 'todos' && c.tipo !== selectedTipo) return false;

      const eff = getSituacaoEfetiva(c, hoje);
      if (selectedSituacao === 'pendentes') return eff === 'pendente' || eff === 'atrasado';
      if (selectedSituacao === 'pagos') return eff === 'pago';

      return true;
    })
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento));

  // Filtrar Entradas
  const entradasDoMes = entradas
    .filter((e) => e.competencia === mesSelecionado)
    .filter((e) => {
      const matchSearch = e.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.pessoa || '').toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchSearch) return false;

      if (selectedSituacao === 'pendentes') return e.situacao === 'previsto';
      if (selectedSituacao === 'pagos') return e.situacao === 'recebido';

      return true;
    })
    .sort((a, b) => a.data_prevista.localeCompare(b.data_prevista));

  const handleDuplicarConta = (c: Conta) => {
    addConta({
      nome: `${c.nome} (Cópia)`,
      descricao: c.descricao,
      categoria: c.categoria,
      tipo: c.tipo,
      valor: c.valor,
      vencimento: c.vencimento,
      situacao: 'pendente',
    });
    setActiveMenuId(null);
  };

  return (
    <div className="space-y-4 pb-6">
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
        Contas
      </h1>

      {/* Month Selector Bar */}
      <HeaderMonth />

      {/* Segmented Tab: [Contas] [Entradas] */}
      <div className="w-full bg-slate-200 dark:bg-[#12141a] border border-slate-300 dark:border-[#202430] p-1 rounded-2xl grid grid-cols-2">
        <button
          onClick={() => setActiveTab('contas')}
          className={`py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
            activeTab === 'contas'
              ? 'bg-white dark:bg-[#1e2330] text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
          }`}
        >
          Contas
        </button>
        <button
          onClick={() => setActiveTab('entradas')}
          className={`py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
            activeTab === 'entradas'
              ? 'bg-white dark:bg-[#1e2330] text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
          }`}
        >
          Entradas
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 dark:text-neutral-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={activeTab === 'contas' ? 'Pesquisar conta' : 'Pesquisar entrada'}
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-[#12141a] border border-slate-300 dark:border-[#202430] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-400 text-sm focus:outline-hidden focus:border-primary dark:focus:border-[#8ab4f8] shadow-xs"
        />
      </div>

      {/* Filters Row (Categoria, Tipo, Situação) */}
      {activeTab === 'contas' && (
        <div className="grid grid-cols-3 gap-2">
          {/* Categoria */}
          <select
            value={selectedCategoria}
            onChange={(e) => setSelectedCategoria(e.target.value)}
            className="w-full px-2.5 py-2.5 rounded-2xl bg-white dark:bg-[#12141a] border border-slate-300 dark:border-[#202430] text-slate-900 dark:text-neutral-300 text-xs font-semibold focus:outline-hidden shadow-xs cursor-pointer hover:border-primary"
          >
            <option value="todas">Categoria</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.nome}>
                {cat.nome}
              </option>
            ))}
          </select>

          {/* Tipo */}
          <select
            value={selectedTipo}
            onChange={(e) => setSelectedTipo(e.target.value)}
            className="w-full px-2.5 py-2.5 rounded-2xl bg-white dark:bg-[#12141a] border border-slate-300 dark:border-[#202430] text-slate-900 dark:text-neutral-300 text-xs font-semibold focus:outline-hidden shadow-xs cursor-pointer hover:border-primary"
          >
            <option value="todos">Tipo</option>
            <option value="fixa">Fixa</option>
            <option value="variavel">Variável</option>
            <option value="cartao">Cartão</option>
          </select>

          {/* Situação */}
          <select
            value={selectedSituacao}
            onChange={(e) => setSelectedSituacao(e.target.value as any)}
            className="w-full px-2.5 py-2.5 rounded-2xl bg-white dark:bg-[#12141a] border border-slate-300 dark:border-[#202430] text-slate-900 dark:text-neutral-300 text-xs font-semibold focus:outline-hidden shadow-xs cursor-pointer hover:border-primary"
          >
            <option value="todos">Situação</option>
            <option value="pendentes">Pendente</option>
            <option value="pagos">Pago</option>
          </select>
        </div>
      )}

      {/* Contas List */}
      {activeTab === 'contas' ? (
        contasDoMes.length === 0 ? (
          <div className="card-surface p-8 text-center text-xs text-neutral-400 space-y-2">
            <div>Nenhuma conta encontrada neste filtro.</div>
            <button
              onClick={onOpenNovaConta}
              className="text-primary dark:text-[#8ab4f8] font-bold hover:underline cursor-pointer"
            >
              Adicionar nova despesa
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {contasDoMes.map((conta) => {
              const status = getSituacaoEfetiva(conta, hoje);
              const isPago = status === 'pago';
              const isAtrasado = status === 'atrasado';
              const isMenuOpen = activeMenuId === conta.id;

              return (
                <div
                  key={conta.id}
                  onClick={() => onEditConta(conta)}
                  className={`card-surface p-4 relative overflow-hidden transition-all cursor-pointer hover:border-primary dark:hover:border-[#8ab4f8] active:scale-[0.99] select-none ${
                    isPago ? 'border-l-4 border-l-[#22c55e]' : isAtrasado ? 'border-l-4 border-l-[#ef4444]' : 'border-l-4 border-l-[#f59e0b]'
                  }`}
                  title="Clique para editar este lançamento"
                >
                  {/* Top: Nome e Valor */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-primary dark:group-hover:text-[#8ab4f8] transition-colors">
                        {conta.nome}
                      </h3>
                      <div className="text-xs text-slate-600 dark:text-neutral-400 mt-1 leading-relaxed flex flex-wrap items-center gap-1.5">
                        <span>Venc. {formatDateFull(conta.vencimento)}</span>
                        {isPago && conta.data_pagamento && <span>· Pago {formatDateFull(conta.data_pagamento)}</span>}
                        {conta.descricao && <span>· {conta.descricao}</span>}
                        {conta.categoria && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40">
                            {conta.categoria}
                          </span>
                        )}
                        {conta.recorrente && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40">
                            Recorrente
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-extrabold tabular-nums text-slate-900 dark:text-white">
                        {formatCurrency(conta.valor)}
                      </span>
                    </div>
                  </div>

                  {/* Bottom: Badge & Desfazer / Pagar + 3 Dots */}
                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 dark:border-[#1e2330]">
                    {/* Badge */}
                    {isPago ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-[#112a1a] text-emerald-800 dark:text-[#4ade80] border border-emerald-300 dark:border-[#22c55e]/30 text-xs font-bold">
                        Pago
                      </span>
                    ) : isAtrasado ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-[#381014] text-rose-800 dark:text-[#f87171] border border-rose-300 dark:border-[#ef4444]/30 text-xs font-bold">
                        Atrasado
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-[#352510] text-amber-900 dark:text-[#f59e0b] border border-amber-300 dark:border-[#f59e0b]/30 text-xs font-bold">
                        Pendente
                      </span>
                    )}

                    {/* Actions Right */}
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {isPago ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            desfazerPagamentoConta(conta.id);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1e2330] dark:hover:bg-[#283042] text-xs font-semibold text-slate-800 dark:text-white transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Desfazer</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            marcarContaComoPaga(conta.id);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-xs font-bold text-black transition-colors cursor-pointer shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Pagar</span>
                        </button>
                      )}

                      {/* 3 Dots Menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(isMenuOpen ? null : conta.id);
                          }}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#1e2330] transition-colors cursor-pointer"
                          title="Mais opções"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {isMenuOpen && (
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 bottom-full mb-1 z-30 w-36 bg-white dark:bg-[#161820] border border-slate-200 dark:border-[#2b3040] rounded-xl p-1 shadow-2xl"
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(null);
                                onEditConta(conta);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-[#222634] rounded-lg text-left cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-neutral-400" />
                              <span>Editar</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicarConta(conta);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-[#222634] rounded-lg text-left cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5 text-neutral-400" />
                              <span>Duplicar</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(null);
                                if (confirm(`Excluir conta "${conta.nome}"?`)) {
                                  deleteConta(conta.id);
                                }
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg text-left cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Excluir</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Entradas List */
        entradasDoMes.length === 0 ? (
          <div className="card-surface p-8 text-center text-xs text-neutral-400 space-y-2">
            <div>Nenhuma entrada cadastrada neste filtro.</div>
            <button
              onClick={onOpenNovaEntrada}
              className="text-primary dark:text-[#8ab4f8] font-bold hover:underline cursor-pointer"
            >
              Adicionar nova entrada
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {entradasDoMes.map((entrada) => {
              const isRecebido = entrada.situacao === 'recebido';

              return (
                <div
                  key={entrada.id}
                  onClick={() => onEditEntrada(entrada)}
                  className="card-surface p-4 border-l-4 border-l-[#22c55e] cursor-pointer hover:border-primary dark:hover:border-[#8ab4f8] active:scale-[0.99] select-none transition-all"
                  title="Clique para editar esta entrada"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                        {entrada.descricao}
                      </h3>
                      <div className="text-xs text-slate-600 dark:text-neutral-400 mt-1 flex flex-wrap items-center gap-1.5">
                        <span>Previsto: {formatDateFull(entrada.data_prevista)}</span>
                        {entrada.pessoa && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40">
                            {entrada.pessoa}
                          </span>
                        )}
                        {entrada.tipo && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 uppercase">
                            {entrada.tipo}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-base font-extrabold tabular-nums text-emerald-700 dark:text-[#4ade80]">
                        +{formatCurrency(entrada.valor)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 dark:border-[#1e2330]">
                    {isRecebido ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-[#112a1a] text-emerald-800 dark:text-[#4ade80] border border-emerald-300 dark:border-[#22c55e]/30 text-xs font-bold">
                        Recebido
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-sky-100 dark:bg-[#1a2333] text-sky-800 dark:text-[#8ab4f8] border border-sky-300 dark:border-[#8ab4f8]/30 text-xs font-bold">
                        Previsto
                      </span>
                    )}

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {isRecebido ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            desfazerRecebimentoEntrada(entrada.id);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1e2330] dark:hover:bg-[#283042] text-xs font-semibold text-slate-800 dark:text-white transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Desfazer</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            marcarEntradaComoRecebida(entrada.id);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-xs font-bold text-black transition-colors cursor-pointer shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Receber</span>
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditEntrada(entrada);
                        }}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Excluir entrada "${entrada.descricao}"?`)) {
                            deleteEntrada(entrada.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};
