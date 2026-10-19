import React, { useState } from 'react';
import { Logo } from './Logo';
import { PLAN_CONFIGS } from '../context/AppContext';
import { PlanTier } from '../types';
import { formatCurrency } from '../utils/formatters';
import { requestCheckout, AsaasCheckoutResponse } from '../services/asaas';

interface SalesLandingPageProps {
  onGoToLogin: () => void;
  onSignupSuccess?: (email: string) => void;
}

export const SalesLandingPage: React.FC<SalesLandingPageProps> = ({ onGoToLogin }) => {
  // Estado do Checkout Express
  const [selectedPlan, setSelectedPlan] = useState<PlanTier | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);

  // Formulário do Checkout
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutData, setCheckoutData] = useState<AsaasCheckoutResponse | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const toggleFaq = (index: number) => {
    setFaqOpenIndex(faqOpenIndex === index ? null : index);
  };

  const handleOpenCheckout = (tier: PlanTier) => {
    setSelectedPlan(tier);
    setCheckoutData(null);
    setCheckoutError(null);
    setIsCheckoutOpen(true);
  };

  const handleCopyPix = () => {
    if (!checkoutData?.pixQrCode?.payload) return;
    navigator.clipboard.writeText(checkoutData.pixQrCode.payload);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleGenerateCheckoutPix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    setCheckoutError(null);

    if (!name.trim()) {
      setCheckoutError('Por favor, informe seu nome completo.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setCheckoutError('Por favor, informe um e-mail válido.');
      return;
    }
    if (!whatsapp.trim() || whatsapp.replace(/\D/g, '').length < 10) {
      setCheckoutError('Por favor, informe seu WhatsApp com DDD.');
      return;
    }
    const cleanDoc = cpfCnpj.replace(/\D/g, '');
    if (cleanDoc.length !== 11 && cleanDoc.length !== 14) {
      setCheckoutError('Por favor, informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido para o Banco Central.');
      return;
    }
    if (password.length < 6) {
      setCheckoutError('Crie uma senha de acesso com no mínimo 6 caracteres.');
      return;
    }

    setIsSubmitting(true);

    try {
      const planConfig = PLAN_CONFIGS[selectedPlan];
      const res = await requestCheckout({
        companyId: `temp_${Date.now()}`,
        planTier: selectedPlan,
        planName: planConfig.name,
        value: planConfig.price,
        customer: {
          name: name.trim(),
          email: email.trim(),
          cpfCnpj: cleanDoc,
          phone: whatsapp.trim(),
        },
      });

      setCheckoutData(res);
    } catch (err: any) {
      setCheckoutError(err.message || 'Erro ao gerar o Pix de assinatura no Asaas. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070e1d] text-slate-100 font-body selection:bg-[#6ffbbe] selection:text-[#04122e]">
      {/* 1. URGENCY TOP BAR */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 py-2.5 px-4 text-center font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md">
        <span className="material-symbols-outlined text-[18px] animate-bounce">bolt</span>
        <span>
          OFERTA DE LANÇAMENTO: Economize R$ 60 no Plano Essencial (apenas <strong>R$ 37,00/mês</strong>) + 3 Bônus Exclusivos inclusos hoje!
        </span>
      </div>

      {/* 2. HEADER DE NAVEGAÇÃO */}
      <header className="sticky top-0 z-40 bg-[#070e1d]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="h-9 w-auto" />
            <span className="hidden sm:inline-block bg-emerald-500/10 text-[#6ffbbe] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider">
              Para Técnicos de Refrigeração
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#metodo" className="hover:text-[#6ffbbe] transition-colors">Método S.O.S</a>
            <a href="#calculadora" className="hover:text-[#6ffbbe] transition-colors">Calculadora BTUs</a>
            <a href="#planos" className="hover:text-[#6ffbbe] transition-colors">Planos & Preços</a>
            <a href="#garantia" className="hover:text-[#6ffbbe] transition-colors">Garantia 7 Dias</a>
            <a href="#faq" className="hover:text-[#6ffbbe] transition-colors">Dúvidas</a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onGoToLogin}
              className="px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">lock_open</span>
              <span>Já sou Assinante</span>
            </button>
            <button
              onClick={() => handleOpenCheckout('essencial')}
              className="px-4 py-2 bg-gradient-to-r from-[#00d084] to-[#6ffbbe] hover:from-[#00b572] hover:to-[#5ee2a8] text-[#04122e] text-xs font-extrabold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all cursor-pointer"
            >
              Começar Agora
            </button>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION (ACIMA DA DOBRA) */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 overflow-hidden">
        {/* Efeitos de luz no fundo */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute top-10 right-10 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-full px-4 py-1.5 text-xs text-slate-300 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold">O 1º Aplicativo Web Criado para Técnicos de Ar-Condicionado</span>
          </div>

          <h1 className="font-headline text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Pare de Tomar Calote de Cliente que Promete Pagar{' '}
            <span className="bg-gradient-to-r from-amber-400 to-red-400 bg-clip-text text-transparent">
              "Amanhã"
            </span>
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Garanta <strong className="text-[#6ffbbe]">50% de sinal no Pix</strong> antes de ligar a furadeira, emita Ordens de Serviço profissionais com <strong className="text-white">fotos de antes/depois</strong> e receba o saldo restante com <strong className="text-white">assinatura do cliente na tela do seu celular</strong>.
          </p>

          {/* CTA Principal */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => handleOpenCheckout('essencial')}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#00d084] to-[#6ffbbe] hover:from-[#00b572] hover:to-[#5ee2a8] text-[#04122e] text-base font-extrabold rounded-2xl shadow-xl shadow-emerald-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[22px]">verified_user</span>
              <span>QUERO BLINDAR MEU DINHEIRO POR R$ 37/MÊS</span>
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('metodo');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-6 py-4 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-bold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px] text-[#6ffbbe]">play_circle</span>
              <span>Ver Como Funciona na Prática</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
              Sem fidelidade ou carência
            </span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
              Cancele quando quiser com 1 clique
            </span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-emerald-400">check_circle</span>
              7 dias de garantia incondicional
            </span>
          </div>

          {/* MOCKUP VISUAL INTERATIVO */}
          <div className="pt-10 max-w-4xl mx-auto">
            <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-4 sm:p-6 shadow-2xl shadow-emerald-500/10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                {/* Card 1: Sinal Garantido */}
                <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-[#6ffbbe] flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-[22px]">payments</span>
                  </div>
                  <h3 className="font-bold text-white text-sm">1. Sinal de 50% no Pix</h3>
                  <p className="text-xs text-slate-400">
                    O cliente recebe o orçamento pelo WhatsApp com QR Code do sinal. O agendamento só é confirmado quando o Pix cai.
                  </p>
                  <div className="bg-[#04122e] p-2.5 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-300 flex items-center justify-between">
                    <span>Sinal Recebido:</span>
                    <strong className="text-white">R$ 450,00 ✓</strong>
                  </div>
                </div>

                {/* Card 2: Assinatura na Tela */}
                <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-[22px]">draw</span>
                  </div>
                  <h3 className="font-bold text-white text-sm">2. OS com Fotos & Assinatura</h3>
                  <p className="text-xs text-slate-400">
                    Tire fotos de antes e depois do vácuo e da máquina. O cliente assina com o dedo na tela do seu celular.
                  </p>
                  <div className="bg-[#04122e] p-2.5 rounded-xl border border-slate-800 text-[11px] font-mono text-blue-300 flex items-center justify-between">
                    <span>Assinatura Digital:</span>
                    <strong className="text-white">Colhida na tela ✓</strong>
                  </div>
                </div>

                {/* Card 3: Calculadora de BTUs */}
                <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-[22px]">calculate</span>
                  </div>
                  <h3 className="font-bold text-white text-sm">3. Calculadora de BTUs</h3>
                  <p className="text-xs text-slate-400">
                    Dimensionamento térmico técnico com largura, comprimento, pessoas e sol. Nunca mais erre a capacidade da máquina.
                  </p>
                  <div className="bg-[#04122e] p-2.5 rounded-xl border border-slate-800 text-[11px] font-mono text-amber-300 flex items-center justify-between">
                    <span>Recomendação:</span>
                    <strong className="text-white">12.000 BTUs ✓</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. BLOCO DE ESPELHAMENTO DE DOR (MINERAÇÃO REAL DE DORES) */}
      <section className="py-20 px-4 sm:px-6 bg-[#040914] border-t border-b border-slate-800/80">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-amber-400 font-extrabold text-xs uppercase tracking-wider">
              Diagnóstico do Instalador Autônomo
            </span>
            <h2 className="font-headline text-2xl sm:text-4xl font-extrabold text-white">
              Você é um excelente profissional, mas passa por alguma dessas situações toda semana?
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
              Seja sincero: se você não tem um processo formal, seu suor está virando lucro para cliente esperto.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-6 space-y-3 relative overflow-hidden">
              <div className="flex items-center gap-3 text-red-400 font-bold text-base">
                <span className="material-symbols-outlined text-[24px]">cancel</span>
                <h4>1. O Calote do "Transfiro Mais Tarde"</h4>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Você gasta gasolina, compra tubulação de cobre cara, fura a parede no sol de 38°C e na hora de receber o cliente diz: <em>"Pode deixar que meu marido chega de noite e te manda o Pix"</em>. O marido chega e a desculpa continua por dias.
              </p>
            </div>

            <div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-6 space-y-3 relative overflow-hidden">
              <div className="flex items-center gap-3 text-red-400 font-bold text-base">
                <span className="material-symbols-outlined text-[24px]">cancel</span>
                <h4>2. Vergonha de Pedir Sinal Adiantado</h4>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Você sabe que precisa cobrar 50% de entrada para cobrir os materiais, mas fica com vergonha porque só tem o WhatsApp ou um caderno velho. Sem um documento formal, você teme que o cliente desconfie e contrate outro.
              </p>
            </div>

            <div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-6 space-y-3 relative overflow-hidden">
              <div className="flex items-center gap-3 text-red-400 font-bold text-base">
                <span className="material-symbols-outlined text-[24px]">cancel</span>
                <h4>3. O Chute no Dimensionamento de BTUs</h4>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Você faz a conta de cabeça no olho. No verão escaldante, a máquina de 9.000 BTUs não gela o quarto que bate sol a tarde toda. O cliente te liga bravo acusando você de ter instalado o aparelho errado, exigindo retrabalho de graça.
              </p>
            </div>

            <div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-6 space-y-3 relative overflow-hidden">
              <div className="flex items-center gap-3 text-red-400 font-bold text-base">
                <span className="material-symbols-outlined text-[24px]">cancel</span>
                <h4>4. Anotações Perdidas & Lucro Invisível</h4>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Orçamentos anotados em guardanapo ou mensagens soltas no WhatsApp. Você não sabe quem te deve, quem pagou o sinal, nem quantos serviços fez no mês. Trabalha até a exaustão e nunca sobra dinheiro no bolso.
              </p>
            </div>
          </div>

          <div className="p-6 bg-slate-900 border border-emerald-500/30 rounded-2xl text-center space-y-3">
            <h3 className="text-base sm:text-lg font-extrabold text-[#6ffbbe]">
              O problema NÃO é a sua qualidade de instalação. O problema é a falta de uma ferramenta profissional.
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto">
              Quando você apresenta uma Ordem de Serviço limpa, com fotos, termos e Pix na tela do celular, o cliente imediatamente te enxerga como uma <strong>empresa séria</strong> — e quem é visto como empresa séria não toma calote.
            </p>
          </div>
        </div>
      </section>

      {/* 5. O MECANISMO ÚNICO (MÉTODO S.O.S DO INSTALADOR) */}
      <section id="metodo" className="py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-[#6ffbbe] font-extrabold text-xs uppercase tracking-wider">
              A Solução Definitiva
            </span>
            <h2 className="font-headline text-2xl sm:text-4xl font-extrabold text-white">
              Apresentando o Método S.O.S do Instalador™
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
              O fluxo simples de 3 etapas que transforma o seu celular em uma blindagem financeira contra inadimplência.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* ETAPA 1 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-emerald-500/50 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-[#6ffbbe] flex items-center justify-center font-black text-xl">
                S
              </div>
              <h3 className="font-headline text-lg font-bold text-white">
                Sinal Garantido no Pix
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ao negociar o serviço, o app calcula automaticamente a entrada (ex: 50%) e gera o Pix oficial com QR Code. Você envia no WhatsApp e só compra o cobre ou se desloca quando o sinal estiver na sua conta.
              </p>
              <div className="pt-2 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">shield</span>
                Custo de material 100% pago pelo cliente
              </div>
            </div>

            {/* ETAPA 2 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-emerald-500/50 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-xl">
                O
              </div>
              <h3 className="font-headline text-lg font-bold text-white">
                Ordem de Serviço Assinada
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                No local do serviço, tire foto do local antes de furar e depois de terminar. Mostre o teste de estanqueidade e colha a assinatura do cliente com o dedo na tela do seu celular.
              </p>
              <div className="pt-2 text-[11px] text-blue-400 font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                Prova irrefutável contra reclamações falsas
              </div>
            </div>

            {/* ETAPA 3 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-emerald-500/50 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xl">
                S
              </div>
              <h3 className="font-headline text-lg font-bold text-white">
                Saldo Liquidado na Entrega
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Com o ar gelando na frente do cliente, abra o saldo restante no app. Ele lê o Pix no celular dele, você confirma o recebimento na hora e envia o comprovante oficial com garantia por WhatsApp.
              </p>
              <div className="pt-2 text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">verified</span>
                Você sai da casa com 100% do dinheiro no bolso
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. RECURSO DE DESTAQUE: CALCULADORA DE BTUS */}
      <section id="calculadora" className="py-16 px-4 sm:px-6 bg-[#040914] border-t border-b border-slate-800/80">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10">
          <div className="md:w-1/2 space-y-5">
            <span className="bg-amber-400/10 text-amber-400 text-xs font-bold px-3 py-1 rounded-full border border-amber-400/20 uppercase tracking-wider">
              Ferramenta Exclusiva Inclusa
            </span>
            <h2 className="font-headline text-2xl sm:text-4xl font-extrabold text-white leading-tight">
              Calculadora de BTUs Exata: Nunca Mais Erre a Carga Térmica
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Chega de tentar adivinhar a potência do ar-condicionado no "olhômetro". O InstalaSaldo traz a calculadora técnica integrada:
            </p>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-[18px]">check</span>
                <span><strong>Metragem Exata:</strong> Multiplicação automática de largura × comprimento.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-[18px]">check</span>
                <span><strong>Fator Sol Direto:</strong> 600 BTUs para sol leve e 800 BTUs para sol da tarde.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-[18px]">check</span>
                <span><strong>Pessoas e Eletrônicos:</strong> Adiciona 600 BTUs por pessoa extra ou aparelho (TV, PC, freezer).</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-[18px]">check</span>
                <span><strong>Sugestão Comercial:</strong> Arredonda na hora para o modelo comercial ideal (9.000, 12.000, 18.000, 24.000 BTUs).</span>
              </li>
            </ul>
          </div>

          <div className="md:w-1/2 w-full">
            <div className="bg-gradient-to-br from-slate-900 to-[#04122e] border-2 border-emerald-500/40 rounded-3xl p-6 shadow-2xl relative">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-400">calculate</span>
                  <span className="font-bold text-sm text-white">Simulador no Celular</span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-[#6ffbbe] px-2 py-0.5 rounded-full font-bold">
                  Prático & Rápido
                </span>
              </div>
              <div className="pt-4 space-y-3 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Ambiente (4m × 3m):</span>
                  <span className="font-mono font-bold text-white">12 m²</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Exposição Solar:</span>
                  <span className="text-amber-400 font-bold">Sol da Tarde (800 BTU/m²)</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Ocupantes extras + TV:</span>
                  <span className="font-mono font-bold text-white">+1.200 BTUs</span>
                </div>
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between">
                  <span className="font-bold text-emerald-300 text-xs">Capacidade Ideal:</span>
                  <span className="font-black text-white text-base">12.000 BTUs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PLANOS & PREÇOS (OFERTA IRRESISTÍVEL - FASE 3) */}
      <section id="planos" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-[#6ffbbe] font-extrabold text-xs uppercase tracking-wider">
              Investimento Baixo • Retorno Imediato
            </span>
            <h2 className="font-headline text-3xl sm:text-5xl font-black text-white">
              Escolha o Plano Ideal Para o Seu Negócio
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
              Menos de R$ 1,23 por dia. Um único sinal que você deixar de perder já paga o aplicativo por 2 anos inteiros.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* PLANO ESSENCIAL */}
            <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 relative hover:border-slate-500 transition-all">
              <div className="space-y-4">
                <div className="inline-block bg-slate-800 text-slate-300 text-[11px] font-bold px-3 py-1 rounded-full uppercase">
                  Para o Instalador Individual
                </div>
                <h3 className="font-headline text-2xl font-black text-white">Plano Essencial</h3>
                <p className="text-xs text-slate-400">
                  Para o autônomo que quer parar de perder dinheiro e organizar o básico com segurança.
                </p>

                <div className="pt-2">
                  <span className="text-xs text-slate-400 line-through block">De R$ 97,00/mês</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-[#6ffbbe] font-bold">R$</span>
                    <span className="text-4xl font-black text-white">37,00</span>
                    <span className="text-xs text-slate-400">/mês recorrente</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold block mt-1">
                    Sem fidelidade • Cancele quando quiser
                  </span>
                </div>

                <div className="border-t border-slate-800 pt-4 space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-400 text-[16px]">check</span>
                    <span><strong>Até 5 clientes ativos</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-400 text-[16px]">check</span>
                    <span><strong>Até 10 serviços por mês</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-400 text-[16px]">check</span>
                    <span>Cálculo automático de Sinal e Saldo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-400 text-[16px]">check</span>
                    <span>Calculadora de BTUs integrada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-400 text-[16px]">check</span>
                    <span>Controle financeiro básico</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-400 text-[16px]">check</span>
                    <span>Suporte via e-mail</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleOpenCheckout('essencial')}
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-md"
              >
                ASSINAR ESSENCIAL (R$ 37/MÊS)
              </button>
            </div>

            {/* PLANO PROFISSIONAL (DESTAQUE) */}
            <div className="bg-gradient-to-b from-[#0e1e38] to-[#0a1526] border-2 border-emerald-400 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 relative shadow-2xl shadow-emerald-500/20 transform md:-translate-y-3">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-[11px] font-black px-4 py-1 rounded-full uppercase tracking-wider shadow-md">
                MAIS POPULAR & RECOMENDADO
              </div>

              <div className="space-y-4">
                <div className="inline-block bg-emerald-500/20 text-[#6ffbbe] text-[11px] font-bold px-3 py-1 rounded-full uppercase mt-2">
                  Completo com Fotos & Assinatura
                </div>
                <h3 className="font-headline text-2xl font-black text-white">Plano Profissional</h3>
                <p className="text-xs text-slate-300">
                  Para técnicos e pequenas empresas que querem fechar mais orçamentos e passar autoridade total.
                </p>

                <div className="pt-2">
                  <span className="text-xs text-slate-400 line-through block">De R$ 197,00/mês</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-[#6ffbbe] font-bold">R$</span>
                    <span className="text-5xl font-black text-[#6ffbbe]">97,00</span>
                    <span className="text-xs text-slate-400">/mês recorrente</span>
                  </div>
                  <span className="text-[10px] text-emerald-300 font-semibold block mt-1">
                    Sem fidelidade • Cancele quando quiser
                  </span>
                </div>

                <div className="border-t border-slate-700 pt-4 space-y-2.5 text-xs text-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#6ffbbe] text-[16px]">check_circle</span>
                    <span><strong>Até 50 clientes ativos</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#6ffbbe] text-[16px]">check_circle</span>
                    <span><strong>Até 120 serviços por mês</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#6ffbbe] text-[16px]">check_circle</span>
                    <span><strong>Orçamentos com envio no WhatsApp</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#6ffbbe] text-[16px]">check_circle</span>
                    <span><strong>Fotos de Antes e Depois na OS</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#6ffbbe] text-[16px]">check_circle</span>
                    <span><strong>Assinatura Digital do Cliente no Celular</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#6ffbbe] text-[16px]">check_circle</span>
                    <span>Agendamento de Manutenções Preventivas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#6ffbbe] text-[16px]">check_circle</span>
                    <span>Suporte VIP via WhatsApp</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleOpenCheckout('profissional')}
                className="w-full py-4 bg-gradient-to-r from-[#00d084] to-[#6ffbbe] hover:from-[#00b572] hover:to-[#5ee2a8] text-[#04122e] font-black text-sm rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95"
              >
                QUERO O PLANO PROFISSIONAL
              </button>
            </div>

            {/* PLANO EMPRESA */}
            <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6 relative hover:border-slate-500 transition-all">
              <div className="space-y-4">
                <div className="inline-block bg-slate-800 text-slate-300 text-[11px] font-bold px-3 py-1 rounded-full uppercase">
                  Para Frotas & Equipes
                </div>
                <h3 className="font-headline text-2xl font-black text-white">Plano Empresa</h3>
                <p className="text-xs text-slate-400">
                  Para frotas de manutenção com múltiplos técnicos e rotas na rua.
                </p>

                <div className="pt-2">
                  <span className="text-xs text-slate-400 line-through block">De R$ 297,00/mês</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs text-[#6ffbbe] font-bold">R$</span>
                    <span className="text-4xl font-black text-white">147,00</span>
                    <span className="text-xs text-slate-400">/mês recorrente</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold block mt-1">
                    Sem fidelidade • Cancele quando quiser
                  </span>
                </div>

                <div className="border-t border-slate-800 pt-4 space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-400 text-[16px]">check</span>
                    <span><strong>Clientes e Serviços ILIMITADOS</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-400 text-[16px]">check</span>
                    <span>Até 15 usuários técnicos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-400 text-[16px]">check</span>
                    <span>Gestão de Equipes e Veículos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-400 text-[16px]">check</span>
                    <span>Relatórios Avançados e DRE</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-400 text-[16px]">check</span>
                    <span>Auditoria e Logs de Atividades</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleOpenCheckout('empresa')}
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-md"
              >
                ASSINAR EMPRESA (R$ 147/MÊS)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. OS 3 BÔNUS EXCLUSIVOS (GRÁTIS HOJE) */}
      <section className="py-16 px-4 sm:px-6 bg-[#040914] border-t border-b border-slate-800/80">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="text-amber-400 font-extrabold text-xs uppercase tracking-wider">
              Presente Especial
            </span>
            <h2 className="font-headline text-2xl sm:text-4xl font-extrabold text-white">
              Assine Hoje e Leve 3 Bônus Blindados Gratuitamente
            </h2>
            <p className="text-sm text-slate-400">
              Esses materiais sozinhos valem mais de R$ 440,00 e serão liberados na sua conta sem custo extra:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <span className="text-amber-400 font-black text-xs uppercase">BÔNUS #1 • VALOR: R$ 197</span>
              <h4 className="font-bold text-white text-base">Termo Jurídico de Garantia e Isenção</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Texto validado por advogados para proteger sua instalação contra rede elétrica instável do cliente ou mau uso do ar-condicionado.
              </p>
              <span className="text-xs font-bold text-emerald-400 block">✓ 100% Grátis Hoje</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <span className="text-amber-400 font-black text-xs uppercase">BÔNUS #2 • VALOR: R$ 97</span>
              <h4 className="font-bold text-white text-base">Tabela de Precificação de Mão de Obra 2026</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tabela de referência com preços médios praticados para instalação de split, recarga de gás, desinstalação e limpeza em todo o Brasil.
              </p>
              <span className="text-xs font-bold text-emerald-400 block">✓ 100% Grátis Hoje</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <span className="text-amber-400 font-black text-xs uppercase">BÔNUS #3 • VALOR: R$ 147</span>
              <h4 className="font-bold text-white text-base">Calculadora de Carga Térmica de Bolso</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Acesso irrestrito à ferramenta de dimensionamento de BTUs para você orçar com segurança técnica na frente do cliente.
              </p>
              <span className="text-xs font-bold text-emerald-400 block">✓ 100% Grátis Hoje</span>
            </div>
          </div>
        </div>
      </section>

      {/* 9. GARANTIA BLINDADA DE 7 DIAS (RISCO ZERO) */}
      <section id="garantia" className="py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-slate-900 via-[#0a1628] to-slate-900 border border-emerald-500/40 rounded-3xl p-8 sm:p-12 text-center space-y-6 relative overflow-hidden shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-[#6ffbbe] flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[36px]">verified_user</span>
          </div>

          <h2 className="font-headline text-2xl sm:text-4xl font-extrabold text-white">
            Garantia Incondicional de 7 Dias: Risco Zero Absoluto
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Nós confiamos tanto na transformação do <strong>InstalaSaldo</strong> que assumimos todo o risco por você. Assine agora, acesse a plataforma e use em seus atendimentos reais por 7 dias. Se por qualquer motivo você achar que ele não te deu segurança para cobrar o sinal ou não facilitou sua vida, basta nos mandar um único e-mail para <strong className="text-white">agenciavallor01@gmail.com</strong> e devolveremos 100% do seu dinheiro. Sem perguntas e sem ressentimentos.
          </p>

          <div>
            <button
              onClick={() => handleOpenCheckout('essencial')}
              className="px-8 py-4 bg-gradient-to-r from-[#00d084] to-[#6ffbbe] hover:from-[#00b572] hover:to-[#5ee2a8] text-[#04122e] text-sm font-extrabold rounded-2xl shadow-lg transition-all cursor-pointer"
            >
              EXPERIMENTAR POR 7 DIAS SEM RISCO
            </button>
          </div>
        </div>
      </section>

      {/* 10. FAQ - PERGUNTAS FREQUENTES */}
      <section id="faq" className="py-16 px-4 sm:px-6 bg-[#040914] border-t border-slate-800/80">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[#6ffbbe] font-bold text-xs uppercase tracking-wider">Tire Suas Dúvidas</span>
            <h2 className="font-headline text-2xl sm:text-3xl font-extrabold text-white">
              Perguntas Frequentes
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Preciso baixar aplicativo pesado na Play Store ou App Store?',
                a: 'Não! O InstalaSaldo é um Aplicativo Web Moderno (PWA). Você abre direto no navegador do celular (Chrome ou Safari) e pode fixar o ícone na sua tela inicial como um app normal. Não ocupa a memória do seu celular e funciona de forma ultra rápida.'
              },
              {
                q: 'Posso usar sendo autônomo sem CNPJ?',
                a: 'Com certeza! O InstalaSaldo foi desenvolvido especialmente para instaladores autônomos que operam com CPF, bem como para MEIs e pequenas empresas que já possuem CNPJ.'
              },
              {
                q: 'Como funciona o cancelamento?',
                a: 'Você tem liberdade total. O plano é mensal e não possui fidelidade nem multas contratuais. Você pode cancelar sua assinatura a qualquer momento com apenas um clique.'
              },
              {
                q: 'O cliente precisa ter o app instalado para assinar a OS?',
                a: 'Não! O cliente assina diretamente com a ponta do dedo na tela do seu celular. Logo após a assinatura, o sistema gera o comprovante em PDF e envia no WhatsApp dele.'
              },
              {
                q: 'Como recebo o acesso após o pagamento?',
                a: 'A liberação é imediata e automática! Assim que o Pix oficial for confirmado pelo Banco Central através do Asaas, você recebe acesso instantâneo para começar a usar.'
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 sm:p-5 text-left font-bold text-sm text-white flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span className="material-symbols-outlined text-slate-400 text-[20px]">
                    {faqOpenIndex === idx ? 'remove' : 'add'}
                  </span>
                </button>
                {faqOpenIndex === idx && (
                  <div className="p-4 sm:p-5 pt-0 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 bg-slate-900/60">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="py-10 px-4 sm:px-6 bg-[#03060d] border-t border-slate-900 text-center text-xs text-slate-500 space-y-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo className="h-6 w-auto" />
            <span className="text-slate-400 font-bold">InstalaSaldo</span>
            <span>• O Sistema Oficial do Instalador de Refrigeração</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Suporte: <strong>agenciavallor01@gmail.com</strong></span>
            <span>•</span>
            <button onClick={onGoToLogin} className="hover:text-white underline cursor-pointer">
              Área do Assinante
            </button>
          </div>
        </div>
        <p className="text-[11px] text-slate-600 max-w-2xl mx-auto pt-4">
          © {new Date().getFullYear()} InstalaSaldo. Todos os direitos reservados. Este software não possui vínculo governamental e foi desenvolvido para gestão operacional de prestadores de serviços.
        </p>
      </footer>

      {/* 12. MODAL DE CHECKOUT EXPRESS COM PIX ASAAS OFICIAL */}
      {isCheckoutOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0b162c] border border-slate-700 text-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl relative animate-scale-up space-y-6">
            <button
              onClick={() => {
                setIsCheckoutOpen(false);
                setCheckoutData(null);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-white cursor-pointer"
            >
              <span className="material-symbols-outlined text-[24px]">close</span>
            </button>

            {!checkoutData ? (
              /* ETAPA 1: DADOS DO ASSINANTE */
              <form onSubmit={handleGenerateCheckoutPix} className="space-y-4">
                <div className="space-y-1">
                  <span className="text-xs text-[#6ffbbe] font-bold uppercase tracking-wider">
                    Checkout Seguro • Pix Imediato
                  </span>
                  <h3 className="font-headline text-2xl font-black text-white">
                    Assinar Plano {PLAN_CONFIGS[selectedPlan].name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Valor: <strong className="text-white">{formatCurrency(PLAN_CONFIGS[selectedPlan].price)}/mês</strong>. Preencha seus dados para gerar o Pix oficial no Banco Central.
                  </p>
                </div>

                {checkoutError && (
                  <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-xs text-red-300">
                    {checkoutError}
                  </div>
                )}

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Seu Nome Completo</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Carlos Eduardo da Silva"
                      className="w-full h-11 px-3.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-[#6ffbbe]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Seu E-mail Profissional</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="carlos@gmail.com"
                      className="w-full h-11 px-3.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-[#6ffbbe]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">WhatsApp com DDD</label>
                      <input
                        type="text"
                        required
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="(85) 99999-9999"
                        className="w-full h-11 px-3.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-[#6ffbbe]"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">CPF ou CNPJ</label>
                      <input
                        type="text"
                        required
                        value={cpfCnpj}
                        onChange={(e) => setCpfCnpj(e.target.value)}
                        placeholder="000.000.000-00"
                        className="w-full h-11 px-3.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-[#6ffbbe]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Crie sua Senha de Acesso</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 dígitos"
                      className="w-full h-11 px-3.5 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-[#6ffbbe]"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-gradient-to-r from-[#00d084] to-[#6ffbbe] hover:from-[#00b572] hover:to-[#5ee2a8] text-[#04122e] font-black text-sm rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isSubmitting ? 'refresh' : 'qr_code_2'}
                    </span>
                    <span>
                      {isSubmitting ? 'Gerando Cobrança no Asaas...' : 'GERAR PIX NO BANCO CENTRAL'}
                    </span>
                  </button>
                  <p className="text-[10px] text-slate-400 text-center mt-2">
                    🔒 Cobrança processada de forma segura com criptografia via Asaas.
                  </p>
                </div>
              </form>
            ) : (
              /* ETAPA 2: QR CODE PIX GERADO */
              <div className="text-center space-y-4">
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl flex items-center justify-between text-left">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      Cobrança Pix Pronta
                    </span>
                    <h4 className="font-bold text-white text-base">
                      {formatCurrency(checkoutData.value)} • Plano {PLAN_CONFIGS[selectedPlan].name}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>Aguardando Pix...</span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-2xl inline-block mx-auto shadow-md">
                  {checkoutData.pixQrCode.encodedImage ? (
                    <img
                      src={checkoutData.pixQrCode.encodedImage}
                      alt="QR Code Pix Asaas"
                      className="w-48 h-48 mx-auto object-contain"
                    />
                  ) : (
                    <div className="w-48 h-48 bg-slate-100 flex items-center justify-center text-slate-500 text-xs">
                      QR Code indisponível
                    </div>
                  )}
                </div>

                {/* Copia e Cola */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[11px] text-slate-300 font-bold block">
                    Pix Copia e Cola:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={checkoutData.pixQrCode.payload}
                      className="w-full h-10 pl-3 pr-24 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-300 font-mono outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCopyPix}
                      className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {copiedPix ? 'check' : 'content_copy'}
                      </span>
                      <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Abra o aplicativo do seu banco (Inter, Nubank, Itaú, etc.), escolha <strong>Pix &gt; Pagar com QR Code ou Copia e Cola</strong>. A liberação do seu acesso é automática assim que o pagamento for recebido.
                </p>

                <div className="pt-2 flex justify-between text-xs border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCheckoutData(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    Alterar dados
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCheckoutOpen(false)}
                    className="text-slate-400 hover:text-white font-bold"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
