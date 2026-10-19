import React, { useState, useEffect } from 'react';
import { useApp, PLAN_CONFIGS } from '../context/AppContext';
import { PlanTier } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  requestCheckout,
  checkPaymentStatus,
  triggerSimulatedPayment,
  AsaasCheckoutResponse,
} from '../services/asaas';

export const PlansView: React.FC = () => {
  const { currentCompany, changeCompanyPlan, invoices, currentUser, isSuperAdmin } = useApp();
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<PlanTier | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cartao'>('pix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [downloadedInvoiceId, setDownloadedInvoiceId] = useState<string | null>(null);

  // Estados específicos da integração Asaas Pix
  const [checkoutData, setCheckoutData] = useState<AsaasCheckoutResponse | null>(null);
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [copiedPix, setCopiedPix] = useState(false);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);

  const currentPlanConfig = PLAN_CONFIGS[currentCompany.plan];

  // Efeito de Polling: verifica a cada 3s se o Asaas confirmou o pagamento
  useEffect(() => {
    if (!checkoutData?.paymentId || checkoutSuccess) return;

    const interval = setInterval(async () => {
      try {
        const status = await checkPaymentStatus(checkoutData.paymentId);
        if (status.isPaid && selectedPlanForCheckout) {
          clearInterval(interval);
          setCheckoutSuccess(true);
          changeCompanyPlan(currentCompany.id, selectedPlanForCheckout);
          setTimeout(() => {
            setCheckoutSuccess(false);
            setSelectedPlanForCheckout(null);
            setCheckoutData(null);
          }, 2500);
        }
      } catch (err) {
        // Silencioso em caso de instabilidade temporária
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [checkoutData?.paymentId, checkoutSuccess, selectedPlanForCheckout, currentCompany.id]);

  // Função para gerar a cobrança no Asaas
  const handleGeneratePix = async () => {
    if (!selectedPlanForCheckout) return;

    // Em produção ou para usuários normais, valida se CPF/CNPJ foi informado
    const cleanDoc = cpfCnpj.replace(/\D/g, '');
    if (!isSuperAdmin && cleanDoc.length !== 11 && cleanDoc.length !== 14) {
      alert('Por favor, informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido para registrar a cobrança Pix oficial no Banco Central via Asaas.');
      return;
    }

    setIsGeneratingPix(true);

    try {
      const plan = PLAN_CONFIGS[selectedPlanForCheckout];
      const res = await requestCheckout({
        companyId: currentCompany.id,
        planTier: selectedPlanForCheckout,
        planName: plan.name,
        value: plan.price,
        customer: {
          name: currentUser.name || currentCompany.name,
          email: currentUser.email || currentCompany.email || 'contato@instalasaldo.com.br',
          cpfCnpj: cpfCnpj.trim() || undefined,
          phone: phone.trim() || undefined,
        },
      });

      setCheckoutData(res);
    } catch (err: any) {
      alert(err.message || 'Erro ao gerar cobrança no Asaas.');
    } finally {
      setIsGeneratingPix(false);
    }
  };

  // Função para simular confirmação imediata (Modo Teste / Sandbox / Super Admin)
  const handleSimulatePayment = async () => {
    if (!checkoutData?.paymentId || !selectedPlanForCheckout) return;
    setIsProcessing(true);

    try {
      await triggerSimulatedPayment({
        paymentId: checkoutData.paymentId,
        companyId: currentCompany.id,
        planTier: selectedPlanForCheckout,
        userEmail: currentUser.email,
      });

      setCheckoutSuccess(true);
      changeCompanyPlan(currentCompany.id, selectedPlanForCheckout);

      setTimeout(() => {
        setCheckoutSuccess(false);
        setSelectedPlanForCheckout(null);
        setCheckoutData(null);
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Erro ao simular pagamento.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyPix = () => {
    if (!checkoutData?.pixQrCode?.payload) return;
    navigator.clipboard.writeText(checkoutData.pixQrCode.payload);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };


  return (
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-8 w-full">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-headline text-2xl font-bold text-[#04122e]">
            Planos & Assinaturas Recorrentes
          </h1>
          <span className="bg-[#6cf8bb] text-[#005236] text-[11px] font-bold px-2 py-0.5 rounded-full uppercase">
            Mensalidade Recorrente
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Planos sob medida para instaladores autônomos e frotas de manutenção. Cobrança mensal automática via Pix ou Cartão.
        </p>
      </div>

      {/* Current Subscription Status Card */}
      <div className="bg-[#1a2744] text-white p-6 rounded-2xl shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 space-y-1">
          <span className="text-[11px] text-blue-200 uppercase tracking-wider font-bold">
            Sua Assinatura Atual
          </span>
          <div className="flex items-center gap-3">
            <h2 className="font-headline text-2xl font-extrabold text-white">
              Plano {currentPlanConfig.name}
            </h2>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                currentCompany.planStatus === 'ativo'
                  ? 'bg-[#6cf8bb] text-[#002113]'
                  : 'bg-amber-300 text-amber-950'
              }`}
            >
              {currentCompany.planStatus === 'ativo' ? 'Ativa' : 'Pendente'}
            </span>
          </div>
          <p className="text-xs text-blue-100">
            {currentPlanConfig.description}
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
          <div>
            <span className="text-[11px] text-blue-200 block">Mensalidade</span>
            <span className="font-headline text-2xl font-bold text-[#6ffbbe]">
              {formatCurrency(currentCompany.monthlyPrice)}
              <span className="text-xs font-normal text-blue-200">/mês</span>
            </span>
          </div>

          <div>
            <span className="text-[11px] text-blue-200 block">Próxima Renovação</span>
            <span className="text-xs font-bold text-white block">
              {formatDate(currentCompany.nextBillingDate)}
            </span>
            <span className="text-[10px] text-emerald-300 font-semibold">Pix Recorrente</span>
          </div>
        </div>
      </div>

      {/* 3 Monthly Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(Object.keys(PLAN_CONFIGS) as PlanTier[]).map((tierKey) => {
          const plan = PLAN_CONFIGS[tierKey];
          const isCurrent = currentCompany.plan === tierKey;

          return (
            <div
              key={plan.id}
              className={`rounded-2xl p-6 transition-all relative flex flex-col justify-between ${
                isCurrent
                  ? 'bg-white border-2 border-[#04122e] shadow-lg ring-4 ring-blue-50'
                  : 'bg-white border border-slate-200 shadow-sm hover:shadow-md'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 right-6">
                  <span className="bg-[#04122e] text-[#6ffbbe] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div>
                <div className="mb-4">
                  <h3 className="font-headline text-xl font-bold text-[#04122e]">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 min-h-[32px]">
                    {plan.description}
                  </p>
                </div>

                {/* Price Display */}
                <div className="mb-6 pb-4 border-b border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-bold text-slate-500">R$</span>
                    <span className="font-headline font-extrabold text-3xl text-[#04122e]">
                      {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">/mês recorrente</span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-semibold block mt-1">
                    Sem fidelidade • Cancele quando quiser
                  </span>
                </div>

                {/* Feature List */}
                <div className="space-y-2.5 text-xs text-slate-700 mb-6">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[#006c49] text-[18px] shrink-0">
                        check
                      </span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div>
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full h-11 bg-slate-100 text-slate-500 text-xs font-bold rounded-xl cursor-default flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    Plano Vigente
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedPlanForCheckout(plan.id)}
                    className="w-full h-11 bg-[#04122e] hover:bg-[#1a2744] text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span>Migrar para {plan.name}</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Invoices History Table */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-headline text-base font-bold text-[#04122e]">
              Histórico de Faturas & Liquidações da Assinatura
            </h3>
            <p className="text-xs text-slate-500">
              Comprovantes fiscais e recibos bancários de mensalidade do InstalaSaldo.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                <th className="p-3">Fatura</th>
                <th className="p-3">Plano Contratado</th>
                <th className="p-3">Vencimento / Baixa</th>
                <th className="p-3">Método</th>
                <th className="p-3 text-right">Valor Mensal</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Recibo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-slate-900">{inv.id.toUpperCase()}</td>
                  <td className="p-3 font-semibold">{inv.planName}</td>
                  <td className="p-3 text-slate-500">{formatDate(inv.dueDate)}</td>
                  <td className="p-3 uppercase text-[11px] font-bold text-slate-600">
                    {inv.paymentMethod}
                  </td>
                  <td className="p-3 text-right font-headline font-bold text-slate-900">
                    {formatCurrency(inv.amount)}
                  </td>
                  <td className="p-3 text-center">
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      PAGO
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        setDownloadedInvoiceId(inv.id);
                        setTimeout(() => setDownloadedInvoiceId(null), 3000);
                      }}
                      className="text-xs text-[#04122e] hover:underline font-bold inline-flex items-center gap-1"
                    >
                      {downloadedInvoiceId === inv.id ? (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">check</span>
                          PDF Gerado!
                        </span>
                      ) : (
                        <span>Baixar PDF</span>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Suporte Técnico Diferenciado por Plano */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006c49] text-[22px]">support_agent</span>
            <h3 className="font-headline text-base font-bold text-[#04122e]">
              Canal de Suporte ao Cliente
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {currentCompany.plan === 'essencial'
              ? 'Plano Essencial: Atendimento exclusivamente por e-mail (agenciavallor01@gmail.com).'
              : `Plano ${currentPlanConfig.name}: Suporte prioritário via WhatsApp direto e E-mail.`}
          </p>
        </div>

        <div>
          {currentCompany.plan === 'essencial' ? (
            <a
              href="mailto:agenciavallor01@gmail.com?subject=Suporte%20InstalaSaldo%20-%20Plano%20Essencial"
              className="px-4 py-2.5 bg-[#04122e] hover:bg-[#1a2744] text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">mail</span>
              <span>Enviar E-mail de Suporte</span>
            </a>
          ) : (
            <a
              href={`https://wa.me/5585997650795?text=${encodeURIComponent(
                `Olá, suporte da Agência Vallor! Sou da empresa "${currentCompany.name}" (Plano ${currentPlanConfig.name}) e gostaria de atendimento técnico no InstalaSaldo.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-[#006c49] hover:bg-[#005236] text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">chat</span>
              <span>Falar no WhatsApp (55 85 99765-0795)</span>
            </a>
          )}
        </div>
      </div>

      {/* Checkout Recorrente Asaas Modal */}
      {selectedPlanForCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full my-6 overflow-hidden shadow-2xl border border-slate-200 animate-fade-in">
            {/* Modal Header */}
            <div className="bg-[#04122e] text-white p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-emerald-500/20 text-[#6ffbbe] font-bold px-2 py-0.5 rounded-full uppercase">
                    Asaas Checkout Seguro
                  </span>
                  {checkoutData?.isSimulated && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full">
                      Modo Simulação / Teste
                    </span>
                  )}
                </div>
                <h3 className="font-headline font-bold text-lg mt-1 text-white">
                  Plano {PLAN_CONFIGS[selectedPlanForCheckout].name}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedPlanForCheckout(null);
                  setCheckoutData(null);
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Sucesso de Ativação (Celebration Screen) */}
              {checkoutSuccess ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-[#006c49] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                    <span className="material-symbols-outlined text-[36px]">check_circle</span>
                  </div>
                  <div>
                    <h4 className="font-headline font-extrabold text-xl text-[#04122e]">
                      Pagamento Confirmado via Pix!
                    </h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                      A assinatura da empresa <strong className="text-slate-800">{currentCompany.name}</strong> foi ativada. Todos os recursos estão desbloqueados!
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    Liberando o painel agora...
                  </div>
                </div>
              ) : !checkoutData ? (
                /* Etapa 1: Resumo do Plano & Dados do Pagador */
                <div className="space-y-4">
                  {/* Card de Valor */}
                  <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-200">
                    <div>
                      <span className="text-xs text-slate-500 block">Mensalidade Recorrente:</span>
                      <span className="font-headline font-extrabold text-2xl text-[#04122e]">
                        {formatCurrency(PLAN_CONFIGS[selectedPlanForCheckout].price)}
                      </span>
                      <span className="text-[11px] text-slate-400 block">Cobrança a cada 30 dias • Cancele quando quiser</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs bg-emerald-100 text-[#006c49] font-bold px-3 py-1 rounded-full inline-block">
                        Pix Automático
                      </span>
                    </div>
                  </div>

                  {/* Informações para a Emissão */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-700">
                      Dados para emissão do comprovante Asaas:
                    </label>

                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Nome / Razão Social</label>
                      <input
                        type="text"
                        disabled
                        value={currentUser.name || currentCompany.name}
                        className="w-full h-10 px-3 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 cursor-not-allowed"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          CPF ou CNPJ do Titular
                        </label>
                        <input
                          type="text"
                          value={cpfCnpj}
                          onChange={(e) => setCpfCnpj(e.target.value)}
                          placeholder="000.000.000-00"
                          className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#04122e]"
                        />
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          Obrigatório para pagar via banco real (exigência do Banco Central).
                        </span>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">WhatsApp de Contato</label>
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="(85) 99999-9999"
                          className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#04122e]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedPlanForCheckout(null)}
                      className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      disabled={isGeneratingPix}
                      onClick={handleGeneratePix}
                      className="px-5 py-2.5 bg-[#006c49] hover:bg-[#005236] active:scale-95 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-all"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {isGeneratingPix ? 'refresh' : 'qr_code_2'}
                      </span>
                      <span>
                        {isGeneratingPix ? 'Gerando Pix no Asaas...' : 'Gerar QR Code Pix'}
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Etapa 2: QR Code Pix Gerado + Copia e Cola + Polling */
                <div className="space-y-4 text-center">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-left">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                        Cobrança Pix Pronta
                      </span>
                      <h4 className="font-headline font-bold text-base text-[#04122e]">
                        Total: {formatCurrency(checkoutData.value)}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
                      <span>Aguardando Pix...</span>
                    </div>
                  </div>

                  {/* QR Code Imagem */}
                  <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-sm inline-block mx-auto">
                    {checkoutData.pixQrCode.encodedImage ? (
                      <img
                        src={checkoutData.pixQrCode.encodedImage}
                        alt="QR Code Pix Asaas"
                        className="w-52 h-52 mx-auto object-contain"
                      />
                    ) : (
                      <div className="w-52 h-52 bg-slate-100 flex items-center justify-center text-slate-400">
                        <span className="material-symbols-outlined text-[48px]">qr_code_2</span>
                      </div>
                    )}
                  </div>

                  {/* Pix Copia e Cola */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase">
                      Código Pix Copia e Cola:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={checkoutData.pixQrCode.payload}
                        className="w-full h-11 pl-3 pr-24 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 outline-none select-all"
                      />
                      <button
                        type="button"
                        onClick={handleCopyPix}
                        className={`absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                          copiedPix
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#04122e] hover:bg-[#1a2744] text-white shadow-sm'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {copiedPix ? 'check' : 'content_copy'}
                        </span>
                        <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Abra o app do seu banco, escolha <strong>Pix &gt; Pagar com QR Code</strong> ou <strong>Pix Copia e Cola</strong>. A aprovação é imediata via Webhook.
                  </p>

                  {/* Indicador de Status Asaas: Real vs Simulação */}
                  {checkoutData.isSimulated && (!import.meta.env.PROD || isSuperAdmin) ? (
                    <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-2 text-left">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                        <span className="material-symbols-outlined text-[18px] text-amber-600">info</span>
                        <span>QR Code de Simulação (Ambiente de Testes / Super Admin)</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Este código é fictício para testes sem debitar dinheiro real da conta bancária. O aplicativo do banco não conseguirá lê-lo. Para aprovar o teste agora mesmo, clique abaixo:
                      </p>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={handleSimulatePayment}
                        className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">bolt</span>
                        <span>{isProcessing ? 'Confirmando...' : '⚡ Simular Pagamento Pix Imediato (Super Admin)'}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-left flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-emerald-600 text-[20px] shrink-0 mt-0.5">verified_user</span>
                      <div className="space-y-0.5 text-xs text-emerald-900">
                        <p className="font-bold">Pix Oficial Registrado no Banco Central (Asaas)</p>
                        <p className="text-[11px] text-emerald-700">
                          Pode escanear ou copiar o código acima com o aplicativo do seu banco (Inter, Nubank, Itaú, Bradesco, etc.). A liberação do plano é automática e instantânea assim que o Pix for recebido.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
                    <button
                      type="button"
                      onClick={() => setCheckoutData(null)}
                      className="text-slate-500 hover:text-slate-800 font-semibold"
                    >
                      Alterar dados
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlanForCheckout(null);
                        setCheckoutData(null);
                      }}
                      className="text-slate-400 hover:text-slate-600 font-medium"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
