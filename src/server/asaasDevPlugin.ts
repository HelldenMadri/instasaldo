import { Plugin } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const ASAAS_KEY = process.env.API_ASAAS_KEY || process.env.ASAAS_API_KEY || '';
const ASAAS_ENV = process.env.ASAAS_ENV || (ASAAS_KEY.includes('prod') ? 'production' : 'sandbox');
const BASE_URL = ASAAS_ENV === 'production' 
  ? 'https://api.asaas.com/v3' 
  : 'https://sandbox.asaas.com/v3';

// Ledger em memória para pagamentos simulados
const SIMULATED_PAYMENTS = new Map<string, any>();

export function asaasDevPlugin(): Plugin {
  return {
    name: 'asaas-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';

        if (!url.startsWith('/api/asaas')) {
          return next();
        }

        // Helper para ler body JSON
        const readBody = (): Promise<any> => {
          return new Promise((resolve) => {
            let data = '';
            req.on('data', chunk => { data += chunk; });
            req.on('end', () => {
              try {
                resolve(data ? JSON.parse(data) : {});
              } catch (e) {
                resolve({});
              }
            });
          });
        };

        const sendJson = (statusCode: number, payload: any) => {
          res.statusCode = statusCode;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(payload));
        };

        // 1. POST /api/asaas/checkout
        if (url === '/api/asaas/checkout' && req.method === 'POST') {
          const body = await readBody();
          const { companyId, planTier, planName, value, customer } = body;

          const cleanCpfCnpj = (customer?.cpfCnpj || '').replace(/\D/g, '');
          const hasRealKey = Boolean(ASAAS_KEY && ASAAS_KEY.length > 15);

          // Se tiver chave real do Asaas configurada, CPF/CNPJ é obrigatório para gerar o Pix oficial no BACEN
          if (hasRealKey && cleanCpfCnpj.length < 11) {
            return sendJson(400, {
              error: 'O CPF ou CNPJ do titular é obrigatório para registrar a cobrança Pix oficial no Banco Central (Asaas).',
            });
          }

          // Se não tiver chave real configurada, entra em modo simulação de desenvolvimento
          if (!hasRealKey) {
            const paymentId = `pay_sim_${Date.now()}`;
            const pixPayload = `00020126580014br.gov.bcb.pix0136instalasaldo-${planTier}-${paymentId}520400005303986540${value?.toFixed(2).length || 5}${value?.toFixed(2) || '97.00'}5802BR5916AGENCIA VALLOR6009FORTALEZA62070503***6304${Math.random().toString(16).substring(2, 6).toUpperCase()}`;
            const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixPayload)}`;
            const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            SIMULATED_PAYMENTS.set(paymentId, {
              paymentId,
              companyId,
              planTier,
              value,
              status: 'PENDING',
              createdAt: new Date().toISOString(),
              pixPayload,
            });

            return sendJson(200, {
              success: true,
              paymentId,
              subscriptionId: `sub_sim_${planTier}`,
              value,
              pixQrCode: {
                encodedImage: qrImageUrl,
                payload: pixPayload,
                expirationDate: dueDate,
              },
              isSimulated: true,
              environment: 'simulation',
              notice: cleanCpfCnpj.length < 11 
                ? 'Para gerar um QR Code Pix real aceito no aplicativo do seu banco, informe o CPF ou CNPJ.' 
                : undefined,
            });
          }

          // Se temos chave real e CPF/CNPJ válido, chama a API Oficial Asaas de Produção!
          try {
            // A. Buscar cliente por CPF/CNPJ ou e-mail
            let asaasCustomerId = '';
            const searchRes = await fetch(`${BASE_URL}/customers?cpfCnpj=${cleanCpfCnpj}`, {
              headers: { 'access_token': ASAAS_KEY },
            });
            const searchData = await searchRes.json();
            if (searchData.data && searchData.data.length > 0) {
              asaasCustomerId = searchData.data[0].id;
            } else {
              // Criar cliente
              const createRes = await fetch(`${BASE_URL}/customers`, {
                method: 'POST',
                headers: { 'access_token': ASAAS_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: customer?.name || 'Cliente InstalaSaldo',
                  email: customer?.email || 'financeiro@instalasaldo.com.br',
                  cpfCnpj: cleanCpfCnpj,
                  mobilePhone: (customer?.phone || '').replace(/\D/g, '') || undefined,
                }),
              });
              const createData = await createRes.json();
              if (createData.errors) {
                return sendJson(400, { error: createData.errors[0]?.description || 'Erro ao cadastrar cliente no Asaas.' });
              }
              asaasCustomerId = createData.id;
            }

            // B. Criar Cobrança Direta Pix (para liberação imediata)
            const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const payRes = await fetch(`${BASE_URL}/payments`, {
              method: 'POST',
              headers: { 'access_token': ASAAS_KEY, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                customer: asaasCustomerId,
                billingType: 'PIX',
                value: value,
                dueDate: dueDate,
                description: `Assinatura InstalaSaldo 2.0 — Plano ${planName}`,
                externalReference: JSON.stringify({ companyId, planTier }),
              }),
            });
            const payData = await payRes.json();
            if (payData.errors) {
              return sendJson(400, { error: payData.errors[0]?.description || 'Erro ao gerar cobrança no Asaas.' });
            }

            const paymentId = payData.id;

            // C. Obter QR Code e Pix Copia e Cola Oficial do Banco Central
            const qrRes = await fetch(`${BASE_URL}/payments/${paymentId}/pixQrCode`, {
              headers: { 'access_token': ASAAS_KEY },
            });
            const qrData = await qrRes.json();

            return sendJson(200, {
              success: true,
              paymentId,
              value,
              pixQrCode: {
                encodedImage: qrData.encodedImage 
                  ? `data:image/png;base64,${qrData.encodedImage}` 
                  : `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData.payload)}`,
                payload: qrData.payload,
                expirationDate: qrData.expirationDate || dueDate,
              },
              isSimulated: false,
              environment: ASAAS_ENV,
              invoiceUrl: payData.invoiceUrl,
            });
          } catch (err: any) {
            console.error('[Asaas Dev Error]', err);
            return sendJson(500, { error: err.message || 'Erro de comunicação com o Asaas.' });
          }
        }

        // 2. GET /api/asaas/payment-status/:paymentId
        if (url.startsWith('/api/asaas/payment-status/') && req.method === 'GET') {
          const paymentId = url.replace('/api/asaas/payment-status/', '').split('?')[0];

          // Verifica se é simulação
          const sim = SIMULATED_PAYMENTS.get(paymentId);
          if (sim) {
            const isPaid = sim.status === 'CONFIRMED' || sim.status === 'RECEIVED';
            return sendJson(200, {
              paymentId,
              status: sim.status,
              isPaid,
              confirmedAt: isPaid ? new Date().toISOString() : undefined,
            });
          }

          // Se é cobrança real do Asaas
          if (ASAAS_KEY) {
            try {
              const resAsaas = await fetch(`${BASE_URL}/payments/${paymentId}`, {
                headers: { 'access_token': ASAAS_KEY },
              });
              if (resAsaas.ok) {
                const p = await resAsaas.json();
                const isPaid = p.status === 'RECEIVED' || p.status === 'CONFIRMED';
                return sendJson(200, {
                  paymentId,
                  status: p.status,
                  isPaid,
                  confirmedAt: p.paymentDate || p.confirmedDate,
                });
              }
            } catch (e) {}
          }

          return sendJson(200, { paymentId, status: 'PENDING', isPaid: false });
        }

        // 3. POST /api/asaas/simulate-payment
        if (url === '/api/asaas/simulate-payment' && req.method === 'POST') {
          const body = await readBody();
          const { paymentId, userEmail } = body;

          // Em produção ou com chave Asaas real ativada, bloqueia simulação para usuários comuns
          if (hasRealKey && ASAAS_ENV === 'production' && userEmail !== 'agenciavallor01@gmail.com') {
            return sendJson(403, {
              error: 'A simulação de pagamentos está desativada em ambiente de produção. Conclua o pagamento escaneando o Pix oficial do Banco Central pelo app do seu banco.',
            });
          }

          if (paymentId) {
            const sim = SIMULATED_PAYMENTS.get(paymentId);
            if (sim) {
              sim.status = 'CONFIRMED';
            }
          }
          return sendJson(200, {
            success: true,
            message: 'Pagamento Pix simulado confirmado instantaneamente!',
          });
        }

        next();
      });
    },
  };
}
