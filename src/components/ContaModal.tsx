import React, { useState, useEffect } from 'react';
import { X, Calendar, CreditCard, Repeat } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Conta, TipoConta, SituacaoConta } from '../types/finance';
import { getTodayBR } from '../utils/finance';

interface ContaModalProps {
  isOpen: boolean;
  onClose: () => void;
  contaToEdit?: Conta | null;
}

export const ContaModal: React.FC<ContaModalProps> = ({
  isOpen,
  onClose,
  contaToEdit,
}) => {
  const { categorias, addConta, updateConta, deleteConta, mesSelecionado } = useFinance();

  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');
  const [vencimento, setVencimento] = useState('');
  const [categoria, setCategoria] = useState('');
  const [tipo, setTipo] = useState<TipoConta>('fixa');
  const [situacao, setSituacao] = useState<SituacaoConta>('pendente');
  const [dataPagamento, setDataPagamento] = useState('');
  const [observacao, setObservacao] = useState('');

  // Opções de parcelamento / recorrência
  const [isParcelado, setIsParcelado] = useState(false);
  const [totalParcelas, setTotalParcelas] = useState(2);
  const [cartao, setCartao] = useState('');
  const [isRecorrente, setIsRecorrente] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (contaToEdit) {
      setNome(contaToEdit.nome);
      setValor(contaToEdit.valor.toString());
      setVencimento(contaToEdit.vencimento);
      setCategoria(contaToEdit.categoria);
      setTipo(contaToEdit.tipo);
      setSituacao(contaToEdit.situacao);
      setDataPagamento(contaToEdit.data_pagamento || '');
      setObservacao(contaToEdit.observacao || '');
      setIsParcelado(false);
      setIsRecorrente(contaToEdit.recorrente || false);
    } else {
      // Padrão novo
      setNome('');
      setValor('');
      // Vencimento padrão dentro do mês selecionado
      const hoje = getTodayBR();
      if (hoje.startsWith(mesSelecionado)) {
        setVencimento(hoje);
      } else {
        setVencimento(`${mesSelecionado}-10`);
      }
      setCategoria(categorias[0]?.nome || 'Outros');
      setTipo('fixa');
      setSituacao('pendente');
      setDataPagamento('');
      setObservacao('');
      setIsParcelado(false);
      setTotalParcelas(2);
      setCartao('');
      setIsRecorrente(false);
    }
  }, [contaToEdit, isOpen, mesSelecionado, categorias]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !valor || !vencimento) return;

    setIsSaving(true);
    try {
      const valorNum = parseFloat(valor.replace(',', '.'));

      if (contaToEdit) {
        await updateConta(contaToEdit.id, {
          nome: nome.trim(),
          valor: valorNum,
          vencimento,
          categoria,
          tipo,
          situacao,
          data_pagamento: situacao === 'pago' ? (dataPagamento || vencimento) : undefined,
          observacao: observacao.trim() || undefined,
          recorrente: isRecorrente,
        });
      } else {
        // Criando conta
        await addConta({
          nome: nome.trim(),
          valor: valorNum,
          vencimento,
          categoria,
          tipo,
          situacao,
          data_pagamento: situacao === 'pago' ? (dataPagamento || vencimento) : undefined,
          observacao: observacao.trim() || undefined,
          recorrente: isRecorrente,
        });

        // Se for parcelado, gera as demais parcelas para os meses futuros
        if (isParcelado && totalParcelas > 1) {
          const [anoStr, mesStr, diaStr] = vencimento.split('-');
          let ano = parseInt(anoStr, 10);
          let mes = parseInt(mesStr, 10);

          for (let i = 2; i <= totalParcelas; i++) {
            mes += 1;
            if (mes > 12) {
              mes = 1;
              ano += 1;
            }
            const proxVenc = `${ano}-${String(mes).padStart(2, '0')}-${diaStr}`;
            await addConta({
              nome: `${nome.trim()} (${i}/${totalParcelas})`,
              valor: valorNum,
              vencimento: proxVenc,
              categoria,
              tipo: 'cartao',
              situacao: 'pendente',
              observacao: cartao ? `Cartão: ${cartao}` : undefined,
            });
          }
        }
      }

      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!contaToEdit) return;
    if (confirm(`Deseja excluir a conta "${contaToEdit.nome}"?`)) {
      await deleteConta(contaToEdit.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white dark:bg-[#12141a] w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-[#232836] max-h-[92vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-[#12141a]/95 backdrop-blur-md px-5 py-4 border-b border-slate-100 dark:border-[#1e2330] flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {contaToEdit ? 'Editar Conta' : 'Nova Conta'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-[#1e2330] text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Nome da Conta */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
              Nome da conta *
            </label>
            <input
              type="text"
              list="sugestoes-contas"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: CPFL, Cartão Atacadão, IPTU..."
              required
              className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-[#161820] border border-slate-200 dark:border-[#262c3b] text-slate-900 dark:text-white focus:outline-hidden focus:border-primary dark:focus:border-[#8ab4f8] text-sm font-medium shadow-xs"
            />
            <datalist id="sugestoes-contas">
              <option value="CPFL" />
              <option value="Água" />
              <option value="Condomínio" />
              <option value="Internet" />
              <option value="IPTU" />
              <option value="Cartão Atacadão" />
              <option value="Financiamento AP" />
              <option value="DAS" />
              <option value="Celular Matheus" />
              <option value="Celular Nicole" />
              <option value="Faculdade - Nicole" />
            </datalist>
          </div>

          {/* Valor & Vencimento */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
                Valor (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-xs font-bold text-neutral-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="0,00"
                  required
                  className="w-full pl-10 pr-3 py-3 rounded-2xl bg-slate-50 dark:bg-[#161820] border border-slate-200 dark:border-[#262c3b] text-slate-900 dark:text-white focus:outline-hidden focus:border-primary dark:focus:border-[#8ab4f8] text-sm font-bold tabular-nums shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
                Vencimento *
              </label>
              <input
                type="date"
                value={vencimento}
                onChange={(e) => setVencimento(e.target.value)}
                required
                className="w-full px-3 py-3 rounded-2xl bg-slate-50 dark:bg-[#161820] border border-slate-200 dark:border-[#262c3b] text-slate-900 dark:text-white focus:outline-hidden focus:border-primary dark:focus:border-[#8ab4f8] text-xs font-medium shadow-xs"
              />
            </div>
          </div>

          {/* Categoria & Tipo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
                Categoria
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full px-3 py-3 rounded-2xl bg-slate-50 dark:bg-[#161820] border border-slate-200 dark:border-[#262c3b] text-slate-900 dark:text-white focus:outline-hidden text-xs font-medium shadow-xs"
              >
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.nome}>
                    {cat.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
                Tipo
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoConta)}
                className="w-full px-3 py-3 rounded-2xl bg-slate-50 dark:bg-[#161820] border border-slate-200 dark:border-[#262c3b] text-slate-900 dark:text-white focus:outline-hidden text-xs font-medium shadow-xs"
              >
                <option value="fixa">Fixa</option>
                <option value="variavel">Variável</option>
                <option value="cartao">Cartão</option>
              </select>
            </div>
          </div>

          {/* Situação */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
              Situação
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSituacao('pendente')}
                className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  situacao === 'pendente'
                    ? 'bg-amber-100 dark:bg-[#352510] text-amber-800 dark:text-[#f59e0b] border border-amber-300 dark:border-[#f59e0b]/40 shadow-xs'
                    : 'bg-slate-50 dark:bg-[#161820] text-neutral-500 dark:text-neutral-400 border border-slate-200 dark:border-[#262c3b]'
                }`}
              >
                Pendente
              </button>
              <button
                type="button"
                onClick={() => setSituacao('pago')}
                className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  situacao === 'pago'
                    ? 'bg-emerald-100 dark:bg-[#112a1a] text-emerald-800 dark:text-[#4ade80] border border-emerald-300 dark:border-[#22c55e]/40 shadow-xs'
                    : 'bg-slate-50 dark:bg-[#161820] text-neutral-500 dark:text-neutral-400 border border-slate-200 dark:border-[#262c3b]'
                }`}
              >
                Pago
              </button>
            </div>
          </div>

          {situacao === 'pago' && (
            <div>
              <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
                Data do Pagamento
              </label>
              <input
                type="date"
                value={dataPagamento || getTodayBR()}
                onChange={(e) => setDataPagamento(e.target.value)}
                className="w-full px-3 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#161820] border border-slate-200 dark:border-[#262c3b] text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden shadow-xs"
              />
            </div>
          )}

          {/* Toggles */}
          {!contaToEdit && (
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-[#1e2330]">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-[#161820] border border-slate-200 dark:border-[#262c3b]">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-primary dark:text-[#8ab4f8]" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Compra Parcelada
                    </span>
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      Gera as parcelas mensais no valor informado
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isParcelado}
                  onChange={(e) => {
                    setIsParcelado(e.target.checked);
                    if (e.target.checked) setIsRecorrente(false);
                  }}
                  className="w-4 h-4 rounded-md accent-primary dark:accent-[#8ab4f8]"
                />
              </div>

              {isParcelado && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-100 dark:bg-[#1a1d26] border border-slate-200 dark:border-[#262c3b]">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                      Nº de Parcelas
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="48"
                      value={totalParcelas}
                      onChange={(e) => setTotalParcelas(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#161820] border border-slate-200 dark:border-[#262c3b] text-slate-900 dark:text-white text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 mb-1">
                      Cartão / Banco
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Atacadão"
                      value={cartao}
                      onChange={(e) => setCartao(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#161820] border border-slate-200 dark:border-[#262c3b] text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                </div>
              )}

              {!isParcelado && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-[#161820] border border-slate-200 dark:border-[#262c3b]">
                  <div className="flex items-center gap-2.5">
                    <Repeat className="w-4 h-4 text-primary dark:text-[#8ab4f8]" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Despesa Recorrente
                      </span>
                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Repetir mensalmente (água, condomínio...)
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isRecorrente}
                    onChange={(e) => setIsRecorrente(e.target.checked)}
                    className="w-4 h-4 rounded-md accent-primary dark:accent-[#8ab4f8]"
                  />
                </div>
              )}
            </div>
          )}

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
              Observação (Opcional)
            </label>
            <input
              type="text"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex.: Aniversário Maitê, Valdeci..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#161820] border border-slate-200 dark:border-[#262c3b] text-slate-900 dark:text-white text-xs focus:outline-hidden shadow-xs"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full h-11 rounded-2xl bg-primary dark:bg-[#8ab4f8] text-white dark:text-[#090a0f] font-bold text-sm shadow-md hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>

          {contaToEdit && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={handleDelete}
                className="text-xs text-rose-500 hover:underline font-semibold cursor-pointer"
              >
                Excluir conta
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
