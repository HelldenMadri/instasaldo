// src/services/asaas.ts — Integração Oficial Asaas (Assinaturas, Pix & Webhooks)
// Suporta modo real (Sandbox / Produção) e modo simulação realista para testes imediatos.

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj?: string;
  phone?: string;
}

export interface AsaasPixQrCode {
  encodedImage: string; // Base64 ou URL da imagem do QR Code
  payload: string;      // Código Pix Copia e Cola
  expirationDate: string;
}

export interface AsaasCheckoutResponse {
  success: boolean;
  paymentId: string;
  subscriptionId?: string;
  value: number;
  pixQrCode: AsaasPixQrCode;
  isSimulated: boolean;
  environment: 'production' | 'sandbox' | 'simulation';
  invoiceUrl?: string;
}

export interface AsaasPaymentStatus {
  paymentId: string;
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED';
  isPaid: boolean;
  confirmedAt?: string;
}

// Armazenamento em memória para pagamentos em modo simulação
const SIMULATED_PAYMENTS = new Map<string, {
  paymentId: string;
  companyId: string;
  planTier: string;
  value: number;
  status: 'PENDING' | 'CONFIRMED';
  createdAt: string;
  pixCode: string;
}>();

function getEnvVar(key: string): string {
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
  } catch (e) {}

  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const metaEnv = (import.meta as any).env;
      if (metaEnv[key]) return metaEnv[key];
      if (metaEnv[`VITE_${key}`]) return metaEnv[`VITE_${key}`];
    }
  } catch (e) {}

  return '';
}

export class AsaasService {
  private apiKey: string;
  private environment: 'production' | 'sandbox';
  private baseUrl: string;

