import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Trash2, 
  Plus, 
  Check, 
  Copy, 
  RefreshCw,
  Share2,
  Users,
  Sun,
  Moon,
  Shield,
  UserCheck,
  Sparkles,
  AlertCircle,
  Bell,
  Smartphone,
  Send,
  MessageSquare,
  Clock,
  Calendar,
  DollarSign,
  AlertTriangle,
  Info,
  CheckCircle2,
  ExternalLink,
  Wallet
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { 
  gerarTextoAlertasWhatsApp, 
  gerarLinkWhatsApp, 
  verificarStatusNotificacoesNativas 
} from '../utils/notifications';
import { PWAInstallBanner } from '../components/PWAInstallBanner';

interface ConfiguracoesPageProps {
  onBack: () => void;
}

export const ConfiguracoesPage: React.FC<ConfiguracoesPageProps> = ({ onBack }) => {
  const { 
    family, 
    membros,
    categorias, 
    recorrentes, 
    modoEscuro,
    toggleModoEscuro,
    updateFamilySettings, 
    gerarNovoCodigoConvite,
    adicionarMembro,
    removerMembro,
    entrarEmOutraFamilia,
    addCategoria, 
    deleteCategoria,
    encerrarRecorrente,
    notificacoesAtivas,
    setNotificacoesAtivas,
    alertasAtivos,
    testarNotificacaoNativa,
    mesSelecionado,
    saldoInicial,
    setSaldoInicial
  } = useFinance();

  const [saldoConfigInput, setSaldoConfigInput] = useState(saldoInicial.toString());
  const [saldoSalvoFeedback, setSaldoSalvoFeedback] = useState(false);

  React.useEffect(() => {
    setSaldoConfigInput(saldoInicial.toString());
  }, [saldoInicial]);

  const handleSalvarSaldoConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(saldoConfigInput.replace(',', '.'));
    if (!isNaN(val)) {
      setSaldoInicial(val);
      setSaldoSalvoFeedback(true);
      setTimeout(() => setSaldoSalvoFeedback(false), 3000);
    }
  };

  const [nomeFamilia, setNomeFamilia] = useState(family.nome);
  const [fechamentoDia, setFechamentoDia] = useState(family.fechamento_dia || 15);
  const [isSaved, setIsSaved] = useState(false);

  // WhatsApp Config
  const [whatsappPhone, setWhatsappPhone] = useState(() => {
    return localStorage.getItem('mcf_whatsapp_phone') || '';
  });
  const [phoneSaved, setPhoneSaved] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  // Código de convite e ações
  const [copiedCode, setCopiedCode] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  // Cadastro de novo membro
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [novoMembroNome, setNovoMembroNome] = useState('');
  const [novoMembroRole, setNovoMembroRole] = useState<'Administrador' | 'Membro'>('Membro');

  // Entrar em outra família
  const [codigoEntrar, setCodigoEntrar] = useState('');
  const [statusEntrar, setStatusEntrar] = useState<{ tipo: 'sucesso' | 'erro'; mensagem: string } | null>(null);
  const [isEntering, setIsEntering] = useState(false);

  // Notificações teste e status
  const [isTestingNotif, setIsTestingNotif] = useState(false);
  const [notifFeedback, setNotifFeedback] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // Nova categoria
  const [novaCatNome, setNovaCatNome] = useState('');
  const [novaCatTipo, setNovaCatTipo] = useState<'Fixa' | 'Variável'>('Variável');

  const handleSalvarFamilia = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateFamilySettings(nomeFamilia.trim(), Number(fechamentoDia));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleSavePhone = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = whatsappPhone.replace(/\D/g, '');
    localStorage.setItem('mcf_whatsapp_phone', clean);
    setPhoneSaved(true);
    setTimeout(() => setPhoneSaved(false), 2000);
  };

  const handleGerarNovoCodigo = async () => {
    setIsGeneratingCode(true);
    try {
      await gerarNovoCodigoConvite();
      setCopiedCode(false);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const copyInvite = () => {
    const cod = family.invite_code || '740C23';
    navigator.clipboard.writeText(cod);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const shareWhatsApp = () => {
    const cod = family.invite_code || '740C23';
    const msg = `Olá! Acesse meu sistema financeiro familiar "${family.nome}" com o código de convite: ${cod}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleTestarNotificacao = async () => {
    setIsTestingNotif(true);
    setNotifFeedback(null);
    try {
      const res = await testarNotificacaoNativa();
      const statusNav = verificarStatusNotificacoesNativas();
      setNotifFeedback({
        tipo: res.success ? 'sucesso' : 'erro',
        texto: res.success 
          ? `${res.message} ${statusNav.detalhe}` 
          : `${res.message} (${statusNav.detalhe}) - O aviso via WhatsApp abaixo funciona 100%!`,
      });
      setTimeout(() => setNotifFeedback(null), 7000);
    } finally {
      setIsTestingNotif(false);
    }
  };

  const handleEnviarAlertasWhatsApp = () => {
    const texto = gerarTextoAlertasWhatsApp(family.nome, alertasAtivos);
    const link = gerarLinkWhatsApp(texto, whatsappPhone);
    window.open(link, '_blank');
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoMembroNome.trim()) return;
    await adicionarMembro(novoMembroNome.trim(), novoMembroRole);
    setNovoMembroNome('');
    setIsAddingMember(false);
  };

  const handleEntrarFamilia = async () => {
    if (!codigoEntrar.trim()) return;
    setIsEntering(true);
    setStatusEntrar(null);
    try {
      const res = await entrarEmOutraFamilia(codigoEntrar.trim());
      setStatusEntrar({
        tipo: res.success ? 'sucesso' : 'erro',
        mensagem: res.message,
      });
      if (res.success) {
        setCodigoEntrar('');
      }
    } finally {
      setIsEntering(false);
    }
  };

  const handleAddCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaCatNome.trim()) return;
    await addCategoria(novaCatNome.trim(), novaCatTipo);
    setNovaCatNome('');
  };

  const textoMsgWhatsApp = gerarTextoAlertasWhatsApp(family.nome, alertasAtivos);

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-[#1e2330] text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          title="Voltar"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Configurações
        </h1>
      </div>

      {/* Banner de Instalação PWA */}
      <PWAInstallBanner />

      {/* Card 1: Preferências de Tema & Notificações WhatsApp / Aparelho */}
      <div className="card-surface p-4 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary dark:text-[#8ab4f8]" />
          <span>Aparência & Notificações</span>
        </h2>

        {/* Modo escuro Funcional */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {modoEscuro ? (
              <Moon className="w-4 h-4 text-primary dark:text-[#8ab4f8]" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
            <div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                Modo escuro
              </span>
              <span className="text-xs text-slate-500 dark:text-neutral-400">
                {modoEscuro ? 'Tema escuro ativado' : 'Tema claro com alto contraste ativado'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleModoEscuro}
            className={`w-12 h-6 rounded-full p-0.5 cursor-pointer flex items-center transition-colors duration-200 focus:outline-hidden ${
              modoEscuro ? 'bg-primary dark:bg-[#8ab4f8] justify-end' : 'bg-slate-300 dark:bg-[#2a2f3e] justify-start'
            }`}
            title={modoEscuro ? 'Clique para desativar modo escuro' : 'Clique para ativar modo escuro'}
          >
            <div className="w-5 h-5 rounded-full bg-white dark:bg-[#090a0f] shadow-md flex items-center justify-center transition-transform">
              {modoEscuro ? (
                <Moon className="w-3 h-3 text-primary dark:text-[#8ab4f8]" />
              ) : (
                <Sun className="w-3 h-3 text-amber-500" />
              )}
            </div>
          </button>
        </div>

        {/* Seção de Notificações WhatsApp com as 4 Regras Solicitadas */}
        <div className="pt-3 border-t border-slate-200 dark:border-[#1e2330] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Notificações no WhatsApp
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-600/30">
              100% Garantido
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed">
            Receba o relatório com as <strong>4 regras automáticas</strong> diretamente no seu WhatsApp ou no grupo da família:
          </p>

          {/* Checklist das 4 Regras Ativas com Cores Vivas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40">
              <div className="w-7 h-7 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-rose-950 dark:text-rose-200 block">1. Contas em atraso</span>
                <span className="text-[11px] text-rose-700 dark:text-rose-300/80">Avisa débitos vencidos e não pagos</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
              <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-amber-950 dark:text-amber-200 block">2. Dia do vencimento</span>
                <span className="text-[11px] text-amber-700 dark:text-amber-300/80">Alerta contas que vencem hoje</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-sky-50/80 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/40">
              <div className="w-7 h-7 rounded-xl bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-sky-950 dark:text-sky-200 block">3. 3 dias antes do venc.</span>
                <span className="text-[11px] text-sky-700 dark:text-sky-300/80">Antecipa vencimentos próximos</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40">
              <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-emerald-950 dark:text-emerald-200 block">4. Data de receber</span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300/80">Salários e entradas previstas</span>
              </div>
            </div>
          </div>

          {/* Configuração de Telefone WhatsApp */}
          <form onSubmit={handleSavePhone} className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-slate-800 dark:text-neutral-300 block">
              Seu WhatsApp (com DDD):
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                placeholder="Ex: 11999998888"
                className="flex-1 px-3 py-2.5 rounded-xl bg-white dark:bg-[#161820] border border-slate-300 dark:border-[#262c3b] text-slate-900 dark:text-white text-xs font-bold focus:outline-hidden focus:border-primary shadow-xs"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                {phoneSaved ? 'Salvo!' : 'Salvar'}
              </button>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-neutral-400 block">
              Se não preencher, o WhatsApp abrirá para você escolher qualquer contato ou grupo familiar.
            </span>
          </form>

          {/* Ações de Envio WhatsApp */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleEnviarAlertasWhatsApp}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Enviar no WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1a1e27] dark:hover:bg-[#232938] border border-slate-200 dark:border-[#262c3b] text-xs font-bold text-slate-800 dark:text-white flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-primary dark:text-[#8ab4f8]" />
              <span>Ver Mensagem</span>
            </button>
          </div>
        </div>

        {/* Diagnóstico de Notificações no Navegador / Aparelho */}
        <div className="pt-3 border-t border-slate-200 dark:border-[#1e2330] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-slate-600 dark:text-neutral-400" />
              <span className="text-xs font-bold text-slate-800 dark:text-neutral-200">
                Notificações no Navegador / Sistema
              </span>
            </div>
            <button
              type="button"
              onClick={handleTestarNotificacao}
              disabled={isTestingNotif}
              className="text-xs font-bold text-primary dark:text-[#8ab4f8] hover:underline cursor-pointer flex items-center gap-1"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{isTestingNotif ? 'Testando...' : 'Testar Agora'}</span>
            </button>
          </div>

          {notifFeedback && (
            <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
              notifFeedback.tipo === 'sucesso'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20'
            }`}>
              {notifFeedback.tipo === 'sucesso' ? (
                <Check className="w-4 h-4 shrink-0 text-emerald-500" />
              ) : (
                <Info className="w-4 h-4 shrink-0 text-amber-500" />
              )}
              <span className="leading-relaxed">{notifFeedback.texto}</span>
            </div>
          )}

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#12141a] border border-slate-200 dark:border-[#222634] text-[11px] text-slate-500 dark:text-neutral-400 leading-relaxed">
            💡 <strong>Por que você pode não ter visto o pop-up nativo?</strong> Navegadores em smartphones e telas incorporadas por segurança bloqueiam notificações silenciosamente a menos que o app seja adicionado à Tela de Início (PWA) ou autorizado. Por isso adicionamos o botão de <strong>WhatsApp direto com as 4 regras</strong>, que sempre chega no seu celular!
          </div>
        </div>
      </div>

      {/* Card: Saldo Inicial da Conta */}
      <div className="card-surface p-4 space-y-3 border border-slate-300 dark:border-[#202430]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-blue-600 dark:text-[#8ab4f8]" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Saldo Inicial de {mesSelecionado.split('-')[1] === '09' ? 'Setembro' : mesSelecionado.split('-')[1] === '10' ? 'Outubro' : mesSelecionado.split('-')[1] === '11' ? 'Novembro' : mesSelecionado.split('-')[1] === '12' ? 'Dezembro' : mesSelecionado}
            </h2>
          </div>
          <span className="text-[11px] font-bold text-blue-600 dark:text-[#8ab4f8]">
            Mês Ativo
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed">
          Altera o saldo inicial <strong>apenas deste mês</strong>. Os meses anteriores são preservados, e os meses seguintes calculam o saldo inicial automaticamente a partir do valor final deste mês.
        </p>

        <form onSubmit={handleSalvarSaldoConfig} className="flex gap-2 pt-1">
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">R$</span>
            <input
              type="number"
              step="0.01"
              value={saldoConfigInput}
              onChange={(e) => setSaldoConfigInput(e.target.value)}
              placeholder="0.00"
              className="w-full input-surface pl-9 pr-3 py-2 text-sm font-extrabold tabular-nums focus:outline-hidden"
              required
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span>Salvar</span>
          </button>
        </form>

        {saldoSalvoFeedback && (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[3]" />
            <span>Saldo inicial atualizado com sucesso! Valores recalculados em todo o aplicativo.</span>
          </div>
        )}
      </div>

      {/* Card 2: Família & Acesso Compartilhado */}
      <div className="card-surface p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary dark:text-[#8ab4f8]" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Família & Acesso Compartilhado
            </h2>
          </div>
          <span className="text-xs text-slate-500 dark:text-neutral-400 font-bold">
            {membros.length} membros
          </span>
        </div>

        {/* Form Família */}
        <form onSubmit={handleSalvarFamilia} className="space-y-3">
          <div>
            <label className="text-xs text-slate-500 dark:text-neutral-400 block mb-1 font-medium">
              Nome da família
            </label>
            <input
              type="text"
              value={nomeFamilia}
              onChange={(e) => setNomeFamilia(e.target.value)}
              className="w-full input-surface px-3 py-2 text-sm font-bold focus:outline-hidden"
              placeholder="Ex: Família Camargo"
              required
            />
          </div>

          <div>
            <label className="text-xs text-slate-500 dark:text-neutral-400 block mb-1 font-medium">
              Dia de corte do mês (fechamento dos períodos 10 e 20)
            </label>
            <select
              value={fechamentoDia}
              onChange={(e) => setFechamentoDia(Number(e.target.value))}
              className="w-full input-surface px-3 py-2 text-sm font-bold focus:outline-hidden cursor-pointer"
            >
              <option value="10">Dia 10</option>
              <option value="15">Dia 15 (Padrão)</option>
              <option value="20">Dia 20</option>
              <option value="25">Dia 25</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-primary dark:bg-[#8ab4f8] text-white dark:text-[#090a0f] text-xs font-bold hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            {isSaved ? <Check className="w-4 h-4" /> : null}
            <span>{isSaved ? 'Configurações Salvas!' : 'Salvar Dados da Família'}</span>
          </button>
        </form>

        {/* Código de Convite */}
        <div className="pt-2 border-t border-slate-200 dark:border-[#1e2330] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-neutral-200">
              Código de convite da sua família:
            </span>
            <button
              onClick={handleGerarNovoCodigo}
              disabled={isGeneratingCode}
              className="text-[11px] font-bold text-primary dark:text-[#8ab4f8] hover:underline flex items-center gap-1 cursor-pointer"
              title="Gerar outro código"
            >
              <RefreshCw className={`w-3 h-3 ${isGeneratingCode ? 'animate-spin' : ''}`} />
              <span>Novo código</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 input-surface px-3 py-2 text-base font-extrabold tracking-widest text-center text-primary dark:text-[#8ab4f8] select-all">
              {family.invite_code || '740C23'}
            </div>

            <button
              onClick={copyInvite}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#1a1e27] hover:bg-slate-200 dark:hover:bg-[#252b38] border border-slate-200 dark:border-[#262c3b] text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              title="Copiar código"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? 'Copiado!' : 'Copiar'}</span>
            </button>

            <button
              onClick={shareWhatsApp}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-xs"
              title="Convidar via WhatsApp"
            >
              <Share2 className="w-4 h-4" />
              <span>Convidar</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-neutral-400">
            Quem usar este código terá acesso em tempo real à mesma base de contas e entradas.
          </p>
        </div>

        {/* Lista de Membros */}
        <div className="pt-2 border-t border-slate-200 dark:border-[#1e2330] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-neutral-200">
              Integrantes da Família
            </span>
            <button
              onClick={() => setIsAddingMember(!isAddingMember)}
              className="text-xs font-bold text-primary dark:text-[#8ab4f8] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingMember ? 'Cancelar' : 'Adicionar Membro'}</span>
            </button>
          </div>

          {isAddingMember && (
            <form onSubmit={handleAddMember} className="p-3 rounded-xl bg-slate-50 dark:bg-[#161820] border border-slate-200 dark:border-[#262c3b] space-y-2">
              <input
                type="text"
                placeholder="Nome do integrante"
                value={novoMembroNome}
                onChange={(e) => setNovoMembroNome(e.target.value)}
                className="w-full input-surface px-3 py-1.5 text-xs font-semibold focus:outline-hidden"
                required
              />
              <div className="flex gap-2">
                <select
                  value={novoMembroRole}
                  onChange={(e) => setNovoMembroRole(e.target.value as any)}
                  className="input-surface px-3 py-1.5 text-xs font-bold focus:outline-hidden cursor-pointer"
                >
                  <option value="Membro">Membro</option>
                  <option value="Administrador">Administrador</option>
                </select>
                <button
                  type="submit"
                  className="flex-1 py-1.5 rounded-xl bg-primary dark:bg-[#8ab4f8] text-white dark:text-[#090a0f] text-xs font-bold cursor-pointer"
                >
                  Cadastrar Integrante
                </button>
              </div>
            </form>
          )}

          <div className="divide-y divide-slate-100 dark:divide-[#1e2330]">
            {membros.map((m) => (
              <div key={m.id} className="py-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-primary dark:text-[#8ab4f8]" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{m.nome}</span>
                    <span className="text-[10px] text-slate-400 dark:text-neutral-500">{m.role}</span>
                  </div>
                </div>
                {membros.length > 1 && (
                  <button
                    onClick={() => removerMembro(m.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                    title="Remover membro"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Entrar em outra família existente */}
        <div className="pt-2 border-t border-slate-200 dark:border-[#1e2330] space-y-2">
          <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 block">
            Entrar em outra família existente
          </span>
          <div className="flex gap-2">
            <input
              type="text"
              value={codigoEntrar}
              onChange={(e) => setCodigoEntrar(e.target.value.toUpperCase())}
              placeholder="Digite o código (ex: ABC123)"
              maxLength={10}
              className="flex-1 input-surface px-3 py-2 text-xs font-bold tracking-wider uppercase focus:outline-hidden"
            />
            <button
              type="button"
              onClick={handleEntrarFamilia}
              disabled={isEntering || !codigoEntrar.trim()}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isEntering ? 'Entrando...' : 'Entrar'}
            </button>
          </div>

          {statusEntrar && (
            <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
              statusEntrar.tipo === 'sucesso'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
            }`}>
              {statusEntrar.tipo === 'sucesso' ? (
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              )}
              <span>{statusEntrar.mensagem}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card 3: Categorias */}
      <div className="card-surface p-4 space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          Categorias ({categorias.length})
        </h2>

        <form onSubmit={handleAddCategoria} className="flex gap-2">
          <input
            type="text"
            placeholder="Nova categoria"
            value={novaCatNome}
            onChange={(e) => setNovaCatNome(e.target.value)}
            className="flex-1 input-surface px-3 py-2 text-xs font-semibold focus:outline-hidden"
            required
          />
          <select
            value={novaCatTipo}
            onChange={(e) => setNovaCatTipo(e.target.value as any)}
            className="input-surface px-2.5 py-2 text-xs font-bold focus:outline-hidden cursor-pointer"
          >
            <option value="Variável">Variável</option>
            <option value="Fixa">Fixa</option>
          </select>
          <button
            type="submit"
            className="p-2 rounded-xl bg-primary dark:bg-[#8ab4f8] text-white dark:text-[#090a0f] hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            title="Adicionar categoria"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>

        <div className="divide-y divide-slate-100 dark:divide-[#1e2330] max-h-48 overflow-y-auto no-scrollbar">
          {categorias.map((c) => (
            <div key={c.id} className="py-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 dark:text-white">
                {c.nome}
                {c.tipo && <span className="text-[10px] text-slate-400 dark:text-neutral-500 ml-1.5 font-normal">({c.tipo})</span>}
              </span>
              <button
                onClick={() => deleteCategoria(c.id)}
                className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                title="Excluir categoria"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Card 4: Contas Recorrentes */}
      <div className="card-surface p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Contas recorrentes ({recorrentes.length})
          </h2>
          <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium">
            Lançamentos automáticos
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-[#1e2330] max-h-56 overflow-y-auto no-scrollbar">
          {recorrentes.map((rec) => (
            <div key={rec} className="py-2.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 dark:text-white">
                {rec}
              </span>
              <button
                onClick={() => {
                  if (confirm(`Deseja encerrar a recorrência de "${rec}"?`)) {
                    encerrarRecorrente(rec);
                  }
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/50 transition-colors cursor-pointer active:scale-95"
                title="Encerrar recorrência"
              >
                Encerrar
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Prévia da Mensagem do WhatsApp */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm card-surface p-5 space-y-3 relative shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1e2330] pb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Mensagem Automática WhatsApp
                </h3>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-bold"
              >
                Fechar
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#12141a] border border-slate-200 dark:border-[#222634] text-xs font-mono text-slate-800 dark:text-neutral-200 whitespace-pre-wrap max-h-72 overflow-y-auto no-scrollbar leading-relaxed">
              {textoMsgWhatsApp}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(textoMsgWhatsApp);
                  setCopiedMsg(true);
                  setTimeout(() => setCopiedMsg(false), 2000);
                }}
                className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1e2330] dark:hover:bg-[#283042] text-xs font-bold text-slate-800 dark:text-white transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {copiedMsg ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMsg ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>

              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  handleEnviarAlertasWhatsApp();
                }}
                className="py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Abrir no WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
