import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  ChevronDown, 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Check, 
  Filter,
  PieChart,
  Layers
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDateShort } from '../utils/finance';

interface RelatoriosPageProps {
  onBack: () => void;
}

const MESES_NOMES = [
  { num: '01', sigla: 'Jan', nome: 'Janeiro' },
  { num: '02', sigla: 'Fev', nome: 'Fevereiro' },
  { num: '03', sigla: 'Mar', nome: 'Março' },
  { num: '04', sigla: 'Abr', nome: 'Abril' },
  { num: '05', sigla: 'Mai', nome: 'Maio' },
  { num: '06', sigla: 'Jun', nome: 'Junho' },
  { num: '07', sigla: 'Jul', nome: 'Julho' },
  { num: '08', sigla: 'Ago', nome: 'Agosto' },
  { num: '09', sigla: 'Set', nome: 'Setembro' },
  { num: '10', sigla: 'Out', nome: 'Outubro' },
  { num: '11', sigla: 'Nov', nome: 'Novembro' },
  { num: '12', sigla: 'Dez', nome: 'Dezembro' },
];

export const RelatoriosPage: React.FC<RelatoriosPageProps> = ({ onBack }) => {
  const { contas, entradas, categorias } = useFinance();

  const [ano, setAno] = useState('2026');
  // 'todos' ou '01'..'12'
  const [mesSelecionado, setMesSelecionado] = useState<string>('todos');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Anos disponíveis
  const anosDisponiveis = useMemo(() => {
    const setAnos = new Set<string>(['2026', '2025']);
    contas.forEach((c) => {
      if (c.competencia) setAnos.add(c.competencia.slice(0, 4));
    });
    entradas.forEach((e) => {
      if (e.competencia) setAnos.add(e.competencia.slice(0, 4));
    });
    return Array.from(setAnos).sort().reverse();
  }, [contas, entradas]);

  // Cálculo real mês a mês de Janeiro a Dezembro para o ano selecionado
  const dadosMensais = useMemo(() => {
    let acumulado = 0;
    return MESES_NOMES.map((m) => {
      const comp = `${ano}-${m.num}`;
      
      const rec = entradas
        .filter((e) => e.competencia === comp)
        .reduce((acc, curr) => acc + Number(curr.valor), 0);

      const desp = contas
        .filter((c) => c.competencia === comp && c.situacao !== 'cancelado')
        .reduce((acc, curr) => acc + Number(curr.valor), 0);

      const saldo = rec - desp;
      acumulado += saldo;

      return {
        num: m.num,
        mes: m.sigla,
        nome: m.nome,
        comp,
        rec,
        desp,
        saldo,
        acum: acumulado,
      };
    });
  }, [contas, entradas, ano]);

  // Totais anuais
  const totaisAno = useMemo(() => {
    const totalRec = dadosMensais.reduce((acc, d) => acc + d.rec, 0);
    const totalDesp = dadosMensais.reduce((acc, d) => acc + d.desp, 0);
    const saldo = totalRec - totalDesp;
    return {
      rec: totalRec,
      desp: totalDesp,
      saldo,
    };
  }, [dadosMensais]);

  // Dados do período ativo (ano todo ou mês específico)
  const periodoAtivo = useMemo(() => {
    if (mesSelecionado === 'todos') {
      return {
        label: `Ano de ${ano}`,
        rec: totaisAno.rec,
        desp: totaisAno.desp,
        saldo: totaisAno.saldo,
        isMesIndividual: false,
      };
    }
    const item = dadosMensais.find((d) => d.num === mesSelecionado);
    if (!item) {
      return {
        label: `Ano de ${ano}`,
        rec: totaisAno.rec,
        desp: totaisAno.desp,
        saldo: totaisAno.saldo,
        isMesIndividual: false,
      };
    }
    return {
      label: `${item.nome} de ${ano}`,
      rec: item.rec,
      desp: item.desp,
      saldo: item.saldo,
      isMesIndividual: true,
      dadosMes: item,
    };
  }, [mesSelecionado, ano, dadosMensais, totaisAno]);

  // Contas e Entradas do período ativo
  const lancamentosPeriodo = useMemo(() => {
    const prefix = mesSelecionado === 'todos' ? `${ano}-` : `${ano}-${mesSelecionado}`;

    const contasFiltradas = contas.filter(
      (c) => c.competencia && c.competencia.startsWith(prefix) && c.situacao !== 'cancelado'
    );
    const entradasFiltradas = entradas.filter(
      (e) => e.competencia && e.competencia.startsWith(prefix)
    );

    return {
      contas: contasFiltradas,
      entradas: entradasFiltradas,
    };
  }, [contas, entradas, ano, mesSelecionado]);

  // Despesas por Categoria no período selecionado
  const despesasPorCategoria = useMemo(() => {
    const map = new Map<string, number>();
    lancamentosPeriodo.contas.forEach((c) => {
      const cat = c.categoria || 'Outros';
      map.set(cat, (map.get(cat) || 0) + Number(c.valor));
    });

    const total = Array.from(map.values()).reduce((a, b) => a + b, 0);
    return Array.from(map.entries())
      .map(([nome, valor]) => ({
        nome,
        valor,
        percentual: total > 0 ? (valor / total) * 100 : 0,
      }))
      .sort((a, b) => b.valor - a.valor);
  }, [lancamentosPeriodo.contas]);

  // Valor máximo para normalizar a altura das barras
  const maxBarValue = useMemo(() => {
    let max = 1000;
    dadosMensais.forEach((d) => {
      if (d.rec > max) max = d.rec;
      if (d.desp > max) max = d.desp;
    });
    return Math.ceil(max * 1.15);
  }, [dadosMensais]);

  // Exportar Relatório completo para CSV
  const handleExportarCSV = () => {
    try {
      // Cabeçalho com BOM UTF-8 para o Excel reconhecer acentos em português
      let csvContent = '\uFEFF';

      // 1. Bloco de Resumo Mensal do Ano
      csvContent += `MEU CONTROLE FINANCEIRO - RELATÓRIO ANUAL ${ano}\n`;
      csvContent += `Gerado em:;${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}\n\n`;

      csvContent += `RESUMO MENSAL;\n`;
      csvContent += `Mês;Receitas (R$);Despesas (R$);Saldo Mensal (R$);Saldo Acumulado (R$)\n`;

      dadosMensais.forEach((d) => {
        csvContent += `${d.nome};${d.rec.toFixed(2).replace('.', ',')};${d.desp.toFixed(2).replace('.', ',')};${d.saldo.toFixed(2).replace('.', ',')};${d.acum.toFixed(2).replace('.', ',')}\n`;
      });

      csvContent += `TOTAL DO ANO;${totaisAno.rec.toFixed(2).replace('.', ',')};${totaisAno.desp.toFixed(2).replace('.', ',')};${totaisAno.saldo.toFixed(2).replace('.', ',')};-\n\n`;

      // 2. Bloco de Detalhamento dos Lançamentos do Período
      const tituloLancamentos = mesSelecionado === 'todos' 
        ? `TODOS OS LANÇAMENTOS DE ${ano}` 
        : `LANÇAMENTOS DE ${MESES_NOMES.find((m) => m.num === mesSelecionado)?.nome.toUpperCase()} DE ${ano}`;

      csvContent += `${tituloLancamentos};\n`;
      csvContent += `Data;Tipo;Descrição / Nome;Categoria;Valor (R$);Situação\n`;

      // Inserir receitas
      lancamentosPeriodo.entradas.forEach((e) => {
        csvContent += `${formatDateShort(e.data_prevista)};Receita;${e.descricao.replace(/;/g, ' ')};${e.tipo || 'Entrada'};${Number(e.valor).toFixed(2).replace('.', ',')};${e.situacao}\n`;
      });

      // Inserir despesas
      lancamentosPeriodo.contas.forEach((c) => {
        csvContent += `${formatDateShort(c.vencimento)};Despesa;${c.nome.replace(/;/g, ' ')};${c.categoria || 'Sem categoria'};${Number(c.valor).toFixed(2).replace('.', ',')};${c.situacao}\n`;
      });

      // Criar Blob e forçar download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const nomeArquivo = `relatorio_financeiro_${ano}${mesSelecionado !== 'todos' ? `_${mesSelecionado}` : ''}.csv`;
      link.setAttribute('href', url);
      link.setAttribute('download', nomeArquivo);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (e) {
      console.error('Erro ao exportar CSV:', e);
      alert('Não foi possível gerar o arquivo CSV.');
    }
  };

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-200">
      {/* Top Header with Back, Title, and Year / Export actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-[#1e2330] text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            title="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Relatórios
            </h1>
            <div className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
              {periodoAtivo.label}
            </div>
          </div>
        </div>

        {/* Right Actions: Year Selector + Export CSV Button */}
        <div className="flex items-center gap-2">
          {/* Dropdown Ano */}
          <div className="relative">
            <select
              value={ano}
              onChange={(e) => {
                setAno(e.target.value);
                setMesSelecionado('todos');
              }}
              className="appearance-none bg-white dark:bg-[#12141a] border border-slate-300 dark:border-[#202430] text-slate-900 dark:text-white text-xs font-bold pl-3 pr-8 py-2 rounded-xl focus:outline-hidden shadow-xs cursor-pointer hover:border-primary dark:hover:border-[#8ab4f8] transition-colors"
            >
              {anosDisponiveis.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Botão Exportar CSV */}
          <button
            onClick={handleExportarCSV}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer ${
              downloadSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-primary dark:bg-[#8ab4f8] text-white dark:text-[#090a0f] hover:opacity-90'
            }`}
            title="Exportar dados para planilha Excel / CSV"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span className="hidden sm:inline">Baixado!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Exportar CSV</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Barra de Seleção de Meses Interativa (Horizontal Scrollable Chips) */}
      <div className="card-surface p-2.5 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setMesSelecionado('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              mesSelecionado === 'todos'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs scale-105'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#161820] dark:hover:bg-[#202430] text-slate-700 dark:text-neutral-300'
            }`}
          >
            Ano Todo
          </button>

          {MESES_NOMES.map((m) => {
            const isSelected = mesSelecionado === m.num;
            const dado = dadosMensais.find((d) => d.num === m.num);
            const temDados = (dado?.rec || 0) > 0 || (dado?.desp || 0) > 0;

            return (
              <button
                key={m.num}
                onClick={() => setMesSelecionado(m.num)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all relative cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-white dark:bg-[#8ab4f8] dark:text-[#090a0f] shadow-md scale-105 ring-2 ring-primary/30'
                    : temDados
                    ? 'bg-white dark:bg-[#161820] border border-slate-200 dark:border-[#222634] text-slate-800 dark:text-neutral-200 hover:border-primary'
                    : 'bg-slate-100/60 dark:bg-[#12141a] text-slate-400 dark:text-neutral-500 hover:text-slate-700'
                }`}
                title={`Ver detalhes de ${m.nome}`}
              >
                {m.sigla}
                {temDados && !isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary dark:bg-[#8ab4f8] absolute top-1 right-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3 Summary Cards in row (Reativo ao Mês ou Ano Selecionado) */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* Receitas */}
        <div className="card-surface p-3 text-center border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-neutral-400 mb-1">
            <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-[#4ade80]" />
            <span>Receitas</span>
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-[#4ade80] tabular-nums truncate">
            {formatCurrency(periodoAtivo.rec)}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-neutral-500 block truncate">
            {periodoAtivo.isMesIndividual ? 'Neste mês' : 'Total 12 meses'}
          </span>
        </div>

        {/* Despesas */}
        <div className="card-surface p-3 text-center border-l-4 border-l-rose-500">
          <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-neutral-400 mb-1">
            <TrendingDown className="w-3 h-3 text-rose-500" />
            <span>Despesas</span>
          </div>
          <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white tabular-nums truncate">
            {formatCurrency(periodoAtivo.desp)}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-neutral-500 block truncate">
            {periodoAtivo.isMesIndividual ? 'Neste mês' : 'Total 12 meses'}
          </span>
        </div>

        {/* Saldo */}
        <div className={`card-surface p-3 text-center border-l-4 ${
          periodoAtivo.saldo >= 0 ? 'border-l-primary' : 'border-l-rose-600'
        }`}>
          <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-neutral-400 mb-1">
            <DollarSign className="w-3 h-3 text-primary dark:text-[#8ab4f8]" />
            <span>Saldo</span>
          </div>
          <div className={`text-xs sm:text-sm font-extrabold tabular-nums truncate ${
            periodoAtivo.saldo >= 0 ? 'text-emerald-600 dark:text-[#4ade80]' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {formatCurrency(periodoAtivo.saldo)}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-neutral-500 block truncate">
            {periodoAtivo.saldo >= 0 ? 'Positivo' : 'Déficit'}
          </span>
        </div>
      </div>

      {/* Chart Card 1: Receitas x Despesas por Mês (100% Interativo ao Clique) */}
      <div className="card-surface p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Receitas × despesas por mês
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400">
              Clique em qualquer mês para selecionar e inspecionar
            </p>
          </div>

          {mesSelecionado !== 'todos' && (
            <button
              onClick={() => setMesSelecionado('todos')}
              className="text-[11px] font-bold text-primary dark:text-[#8ab4f8] hover:underline cursor-pointer"
            >
              Ver ano todo
            </button>
          )}
        </div>

        {/* Custom Bar Chart com clique em cada mês */}
        <div className="h-52 w-full relative pt-4 pb-2">
          {/* Linhas de guia */}
          <div className="absolute inset-x-0 top-3 bottom-8 flex flex-col justify-between pointer-events-none text-[9px] text-slate-400 dark:text-neutral-600 border-b border-slate-200 dark:border-[#1e2330]">
            <div className="border-b border-dashed border-slate-200 dark:border-[#1c202a] w-full flex justify-between pr-2">
              <span>{formatCurrency(maxBarValue)}</span>
            </div>
            <div className="border-b border-dashed border-slate-200 dark:border-[#1c202a] w-full flex justify-between pr-2">
              <span>{formatCurrency(maxBarValue * 0.66)}</span>
            </div>
            <div className="border-b border-dashed border-slate-200 dark:border-[#1c202a] w-full flex justify-between pr-2">
              <span>{formatCurrency(maxBarValue * 0.33)}</span>
            </div>
          </div>

          {/* Barras Interativas dos 12 meses */}
          <div className="absolute inset-x-2 bottom-0 top-2 flex items-end justify-between gap-1">
            {dadosMensais.map((d) => {
              const isSelected = mesSelecionado === d.num;
              const hRec = Math.max(2, Math.min(100, (d.rec / maxBarValue) * 100));
              const hDesp = Math.max(2, Math.min(100, (d.desp / maxBarValue) * 100));

              return (
                <div
                  key={d.num}
                  onClick={() => setMesSelecionado(isSelected ? 'todos' : d.num)}
                  className={`flex-1 flex flex-col items-center justify-end h-full cursor-pointer group transition-all duration-150 py-1 rounded-xl ${
                    isSelected
                      ? 'bg-primary/10 dark:bg-[#8ab4f8]/10 ring-2 ring-primary dark:ring-[#8ab4f8]'
                      : 'hover:bg-slate-100 dark:hover:bg-[#161820]'
                  }`}
                  title={`${d.nome}:\nReceitas: ${formatCurrency(d.rec)}\nDespesas: ${formatCurrency(d.desp)}\nSaldo: ${formatCurrency(d.saldo)}`}
                >
                  {/* Tooltip rápida no hover / selecionado */}
                  {isSelected && (
                    <div className="absolute -top-3 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md pointer-events-none whitespace-nowrap z-20">
                      {d.mes}: {formatCurrency(d.saldo)}
                    </div>
                  )}

                  <div className="flex items-end justify-center gap-0.5 sm:gap-1 w-full px-0.5 h-36">
                    {/* Barra Receita (Verde) */}
                    <div
                      className={`w-2 sm:w-2.5 rounded-t-sm transition-all duration-300 ${
                        d.rec > 0 ? 'bg-[#22c55e]' : 'bg-slate-200 dark:bg-[#1a1e27]'
                      } ${isSelected ? 'opacity-100 scale-105' : 'opacity-85 group-hover:opacity-100'}`}
                      style={{ height: d.rec > 0 ? `${hRec}%` : '4px' }}
                    />

                    {/* Barra Despesa (Azul / Rose) */}
                    <div
                      className={`w-2 sm:w-2.5 rounded-t-sm transition-all duration-300 ${
                        d.desp > 0 ? 'bg-[#3b82f6]' : 'bg-slate-200 dark:bg-[#1a1e27]'
                      } ${isSelected ? 'opacity-100 scale-105' : 'opacity-85 group-hover:opacity-100'}`}
                      style={{ height: d.desp > 0 ? `${hDesp}%` : '4px' }}
                    />
                  </div>

                  {/* Nome do Mês */}
                  <span
                    className={`text-[9px] sm:text-[10px] mt-1 font-bold transition-colors ${
                      isSelected
                        ? 'text-primary dark:text-[#8ab4f8] scale-110 font-extrabold'
                        : 'text-slate-500 dark:text-neutral-400 group-hover:text-slate-900 dark:group-hover:text-white'
                    }`}
                  >
                    {d.mes}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legenda com indicador de clique */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#1e2330] text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-[#22c55e] rounded-xs inline-block" />
              <span className="text-slate-700 dark:text-neutral-300 font-semibold text-[11px]">Receitas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-[#3b82f6] rounded-xs inline-block" />
              <span className="text-slate-700 dark:text-neutral-300 font-semibold text-[11px]">Despesas</span>
            </div>
          </div>

          <span className="text-[10px] text-slate-400 dark:text-neutral-500 italic">
            Toque na barra para filtrar
          </span>
        </div>
      </div>

      {/* Chart Card 2: Saldo Acumulado no Ano */}
      <div className="card-surface p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            Evolução do saldo acumulado ({ano})
          </h3>
          <span className="text-xs font-bold text-primary dark:text-[#8ab4f8] tabular-nums">
            Final: {formatCurrency(totaisAno.saldo)}
          </span>
        </div>

        {/* Dynamic SVG Line Chart com pontos clicáveis */}
        <div className="h-44 w-full relative pt-2">
          {(() => {
            const width = 320;
            const height = 120;
            const padX = 20;
            const padY = 15;

            // Encontrar min e max dos saldos acumulados
            const valores = dadosMensais.map((d) => d.acum);
            const minVal = Math.min(0, ...valores);
            const maxVal = Math.max(1000, ...valores);
            const range = maxVal - minVal || 1;

            const getY = (val: number) => {
              const norm = (val - minVal) / range;
              return height - padY - norm * (height - 2 * padY);
            };

            const getX = (idx: number) => {
              return padX + (idx / 11) * (width - 2 * padX);
            };

            // Linha zero
            const yZero = getY(0);

            // Gerar polyline para Acumulado
            const pointsAcum = dadosMensais.map((d, i) => `${getX(i).toFixed(1)},${getY(d.acum).toFixed(1)}`).join(' ');

            return (
              <svg className="w-full h-36 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
                {/* Linha zero de referência */}
                <line
                  x1={padX}
                  y1={yZero}
                  x2={width - padX}
                  y2={yZero}
                  stroke="currentColor"
                  className="text-slate-300 dark:text-[#262c3b]"
                  strokeDasharray="4 4"
                  strokeWidth="1.2"
                />

                {/* Linha de Acumulado */}
                <polyline
                  fill="none"
                  stroke="#0ea5e9"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={pointsAcum}
                />

                {/* Pontos clicáveis para cada mês */}
                {dadosMensais.map((d, i) => {
                  const cx = getX(i);
                  const cy = getY(d.acum);
                  const isSelected = mesSelecionado === d.num;

                  return (
                    <g key={d.num} className="cursor-pointer" onClick={() => setMesSelecionado(isSelected ? 'todos' : d.num)}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isSelected ? 6 : 3.5}
                        fill={isSelected ? '#0ea5e9' : '#ffffff'}
                        stroke="#0ea5e9"
                        strokeWidth={isSelected ? 3 : 2}
                        className="transition-all hover:r-6"
                      />
                    </g>
                  );
                })}
              </svg>
            );
          })()}

          {/* Month labels bottom */}
          <div className="flex justify-between px-2 text-[9px] text-slate-500 dark:text-neutral-400 pt-1 border-t border-slate-100 dark:border-[#1e2330]">
            {dadosMensais.map((d) => (
              <span
                key={d.num}
                onClick={() => setMesSelecionado(mesSelecionado === d.num ? 'todos' : d.num)}
                className={`cursor-pointer ${
                  mesSelecionado === d.num ? 'font-extrabold text-primary dark:text-[#8ab4f8]' : ''
                }`}
              >
                {d.mes}
              </span>
            ))}
          </div>
        </div>

        {/* Legenda */}
        <div className="flex items-center justify-center gap-6 pt-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9] inline-block" />
            <span className="text-slate-700 dark:text-neutral-300 font-medium">Saldo Acumulado</span>
          </div>
        </div>
      </div>

      {/* Detalhamento por Categorias no Período Selecionado */}
      {despesasPorCategoria.length > 0 && (
        <div className="card-surface p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-primary dark:text-[#8ab4f8]" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Despesas por categoria — {periodoAtivo.label}
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-neutral-400">
              {despesasPorCategoria.length} categorias
            </span>
          </div>

          <div className="space-y-2.5 pt-1">
            {despesasPorCategoria.map((cat, idx) => {
              const cores = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'];
              const cor = cores[idx % cores.length];

              return (
                <div key={cat.nome} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-neutral-200">
                      {cat.nome}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatCurrency(cat.valor)} ({cat.percentual.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#1e2330] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${cat.percentual}%`,
                        backgroundColor: cor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lista Resumida dos Lançamentos do Período */}
      <div className="card-surface p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary dark:text-[#8ab4f8]" />
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Lançamentos ({lancamentosPeriodo.contas.length + lancamentosPeriodo.entradas.length})
            </h3>
          </div>
          <button
            onClick={handleExportarCSV}
            className="text-xs font-bold text-primary dark:text-[#8ab4f8] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar Planilha</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-[#1e2330] max-h-64 overflow-y-auto no-scrollbar">
          {/* Entradas */}
          {lancamentosPeriodo.entradas.map((e) => (
            <div key={e.id} className="py-2.5 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  {e.descricao}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-neutral-400">
                  {formatDateShort(e.data_prevista)} · Receita · {e.situacao}
                </span>
              </div>
              <span className="font-extrabold text-emerald-600 dark:text-[#4ade80] tabular-nums">
                + {formatCurrency(e.valor)}
              </span>
            </div>
          ))}

          {/* Contas */}
          {lancamentosPeriodo.contas.map((c) => (
            <div key={c.id} className="py-2.5 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  {c.nome}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-neutral-400">
                  Venc. {formatDateShort(c.vencimento)} · {c.categoria} · {c.situacao}
                </span>
              </div>
              <span className="font-extrabold text-slate-900 dark:text-white tabular-nums">
                - {formatCurrency(c.valor)}
              </span>
            </div>
          ))}

          {lancamentosPeriodo.contas.length === 0 && lancamentosPeriodo.entradas.length === 0 && (
            <div className="py-6 text-center text-xs text-slate-400 dark:text-neutral-500">
              Nenhum lançamento registrado neste período.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
