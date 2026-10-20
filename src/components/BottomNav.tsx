import React, { useState } from 'react';
import { 
  Home, 
  ListChecks, 
  TrendingUp, 
  CreditCard, 
  Menu,
  Plus, 
  X,
  Receipt,
  ArrowDownCircle
} from 'lucide-react';

export type NavTab = 'inicio' | 'contas' | 'fluxo' | 'parcelas' | 'mais';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenNovaConta: () => void;
  onOpenNovaEntrada: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenNovaConta,
  onOpenNovaEntrada,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <>
      {/* Dimmed backdrop when central + menu is open */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/50 dark:bg-black/70 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
          onClick={() => setShowMenu(false)}
        />
      )}

      {/* Action Menu Popover centered directly above the central + button */}
      {showMenu && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-72 max-w-[90vw] card-surface p-2 shadow-2xl space-y-1.5 animate-in fade-in slide-in-from-bottom-3 duration-150">
          <div className="px-3 py-1.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider text-center border-b border-slate-100 dark:border-[#1e2330]">
            Novo Lançamento
          </div>

          {/* Nova Entrada */}
          <button
            onClick={() => {
              setShowMenu(false);
              onOpenNovaEntrada();
            }}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-left transition-colors group"
          >
            <div className="w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ArrowDownCircle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-800 dark:text-white">
                Nova entrada
              </div>
              <div className="text-[11px] text-neutral-400 truncate">
                Salário, extra ou rendimento
              </div>
            </div>
          </button>

          {/* Nova Conta */}
          <button
            onClick={() => {
              setShowMenu(false);
              onOpenNovaConta();
            }}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-950/30 text-left transition-colors group"
          >
            <div className="w-9 h-9 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Receipt className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-800 dark:text-white">
                Nova conta
              </div>
              <div className="text-[11px] text-neutral-400 truncate">
                Despesa fixa, variável ou fatura
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Bottom Navigation Bar with Centralized '+' Button */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#090a0f]/95 backdrop-blur-md border-t border-slate-200 dark:border-[#1a1d26] pb-safe transition-colors shadow-lg">
        <div className="max-w-md mx-auto grid grid-cols-5 items-center h-16 px-1 relative">
          
          {/* 1. Início */}
          <button
            onClick={() => {
              setShowMenu(false);
              onSelectTab('inicio');
            }}
            className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
              currentTab === 'inicio'
                ? 'text-blue-600 dark:text-[#8ab4f8] font-extrabold scale-105'
                : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            <Home className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-semibold">Início</span>
          </button>

          {/* 2. Contas */}
          <button
            onClick={() => {
              setShowMenu(false);
              onSelectTab('contas');
            }}
            className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
              currentTab === 'contas'
                ? 'text-blue-600 dark:text-[#8ab4f8] font-extrabold scale-105'
                : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            <ListChecks className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-semibold">Contas</span>
          </button>

          {/* 3. Botão '+' Centralizado nos Botões de Navegação */}
          <div className="flex flex-col items-center justify-center -mt-6">
            <button
              onClick={() => setShowMenu(!showMenu)}
              aria-label="Adicionar lançamento"
              title="Adicionar lançamento"
              className={`w-13 h-13 rounded-full flex items-center justify-center shadow-xl ring-4 ring-white dark:ring-[#090a0f] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer ${
                showMenu
                  ? 'rotate-45 bg-rose-600 dark:bg-rose-500 text-white shadow-rose-500/40'
                  : 'bg-blue-600 dark:bg-[#8ab4f8] text-white dark:text-[#090a0f] shadow-blue-600/40 dark:shadow-[#8ab4f8]/30 hover:bg-blue-700 dark:hover:bg-[#a6c8ff]'
              }`}
            >
              <Plus className="w-7 h-7 stroke-[3]" />
            </button>
            <span className="text-[10px] font-bold text-slate-700 dark:text-neutral-300 mt-1">Novo</span>
          </div>

          {/* 4. Parcelas */}
          <button
            onClick={() => {
              setShowMenu(false);
              onSelectTab('parcelas');
            }}
            className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
              currentTab === 'parcelas'
                ? 'text-blue-600 dark:text-[#8ab4f8] font-extrabold scale-105'
                : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            <CreditCard className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-semibold">Parcelas</span>
          </button>

          {/* 5. Mais */}
          <button
            onClick={() => {
              setShowMenu(false);
              onSelectTab('mais');
            }}
            className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
              currentTab === 'mais'
                ? 'text-blue-600 dark:text-[#8ab4f8] font-extrabold scale-105'
                : 'text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white'
            }`}
          >
            <Menu className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-semibold">Mais</span>
          </button>

        </div>
      </nav>
    </>
  );
};
