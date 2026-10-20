import React, { useState } from 'react';
import { Download, Smartphone, Check, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already installed, don't show prompt
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const res = await install();
      if (res) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 3000);
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <div className="card-surface p-3.5 border border-emerald-400/40 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-md border border-emerald-500/30 bg-[#080b0c]">
            <img src="/icon.svg" alt="Meu Controle" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
              Instalar Aplicativo
            </div>
            <div className="text-[11px] text-slate-600 dark:text-neutral-400 truncate">
              Acesso rápido na tela inicial do celular
            </div>
          </div>
        </div>

        <button
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs active:scale-95"
        >
          {installSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Instalado!</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span>Instalar</span>
            </>
          )}
        </button>
      </div>

      {/* Guia de instalação manual se o navegador ainda não disparou o prompt nativo */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm card-surface p-5 space-y-4 relative shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1e2330] pb-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-600 dark:text-[#8ab4f8]" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Como instalar o app no celular
                </h3>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="text-xs text-slate-700 dark:text-neutral-300 space-y-2.5 leading-relaxed">
                <p>No <strong>Safari do iPhone / iPad</strong>:</p>
                <div className="flex items-start gap-2 bg-slate-100 dark:bg-[#161820] p-2.5 rounded-xl">
                  <Share className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>1. Toque no botão de <strong>Compartilhar</strong> (ícone do quadrado com seta para cima).</span>
                </div>
                <div className="flex items-start gap-2 bg-slate-100 dark:bg-[#161820] p-2.5 rounded-xl">
                  <PlusSquare className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>2. Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>.</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-700 dark:text-neutral-300 space-y-2.5 leading-relaxed">
                <p>No <strong>Google Chrome (Android)</strong>:</p>
                <div className="flex items-start gap-2 bg-slate-100 dark:bg-[#161820] p-2.5 rounded-xl">
                  <span className="font-bold text-blue-600">⋮</span>
                  <span>1. Toque no menu de <strong>3 pontos</strong> no canto superior direito do Chrome.</span>
                </div>
                <div className="flex items-start gap-2 bg-slate-100 dark:bg-[#161820] p-2.5 rounded-xl">
                  <Download className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>2. Selecione <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>.</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowGuide(false)}
              className="w-full py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold active:scale-95 transition-all cursor-pointer"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
};
