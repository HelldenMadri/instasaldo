import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const BtuCalculatorView: React.FC = () => {
  const { setActiveView } = useApp();

  // Estados dos parâmetros de cálculo
  const [calculationMode, setCalculationMode] = useState<'dimensions' | 'area'>('dimensions');
  const [width, setWidth] = useState<number>(3.5);
  const [length, setLength] = useState<number>(3.5);
  const [directArea, setDirectArea] = useState<number>(12);
  const [sunExposure, setSunExposure] = useState<'morning_shade' | 'afternoon_sun'>('morning_shade');
  const [peopleCount, setPeopleCount] = useState<number>(2);
  const [electronicsCount, setElectronicsCount] = useState<number>(1);
  const [roomType, setRoomType] = useState<string>('quarto');
  const [copiedMessage, setCopiedMessage] = useState(false);

  // 1. Área em m²
  const area = calculationMode === 'dimensions'
    ? Math.max(1, Number((width * length).toFixed(1)))
    : Math.max(1, directArea);

  // 2. Fator de incidência solar
  const btuPerSqm = sunExposure === 'morning_shade' ? 600 : 800;
  const areaBtus = Math.round(area * btuPerSqm);

  // 3. Pessoas extras (+600 BTUs por pessoa além da 1ª)
  const extraPeople = Math.max(0, peopleCount - 1);
  const peopleBtus = extraPeople * 600;

  // 4. Aparelhos eletrônicos (+600 BTUs cada)
  const electronicsBtus = Math.max(0, electronicsCount) * 600;

  // 5. Carga térmica calculada total
  const totalBtus = areaBtus + peopleBtus + electronicsBtus;

  // 6. Capacidades comerciais padrão de mercado
  const COMMERCIAL_CAPACITIES = [7000, 9000, 12000, 18000, 24000, 30000, 36000, 48000, 60000];

  const getRecommendedCommercialModel = (btus: number): {
    capacity: number;
    description: string;
    pipeSize: string;
    breaker: string;
    multipleUnits?: string;
  } => {
    if (btus <= 7500) {
      return {
        capacity: 9000,
        description: '9.000 BTUs (ou 7.500 BTUs se disponível)',
        pipeSize: 'Líquido 1/4" • Sucção 3/8"',
        breaker: 'Disjuntor bipolar 10A / 16A curva C',
      };
    }
    if (btus <= 9000) {
      return {
        capacity: 9000,
        description: '9.000 BTUs',
        pipeSize: 'Líquido 1/4" • Sucção 3/8"',
        breaker: 'Disjuntor bipolar 10A / 16A curva C',
      };
    }
    if (btus <= 12000) {
      return {
        capacity: 12000,
        description: '12.000 BTUs',
        pipeSize: 'Líquido 1/4" • Sucção 3/8" (ou 1/2")',
        breaker: 'Disjuntor bipolar 16A / 20A curva C',
      };
    }
    if (btus <= 18000) {
      return {
        capacity: 18000,
        description: '18.000 BTUs',
        pipeSize: 'Líquido 1/4" • Sucção 1/2"',
        breaker: 'Disjuntor bipolar 20A curva C',
      };
    }
    if (btus <= 24000) {
      return {
        capacity: 24000,
        description: '24.000 BTUs',
        pipeSize: 'Líquido 1/4" (ou 3/8") • Sucção 5/8"',
        breaker: 'Disjuntor bipolar 25A curva C',
      };
    }
    if (btus <= 30000) {
      return {
        capacity: 30000,
        description: '30.000 BTUs',
        pipeSize: 'Líquido 3/8" • Sucção 5/8"',
        breaker: 'Disjuntor bipolar 25A / 32A curva C',
      };
    }
    if (btus <= 36000) {
      return {
        capacity: 36000,
        description: '36.000 BTUs (Split Piso Teto ou Cassete)',
        pipeSize: 'Líquido 3/8" • Sucção 3/4"',
        breaker: 'Disjuntor bipolar/tripolar 32A',
      };
    }
    if (btus <= 48000) {
      return {
        capacity: 48000,
        description: '48.000 BTUs (Piso Teto / Cassete)',
        pipeSize: 'Líquido 3/8" • Sucção 3/4"',
        breaker: 'Disjuntor bipolar/tripolar 40A',
      };
    }
    if (btus <= 60000) {
      return {
        capacity: 60000,
        description: '60.000 BTUs (Piso Teto / Cassete)',
        pipeSize: 'Líquido 3/8" • Sucção 7/8"',
        breaker: 'Disjuntor 50A ou trifásico',
      };
    }

    const unitsCount = Math.ceil(btus / 30000);
    return {
      capacity: btus,
      description: `${unitsCount}x Splits de 30.000 BTUs ou Multi-Split`,
      pipeSize: 'Dimensionamento individual por evaporadora',
      breaker: 'Quadro dedicado com disjuntor individual',
      multipleUnits: `Para ambientes de alta carga (${btus.toLocaleString('pt-BR')} BTUs), recomenda-se dividir a climatização em ${unitsCount} aparelhos para melhor distribuição térmica.`,
    };
  };

  const recommendation = getRecommendedCommercialModel(totalBtus);

  // Mensagem para WhatsApp / Proposta Técnica
  const generateTechnicalProposal = (): string => {
    return `*DIMENSIONAMENTO TÉRMICO — INSTALASALDO*\n\n` +
      `*Ambiente:* ${roomType.toUpperCase()} (${area} m²)\n` +
      `*Incidência Solar:* ${sunExposure === 'morning_shade' ? 'Manhã / Sombra (600 BTU/m²)' : 'Tarde / Sol Pleno (800 BTU/m²)'}\n` +
      `*Ocupação:* ${peopleCount} pessoas | ${electronicsCount} aparelho(s) eletrônico(s)\n\n` +
      `*Cálculo de Carga Térmica:* ${totalBtus.toLocaleString('pt-BR')} BTUs/h\n` +
      `👉 *Capacidade Comercial Recomendada:* *${recommendation.description}*\n` +
      `*Tubulação Típica:* ${recommendation.pipeSize}\n` +
      `*Proteção Elétrica:* ${recommendation.breaker}\n\n` +
      `_Dimensionamento calculado conforme normas técnicas de climatização residencial e comercial._`;
  };

  const handleCopyProposal = () => {
    navigator.clipboard.writeText(generateTechnicalProposal());
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 3000);
  };

  const handleSendWhatsApp = () => {
    const text = encodeURIComponent(generateTechnicalProposal());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-8 w-full animate-fade-in">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006c49] text-2xl">mode_fan</span>
            <h1 className="font-headline text-2xl font-bold text-[#04122e]">
              Calculadora de BTUs
            </h1>
            <span className="bg-emerald-100 text-[#005236] text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase">
              Cálculo Térmico Oficial
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dimensione a capacidade exata do ar-condicionado ideal para evitar perda de rendimento e consumo excessivo de energia.
          </p>
        </div>

        {/* Botão de ação rápida */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyProposal}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
              copiedMessage
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {copiedMessage ? 'check' : 'content_copy'}
            </span>
            <span>{copiedMessage ? 'Resumo Copiado!' : 'Copiar Resumo Técnico'}</span>
          </button>

          <button
            onClick={handleSendWhatsApp}
            className="px-4 py-2 bg-[#006c49] hover:bg-[#005236] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">chat</span>
            <span>Enviar no WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Grid Principal: Entrada de Dados e Resultado */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Painel Esquerdo: Formulário de Parâmetros (7 Colunas) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="font-headline font-bold text-base text-[#04122e] flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-emerald-600">tune</span>
              Parâmetros do Ambiente
            </h2>
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setCalculationMode('dimensions')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  calculationMode === 'dimensions'
                    ? 'bg-white text-[#04122e] shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Largura × Comp.
              </button>
              <button
                type="button"
                onClick={() => setCalculationMode('area')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  calculationMode === 'area'
                    ? 'bg-white text-[#04122e] shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                m² Direto
              </button>
            </div>
          </div>

          {/* 1. Tipo do Cômodo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Tipo do Cômodo / Ambiente
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'quarto', label: 'Quarto', icon: 'bed' },
                { id: 'sala', label: 'Sala de Estar', icon: 'weekend' },
                { id: 'escritorio', label: 'Escritório', icon: 'work' },
                { id: 'comercio', label: 'Comércio / Loja', icon: 'storefront' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setRoomType(t.id);
                    if (t.id === 'quarto') { setPeopleCount(2); setElectronicsCount(1); }
                    if (t.id === 'sala') { setPeopleCount(3); setElectronicsCount(2); }
                    if (t.id === 'escritorio') { setPeopleCount(2); setElectronicsCount(3); }
                    if (t.id === 'comercio') { setPeopleCount(5); setElectronicsCount(2); }
                  }}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                    roomType === t.id
                      ? 'border-[#04122e] bg-[#04122e]/5 text-[#04122e] font-bold shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{t.icon}</span>
                  <span className="text-xs">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Dimensões ou Área */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              Tamanho do Espaço
            </label>
            {calculationMode === 'dimensions' ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Largura (metros)</span>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      value={width}
                      onChange={(e) => setWidth(parseFloat(e.target.value) || 1)}
                      className="w-full h-11 px-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#04122e]"
                    />
                    <span className="absolute right-3 top-3 text-xs text-slate-400 font-bold">m</span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Comprimento (metros)</span>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      value={length}
                      onChange={(e) => setLength(parseFloat(e.target.value) || 1)}
                      className="w-full h-11 px-3 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#04122e]"
                    />
                    <span className="absolute right-3 top-3 text-xs text-slate-400 font-bold">m</span>
                  </div>
                </div>

                <div className="bg-slate-100 p-2.5 rounded-xl flex flex-col justify-center items-center text-center">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Área Resultante</span>
                  <span className="text-lg font-headline font-extrabold text-[#04122e]">
                    {area} <span className="text-xs font-normal">m²</span>
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Área total do cômodo em metros quadrados</span>
                <div className="relative max-w-xs">
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={directArea}
                    onChange={(e) => setDirectArea(parseFloat(e.target.value) || 1)}
                    className="w-full h-11 px-3 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#04122e]"
                  />
                  <span className="absolute right-3 top-3 text-xs text-slate-400 font-bold">m²</span>
                </div>
              </div>
            )}
          </div>

          {/* 3. Incidência Solar (600 vs 800) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Incidência de Sol no Ambiente
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSunExposure('morning_shade')}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                  sunExposure === 'morning_shade'
                    ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  sunExposure === 'morning_shade' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <span className="material-symbols-outlined text-[18px]">wb_twilight</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Sol da Manhã / Sombra</span>
                  <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                    Não pega sol direto à tarde. <strong>600 BTUs/m²</strong>
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSunExposure('afternoon_sun')}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                  sunExposure === 'afternoon_sun'
                    ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  sunExposure === 'afternoon_sun' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <span className="material-symbols-outlined text-[18px]">sunny</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Sol da Tarde / Sol Pleno</span>
                  <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                    Sol forte direto o dia todo ou tarde. <strong>800 BTUs/m²</strong>
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* 4. Ocupação e Eletrônicos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            {/* Pessoas */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-slate-500">group</span>
                  Pessoas no Local
                </label>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {peopleCount} {peopleCount === 1 ? 'pessoa' : 'pessoas'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPeopleCount(Math.max(1, peopleCount - 1))}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-base"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full h-10 text-center font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => setPeopleCount(peopleCount + 1)}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-base"
                >
                  +
                </button>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                1ª pessoa inclusa na área. +600 BTUs a partir da 2ª pessoa.
              </span>
            </div>

            {/* Eletrônicos */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-slate-500">devices</span>
                  Aparelhos Eletrônicos
                </label>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                  {electronicsCount} {electronicsCount === 1 ? 'aparelho' : 'aparelhos'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setElectronicsCount(Math.max(0, electronicsCount - 1))}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-base"
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={electronicsCount}
                  onChange={(e) => setElectronicsCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full h-10 text-center font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => setElectronicsCount(electronicsCount + 1)}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-base"
                >
                  +
                </button>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                TVs, computadores, consoles, etc. (+600 BTUs cada).
              </span>
            </div>
          </div>
        </div>

        {/* Painel Direito: Resultado & Recomendação Comercial (5 Colunas) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card Principal de Recomendação */}
          <div className="bg-[#04122e] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden space-y-6">
            <div className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none"></div>

            <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
              <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">
                Recomendação Técnica
              </span>
              <span className="text-xs bg-[#6ffbbe] text-[#002113] font-bold px-3 py-1 rounded-full">
                Ideal para Compra
              </span>
            </div>

            {/* Destaque do Modelo Comercial */}
            <div className="relative z-10 space-y-2">
              <span className="text-xs text-blue-200 block">Capacidade Comercial Sugerida:</span>
              <div className="flex items-baseline gap-2">
                <span className="font-headline text-4xl font-extrabold text-[#6ffbbe] tracking-tight">
                  {recommendation.description}
                </span>
              </div>
              <p className="text-xs text-blue-100 leading-relaxed">
                Potência calculada com margem de segurança para garantir resfriamento rápido e maior durabilidade do compressor.
              </p>
            </div>

            {/* Memória de Cálculo / Detalhamento */}
            <div className="relative z-10 bg-white/5 rounded-2xl p-4 border border-white/10 space-y-2 text-xs">
              <div className="flex items-center justify-between text-blue-200 pb-2 border-b border-white/10">
                <span>Cálculo Exato da Carga:</span>
                <span className="font-mono font-bold text-white text-sm">
                  {totalBtus.toLocaleString('pt-BR')} BTUs/h
                </span>
              </div>
              <div className="space-y-1 text-[11px] text-blue-300 pt-1">
                <div className="flex justify-between">
                  <span>• Área ({area} m² × {btuPerSqm} BTUs):</span>
                  <span className="font-mono">{areaBtus.toLocaleString('pt-BR')} BTUs</span>
                </div>
                <div className="flex justify-between">
                  <span>• Pessoas extras ({extraPeople} × 600 BTUs):</span>
                  <span className="font-mono">+{peopleBtus.toLocaleString('pt-BR')} BTUs</span>
                </div>
                <div className="flex justify-between">
                  <span>• Eletrônicos ({electronicsCount} × 600 BTUs):</span>
                  <span className="font-mono">+{electronicsBtus.toLocaleString('pt-BR')} BTUs</span>
                </div>
              </div>
            </div>

            {/* Ficha Técnica de Instalação */}
            <div className="relative z-10 space-y-2 text-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200 block">
                Especificações Técnicas de Instalação:
              </span>
              <div className="grid grid-cols-1 gap-2 bg-white/10 p-3 rounded-xl border border-white/10">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-400">straighten</span>
                  <span className="text-[11px] text-blue-100">
                    Tubulação: <strong className="text-white">{recommendation.pipeSize}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-400">electrical_services</span>
                  <span className="text-[11px] text-blue-100">
                    Proteção: <strong className="text-white">{recommendation.breaker}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Ação: Gerar Orçamento com esse Ar */}
            <div className="relative z-10 pt-2">
              <button
                type="button"
                onClick={() => setActiveView('orcamentos')}
                className="w-full py-3 bg-[#6cf8bb] hover:bg-[#5ce6aa] text-[#002113] active:scale-95 text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">request_quote</span>
                <span>Criar Orçamento com este Aparelho</span>
              </button>
            </div>
          </div>

          {/* Tabela de Referência Rápida (conforme solicitado pelo instalador) */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3">
            <h3 className="font-headline font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-emerald-600">table_chart</span>
              Tabela de Referência Rápida
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-600">Até 12 m²</span>
                <span className="font-bold text-[#04122e]">9.000 BTUs</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-600">12 a 15 m²</span>
                <span className="font-bold text-[#04122e]">9.000 a 12.000 BTUs</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-600">15 a 20 m²</span>
                <span className="font-bold text-[#04122e]">12.000 BTUs</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-600">20 a 30 m²</span>
                <span className="font-bold text-[#04122e]">18.000 BTUs</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-600">35 a 45 m²</span>
                <span className="font-bold text-[#04122e]">24.000 BTUs</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-600">Acima de 45 m²</span>
                <span className="font-bold text-[#04122e]">30.000 a 36.000+ BTUs</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
