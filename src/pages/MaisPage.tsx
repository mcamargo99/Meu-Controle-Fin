import React from 'react';
import { 
  BarChart2, 
  FileSpreadsheet, 
  Settings, 
  LogOut, 
  ChevronRight,
  TrendingUp,
  Database,
  Send,
  Bell
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { supabase } from '../lib/supabase';
import { gerarTextoAlertasWhatsApp, gerarLinkWhatsApp } from '../utils/notifications';

import { PWAInstallBanner } from '../components/PWAInstallBanner';

interface MaisPageProps {
  onOpenRelatorios: () => void;
  onOpenConfiguracoes: () => void;
  onOpenImportar: () => void;
  onOpenAuth: () => void;
  onOpenFluxo: () => void;
}

export const MaisPage: React.FC<MaisPageProps> = ({
  onOpenRelatorios,
  onOpenConfiguracoes,
  onOpenImportar,
  onOpenAuth,
  onOpenFluxo,
}) => {
  const { user, family, alertasAtivos, logout } = useFinance();

  const handleLogout = async () => {
    await logout();
  };

  const handleDispararWhatsApp = () => {
    const savedPhone = localStorage.getItem('mcf_whatsapp_phone') || '';
    const texto = gerarTextoAlertasWhatsApp(family.nome, alertasAtivos);
    const link = gerarLinkWhatsApp(texto, savedPhone);
    window.open(link, '_blank');
  };

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-200">
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
        Mais
      </h1>

      {/* Banner de Instalação do App PWA */}
      <PWAInstallBanner />

      {/* Main Options Card with colorful badge icons */}
      <div className="card-surface divide-y divide-slate-100 dark:divide-[#1e2330] overflow-hidden shadow-xs border border-slate-300 dark:border-[#202430]">
        {/* Fluxo de Caixa */}
        <button
          onClick={onOpenFluxo}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#181b24] transition-colors text-left cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-[#8ab4f8] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white block">
                Fluxo de caixa
              </span>
              <span className="text-xs text-slate-500 dark:text-neutral-400">
                Extrato diário e saldo progressivo
              </span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 dark:text-neutral-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
        </button>

        {/* Relatórios */}
        <button
          onClick={onOpenRelatorios}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#181b24] transition-colors text-left cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <BarChart2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white block">
                Relatórios
              </span>
              <span className="text-xs text-slate-500 dark:text-neutral-400">
                Gráficos interativos por mês e exportação CSV
              </span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 dark:text-neutral-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
        </button>

        {/* Avisos WhatsApp Rápidos */}
        <button
          onClick={handleDispararWhatsApp}
          className="w-full p-4 flex items-center justify-between hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors text-left cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Send className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white block">
                Disparar Avisos no WhatsApp
              </span>
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                Regras de 3 dias, vencimento hoje, atrasos e pagamentos a receber
              </span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </button>

        {/* Importar Planilha */}
        <button
          onClick={onOpenImportar}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#181b24] transition-colors text-left cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white block">
                Importar planilha
              </span>
              <span className="text-xs text-slate-500 dark:text-neutral-400">
                Importar lançamentos e contas de arquivo Excel
              </span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 dark:text-neutral-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
        </button>

        {/* Configurações */}
        <button
          onClick={onOpenConfiguracoes}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#181b24] transition-colors text-left cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Settings className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white block">
                Configurações
              </span>
              <span className="text-xs text-slate-500 dark:text-neutral-400">
                Família, membros, notificações e temas
              </span>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 dark:text-neutral-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
        </button>
      </div>

      {/* Sair / Login */}
      <button
        onClick={user ? handleLogout : onOpenAuth}
        className="w-full card-surface p-4 flex items-center gap-3.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors text-left cursor-pointer border border-slate-300 dark:border-[#202430] group"
      >
        <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <LogOut className="w-5 h-5 stroke-[2.2]" />
        </div>
        <span className="font-extrabold text-sm sm:text-base">
          {user ? 'Sair da conta' : 'Fazer Login / Criar Conta'}
        </span>
      </button>

      {/* App Branding Footer */}
      <div className="pt-4 text-center flex flex-col items-center justify-center gap-2 opacity-80 pb-2">
        <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-md border border-emerald-500/30 bg-[#080b0c]">
          <img src="/icon.svg" alt="Meu Controle" className="w-full h-full object-cover" />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-800 dark:text-neutral-200">
            Meu Controle Financeiro
          </div>
          <div className="text-[10px] text-slate-400 dark:text-neutral-500 font-medium">
            Versão 2.4.0 · PWA Ativo
          </div>
        </div>
      </div>
    </div>
  );
};
