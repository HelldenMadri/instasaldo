import React, { useState } from 'react';
import { WorkOrder, Company } from '../types';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/formatters';

interface WhatsAppDispatchModalProps {
  order: WorkOrder;
  company: Company;
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppDispatchModal: React.FC<WhatsAppDispatchModalProps> = ({
  order,
  company,
  isOpen,
  onClose,
}) => {
  const { sendWhatsAppWorkOrder } = useApp();

  const [recipientType, setRecipientType] = useState<'client' | 'technician' | 'custom'>('client');
  const [customPhone, setCustomPhone] = useState('');
  const [deliveryFormat, setDeliveryFormat] = useState<'documento_formatado' | 'pdf_comprovante' | 'link_seguro'>(
    company.whatsappConfig?.deliveryFormat || 'documento_formatado'
  );
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; waLink?: string } | null>(null);

  if (!isOpen) return null;

  const clientPhone = order.clientPhone || '(11) 98122-3344';
  const technicianPhone = '(11) 98765-4321';
  const targetPhone =
    recipientType === 'client'
      ? clientPhone
      : recipientType === 'technician'
      ? technicianPhone
      : customPhone || clientPhone;

  // Build the message based on selected delivery format
  const generateMessageText = () => {
    const isPaid = order.pendingBalance <= 0;
    const pixInfo =
      order.pendingBalance > 0
        ? `\n\n🔑 *Chave Pix para quitação do saldo:* financeiro@instalasaldo.com.br (ou solicite o QR Code Pix)`
        : `\n\n✅ *Status Financeiro:* Totalmente quitado (R$ ${order.totalValue.toFixed(2)})`;

    if (deliveryFormat === 'documento_formatado') {
      return `*InstalaSaldo — Ordem de Serviço ${order.code}*
Olá, *${order.clientName}*!

Seguem os dados do seu atendimento de *${order.serviceType === 'instalacao' ? 'Instalação' : 'Manutenção'}*:
• *Serviço:* ${order.description}
• *Data Agendada:* ${formatDate(order.scheduledDate)}
• *Técnico Responsável:* ${order.assignedTechnicianName}
• *Endereço:* ${order.clientAddress}

*Resumo Financeiro:*
• *Valor Total:* ${formatCurrency(order.totalValue)}
• *Sinal Pago (Entrada):* ${formatCurrency(order.depositValue)}
• *Saldo Restante a Pagar:* ${formatCurrency(order.pendingBalance)}${pixInfo}

${order.clientSignature ? '✍️ *Comprovante:* Assinado digitalmente pelo cliente.' : '⏳ *Assinatura:* Coleta presencial na entrega do serviço.'}

Qualquer dúvida ou ajuste de horário, estamos à total disposição!
*${company.name}*
📞 ${company.phone}`;
    }

    if (deliveryFormat === 'pdf_comprovante') {
      return `*InstalaSaldo — Comprovante Digital OS ${order.code}*
Prezado(a) *${order.clientName}*,

Seu comprovante de serviço e recibo de pagamento já está disponível:
• *Ordem:* ${order.code}
• *Serviço:* ${order.description}
• *Valor Quitado:* ${formatCurrency(order.depositValue)}
• *Saldo a Liquidar:* ${formatCurrency(order.pendingBalance)}

📄 *Visualizar e Baixar Comprovante PDF Oficial:*
https://instalasaldo.com.br/comprovante/${order.code}

*${company.name}*`;
    }

    return `*InstalaSaldo — Acompanhamento em Tempo Real*
Olá, *${order.clientName}*!

Sua Ordem de Serviço *${order.code}* (${order.serviceType === 'instalacao' ? 'Instalação' : 'Manutenção'}) está registrada com sucesso.

Para acompanhar o status do técnico em campo, fotos do serviço e dados de quitação, acesse:
🔗 https://instalasaldo.com.br/os/${order.code}?token=sec_778192

*${company.name}*`;
  };

  const [customMessage, setCustomMessage] = useState(generateMessageText());

