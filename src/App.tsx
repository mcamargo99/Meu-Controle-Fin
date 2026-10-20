import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { BottomNav, NavTab } from './components/BottomNav';
import { InicioPage } from './pages/InicioPage';
import { ContasPage } from './pages/ContasPage';
import { FluxoPage } from './pages/FluxoPage';
import { ParcelasPage } from './pages/ParcelasPage';
import { MaisPage } from './pages/MaisPage';
import { RelatoriosPage } from './pages/RelatoriosPage';
import { ConfiguracoesPage } from './pages/ConfiguracoesPage';
import { ImportarPage } from './pages/ImportarPage';
import { ContaModal } from './components/ContaModal';
import { EntradaModal } from './components/EntradaModal';
import { AuthModal } from './pages/AuthModal';
import { AuthPage } from './pages/AuthPage';
import { Conta, Entrada } from './types/finance';

function AppContent() {
  const { user } = useFinance();
  const [currentTab, setCurrentTab] = useState<NavTab>('inicio');
  const [subView, setSubView] = useState<'relatorios' | 'configuracoes' | 'importar' | null>(null);
  const [contasFilter, setContasFilter] = useState<'todos' | 'pendentes' | 'pagos'>('todos');

  // Modais
  const [isContaModalOpen, setIsContaModalOpen] = useState(false);
  const [contaToEdit, setContaToEdit] = useState<Conta | null>(null);

  const [isEntradaModalOpen, setIsEntradaModalOpen] = useState(false);
  const [entradaToEdit, setEntradaToEdit] = useState<Entrada | null>(null);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleOpenNovaConta = () => {
    setContaToEdit(null);
    setIsContaModalOpen(true);
  };

  const handleEditConta = (conta: Conta) => {
    setContaToEdit(conta);
    setIsContaModalOpen(true);
  };

  const handleOpenNovaEntrada = () => {
    setEntradaToEdit(null);
    setIsEntradaModalOpen(true);
  };

  const handleEditEntrada = (entrada: Entrada) => {
    setEntradaToEdit(entrada);
    setIsEntradaModalOpen(true);
  };

  const [contasSubTab, setContasSubTab] = useState<'contas' | 'entradas'>('contas');

  const handleSelectTab = (tab: NavTab) => {
    setSubView(null);
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToContasWithFilter = (
    filter?: 'todos' | 'pendentes' | 'pagos',
    tab: 'contas' | 'entradas' = 'contas'
  ) => {
    if (filter) setContasFilter(filter);
    setContasSubTab(tab);
    handleSelectTab('contas');
  };

  // Se não estiver logado, exibe a tela de login/cadastro conforme o print enviado
  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col justify-between selection:bg-[#8ab4f8]/30 transition-colors duration-200">
      {/* Mobile-First Main Container */}
      <main className="w-full max-w-md mx-auto px-4 pt-4 pb-28 flex-1">
        {/* Subviews or Main Tabs */}
        {subView === 'relatorios' ? (
          <RelatoriosPage onBack={() => setSubView(null)} />
        ) : subView === 'configuracoes' ? (
          <ConfiguracoesPage onBack={() => setSubView(null)} />
        ) : subView === 'importar' ? (
          <ImportarPage onBack={() => setSubView(null)} />
        ) : (
          <>
            {currentTab === 'inicio' && (
              <InicioPage
                onNavigateToContas={handleNavigateToContasWithFilter}
                onEditConta={handleEditConta}
                onOpenNovaConta={handleOpenNovaConta}
              />
            )}

            {currentTab === 'contas' && (
              <ContasPage
                initialFilter={contasFilter}
                initialTab={contasSubTab}
                onEditConta={handleEditConta}
                onEditEntrada={handleEditEntrada}
                onOpenNovaConta={handleOpenNovaConta}
                onOpenNovaEntrada={handleOpenNovaEntrada}
              />
            )}

            {currentTab === 'fluxo' && <FluxoPage />}

            {currentTab === 'parcelas' && (
              <ParcelasPage onOpenNovaConta={handleOpenNovaConta} />
            )}

            {currentTab === 'mais' && (
              <MaisPage
                onOpenRelatorios={() => setSubView('relatorios')}
                onOpenConfiguracoes={() => setSubView('configuracoes')}
                onOpenImportar={() => setSubView('importar')}
                onOpenAuth={() => setIsAuthModalOpen(true)}
                onOpenFluxo={() => handleSelectTab('fluxo')}
              />
            )}
          </>
        )}
      </main>

      {/* Floating Action Button & Bottom Bar */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenNovaConta={handleOpenNovaConta}
        onOpenNovaEntrada={handleOpenNovaEntrada}
      />

      {/* Modais Globais */}
      <ContaModal
        isOpen={isContaModalOpen}
        onClose={() => {
          setIsContaModalOpen(false);
          setContaToEdit(null);
        }}
        contaToEdit={contaToEdit}
      />

      <EntradaModal
        isOpen={isEntradaModalOpen}
        onClose={() => {
          setIsEntradaModalOpen(false);
          setEntradaToEdit(null);
        }}
        entradaToEdit={entradaToEdit}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}
