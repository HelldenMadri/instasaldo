import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { WorkOrder, OrderStatus } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { SignaturePadModal } from './SignaturePadModal';
import { ReceiptPrintModal } from './ReceiptPrintModal';
import { WhatsAppDispatchModal } from './WhatsAppDispatchModal';

export const OrdersView: React.FC = () => {
  const { workOrders, updateWorkOrder, signWorkOrder, currentCompany } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modals state
  const [signingOrder, setSigningOrder] = useState<WorkOrder | null>(null);
  const [printingOrder, setPrintingOrder] = useState<WorkOrder | null>(null);
  const [photoOrder, setPhotoOrder] = useState<WorkOrder | null>(null);
  const [whatsAppOrder, setWhatsAppOrder] = useState<WorkOrder | null>(null);

  // Photo upload simulation
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoType, setPhotoType] = useState<'antes' | 'depois'>('antes');

  const filteredOrders = workOrders.filter((o) => {
    const matchesSearch =
      o.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddPhoto = () => {
    if (!photoOrder) return;
    const sampleUrls = {
      antes: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      depois: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
    };

    const newPhoto = {
      id: `p-${Date.now()}`,
      url: sampleUrls[photoType],
      caption: photoCaption || (photoType === 'antes' ? 'Condição antes do atendimento' : 'Serviço finalizado e testado'),
      type: photoType,
      timestamp: new Date().toLocaleString('pt-BR'),
    };

    updateWorkOrder(photoOrder.id, {
      photos: [...photoOrder.photos, newPhoto],
    });

    setPhotoCaption('');
    setPhotoOrder(null);
  };

  return (
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-bold text-[#04122e]">
            Ordens de Serviço (OS)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Acompanhamento operacional em campo, registro de fotos antes/depois, assinatura digital do cliente e emissão de recibos.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código (OS-...), cliente ou descrição..."
            className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#1a2744]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 bg-white border border-slate-200 text-xs text-slate-700 font-semibold rounded-lg outline-none cursor-pointer"
        >
          <option value="all">Todos os Status</option>
          <option value="agendado">Agendado</option>
          <option value="em_execucao">Em Execução</option>
          <option value="concluido">Concluído</option>
        </select>
      </div>

      {/* Work Orders Grid or Empty State */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[32px]">assignment</span>
          </div>
          <h3 className="font-headline font-bold text-base text-slate-800">
            {searchTerm || statusFilter !== 'all' ? 'Nenhuma Ordem de Serviço encontrada' : 'Nenhuma Ordem de Serviço ativa'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchTerm || statusFilter !== 'all'
              ? 'Nenhuma OS corresponde aos filtros selecionados. Tente redefinir a busca ou o status.'
              : 'As Ordens de Serviço (OS) são geradas automaticamente ao aprovar um Orçamento na aba Orçamentos.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredOrders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div className="space-y-4">
              {/* Card Top */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-headline font-bold text-base text-[#04122e]">
                      {order.code}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        order.serviceType === 'instalacao'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.serviceType === 'instalacao' ? 'Instalação' : 'Manutenção'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium block mt-0.5">
                    Data: {formatDate(order.scheduledDate)}
                  </span>
                </div>

                <select
                  value={order.status}
                  onChange={(e) => updateWorkOrder(order.id, { status: e.target.value as OrderStatus })}
                  className={`text-xs font-bold px-2.5 py-1 rounded-full outline-none border cursor-pointer ${
                    order.status === 'concluido'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : order.status === 'em_execucao'
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <option value="agendado">Agendado</option>
                  <option value="em_execucao">Em Execução</option>
                  <option value="concluido">Concluído</option>
                </select>
              </div>

              {/* Client & Description */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{order.clientName}</span>
                  <span className="text-slate-500">{order.clientPhone}</span>
                </div>
                <p className="text-slate-700 font-medium">{order.description}</p>
                <p className="text-slate-400 text-[11px] truncate">{order.clientAddress}</p>
              </div>

              {/* Financial Box */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50/60 p-3 rounded-xl border border-slate-200 text-xs text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block">Total do Serviço</span>
                  <span className="font-headline font-bold text-slate-900">
                    {formatCurrency(order.totalValue)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Sinal Recebido</span>
                  <span className="font-bold text-emerald-700">
                    {formatCurrency(order.depositValue)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Saldo Restante</span>
                  <span
                    className={`font-headline font-bold ${
                      order.pendingBalance > 0 ? 'text-amber-600' : 'text-slate-400'
                    }`}
                  >
                    {formatCurrency(order.pendingBalance)}
                  </span>
                </div>
              </div>

              {/* Photos Gallery Strip */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700">
                    Fotos do Serviço ({order.photos.length})
                  </span>
                  <button
                    onClick={() => setPhotoOrder(order)}
                    className="text-[11px] text-[#04122e] hover:underline font-bold flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">add_a_photo</span>
                    Adicionar Foto
                  </button>
                </div>

                {order.photos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {order.photos.map((p) => (
                      <div key={p.id} className="relative rounded-lg overflow-hidden border border-slate-200 group">
                        <img
                          src={p.url}
                          alt={p.caption}
                          className="w-full h-24 object-cover"
                        />
                        <div className="absolute top-1 left-1">
                          <span
                            className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                              p.type === 'antes' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                            }`}
                          >
                            {p.type}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-600 bg-white/95 p-1 truncate">
                          {p.caption}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-400">
                    Nenhuma foto de campo anexada ainda.
                  </div>
                )}
              </div>

              {/* Signature Status */}
              <div className="pt-1">
                {order.clientSignature ? (
                  <div className="flex items-center gap-2 text-xs bg-emerald-50 text-emerald-800 p-2.5 rounded-lg border border-emerald-200">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span>Assinado digitalmente pelo cliente em {order.clientSignatureDate}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs bg-amber-50 text-amber-800 p-2.5 rounded-lg border border-amber-200">
                    <span className="material-symbols-outlined text-[18px]">pending</span>
                    <span>Assinatura digital do cliente pendente</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Action Buttons */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPrintingOrder(order)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                  <span>Comprovante</span>
                </button>

                <button
                  onClick={() => setWhatsAppOrder(order)}
                  className="px-3 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
                  title="Enviar detalhes da OS via WhatsApp com cálculo de sinal e saldo"
                >
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                  <span>WhatsApp OS</span>
                </button>
              </div>

              {!order.clientSignature ? (
                <button
                  onClick={() => setSigningOrder(order)}
                  className="px-3.5 py-2 bg-[#04122e] hover:bg-[#1a2744] text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">draw</span>
                  <span>Assinatura</span>
                </button>
              ) : (
                <button
                  onClick={() => setSigningOrder(order)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
                  <span>Assinada</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    )}

      {/* Signature Pad Modal */}
      {signingOrder && (
        <SignaturePadModal
          order={signingOrder}
          isOpen={!!signingOrder}
          onClose={() => setSigningOrder(null)}
          onSaveSignature={(signatureDataUrl) => {
            signWorkOrder(signingOrder.id, signatureDataUrl);
          }}
        />
      )}

      {/* Receipt Print Modal */}
      {printingOrder && (
        <ReceiptPrintModal
          order={printingOrder}
          company={currentCompany}
          isOpen={!!printingOrder}
          onClose={() => setPrintingOrder(null)}
        />
      )}

      {/* WhatsApp OS Dispatch Modal */}
      {whatsAppOrder && (
        <WhatsAppDispatchModal
          order={whatsAppOrder}
          company={currentCompany}
          isOpen={!!whatsAppOrder}
          onClose={() => setWhatsAppOrder(null)}
        />
      )}

      {/* Photo Upload Modal */}
      {photoOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-bold text-sm text-[#04122e]">
                Anexar Foto de Campo
              </h3>
              <button
                onClick={() => setPhotoOrder(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tipo da Foto
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPhotoType('antes')}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                    photoType === 'antes'
                      ? 'bg-amber-100 border-amber-300 text-amber-900'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  Antes
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoType('depois')}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                    photoType === 'depois'
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  Depois
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Legenda da Foto
              </label>
              <input
                type="text"
                value={photoCaption}
                onChange={(e) => setPhotoCaption(e.target.value)}
                placeholder="Ex: Condensadora instalada com tubulação protegida"
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPhotoOrder(null)}
                className="px-3 py-2 text-xs text-slate-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddPhoto}
                className="px-4 py-2 bg-[#04122e] text-white text-xs font-bold rounded-lg"
              >
                Confirmar Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
