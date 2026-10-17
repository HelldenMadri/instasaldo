// test-suite.js — Automated Validation Suite for InstalaSaldo 2.0 Micro SaaS
import assert from 'node:assert/strict';
import {
  isSuperAdmin,
  SUPER_ADMIN_EMAIL,
  createService,
  updateService,
  fetchServices,
  SUBSCRIPTION_PLANS,
  normalizePlanKey,
  canAccessFeature,
  fetchAdminUsers,
  updateAdminUser,
  toggleUserStatus,
  deleteAdminUser,
  fetchAdminStats,
  recordAuditLog,
  fetchAuditLogs,
  createCustomer,
  fetchCustomers,
  createQuote,
  createWorkOrder,
  completeWorkOrder,
  startWorkOrder,
  addWorkOrderPhoto,
  addWorkOrderSignature,
  migrateCompanyPlan,
} from './src/api.js';

async function runTests() {
  console.log('--- INICIANDO BATERIA DE TESTES AUTOMATIZADOS (INSTALASALDO 2.0) ---');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}:`, err.message);
      failed++;
    }
  }

  // 1. REGRAS DE TIPO E DESCRIÇÃO OBRIGATÓRIA DE SERVIÇOS
  console.log('\n[1] Validação de Serviço (Instalação / Manutenção + Descrição Obrigatória)');
  
  await test('Deve cadastrar serviço do tipo Instalação com descrição válida', async () => {
    const svc = await createService({
      cliente: 'Condomínio Solar',
      service_type: 'Instalação',
      description: 'Instalação de ar-condicionado split de 12.000 BTUs Daikin',
      valor: '1800,00',
      valor_recebido: '600,00',
    });
    assert.equal(svc.service_type, 'Instalação');
    assert.equal(svc.description, 'Instalação de ar-condicionado split de 12.000 BTUs Daikin');
    assert.equal(svc.valor_cents, 180000);
    assert.equal(svc.recebido_cents, 60000);
    assert.equal(svc.status, 'pendente');
  });

  await test('Deve cadastrar serviço do tipo Manutenção com descrição válida', async () => {
    const svc = await createService({
      cliente: 'Restaurante Central',
      service_type: 'Manutenção',
      description: 'Higienização completa da serpentina e troca de filtro',
      valor: '450,00',
      valor_recebido: '450,00',
    });
    assert.equal(svc.service_type, 'Manutenção');
    assert.equal(svc.status, 'concluido');
  });

  await test('Deve bloquear cadastro sem tipo de serviço ou com tipo inválido', async () => {
    await assert.rejects(
      async () => {
        await createService({
          cliente: 'Sem Tipo',
          description: 'Descrição de teste',
          valor: '200,00',
          valor_recebido: '200,00',
        });
      },
      /Selecione o tipo de serviço: Instalação ou Manutenção/
    );

    await assert.rejects(
      async () => {
        await createService({
          cliente: 'Tipo Invalido',
          service_type: 'OutroInvalido',
          description: 'Descrição de teste',
          valor: '200,00',
          valor_recebido: '200,00',
        });
      },
      /Selecione o tipo de serviço: Instalação ou Manutenção/
    );
  });

  await test('Deve bloquear cadastro com descrição vazia ou apenas espaços', async () => {
    await assert.rejects(
      async () => {
        await createService({
          cliente: 'Descricao Vazia',
          service_type: 'Instalação',
          description: '',
          valor: '300,00',
          valor_recebido: '100,00',
        });
      },
      /A descrição do serviço é obrigatória/
    );

    await assert.rejects(
      async () => {
        await createService({
          cliente: 'Descricao Apenas Espacos',
          service_type: 'Manutenção',
          description: '      ',
          valor: '300,00',
          valor_recebido: '100,00',
        });
      },
      /A descrição do serviço é obrigatória/
    );
  });

  await test('Deve atualizar serviço preservando dados e validando descrição não vazia', async () => {
    const svc = await createService({
      cliente: 'Padaria Bela Vista',
      service_type: 'Instalação',
      description: 'Instalação inicial',
      valor: '1000,00',
      valor_recebido: '500,00',
    });

    const updated = await updateService(svc.id, {
      description: 'Instalação concluída com vácuo de 500 micras e suporte inox',
    });
    assert.equal(updated.description, 'Instalação concluída com vácuo de 500 micras e suporte inox');

    await assert.rejects(
      async () => {
        await updateService(svc.id, { description: '   ' });
      },
      /A descrição do serviço é obrigatória/
    );
  });

  // 2. REGRAS DOS PLANOS SAAS RECORRENTES MENSAIS
  console.log('\n[2] Planos Recorrentes Mensais & Acesso a Recursos');

  await test('Configuração de preços dos planos Essencial (R$ 37), Profissional (R$ 97), Empresa (R$ 147)', () => {
    assert.equal(SUBSCRIPTION_PLANS.essencial.price_cents, 3700);
    assert.equal(SUBSCRIPTION_PLANS.essencial.price_formatted, 'R$ 37,00');
    assert.equal(SUBSCRIPTION_PLANS.essencial.billing_cycle, 'mensal');
    assert.equal(SUBSCRIPTION_PLANS.profissional.price_cents, 9700);
    assert.equal(SUBSCRIPTION_PLANS.profissional.price_formatted, 'R$ 97,00');
    assert.equal(SUBSCRIPTION_PLANS.profissional.billing_cycle, 'mensal');
    assert.equal(SUBSCRIPTION_PLANS.empresa.price_cents, 14700);
    assert.equal(SUBSCRIPTION_PLANS.empresa.price_formatted, 'R$ 147,00');
    assert.equal(SUBSCRIPTION_PLANS.empresa.billing_cycle, 'mensal');
  });

  await test('Plano Essencial: Suporte exclusivo por e-mail e SEM suporte via WhatsApp', () => {
    assert.equal(canAccessFeature('email_support', 'cliente@empresa.com', 'essencial'), true);
    assert.equal(canAccessFeature('whatsapp_support', 'cliente@empresa.com', 'essencial'), false);
    assert.equal(canAccessFeature('quotes', 'cliente@empresa.com', 'essencial'), false);
    assert.equal(canAccessFeature('teams', 'cliente@empresa.com', 'essencial'), false);
  });

  await test('Plano Profissional: Suporte por e-mail E WhatsApp, com Orçamentos e OS', () => {
    assert.equal(canAccessFeature('email_support', 'cliente@empresa.com', 'profissional'), true);
    assert.equal(canAccessFeature('whatsapp_support', 'cliente@empresa.com', 'profissional'), true);
    assert.equal(canAccessFeature('quotes', 'cliente@empresa.com', 'profissional'), true);
    assert.equal(canAccessFeature('work_orders', 'cliente@empresa.com', 'profissional'), true);
    assert.equal(canAccessFeature('teams', 'cliente@empresa.com', 'profissional'), false);
  });

  await test('Plano Empresa: Suporte completo e gestão de Equipes & Funcionários', () => {
    assert.equal(canAccessFeature('email_support', 'cliente@empresa.com', 'empresa'), true);
    assert.equal(canAccessFeature('whatsapp_support', 'cliente@empresa.com', 'empresa'), true);
    assert.equal(canAccessFeature('teams', 'cliente@empresa.com', 'empresa'), true);
    assert.equal(canAccessFeature('reports', 'cliente@empresa.com', 'empresa'), true);
  });

  await test('Migração de plano para empresas usuárias', async () => {
    const mig1 = await migrateCompanyPlan('profissional');
    assert.equal(mig1.id, 'profissional');
    assert.equal(mig1.price_cents, 9700);

    const mig2 = await migrateCompanyPlan('empresa');
    assert.equal(mig2.id, 'empresa');
    assert.equal(mig2.price_cents, 14700);

    const mig3 = await migrateCompanyPlan('essencial');
    assert.equal(mig3.id, 'essencial');
    assert.equal(mig3.price_cents, 3700);
  });

  // 3. SUPER ADMIN — SEGURANÇA E ACESSO GLOBAL
  console.log('\n[3] Super Admin — Acesso Global, Proteção e Métricas MRR');

  await test('Identificação estrita do Super Admin agenciavallor01@gmail.com', () => {
    assert.equal(isSuperAdmin('agenciavallor01@gmail.com'), true);
    assert.equal(isSuperAdmin('AGENCIAVALLOR01@GMAIL.COM'), true);
    assert.equal(isSuperAdmin('outrouser@gmail.com'), false);
  });

  await test('Super Admin tem bypass total de restrições em qualquer plano', () => {
    assert.equal(canAccessFeature('teams', 'agenciavallor01@gmail.com', 'essencial'), true);
    assert.equal(canAccessFeature('whatsapp_support', 'agenciavallor01@gmail.com', 'essencial'), true);
    assert.equal(canAccessFeature('quotes', 'agenciavallor01@gmail.com', 'essencial'), true);
    assert.equal(canAccessFeature('reports', 'agenciavallor01@gmail.com', 'essencial'), true);
  });

  await test('Proteção contra suspensão, exclusão ou rebaixamento da conta Super Admin', async () => {
    await assert.rejects(
      async () => {
        await toggleUserStatus('super-admin-root');
      },
      /não pode ser suspensa/
    );

    await assert.rejects(
      async () => {
        await deleteAdminUser('super-admin-root');
      },
      /não pode ser excluída/
    );

    await assert.rejects(
      async () => {
        await updateAdminUser('super-admin-root', { role: 'instalador' });
      },
      /papel do Super Admin não pode ser alterado/
    );
  });

  await test('Super Admin pode visualizar e editar outros usuários', async () => {
    const updated = await updateAdminUser('usr-tech-01', {
      nome: 'Carlos Técnico Líder',
      empresa: 'Climatiza SP',
      plano: 'Empresa',
    });
    assert.equal(updated.nome, 'Carlos Técnico Líder');
    assert.equal(updated.empresa, 'Climatiza SP');
    assert.equal(updated.plano, 'Empresa');
  });

  await test('Dashboard Super Admin calcula MRR consolidado das assinaturas ativas', async () => {
    const stats = await fetchAdminStats();
    assert.ok(stats.totalUsuarios >= 1);
    assert.ok(stats.mrr_cents > 0);
    assert.ok(stats.mrr_formatted.includes('/mês'));
    assert.ok(stats.empresasPorPlano.Essencial !== undefined);
    assert.ok(stats.empresasPorPlano.Profissional !== undefined);
    assert.ok(stats.empresasPorPlano.Empresa !== undefined);
    console.log(`     → MRR Calculado: ${stats.mrr_formatted} | Assinaturas: ${stats.assinaturasAtivas}`);
  });

  console.log(`\n======================================================`);
  console.log(`RESULTADO FINAL: ${passed} PASSOU | ${failed} FALHOU`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
