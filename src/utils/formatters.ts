/**
 * Format number to Brazilian Real (BRL) currency string
 * e.g., 2800 -> "R$ 2.800,00"
 */
export function formatCurrency(value: number): string {
  if (isNaN(value)) value = 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format currency without the "R$" prefix
 * e.g., 2800 -> "2.800,00"
 */
export function formatCurrencyValue(value: number): string {
  if (isNaN(value)) value = 0;
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Parse Brazilian currency string to number
 * e.g., "2.800,00" or "R$ 2.800,00" -> 2800.00
 */
export function parseCurrencyInput(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[^\d]/g, '');
  if (!cleaned) return 0;
  return parseFloat(cleaned) / 100;
}

/**
 * Format date to Brazilian standard DD/MM/YYYY
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  const parts = dateString.split('T')[0].split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('pt-BR');
}

/**
 * Format Brazilian phone / WhatsApp
 * e.g., "11987654321" -> "(11) 98765-4321"
 */
export function formatPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

/**
 * Format CPF or CNPJ
 */
export function formatDocument(doc: string): string {
  if (!doc) return '';
  const digits = doc.replace(/\D/g, '');
  if (digits.length === 11) {
    // CPF
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  if (digits.length === 14) {
    // CNPJ
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }
  return doc;
}
