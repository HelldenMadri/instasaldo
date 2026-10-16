// src/money.js
// Integer math in centavos (never float) to prevent precision errors.

/**
 * Converts a float, number or string representation to integer cents.
 * Examples:
 *   toCents(10.5) => 1050
 *   toCents("10,50") => 1050
 *   toCents("1.250,50") => 125050
 *   toCents(1050, true) => 1050 (already in cents)
 */
export function toCents(value, isAlreadyCents = false) {
  if (value === null || value === undefined || value === '') return 0;
  if (isAlreadyCents && Number.isInteger(value)) return Math.max(0, value);

  if (typeof value === 'number') {
    if (isAlreadyCents) return Math.max(0, Math.round(value));
    return Math.max(0, Math.round(value * 100));
  }

  if (typeof value === 'string') {
    let clean = value.trim().replace(/^R\$\s?/, '');
    // If has both dot and comma (e.g. 1.250,50), remove dot and replace comma by dot
    if (clean.includes('.') && clean.includes(',')) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else if (clean.includes(',')) {
      clean = clean.replace(',', '.');
    }
    const parsed = parseFloat(clean);
    if (isNaN(parsed) || parsed < 0) return 0;
    return isAlreadyCents ? Math.round(parsed) : Math.round(parsed * 100);
  }

  return 0;
}

/**
 * Formats integer cents into Brazilian Real string (e.g. R$ 1.250,00)
 */
export function formatBRL(cents) {
  const safeCents = Number.isInteger(cents) ? cents : toCents(cents, false);
  const reais = safeCents / 100;
  return reais.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Validates financial transaction inputs
 * @param {number} totalCents 
 * @param {number} receivedCents 
 * @returns {{ valid: boolean, balanceCents: number, error: string | null }}
 */
export function validatePayment(totalCents, receivedCents) {
  const t = Math.max(0, Math.round(totalCents || 0));
  const r = Math.max(0, Math.round(receivedCents || 0));

  if (t < 0 || r < 0) {
    return {
      valid: false,
      balanceCents: 0,
      error: 'Valores monetários não podem ser negativos.',
    };
  }

  if (r > t) {
    return {
      valid: false,
      balanceCents: 0,
      error: 'O valor recebido não pode ser superior ao valor total.',
    };
  }

  const balance = t - r;
  return {
    valid: true,
    balanceCents: balance,
    error: null,
  };
}
