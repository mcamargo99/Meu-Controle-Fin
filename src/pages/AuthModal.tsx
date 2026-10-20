import React, { useState } from 'react';
import { X, Wallet, Check } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { loginWithDatabase, registerWithDatabase, resetPassword } from '../services/financeService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { setUser } = useFinance();
  const [mode, setMode] = useState<'login' | 'signup' | 'recovery'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [manterConectado, setManterConectado] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'login') {
        const loggedUser = await loginWithDatabase(email.trim(), password);
        if (manterConectado) {
          localStorage.setItem('mcf_auth_user_v2', JSON.stringify(loggedUser));
          localStorage.setItem('mcf_manter_conectado', 'true');
        } else {
          sessionStorage.setItem('mcf_auth_user_v2', JSON.stringify(loggedUser));
          localStorage.removeItem('mcf_auth_user_v2');
        }
        setUser(loggedUser as any);
        setMessage({ type: 'success', text: 'Conectado com sucesso!' });
        setTimeout(() => {
          onClose();
        }, 500);
      } else if (mode === 'signup') {
        const newUser = await registerWithDatabase(email.trim(), password, nome.trim());
        if (manterConectado) {
          localStorage.setItem('mcf_auth_user_v2', JSON.stringify(newUser));
          localStorage.setItem('mcf_manter_conectado', 'true');
        } else {
          sessionStorage.setItem('mcf_auth_user_v2', JSON.stringify(newUser));
          localStorage.removeItem('mcf_auth_user_v2');
        }
        setUser(newUser as any);
        setMessage({
          type: 'success',
          text: 'Conta criada com sucesso! Conectando à sua base familiar...',
        });
        setTimeout(() => {
          onClose();
        }, 600);
      } else if (mode === 'recovery') {
        await resetPassword(email.trim());
        setMessage({
          type: 'success',
          text: 'Se o e-mail estiver cadastrado, você receberá o link para redefinir a senha.',
        });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Verifique seus dados de acesso.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm space-y-3 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button top-right */}
        <button
          onClick={onClose}
          className="absolute right-0 -top-10 p-1.5 rounded-full text-neutral-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Top Header Card */}
        <div className="card-surface p-5 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-transparent text-primary dark:text-[#8ab4f8] flex items-center justify-start">
            <Wallet className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Meu Controle Financeiro
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
            As contas da família, sem planilha.
          </p>
        </div>

        {/* Login / Auth Card */}
        <div className="card-surface p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar Conta' : 'Recuperar Senha'}
          </h3>

          {message && (
            <div
              className={`p-3 rounded-xl text-xs ${
                message.type === 'success'
                  ? 'bg-emerald-50 dark:bg-[#112a1a] text-emerald-700 dark:text-[#4ade80] border border-emerald-200 dark:border-[#22c55e]/30'
                  : 'bg-rose-50 dark:bg-[#381014] text-rose-700 dark:text-[#f87171] border border-rose-200 dark:border-[#ef4444]/30'
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
                  Seu Nome
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  placeholder="Nome completo"
                  className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-[#161820] border border-slate-200 dark:border-[#262c3b] text-slate-900 dark:text-white text-sm focus:outline-hidden focus:border-primary dark:focus:border-[#8ab4f8] shadow-xs"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu.email@exemplo.com"
                className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-[#161820] border border-slate-200 dark:border-[#262c3b] text-slate-900 dark:text-white text-sm focus:outline-hidden focus:border-primary dark:focus:border-[#8ab4f8] shadow-xs"
              />
            </div>

            {mode !== 'recovery' && (
              <div>
                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-1.5">
                  Senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-3 rounded-2xl bg-slate-50 dark:bg-[#161820] border border-slate-200 dark:border-[#262c3b] text-slate-900 dark:text-white text-sm focus:outline-hidden focus:border-primary dark:focus:border-[#8ab4f8] shadow-xs"
                />
              </div>
            )}

            {mode === 'login' && (
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={manterConectado}
                  onChange={(e) => setManterConectado(e.target.checked)}
                  className="w-4 h-4 rounded-md accent-primary dark:accent-[#8ab4f8]"
                />
                <span className="text-xs text-slate-700 dark:text-neutral-300 font-medium">Manter conectado</span>
              </label>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-2xl bg-primary dark:bg-[#8ab4f8] text-white dark:text-[#090a0f] font-bold text-sm shadow-md hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 mt-2 cursor-pointer"
            >
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Cadastrar' : 'Enviar Link'}
            </button>
          </form>

          {/* Links Row */}
          <div className="flex items-center justify-between text-xs pt-1">
            {mode === 'login' ? (
              <>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-primary dark:text-[#8ab4f8] font-semibold hover:underline cursor-pointer"
                >
                  Criar conta
                </button>
                <button
                  type="button"
                  onClick={() => setMode('recovery')}
                  className="text-neutral-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  Esqueci a senha
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-primary dark:text-[#8ab4f8] font-semibold hover:underline w-full text-center cursor-pointer"
              >
                Voltar para Entrar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
