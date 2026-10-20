import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatMonthLabel } from '../utils/finance';

export const HeaderMonth: React.FC = () => {
  const { mesSelecionado, setMesSelecionado } = useFinance();

  const handlePrevMonth = () => {
    const [year, month] = mesSelecionado.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setMesSelecionado(newMonth);
  };

  const handleNextMonth = () => {
    const [year, month] = mesSelecionado.split('-').map(Number);
    const date = new Date(year, month, 1);
    const newMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    setMesSelecionado(newMonth);
  };

  return (
    <div className="w-full card-surface rounded-2xl h-12 px-3 flex items-center justify-between shadow-xs mb-4 border border-slate-300 dark:border-[#202430]">
      <button
        onClick={handlePrevMonth}
        className="p-1.5 rounded-xl text-slate-500 hover:text-primary dark:text-neutral-400 dark:hover:text-[#8ab4f8] hover:bg-slate-100 dark:hover:bg-[#1a1e27] active:scale-95 transition-all cursor-pointer"
        title="Mês anterior"
        aria-label="Mês anterior"
      >
        <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
      </button>

      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-primary dark:text-[#8ab4f8]" />
        <span className="text-sm font-extrabold tracking-wide text-slate-900 dark:text-white">
          {formatMonthLabel(mesSelecionado)}
        </span>
      </div>

      <button
        onClick={handleNextMonth}
        className="p-1.5 rounded-xl text-slate-500 hover:text-primary dark:text-neutral-400 dark:hover:text-[#8ab4f8] hover:bg-slate-100 dark:hover:bg-[#1a1e27] active:scale-95 transition-all cursor-pointer"
        title="Próximo mês"
        aria-label="Próximo mês"
      >
        <ChevronRight className="w-5 h-5 stroke-[2.5]" />
      </button>
    </div>
  );
};
