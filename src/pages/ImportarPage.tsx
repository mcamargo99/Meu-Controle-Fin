import React, { useState } from 'react';
import { ArrowLeft, FileUp, CheckCircle2, Download, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { getTodayBR } from '../utils/finance';

interface ImportarPageProps {
  onBack: () => void;
}

export const ImportarPage: React.FC<ImportarPageProps> = ({ onBack }) => {
  const { addConta } = useFinance();
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleSimularImportacao = async () => {
    setFileName('extrato_bancario_outubro.csv');
    
    await addConta({
      nome: 'Mercado Pão de Açúcar',
      descricao: 'Importado de extrato bancário',
      categoria: 'Alimentação',
      tipo: 'variavel',
      valor: 184.50,
      vencimento: getTodayBR(),
      situacao: 'pago',
      data_pagamento: getTodayBR(),
    });

    await addConta({
      nome: 'Posto Shell Combustível',
      descricao: 'Importado de extrato bancário',
      categoria: 'Carro',
      tipo: 'variavel',
      valor: 210.00,
      vencimento: getTodayBR(),
      situacao: 'pago',
      data_pagamento: getTodayBR(),
    });

    setImportedCount(2);
  };

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-[#1e2330] text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Importar Planilha
        </h1>
      </div>

      <div className="card-surface p-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 dark:bg-[#8ab4f8]/10 text-primary dark:text-[#8ab4f8] flex items-center justify-center mx-auto">
          <FileUp className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Importe extratos e planilhas em segundos
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto leading-relaxed">
            Arraste seu arquivo CSV ou Excel (XLSX) ou clique para selecionar. O sistema identifica automaticamente colunas de data, valor e descrição.
          </p>
        </div>

        <div className="border-2 border-dashed border-slate-300 dark:border-[#262c3b] hover:border-primary dark:hover:border-[#8ab4f8] p-8 rounded-2xl cursor-pointer transition-colors space-y-2 bg-slate-50/50 dark:bg-transparent">
          <FileSpreadsheet className="w-8 h-8 text-neutral-400 mx-auto" />
          <div className="text-xs font-semibold text-slate-800 dark:text-white">
            Clique para enviar seu arquivo (.csv, .xlsx)
          </div>
          <span className="text-[10px] text-neutral-400 block">
            Formatos suportados: Nubank, Itaú, Bradesco, Inter, Excel
          </span>
        </div>

        <button
          onClick={handleSimularImportacao}
          className="w-full h-11 rounded-2xl bg-primary dark:bg-[#8ab4f8] text-white dark:text-[#090a0f] font-bold text-sm hover:opacity-90 active:scale-[0.99] transition-all shadow-md cursor-pointer"
        >
          Testar Importação de Extrato
        </button>

        {importedCount !== null && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-[#112a1a] border border-emerald-200 dark:border-[#22c55e]/30 text-emerald-700 dark:text-[#4ade80] text-xs flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Sucesso! {importedCount} lançamentos importados de {fileName}.</span>
          </div>
        )}
      </div>
    </div>
  );
};
