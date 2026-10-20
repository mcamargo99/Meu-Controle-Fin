import React, { useState } from 'react';
import { Wallet, Check, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { loginWithDatabase, registerWithDatabase, resetPassword } from '../services/financeService';

interface AuthPageProps {
  onSuccess?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const { setUser } = useFinance();
  const [mode, setMode] = useState<'login' | 'signup' | 'recovery'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [manterConectado, setManterConectado] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const emailClean = email.trim();

    try {
      if (mode === 'login') {
        const loggedUser = await loginWithDatabase(emailClean, password);

        if (manterConectado) {
          localStorage.setItem('mcf_auth_user_v2', JSON.stringify(loggedUser));
          localStorage.setItem('mcf_manter_conectado', 'true');
          sessionStorage.removeItem('mcf_auth_user_v2');
        } else {
          sessionStorage.setItem('mcf_auth_user_v2', JSON.stringify(loggedUser));
          localStorage.removeItem('mcf_auth_user_v2');
          localStorage.removeItem('mcf_manter_conectado');
        }

        setMessage({ type: 'success', text: 'Conectado com sucesso!' });
        setUser(loggedUser as any);
        if (onSuccess) onSuccess();
      } else if (mode === 'signup') {
        const newUser = await registerWithDatabase(emailClean, password, nome.trim());

        if (manterConectado) {
          localStorage.setItem('mcf_auth_user_v2', JSON.stringify(newUser));
          localStorage.setItem('mcf_manter_conectado', 'true');
          sessionStorage.removeItem('mcf_auth_user_v2');
        } else {
          sessionStorage.setItem('mcf_auth_user_v2', JSON.stringify(newUser));
          localStorage.removeItem('mcf_auth_user_v2');
          localStorage.removeItem('mcf_manter_conectado');
        }

        setMessage({
          type: 'success',
          text: 'Conta e família criadas com sucesso! Conectando...',
        });
        setUser(newUser as any);
        if (onSuccess) onSuccess();
      } else if (mode === 'recovery') {
        await resetPassword(emailClean);
        setMessage({
          type: 'success',
          text: 'Instruções de recuperação enviadas para o seu e-mail.',
        });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Verifique seus dados de acesso.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#07090e] flex flex-col items-center justify-center px-4 py-8 selection:bg-blue-500/30">
      <div className="w-full max-w-sm space-y-3.5 animate-in fade-in duration-300">
        
        {/* Card Superior de Identidade (Conforme Print) */}
        <div className="card-surface p-5 rounded-3xl border border-slate-200/90 dark:border-[#202533] shadow-md space-y-2">
          <div className="w-10 h-10 rounded-xl bg-transparent text-blue-600 dark:text-[#8ab4f8] flex items-center justify-start">
            <Wallet className="w-8 h-8 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Meu Controle Financeiro
            </h1>
            <p className="text-xs text-slate-500 dark:text-neutral-400 font-medium mt-1">
              As contas da família, sem planilha.
            </p>
          </div>
        </div>

        {/* Card Principal de Formulário */}
        <div className="card-surface p-6 rounded-3xl border border-slate-200/90 dark:border-[#202533] shadow-lg space-y-5">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              {mode === 'login' && 'Entrar'}
              {mode === 'signup' && 'Criar conta'}
              {mode === 'recovery' && 'Recuperar senha'}
            </h2>
            {mode === 'signup' && (
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Crie sua conta gratuita e tenha o painel exclusivo da sua família.
              </p>
            )}
            {mode === 'recovery' && (
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Digite seu e-mail para receber o link de redefinição.
              </p>
            )}
          </div>

          {message && (
            <div
              className={`p-3 rounded-2xl text-xs flex items-center gap-2 animate-in fade-in ${
                message.type === 'success'
                  ? 'bg-emerald-50 dark:bg-[#112a1a] text-emerald-700 dark:text-[#4ade80] border border-emerald-200 dark:border-emerald-500/30'
                  : 'bg-rose-50 dark:bg-[#2a1111] text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
              }`}
            >
              {message.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0 stroke-[2.5]" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo Nome (Apenas em Cadastro) */}
            {mode === 'signup' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-neutral-300 block mb-1.5">
                  Seu Nome
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Silva"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#12161f] border border-slate-200 dark:border-[#262c3b] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-hidden focus:border-blue-600 transition-colors"
                />
              </div>
            )}

            {/* Campo E-mail */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-neutral-300 block mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                required
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#12161f] border border-slate-200 dark:border-[#262c3b] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-hidden focus:border-blue-600 transition-colors"
              />
            </div>

            {/* Campo Senha */}
            {mode !== 'recovery' && (
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-neutral-300 block mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#12161f] border border-slate-200 dark:border-[#262c3b] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-hidden focus:border-blue-600 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                    title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Checkbox Manter Conectado */}
            {mode !== 'recovery' && (
              <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-neutral-300 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={manterConectado}
                  onChange={(e) => setManterConectado(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 dark:border-[#262c3b] focus:ring-blue-500 cursor-pointer accent-blue-600"
                />
                <span className="font-medium">Manter conectado</span>
              </label>
            )}

            {/* Botão de Ação Primário */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : mode === 'login' ? (
                'Entrar'
              ) : mode === 'signup' ? (
                'Criar conta'
              ) : (
                'Enviar instruções'
              )}
            </button>

            {/* Links no Rodapé (Criar conta & Esqueci a senha) */}
            <div className="flex items-center justify-between text-xs pt-2">
              {mode === 'login' ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setMessage(null);
                    }}
                    className="text-blue-600 dark:text-[#8ab4f8] font-bold hover:underline cursor-pointer"
                  >
                    Criar conta
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('recovery');
                      setMessage(null);
                    }}
                    className="text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                  >
                    Esqueci a senha
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setMessage(null);
                  }}
                  className="text-blue-600 dark:text-[#8ab4f8] font-bold hover:underline flex items-center gap-1 cursor-pointer mx-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar para o Login</span>
                </button>
              )}
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};