  // Update text when delivery format changes
  const handleFormatChange = (fmt: 'documento_formatado' | 'pdf_comprovante' | 'link_seguro') => {
    setDeliveryFormat(fmt);
    setTimeout(() => {
      // Recompute with new format
      const isPaid = order.pendingBalance <= 0;
      const pixInfo =
        order.pendingBalance > 0
          ? `\n\n🔑 *Chave Pix para quitação do saldo:* financeiro@instalasaldo.com.br (ou solicite o QR Code Pix)`
          : `\n\n✅ *Status Financeiro:* Totalmente quitado (R$ ${order.totalValue.toFixed(2)})`;

      if (fmt === 'documento_formatado') {
        setCustomMessage(`*InstalaSaldo — Ordem de Serviço ${order.code}*
Olá, *${order.clientName}*!

Seguem os dados do seu atendimento de *${order.serviceType === 'instalacao' ? 'Instalação' : 'Manutenção'}*:
• *Serviço:* ${order.description}
• *Data Agendada:* ${formatDate(order.scheduledDate)}
• *Técnico Responsável:* ${order.assignedTechnicianName}
• *Endereço:* ${order.clientAddress}

*Resumo Financeiro:*
• *Valor Total:* ${formatCurrency(order.totalValue)}
• *Sinal Pago (Entrada):* ${formatCurrency(order.depositValue)}
• *Saldo Restante a Pagar:* ${formatCurrency(order.pendingBalance)}${pixInfo}

${order.clientSignature ? '✍️ *Comprovante:* Assinado digitalmente pelo cliente.' : '⏳ *Assinatura:* Coleta presencial na entrega do serviço.'}

Qualquer dúvida ou ajuste de horário, estamos à total disposição!
*${company.name}*
📞 ${company.phone}`);
      } else if (fmt === 'pdf_comprovante') {
        setCustomMessage(`*InstalaSaldo — Comprovante Digital OS ${order.code}*
Prezado(a) *${order.clientName}*,

Seu comprovante de serviço e recibo de pagamento já está disponível:
• *Ordem:* ${order.code}
• *Serviço:* ${order.description}
• *Valor Quitado:* ${formatCurrency(order.depositValue)}
• *Saldo a Liquidar:* ${formatCurrency(order.pendingBalance)}

📄 *Visualizar e Baixar Comprovante PDF Oficial:*
https://instalasaldo.com.br/comprovante/${order.code}

*${company.name}*`);
      } else {
        setCustomMessage(`*InstalaSaldo — Acompanhamento em Tempo Real*
Olá, *${order.clientName}*!

Sua Ordem de Serviço *${order.code}* (${order.serviceType === 'instalacao' ? 'Instalação' : 'Manutenção'}) está registrada com sucesso.

Para acompanhar o status do técnico em campo, fotos do serviço e dados de quitação, acesse:
🔗 https://instalasaldo.com.br/os/${order.code}?token=sec_778192

*${company.name}*`);
      }
    }, 10);
  };

