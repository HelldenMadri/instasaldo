import React from 'react';
import { WorkOrder, Company } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Logo } from './Logo';

interface ReceiptPrintModalProps {
  order: WorkOrder;
  company: Company;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptPrintModal: React.FC<ReceiptPrintModalProps> = ({
  order,
  company,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full my-8 overflow-hidden shadow-2xl border border-slate-200">
        {/* Modal Top Actions (no-print) */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-400">receipt_long</span>
            <span className="font-headline font-bold text-sm">
              Comprovante & Recibo Oficial InstalaSaldo
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#006c49] hover:bg-[#005236] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              Imprimir / Salvar PDF
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 bg-white text-slate-800 print:p-0 font-body text-sm" id="printable-receipt">
          {/* Document Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex flex-col">
              <Logo size="md" />
              <span className="text-[11px] text-slate-500 mt-1 font-mono">
                Sistema de Gestão & Liquidação de Saldo
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-500 block">
                Comprovante de Execução
              </span>
              <span className="font-headline text-lg font-bold text-[#04122e]">
                {order.code}
              </span>
              <span className="text-xs text-slate-500 block mt-0.5">
                Emissão: {formatDate(new Date().toISOString())}
              </span>
            </div>
          </div>

          {/* Company & Client Two-column Box */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Prestador de Serviços
              </span>
              <p className="font-bold text-slate-900 text-sm leading-tight">{company.name}</p>
              <p className="text-xs text-slate-600 mt-0.5">CNPJ/CPF: {company.document}</p>
              <p className="text-xs text-slate-600">Telefone: {company.phone}</p>
              <p className="text-xs text-slate-600">{company.city} - {company.state}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Cliente / Tomador
              </span>
              <p className="font-bold text-slate-900 text-sm leading-tight">{order.clientName}</p>
              <p className="text-xs text-slate-600 mt-0.5">Telefone: {order.clientPhone}</p>
              <p className="text-xs text-slate-600">Endereço: {order.clientAddress}</p>
            </div>
          </div>

          {/* Service Details */}
          <div className="mb-6">
            <h4 className="font-headline font-bold text-slate-900 text-sm border-b border-slate-200 pb-2 mb-3">
              Discriminação do Serviço Realizado
            </h4>
            <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-100 mb-3">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  order.serviceType === 'instalacao'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {order.serviceType === 'instalacao' ? 'Instalação' : 'Manutenção'}
                </span>
                <span className="text-xs text-slate-500">
                  Data de Execução: {formatDate(order.scheduledDate)}
                </span>
              </div>
              <p className="text-slate-800 font-medium text-sm">{order.description}</p>
              {order.notes && (
                <p className="text-xs text-slate-500 mt-2 italic bg-white p-2 rounded border border-slate-200">
                  Obs: {order.notes}
                </p>
              )}
            </div>
          </div>

          {/* Financial Breakdown (Destaque Sinal & Saldo) */}
          <div className="mb-6">
            <h4 className="font-headline font-bold text-slate-900 text-sm border-b border-slate-200 pb-2 mb-3">
              Demonstrativo Financeiro & Quitação
            </h4>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="p-2.5">Descrição Financeira</th>
                  <th className="p-2.5 text-center">Status</th>
                  <th className="p-2.5 text-right">Valor (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2.5 font-medium text-slate-800">Valor Total do Serviço Contratado</td>
                  <td className="p-2.5 text-center">
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      Contratado
                    </span>
                  </td>
                  <td className="p-2.5 text-right font-bold text-slate-900">
                    {formatCurrency(order.totalValue)}
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-600">Sinal Recebido (Entrada / Reserva)</td>
                  <td className="p-2.5 text-center">
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                      Recebido no Ato
                    </span>
                  </td>
                  <td className="p-2.5 text-right font-semibold text-emerald-700">
                    - {formatCurrency(order.depositValue)}
                  </td>
                </tr>
                <tr className="bg-slate-50 font-bold">
                  <td className="p-3 text-slate-900">
                    {order.pendingBalance <= 0 || order.clientSignature
                      ? 'Saldo Restante Liquidado na Conclusão'
                      : 'Saldo Pendente a Receber'}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                        order.pendingBalance <= 0 || order.clientSignature
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.pendingBalance <= 0 || order.clientSignature ? 'Quitado 100%' : 'Pendente'}
                    </span>
                  </td>
                  <td
                    className={`p-3 text-right text-base font-headline ${
                      order.pendingBalance <= 0 || order.clientSignature
                        ? 'text-emerald-700'
                        : 'text-amber-600'
                    }`}
                  >
                    {formatCurrency(order.pendingBalance)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signatures Row */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 mt-8">
            <div className="flex flex-col items-center text-center">
              <div className="h-20 flex items-center justify-center">
                <span className="text-slate-400 font-cursive text-lg">
                  {order.assignedTechnicianName}
                </span>
              </div>
              <div className="w-full border-t border-slate-300 pt-1">
                <span className="font-bold text-xs text-slate-800 block">
                  {order.assignedTechnicianName}
                </span>
                <span className="text-[10px] text-slate-500">Técnico Responsável</span>
              </div>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="h-20 flex items-center justify-center">
                {order.clientSignature ? (
                  <img
                    src={order.clientSignature}
                    alt="Assinatura do Cliente"
                    className="max-h-18 max-w-full object-contain"
                  />
                ) : (
                  <span className="text-[11px] text-slate-400 italic">
                    Assinatura digital pendente
                  </span>
                )}
              </div>
              <div className="w-full border-t border-slate-300 pt-1">
                <span className="font-bold text-xs text-slate-800 block">
                  {order.clientName}
                </span>
                <span className="text-[10px] text-slate-500">
                  {order.clientSignatureDate ? `Assinado em ${order.clientSignatureDate}` : 'Cliente / Aceite dos Serviços'}
                </span>
              </div>
            </div>
          </div>

          {/* Legal / Security Footer */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span>InstalaSaldo Plataforma de Micro SaaS • Documento com validade legal brasileira</span>
            <span>Chave de Autenticação: {order.id.toUpperCase()}-BRL-VERIFIED</span>
          </div>
        </div>
      </div>
    </div>
  );
};