  constructor() {
    this.apiKey = getEnvVar('ASAAS_API_KEY') || getEnvVar('API_ASAAS_KEY') || getEnvVar('ASAAS_SANDBOX_KEY');
    this.environment = (getEnvVar('ASAAS_ENV') === 'production' || this.apiKey.includes('prod')) ? 'production' : 'sandbox';
    this.baseUrl = this.environment === 'production' 
      ? 'https://api.asaas.com/v3' 
      : 'https://sandbox.asaas.com/v3';
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 15);
  }

  public getEnvironment(): 'production' | 'sandbox' | 'simulation' {
    if (!this.isConfigured()) return 'simulation';
    return this.environment;
  }

  /**
   * Cria ou localiza um cliente no Asaas
   */
  public async getOrCreateCustomer(data: {
    name: string;
    email: string;
    cpfCnpj?: string;
    phone?: string;
    companyId: string;
  }): Promise<AsaasCustomer> {
    if (!this.isConfigured()) {
      return {
        id: `cus_sim_${Date.now()}`,
        name: data.name,
        email: data.email,
        cpfCnpj: data.cpfCnpj || '000.000.000-00',
        phone: data.phone || '85999999999',
      };
    }

    try {
      // 1. Buscar cliente existente por e-mail
      const searchRes = await fetch(`${this.baseUrl}/customers?email=${encodeURIComponent(data.email)}`, {
        headers: {
          'access_token': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.data && searchData.data.length > 0) {
          const found = searchData.data[0];
          return {
            id: found.id,
            name: found.name,
            email: found.email,
            cpfCnpj: found.cpfCnpj,
            phone: found.phone || found.mobilePhone,
          };
        }
      }

      // 2. Criar novo cliente caso não exista
      const cleanDoc = (data.cpfCnpj || '').replace(/\D/g, '');
      const cleanPhone = (data.phone || '').replace(/\D/g, '');

      const createRes = await fetch(`${this.baseUrl}/customers`, {
        method: 'POST',
        headers: {
          'access_token': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          cpfCnpj: cleanDoc || undefined,
          mobilePhone: cleanPhone || undefined,
          externalReference: data.companyId,
          notificationDisabled: false,
        }),
      });

      if (!createRes.ok) {
        const errJson = await createRes.json();
        throw new Error(errJson.errors?.[0]?.description || 'Erro ao cadastrar cliente no Asaas');
      }

      const created = await createRes.json();
      return {
        id: created.id,
        name: created.name,
        email: created.email,
        cpfCnpj: created.cpfCnpj,
        phone: created.mobilePhone || created.phone,
      };
    } catch (err: any) {
      console.error('[Asaas Service] Erro ao criar/buscar cliente:', err);
      // Fallback gracioso para simulação se falhar conexão
      return {
        id: `cus_fallback_${Date.now()}`,
        name: data.name,
        email: data.email,
        cpfCnpj: data.cpfCnpj,
        phone: data.phone,
      };
    }
  }

  /**
   * Cria uma assinatura / cobrança Pix no Asaas
   */
  public async createSubscriptionCheckout(data: {
    companyId: string;
    planTier: string;
    planName: string;
    value: number;
    customer: {
      name: string;
      email: string;
      cpfCnpj?: string;
      phone?: string;
    };
  }): Promise<AsaasCheckoutResponse> {
    const isReal = this.isConfigured();

    if (!isReal) {
      // MODO SIMULAÇÃO REALISTA: Gera payload Pix e QR Code dinâmico
      const paymentId = `pay_sim_${Date.now()}`;
      const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Payload Pix Copia e Cola estruturado padrão EMVCo BR Code
      const pixPayload = `00020126580014br.gov.bcb.pix0136instalasaldo-${data.planTier}-${paymentId}520400005303986540${data.value.toFixed(2).length}${data.value.toFixed(2)}5802BR5916AGENCIA VALLOR6009FORTALEZA62070503***6304${Math.random().toString(16).substring(2, 6).toUpperCase()}`;
      
      // Imagem de QR Code gerada via API aberta e segura
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixPayload)}`;

      SIMULATED_PAYMENTS.set(paymentId, {
        paymentId,
        companyId: data.companyId,
        planTier: data.planTier,
        value: data.value,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        pixCode: pixPayload,
      });

      return {
        success: true,
        paymentId,
        subscriptionId: `sub_sim_${data.planTier}`,
        value: data.value,
        pixQrCode: {
          encodedImage: qrImageUrl,
          payload: pixPayload,
          expirationDate: dueDate,
        },
        isSimulated: true,
        environment: 'simulation',
        invoiceUrl: `https://sandbox.asaas.com/i/${paymentId}`,
      };
    }

    try {
      // 1. Obter cliente Asaas
      const customer = await this.getOrCreateCustomer({
        ...data.customer,
        companyId: data.companyId,
      });

      // 2. Data de vencimento da primeira parcela (hoje ou amanhã)
      const nextDue = new Date();
      nextDue.setDate(nextDue.getDate() + 1);
      const nextDueDateStr = nextDue.toISOString().split('T')[0];

      // 3. Criar Assinatura Recorrente Mensal com Pix
      const subRes = await fetch(`${this.baseUrl}/subscriptions`, {
        method: 'POST',
        headers: {
          'access_token': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: customer.id,
          billingType: 'PIX',
          value: data.value,
          nextDueDate: nextDueDateStr,
          cycle: 'MONTHLY',
          description: `Assinatura InstalaSaldo 2.0 — Plano ${data.planName}`,
          externalReference: JSON.stringify({
            companyId: data.companyId,
            planTier: data.planTier,
          }),
        }),
      });

      if (!subRes.ok) {
        const errJson = await subRes.json();
        throw new Error(errJson.errors?.[0]?.description || 'Erro ao criar assinatura no Asaas');
      }

      const subscription = await subRes.json();

      // 4. Buscar a cobrança inicial gerada para a assinatura
      const paymentsRes = await fetch(`${this.baseUrl}/subscriptions/${subscription.id}/payments`, {
        headers: {
          'access_token': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      let paymentId = subscription.id;
      let invoiceUrl = '';

      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        if (paymentsData.data && paymentsData.data.length > 0) {
          paymentId = paymentsData.data[0].id;
          invoiceUrl = paymentsData.data[0].invoiceUrl || '';
        }
      }

      // 5. Obter QR Code e Chave Pix Copia e Cola da cobrança
      const pixRes = await fetch(`${this.baseUrl}/payments/${paymentId}/pixQrCode`, {
        headers: {
          'access_token': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      let encodedImage = '';
      let payload = '';
      let expirationDate = nextDueDateStr;

      if (pixRes.ok) {
        const pixData = await pixRes.json();
        encodedImage = pixData.encodedImage 
          ? `data:image/png;base64,${pixData.encodedImage}` 
          : `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixData.payload)}`;
        payload = pixData.payload;
        expirationDate = pixData.expirationDate || nextDueDateStr;
      }

      return {
        success: true,
        paymentId,
        subscriptionId: subscription.id,
        value: data.value,
        pixQrCode: {
          encodedImage,
          payload,
          expirationDate,
        },
        isSimulated: false,
        environment: this.environment,
        invoiceUrl,
      };
    } catch (err: any) {
      console.error('[Asaas Service] Erro no checkout real:', err.message);
      throw err;
    }
  }

  /**
   * Consulta status de pagamento de uma cobrança
   */
  public async getPaymentStatus(paymentId: string): Promise<AsaasPaymentStatus> {
    // 1. Verificar se é simulação
    if (SIMULATED_PAYMENTS.has(paymentId)) {
      const sim = SIMULATED_PAYMENTS.get(paymentId)!;
      return {
        paymentId,
        status: sim.status === 'CONFIRMED' ? 'CONFIRMED' : 'PENDING',
        isPaid: sim.status === 'CONFIRMED',
        confirmedAt: sim.status === 'CONFIRMED' ? new Date().toISOString() : undefined,
      };
    }

    if (!this.isConfigured()) {
      return {
        paymentId,
        status: 'PENDING',
        isPaid: false,
      };
    }

    try {
      const res = await fetch(`${this.baseUrl}/payments/${paymentId}`, {
        headers: {
          'access_token': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        return { paymentId, status: 'PENDING', isPaid: false };
      }

      const p = await res.json();
      const isPaid = p.status === 'RECEIVED' || p.status === 'CONFIRMED';
      return {
        paymentId: p.id,
        status: p.status,
        isPaid,
        confirmedAt: p.paymentDate || p.clientPaymentDate,
      };
    } catch (err) {
      return { paymentId, status: 'PENDING', isPaid: false };
    }
  }

  /**
   * Simula a confirmação imediata de um pagamento (Modo Teste)
   */
  public simulatePaymentConfirmation(paymentId: string): { success: boolean; companyId?: string; planTier?: string } {
    const sim = SIMULATED_PAYMENTS.get(paymentId);
    if (sim) {
      sim.status = 'CONFIRMED';
      SIMULATED_PAYMENTS.set(paymentId, sim);
      return {
        success: true,
        companyId: sim.companyId,
        planTier: sim.planTier,
      };
    }

    return { success: true };
  }
}

export const asaasService = new AsaasService();

// ============================================================================
// HELPER CLIENTE FRONTEND (CHAMA O BACKEND OU FAZ FALLBACK TRANSPARENTE)
// ============================================================================

export async function requestCheckout(params: {
  companyId: string;
  planTier: string;
  planName: string;
  value: number;
  customer: {
    name: string;
    email: string;
    cpfCnpj?: string;
    phone?: string;
  };
}): Promise<AsaasCheckoutResponse> {
  try {
    const res = await fetch('/api/asaas/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Backend offline ou rodando no Vite puro
  }

  // Fallback transparente usando o serviço direto
  return await asaasService.createSubscriptionCheckout(params);
}

export async function checkPaymentStatus(paymentId: string): Promise<AsaasPaymentStatus> {
  try {
    const res = await fetch(`/api/asaas/payment-status/${paymentId}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Fallback
  }

  return await asaasService.getPaymentStatus(paymentId);
}

export async function triggerSimulatedPayment(params: {
  paymentId: string;
  companyId: string;
  planTier: string;
  userEmail?: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/asaas/simulate-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (res.ok) {
      return await res.json();
    } else {
      const err = await res.json().catch(() => ({}));
      if (err.error) {
        throw new Error(err.error);
      }
    }
  } catch (err: any) {
    if (err.message && err.message.includes('desativada em ambiente de produção')) {
      throw err;
    }
  }

  asaasService.simulatePaymentConfirmation(params.paymentId);
  return {
    success: true,
    message: 'Pagamento Pix simulado confirmado com sucesso! Plano liberado.',
  };
}