  const handleSend = async () => {
    setIsSending(true);
    setFeedback(null);

    try {
      const res = await sendWhatsAppWorkOrder(
        order.id,
        recipientType,
        recipientType === 'custom' ? customPhone : undefined,
        customMessage
      );

      if (res.success) {
        setFeedback({
          type: 'success',
          message: res.message,
          waLink: res.waLink,
        });

        // If manual link is generated, automatically open in new tab
        if (res.waLink) {
          window.open(res.waLink, '_blank');
        }
      } else {
        setFeedback({
          type: 'error',
          message: res.message,
        });
      }
    } catch {
      setFeedback({
        type: 'error',
        message: 'Erro ao disparar mensagem. Verifique a conectividade.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header (WhatsApp Brand Style) */}
        <div className="bg-[#075E54] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[24px]">chat</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline font-bold text-base text-white">
                  Disparo de OS via WhatsApp
                </h3>
                <span className="bg-[#128C7E] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  {order.code}
                </span>
              </div>
              <p className="text-xs text-white/80">
                Envio direto ao cliente ou técnico com dados de sinal, saldo e Pix
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700">
          {/* Provider Status Pill */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-bold text-emerald-900">
                Canal de Envio: {company.whatsappConfig?.provider === 'meta_cloud_api' ? 'Meta Cloud API Oficial' : 'WhatsApp Direto (Link Web/App)'}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700">
              Número da Empresa: {company.phone}
            </span>
          </div>

          {/* Recipient Selection */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Destinatário da Mensagem
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRecipientType('client')}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  recipientType === 'client'
                    ? 'border-[#075E54] bg-[#075E54]/5 ring-1 ring-[#075E54]'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="font-bold text-slate-900">Cliente</span>
                <span className="text-[11px] text-slate-500 truncate">{order.clientName}</span>
                <span className="text-[10px] text-emerald-700 font-mono mt-0.5">{clientPhone}</span>
              </button>

              <button
                type="button"
                onClick={() => setRecipientType('technician')}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  recipientType === 'technician'
                    ? 'border-[#075E54] bg-[#075E54]/5 ring-1 ring-[#075E54]'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="font-bold text-slate-900">Técnico Responsável</span>
                <span className="text-[11px] text-slate-500 truncate">{order.assignedTechnicianName}</span>
                <span className="text-[10px] text-emerald-700 font-mono mt-0.5">{technicianPhone}</span>
              </button>

              <button
                type="button"
                onClick={() => setRecipientType('custom')}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  recipientType === 'custom'
                    ? 'border-[#075E54] bg-[#075E54]/5 ring-1 ring-[#075E54]'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="font-bold text-slate-900">Outro WhatsApp</span>
                <span className="text-[11px] text-slate-500">Digitar número</span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5">(com DDD)</span>
              </button>
            </div>

            {recipientType === 'custom' && (
              <div className="pt-2">
                <input
                  type="text"
                  value={customPhone}
                  onChange={(e) => setCustomPhone(e.target.value)}
                  placeholder="Ex: (11) 99876-5432"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-[#075E54]"
                />
              </div>
            )}
          </div>

          {/* Delivery Format Pills */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Formato de Entrega
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: 'documento_formatado', label: 'Documento Completo (Sinal & Saldo)', icon: 'description' },
                { id: 'pdf_comprovante', label: 'Comprovante / Recibo Digital', icon: 'picture_as_pdf' },
                { id: 'link_seguro', label: 'Link de Acompanhamento', icon: 'link' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => handleFormatChange(fmt.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 whitespace-nowrap transition-all ${
                    deliveryFormat === fmt.id
                      ? 'bg-[#04122e] text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{fmt.icon}</span>
                  <span>{fmt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Live WhatsApp Bubble Preview & Message Editor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
            {/* Editor */}
            <div className="space-y-1">
              <span className="block text-[11px] font-bold text-slate-600">
                Texto da Mensagem (Editável)
              </span>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={9}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-[#075E54] resize-none leading-relaxed"
              ></textarea>
            </div>

            {/* Live WhatsApp Chat Bubble */}
            <div className="space-y-1">
              <span className="block text-[11px] font-bold text-slate-600">
                Pré-visualização no WhatsApp do Destinatário
              </span>
              <div className="h-[210px] overflow-y-auto bg-[#E5DDD5] p-3 rounded-xl border border-slate-300 flex flex-col justify-end">
                <div className="max-w-[95%] bg-[#DCF8C6] text-slate-900 p-2.5 rounded-lg shadow-sm self-end rounded-tr-none text-[11px] leading-relaxed relative">
                  <div className="whitespace-pre-wrap break-words">
                    {customMessage}
                  </div>
                  <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-500">
                    <span>{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-[#34B7F1] font-bold">✓✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback message banner */}
          {feedback && (
            <div
              className={`p-3 rounded-xl flex items-center justify-between gap-2 text-xs font-semibold ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">
                  {feedback.type === 'success' ? 'check_circle' : 'error'}
                </span>
                <span>{feedback.message}</span>
              </div>
              {feedback.waLink && (
                <a
                  href={feedback.waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-[#25D366] text-white rounded-lg text-[11px] font-bold flex items-center gap-1 hover:bg-[#20bd5a]"
                >
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  <span>Abrir Conversa</span>
                </a>
              )}
            </div>
          )}

          {/* Previous Dispatch Attempts History on this OS */}
          {order.whatsappDispatches && order.whatsappDispatches.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">
                Histórico de Envios Anteriores nesta OS ({order.whatsappDispatches.length})
              </span>
              <div className="space-y-1">
                {order.whatsappDispatches.map((disp) => (
                  <div
                    key={disp.id}
                    className="p-2 bg-slate-50 rounded-lg flex items-center justify-between text-[11px] border border-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#25D366] text-[16px]">
                        send
                      </span>
                      <span className="font-bold text-slate-800">{disp.destinationPhone}</span>
                      <span className="text-slate-400">• {disp.method === 'automatico' ? 'API Cloud' : 'WhatsApp Link'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-[10px]">{disp.timestamp}</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                        {disp.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={isSending}
            className="px-6 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isSending ? 'sync' : 'send'}
            </span>
            <span>
              {isSending
                ? 'Disparando...'
                : company.whatsappConfig?.provider === 'meta_cloud_api'
                ? 'Disparar via Meta Cloud API'
                : 'Abrir no WhatsApp'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
