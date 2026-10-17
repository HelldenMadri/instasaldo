import React, { useState } from 'react';
import { useApp, PLAN_CONFIGS } from '../context/AppContext';
import { PlanTier } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

export const PlansView: React.FC = () => {
  const { currentCompany, changeCompanyPlan, invoices } = useApp();
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<PlanTier | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cartao'>('pix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [downloadedInvoiceId, setDownloadedInvoiceId] = useState<string | null>(null);

  const currentPlanConfig = PLAN_CONFIGS[currentCompany.plan];

  const handleConfirmSubscription = () => {
    if (!selectedPlanForCheckout) return;
    setIsProcessing(true);

    setTimeout(() => {
      changeCompanyPlan(currentCompany.id, selectedPlanForCheckout);
      setIsProcessing(false);
      setCheckoutSuccess(true);
      setTimeout(() => {
        setCheckoutSuccess(false);
        setSelectedPlanForCheckout(null);
      }, 2000);
    }, 1200);
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

      {/* Checkout Recorrente Modal */}
      {selectedPlanForCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-[#04122e] text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-headline font-bold text-base">
                  Assinatura Mensal Recorrente
                </h3>
                <p className="text-xs text-blue-200">
                  InstalaSaldo Plano {PLAN_CONFIGS[selectedPlanForCheckout].name}
                </p>
              </div>
              <button
                onClick={() => setSelectedPlanForCheckout(null)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Value Summary */}
              <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200">
                <div>
                  <span className="text-xs text-slate-500 block">Valor Mensal Recorrente:</span>
                  <span className="font-headline font-extrabold text-2xl text-[#04122e]">
                    {formatCurrency(PLAN_CONFIGS[selectedPlanForCheckout].price)}
                  </span>
                  <span className="text-[11px] text-slate-400 block">Cobrança a cada 30 dias</span>
                </div>
                <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
                  Sem Fidelidade
                </span>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Forma de Pagamento Recorrente
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      paymentMethod === 'pix'
                        ? 'bg-emerald-50 border-[#006c49] text-[#006c49] shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
                    <span>Pix Automático</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cartao')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      paymentMethod === 'cartao'
                        ? 'bg-blue-50 border-[#04122e] text-[#04122e] shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">credit_card</span>
                    <span>Cartão de Crédito</span>
                  </button>
                </div>
              </div>

              {paymentMethod === 'pix' ? (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center space-y-2">
                  <div className="w-24 h-24 mx-auto bg-white p-2 border border-slate-300 rounded-lg flex items-center justify-center">
                    <span className="material-symbols-outlined text-[64px] text-slate-800">
                      qr_code_2
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    Escaneie ou copie a Chave Pix Recorrente para ativação instantânea.
                  </p>
                  <button
                    type="button"
                    onClick={() => alert('Chave Pix Copia-e-Cola copiada para a área de transferência!')}
                    className="text-xs text-[#006c49] font-bold hover:underline"
                  >
                    Copiar Código Pix Copia e Cola
                  </button>
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  <input
                    type="text"
                    placeholder="Número do Cartão de Crédito"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                    defaultValue="4532 •••• •••• 9812"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="MM/AA"
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                      defaultValue="11/28"
                    />
                    <input
                      type="text"
                      placeholder="CVV"
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                      defaultValue="492"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedPlanForCheckout(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleConfirmSubscription}
                  className={`px-5 py-2.5 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 ${
                    checkoutSuccess
                      ? 'bg-[#006c49]'
                      : 'bg-[#04122e] hover:bg-[#1a2744] active:scale-95'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {checkoutSuccess ? 'check_circle' : isProcessing ? 'refresh' : 'lock'}
                  </span>
                  <span>
                    {checkoutSuccess
                      ? 'Assinatura Ativada!'
                      : isProcessing
                      ? 'Processando...'
                      : `Confirmar Assinatura (${formatCurrency(PLAN_CONFIGS[selectedPlanForCheckout].price)}/mês)`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
