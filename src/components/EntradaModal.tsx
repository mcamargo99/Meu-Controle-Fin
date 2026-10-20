import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Entrada, TipoEntrada, SituacaoEntrada } from '../types/finance';
import { getTodayBR } from '../utils/finance';

interface EntradaModalProps {
  isOpen: boolean;
  onClose: () => void;
  entradaToEdit?: Entrada | null;
}

export const EntradaModal: React.FC<EntradaModalProps> = ({
  isOpen,
  onClose,
  entradaToEdit,
}) => {
  const { addEntrada, updateEntrada, deleteEntrada, mesSelecionado } = useFinance();

  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [dataPrevista, setDataPrevista] = useState('');
  const [tipo, setTipo] = useState<TipoEntrada>('salario');
  const [pessoa, setPessoa] = useState('');
  const [situacao, setSituacao] = useState<SituacaoEntrada>('recebido');
  const [observacao, setObservacao] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (entradaToEdit) {
      setDescricao(entradaToEdit.descricao);
      setValor(entradaToEdit.valor.toString());
      setDataPrevista(entradaToEdit.data_prevista);
      setTipo(entradaToEdit.tipo);
      setPessoa(entradaToEdit.pessoa || '');
      setSituacao(entradaToEdit.situacao);
      setObservacao(entradaToEdit.observacao || '');
    } else {
      setDescricao('');
      setValor('');
      const hoje = getTodayBR();
      if (hoje.startsWith(mesSelecionado)) {
        setDataPrevista(hoje);
      } else {
        setDataPrevista(`${mesSelecionado}-05`);
      }
      setTipo('salario');
      setPessoa('Matheus');
      setSituacao('recebido');
      setObservacao('');
    }
  }, [entradaToEdit, isOpen, mesSelecionado]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim() || !valor || !dataPrevista) return;

    setIsSaving(true);
    try {
      const valorNum = parseFloat(valor.replace(',', '.'));

      if (entradaToEdit) {
        await updateEntrada(entradaToEdit.id, {
          descricao: descricao.trim(),
          valor: valorNum,
          data_prevista: dataPrevista,
          data_recebida: situacao === 'recebido' ? dataPrevista : undefined,
          tipo,
          pessoa: pessoa.trim() || undefined,
          situacao,
          observacao: observacao.trim() || undefined,
        });
      } else {
        await addEntrada({
          descricao: descricao.trim(),
          valor: valorNum,
          data_prevista: dataPrevista,
          data_recebida: situacao === 'recebido' ? dataPrevista : undefined,
          tipo,
          pessoa: pessoa.trim() || undefined,
          situacao,
          observacao: observacao.trim() || undefined,
        });
      }

      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!entradaToEdit) return;
    if (confirm(`Deseja excluir a entrada "${entradaToEdit.descricao}"?`)) {
      await deleteEntrada(entradaToEdit.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white dark:bg-[#12141a] w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-[#232836] max-h-[92vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-200">
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-[#12141a]/95 backdrop-blur-md px-5 py-4 border-b border-slate-100 dark:border-[#1e2330] flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {entradaToEdit ? 'Editar Entrada' : 'Nova Entrada'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-[#1e2330] text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
              Descrição *
            </label>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex.: Salário Matheus, Hora Extra, Freelance..."
              required
              className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-[#161820] border border-slate-200 dark:border-[#262c3b] text-slate-900 dark:text-white focus:outline-hidden focus:border-primary dark:focus:border-[#8ab4f8] text-sm font-medium shadow-xs"
            />
          </div>

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
                Data *
              </label>
              <input
                type="date"
                value={dataPrevista}
                onChange={(e) => setDataPrevista(e.target.value)}
                required
                className="w-full px-3 py-3 rounded-2xl bg-slate-50 dark:bg-[#161820] border border-slate-200 dark:border-[#262c3b] text-slate-900 dark:text-white focus:outline-hidden focus:border-primary dark:focus:border-[#8ab4f8] text-xs font-medium shadow-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
                Tipo
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoEntrada)}
                className="w-full px-3 py-3 rounded-2xl bg-slate-50 dark:bg-[#161820] border border-slate-200 dark:border-[#262c3b] text-slate-900 dark:text-white focus:outline-hidden text-xs font-medium shadow-xs"
              >
                <option value="salario">Salário</option>
                <option value="extra">Renda Extra</option>
                <option value="investimento">Investimentos</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
                Pessoa / Origem
              </label>
              <input
                type="text"
                value={pessoa}
                onChange={(e) => setPessoa(e.target.value)}
                placeholder="Ex.: Matheus"
                className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-[#161820] border border-slate-200 dark:border-[#262c3b] text-slate-900 dark:text-white focus:outline-hidden text-xs font-medium shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
              Situação
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSituacao('recebido')}
                className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  situacao === 'recebido'
                    ? 'bg-emerald-100 dark:bg-[#112a1a] text-emerald-800 dark:text-[#4ade80] border border-emerald-300 dark:border-[#22c55e]/40 shadow-xs'
                    : 'bg-slate-50 dark:bg-[#161820] text-neutral-500 dark:text-neutral-400 border border-slate-200 dark:border-[#262c3b]'
                }`}
              >
                Recebido
              </button>
              <button
                type="button"
                onClick={() => setSituacao('previsto')}
                className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  situacao === 'previsto'
                    ? 'bg-sky-100 dark:bg-[#1a2333] text-sky-800 dark:text-[#8ab4f8] border border-sky-300 dark:border-[#8ab4f8]/40 shadow-xs'
                    : 'bg-slate-50 dark:bg-[#161820] text-neutral-500 dark:text-neutral-400 border border-slate-200 dark:border-[#262c3b]'
                }`}
              >
                Previsto
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
              Observação (Opcional)
            </label>
            <input
              type="text"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex.: Adiantamento, bônus..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#161820] border border-slate-200 dark:border-[#262c3b] text-slate-900 dark:text-white text-xs focus:outline-hidden shadow-xs"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full h-11 rounded-2xl bg-primary dark:bg-[#8ab4f8] text-white dark:text-[#090a0f] font-bold text-sm shadow-md hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'Salvando...' : 'Salvar Entrada'}
            </button>
          </div>

          {entradaToEdit && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={handleDelete}
                className="text-xs text-rose-500 hover:underline font-semibold cursor-pointer"
              >
                Excluir entrada
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
