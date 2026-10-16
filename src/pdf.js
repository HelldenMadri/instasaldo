// src/pdf.js
// Printable voucher and Web Share generation for Quotes and Work Orders

import { formatBRL } from './money.js';

/**
 * Opens a print-ready formatted voucher window for a Quote (Orçamento)
 */
export function openQuoteVoucher(quote, company, customer) {
  const win = window.open('', '_blank');
  if (!win) {
    alert('Por favor, permita popups para visualizar o documento do orçamento.');
    return;
  }

  const itemsHtml = (quote.items || [])
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${item.description}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">${formatBRL(item.unit_price_cents)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${formatBRL(item.total_price_cents)}</td>
    </tr>
  `
    )
    .join('');

  const doc = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Orçamento #${quote.quote_number || '001'} - ${company.name || 'InstalaSaldo'}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; margin: 30px; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1a2744; padding-bottom: 15px; margin-bottom: 20px; }
        .company-name { font-size: 22px; font-weight: 800; color: #1a2744; }
        .doc-title { font-size: 20px; font-weight: 700; color: #3b82f6; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
        th { background: #f8fafc; padding: 10px 8px; text-align: left; border-bottom: 2px solid #cbd5e1; color: #475569; }
        .totals { margin-left: auto; width: 280px; font-size: 14px; }
        .totals-row { display: flex; justify-content: space-between; padding: 6px 0; }
        .totals-final { font-size: 18px; font-weight: 800; color: #1a2744; border-top: 2px solid #1a2744; padding-top: 8px; margin-top: 6px; }
        .footer { margin-top: 40px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; }
        @media print { .no-print { display: none; } }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 20px; text-align: right;">
        <button onclick="window.print()" style="background: #1a2744; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; cursor: pointer;">🖨️ Imprimir / Salvar PDF</button>
      </div>

      <div class="header">
        <div>
          <div class="company-name">${company.name || 'InstalaSaldo'}</div>
          <div style="font-size: 13px; color: #64748b;">${company.trade_name || ''} | Tel: ${company.phone || 'N/I'}</div>
        </div>
        <div style="text-align: right;">
          <div class="doc-title">ORÇAMENTO #${quote.quote_number || '001'}</div>
          <div style="font-size: 13px; color: #64748b;">Data: ${quote.issue_date || new Date().toLocaleDateString('pt-BR')}</div>
        </div>
      </div>

      <div class="info-grid">
        <div>
          <strong>CLIENTE:</strong><br>
          ${customer.name}<br>
          Telefone: ${customer.phone}<br>
          ${customer.address ? `Endereço: ${customer.address}` : ''}
        </div>
        <div>
          <strong>CONDIÇÕES:</strong><br>
          Validade até: ${quote.valid_until || '15 dias'}<br>
          Condições de Pagamento: ${quote.payment_terms || 'À combinar'}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Descrição do Item/Serviço</th>
            <th style="text-align: center;">Qtd</th>
            <th style="text-align: right;">Valor Unitário</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml || '<tr><td colspan="4" style="text-align:center; padding:15px;">Sem itens especificados</td></tr>'}
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-row">
          <span>Subtotal:</span>
          <span>${formatBRL(quote.subtotal_cents || quote.total_cents)}</span>
        </div>
        ${quote.discount_cents ? `<div class="totals-row" style="color: #ef4444;"><span>Desconto:</span><span>- ${formatBRL(quote.discount_cents)}</span></div>` : ''}
        <div class="totals-row totals-final">
          <span>Valor Total:</span>
          <span>${formatBRL(quote.total_cents)}</span>
        </div>
        <div class="totals-row" style="color: #16a34a; font-weight: 600;">
          <span>Entrada (Sinal):</span>
          <span>${formatBRL(quote.entry_cents || 0)}</span>
        </div>
        <div class="totals-row" style="color: #d97706; font-weight: 600;">
          <span>Saldo Restante:</span>
          <span>${formatBRL(quote.balance_cents || 0)}</span>
        </div>
      </div>

      ${quote.notes ? `<div style="margin-top: 25px; padding: 12px; background: #f8fafc; border-left: 3px solid #3b82f6; font-size: 13px;"><strong>Observações:</strong><br>${quote.notes}</div>` : ''}

      <div class="footer">
        Documento gerado por InstalaSaldo — Gestão Inteligente para Especialistas em Instalações.
      </div>
    </body>
    </html>
  `;

  win.document.write(doc);
  win.document.close();
}

/**
 * Generates WhatsApp sharing URL with pre-filled professional message
 */
export function buildWhatsAppLink(phone, message) {
  const cleanPhone = (phone || '').replace(/\D/g, '');
  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/55${cleanPhone}?text=${encodedMsg}`;
}
