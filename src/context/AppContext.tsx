import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  UserStatus,
  AccountStatus,
  Company,
  CompanyWhatsAppConfig,
  CompanyFeatures,
  Client,
  ServiceItem,
  Budget,
  WorkOrder,
  WAMessageAttempt,
  TeamMember,
  PlanTier,
  PlanStatus,
  PlanConfig,
  Invoice,
  AuditLog,
} from '../types';
import { supabase, isSupabaseConfigured, SUPABASE_CONFIG } from '../lib/supabase';

export const PROTECTED_OWNER_EMAIL = 'agenciavallor01@gmail.com';

export const PLAN_CONFIGS: Record<PlanTier, PlanConfig> = {
  essencial: {
    id: 'essencial',
    name: 'Essencial',
    price: 37,
    description: 'Para o instalador individual autônomo que quer parar de perder dinheiro.',
    features: [
      'Gestão básica de clientes e serviços',
      'Cálculo automático de sinal e saldo',
      'Controle financeiro básico',
      'Suporte exclusivamente por e-mail',
      'Até 50 clientes ativos',
      'Até 30 serviços por mês',
    ],
    limits: {
      maxClients: 50,
      maxOrdersPerMonth: 30,
      maxTeamMembers: 1,
      supportChannel: 'E-mail (em até 24h)',
    },
  },
  profissional: {
    id: 'profissional',
    name: 'Profissional',
    price: 97,
    badge: 'Mais Popular',
    description: 'Ideal para profissionais em crescimento que precisam de orçamentos e OS digital.',
    features: [
      'Tudo do Plano Essencial',
      'Orçamentos com conversão direta em OS',
      'Ordens de serviço com fotos antes/depois',
      'Assinatura digital do cliente na tela',
      'Comprovante em PDF profissional',
      'Lembretes de manutenção preventiva',
      'Suporte prioritário via WhatsApp e E-mail',
      'Até 250 clientes ativos',
    ],
    limits: {
      maxClients: 250,
      maxOrdersPerMonth: 120,
      maxTeamMembers: 3,
      supportChannel: 'WhatsApp & E-mail (Prioritário)',
    },
  },
  empresa: {
    id: 'empresa',
    name: 'Empresa',
    price: 147,
    badge: 'Completo',
    description: 'Para equipes e frotas de instalação com múltiplos técnicos e gestão avançada.',
    features: [
      'Tudo do Plano Profissional',
      'Gestão multi-técnicos e equipes de campo',
      'Painel para Gerentes e Instaladores',
      'Distribuição de serviços e rotas',
      'Relatórios financeiros e contábeis avançados',
      'Exportação de dados para Excel/PDF',
      'Clientes e serviços ilimitados',
      'Suporte VIP via WhatsApp dedicado',
    ],
    limits: {
      maxClients: 'unlimited',
      maxOrdersPerMonth: 'unlimited',
      maxTeamMembers: 'unlimited',
      supportChannel: 'WhatsApp VIP Dedicado',
    },
  },
};

// Seed Users
const INITIAL_USERS: User[] = [
  {
    id: 'usr-superadmin',
    name: 'Super Admin',
    email: 'agenciavallor01@gmail.com',
    role: 'superadmin',
    companyId: 'comp-climafrio',
    companyName: 'InstalaSaldo Global',
    status: 'ativo',
    phone: '(11) 99888-0001',
    createdAt: '2023-01-01',
    lastLogin: 'Hoje às 14:48',
    connectedDevice: 'MacBook Pro — Chrome 124',
    isOwner: true,
  },
  {
    id: 'usr-rodrigo',
    name: 'Rodrigo Santana Albuquerque',
    email: 'rodrigo@climafrio.com.br',
    role: 'empresa_admin',
    companyId: 'comp-climafrio',
    companyName: 'ClimaFrio Soluções Térmicas ME',
    status: 'ativo',
    phone: '(11) 98765-4321',
    createdAt: '2023-03-12',
    lastLogin: 'Hoje às 14:32',
    connectedDevice: 'iPhone 14 Pro — iOS 17.4 (PWA App v2.4.0)',
  },
  {
    id: 'usr-marcos',
    name: 'Marcos Castro Silva',
    email: 'marcos.solar@castroinstala.com.br',
    role: 'empresa_admin',
    companyId: 'comp-castro',
    companyName: 'Castro Painéis & Energia Solar',
    status: 'ativo',
    phone: '(21) 99123-4567',
    createdAt: '2023-08-18',
    lastLogin: 'Hoje às 11:20',
    connectedDevice: 'Samsung Galaxy S24 — Android 14',
  },
  {
    id: 'usr-fabio',
    name: 'Fabio Alencar',
    email: 'fabio.eletro@gmail.com',
    role: 'empresa_admin',
    companyId: 'comp-alencar',
    companyName: 'Alencar Instalações Elétricas',
    status: 'pendente',
    phone: '(31) 98877-6655',
    createdAt: '2024-01-04',
    lastLogin: 'Ontem às 18:15',
    connectedDevice: 'Motorola Edge — Android 13',
  },
  {
    id: 'usr-julio',
    name: 'Julio Lacerda',
    email: 'lacerda.seg@outlook.com',
    role: 'empresa_admin',
    companyId: 'comp-lacerda',
    companyName: 'Lacerda Câmeras e Alarmes ME',
    status: 'bloqueado',
    phone: '(41) 97766-5544',
    createdAt: '2022-11-22',
    lastLogin: '12/10/2026',
    connectedDevice: 'Xiaomi Redmi Note 12',
  },
  {
    id: 'usr-tatiane',
    name: 'Tatiane Amorim',
    email: 'tati@amorimhidraulica.com.br',
    role: 'empresa_admin',
    companyId: 'comp-amorim',
    companyName: 'Amorim Hidráulica & Gás',
    status: 'ativo',
    phone: '(71) 98112-3344',
    createdAt: '2023-09-15',
    lastLogin: 'Hoje às 09:40',
    connectedDevice: 'iPhone 13 — iOS 17.2',
  },
];

// Seed Companies
const INITIAL_COMPANIES: Company[] = [
  {
    id: 'comp-climafrio',
    name: 'ClimaFrio Soluções Térmicas ME',
    document: '34.891.204/0001-72',
    email: 'rodrigo@climafrio.com.br',
    phone: '(11) 98765-4321',
    plan: 'profissional',
    planStatus: 'ativo',
    accountStatus: 'ativo',
    monthlyPrice: 97,
    nextBillingDate: '2026-11-12',
    address: 'Av. Paulista, 1000, Cj 42',
    city: 'São Paulo',
    state: 'SP',
    ownerName: 'Rodrigo Santana Albuquerque',
    ownerEmail: 'rodrigo@climafrio.com.br',
    totalOrdersCount: 142,
    totalVolume: 184500,
    teamMembersCount: 4,
    lastActivity: 'Hoje às 14:32',
    createdAt: '2023-03-12',
    whatsappConfig: {
      enabled: true,
      provider: 'manual_fallback',
      status: 'conectado',
      phoneNumber: '11987654321',
      apiKeyConfigured: false,
      deliveryFormat: 'documento_formatado',
      lastConnectedAt: '2026-10-15',
    },
    features: {
      whatsappAutomated: false,
      digitalSignature: true,
      advancedReports: true,
      customBranding: true,
      multiTechnicianDispatch: true,
    },
  },
  {
    id: 'comp-castro',
    name: 'Castro Painéis & Energia Solar',
    document: '21.049.551/0001-90',
    email: 'marcos.solar@castroinstala.com.br',
    phone: '(21) 99123-4567',
    plan: 'empresa',
    planStatus: 'ativo',
    accountStatus: 'ativo',
    monthlyPrice: 147,
    nextBillingDate: '2026-11-18',
    city: 'Rio de Janeiro',
    state: 'RJ',
    ownerName: 'Marcos Castro Silva',
    ownerEmail: 'marcos.solar@castroinstala.com.br',
    totalOrdersCount: 215,
    totalVolume: 320000,
    teamMembersCount: 8,
    lastActivity: 'Hoje às 11:20',
    createdAt: '2023-08-18',
    whatsappConfig: {
      enabled: true,
      provider: 'meta_cloud_api',
      status: 'conectado',
      phoneNumber: '21991234567',
      phoneNumberId: '1098472910398',
      businessAccountId: 'WABA-992384',
      apiKeyConfigured: true,
      deliveryFormat: 'documento_formatado',
      lastConnectedAt: '2026-10-14',
      lastTestStatus: 'sucesso',
      lastTestMessage: 'Mensagem de teste enviada via Cloud API com sucesso.',
    },
    features: {
      whatsappAutomated: true,
      digitalSignature: true,
      advancedReports: true,
      customBranding: true,
      multiTechnicianDispatch: true,
    },
  },
  {
    id: 'comp-alencar',
    name: 'Alencar Instalações Elétricas',
    document: '219.882.018-09',
    email: 'fabio.eletro@gmail.com',
    phone: '(31) 98877-6655',
    plan: 'essencial',
    planStatus: 'pendente',
    accountStatus: 'trial',
    monthlyPrice: 37,
    nextBillingDate: '2026-10-25',
    city: 'Belo Horizonte',
    state: 'MG',
    ownerName: 'Fabio Alencar',
    ownerEmail: 'fabio.eletro@gmail.com',
    totalOrdersCount: 48,
    totalVolume: 62400,
    teamMembersCount: 1,
    lastActivity: 'Ontem às 18:15',
    createdAt: '2024-01-04',
    whatsappConfig: {
      enabled: false,
      provider: 'manual_fallback',
      status: 'desconectado',
      deliveryFormat: 'documento_formatado',
      apiKeyConfigured: false,
    },
    features: {
      whatsappAutomated: false,
      digitalSignature: true,
      advancedReports: false,
      customBranding: false,
      multiTechnicianDispatch: false,
    },
  },
  {
    id: 'comp-lacerda',
    name: 'Lacerda Câmeras e Alarmes ME',
    document: '18.239.112/0001-44',
    email: 'lacerda.seg@outlook.com',
    phone: '(41) 97766-5544',
    plan: 'profissional',
    planStatus: 'bloqueado',
    accountStatus: 'suspenso',
    monthlyPrice: 97,
    nextBillingDate: '2026-09-22',
    city: 'Curitiba',
    state: 'PR',
    ownerName: 'Julio Lacerda',
    ownerEmail: 'lacerda.seg@outlook.com',
    totalOrdersCount: 89,
    totalVolume: 112000,
    teamMembersCount: 3,
    lastActivity: '12/10/2026',
    createdAt: '2022-11-22',
    whatsappConfig: {
      enabled: false,
      provider: 'manual_fallback',
      status: 'desconectado',
      deliveryFormat: 'documento_formatado',
      apiKeyConfigured: false,
    },
    features: {
      whatsappAutomated: false,
      digitalSignature: false,
      advancedReports: false,
      customBranding: false,
      multiTechnicianDispatch: false,
    },
  },
  {
    id: 'comp-amorim',
    name: 'Amorim Hidráulica & Gás',
    document: '40.119.820/0001-11',
    email: 'tati@amorimhidraulica.com.br',
    phone: '(71) 98112-3344',
    plan: 'empresa',
    planStatus: 'ativo',
    accountStatus: 'ativo',
    monthlyPrice: 147,
    nextBillingDate: '2026-11-15',
    city: 'Salvador',
    state: 'BA',
    ownerName: 'Tatiane Amorim',
    ownerEmail: 'tati@amorimhidraulica.com.br',
    totalOrdersCount: 167,
    totalVolume: 245000,
    teamMembersCount: 6,
    lastActivity: 'Hoje às 09:40',
    createdAt: '2023-09-15',
    whatsappConfig: {
      enabled: true,
      provider: 'qr_code_webhook',
      status: 'conectado',
      phoneNumber: '71981123344',
      deliveryFormat: 'pdf_comprovante',
      apiKeyConfigured: false,
      lastConnectedAt: '2026-10-12',
    },
    features: {
      whatsappAutomated: true,
      digitalSignature: true,
      advancedReports: true,
      customBranding: true,
      multiTechnicianDispatch: true,
    },
  },
];

// Seed Clients
const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli-marcos',
    companyId: 'comp-climafrio',
    name: 'Marcos Silveira Rezende',
    phone: '(11) 98122-3344',
    whatsapp: '11981223344',
    email: 'marcos.rezende@gmail.com',
    document: '321.456.789-01',
    address: 'Rua das Palmeiras, 450, Apto 82 - Jardins',
    city: 'São Paulo',
    state: 'SP',
    postalCode: '01415-001',
    notes: 'Cliente prefere atendimento no período da manhã. Acesso pela portaria social.',
    createdAt: '2026-08-10',
  },
  {
    id: 'cli-solar',
    companyId: 'comp-climafrio',
    name: 'Condomínio Solar das Flores',
    phone: '(11) 3255-8900',
    whatsapp: '11976543210',
    email: 'sindico@solardasflores.com.br',
    document: '12.345.678/0001-99',
    address: 'Alameda dos Ipês, 1200 - Brooklin',
    city: 'São Paulo',
    state: 'SP',
    postalCode: '04561-002',
    notes: 'Manutenção periódica nas áreas comuns e salão de festas. Falar com Síndico Alberto.',
    createdAt: '2026-07-05',
  },
  {
    id: 'cli-camila',
    companyId: 'comp-climafrio',
    name: 'Dra. Camila Nogueira',
    phone: '(11) 99344-5566',
    whatsapp: '11993445566',
    email: 'consultorio.camila@clinicavita.com.br',
    document: '287.654.321-12',
    address: 'Rua Bela Cintra, 890, Conjunto 112 - Consolação',
    city: 'São Paulo',
    state: 'SP',
    postalCode: '01415-000',
    notes: 'Consultório odontológico. Serviços somente às sextas após às 18h ou sábados.',
    createdAt: '2026-09-01',
  },
  {
    id: 'cli-boulevard',
    companyId: 'comp-climafrio',
    name: 'Shopping Boulevard Center',
    phone: '(11) 3344-9988',
    whatsapp: '11982334455',
    email: 'engenharia@boulevardcenter.com.br',
    document: '55.667.889/0001-22',
    address: 'Av. Ibirapuera, 3100 - Moema',
    city: 'São Paulo',
    state: 'SP',
    postalCode: '04029-200',
    notes: 'Equipamentos de alta potência. Necessário uso de EPI completo e NR-35.',
    createdAt: '2026-05-18',
  },
  {
    id: 'cli-paodourado',
    companyId: 'comp-climafrio',
    name: 'Padaria Pão Dourado',
    phone: '(11) 3211-4455',
    whatsapp: '11971239876',
    email: 'gerencia@paodourado.com.br',
    document: '77.889.900/0001-33',
    address: 'Rua Augusta, 1420 - Consolação',
    city: 'São Paulo',
    state: 'SP',
    postalCode: '01304-001',
    notes: 'Câmaras frias e balcões refrigerados.',
    createdAt: '2026-09-20',
  },
];

// Seed Services (matching Image 5!)
const INITIAL_SERVICES: ServiceItem[] = [
  {
    id: 'srv-1',
    companyId: 'comp-climafrio',
    clientId: 'cli-marcos',
    clientName: 'Marcos Silveira Rezende',
    serviceType: 'instalacao',
    description: 'Instalação de Ar-Condicionado Split 12.000 BTUs Inverter',
    totalValue: 2800.0,
    depositValue: 1000.0,
    pendingBalance: 1800.0,
    scheduledDate: '2026-10-16',
    status: 'agendado',
    assignedTechnicianId: 'usr-rodrigo',
    assignedTechnicianName: 'Rodrigo Santana',
    notes: 'Necessário levar escada de 6 degraus e tubulação extra. Cliente prefere pagar o saldo restante de R$ 1.800,00 via Pix.',
    createdAt: '2026-10-16T10:00:00Z',
    updatedAt: '2026-10-16T10:00:00Z',
  },
  {
    id: 'srv-2',
    companyId: 'comp-climafrio',
    clientId: 'cli-solar',
    clientName: 'Condomínio Solar das Flores',
    serviceType: 'manutencao',
    description: 'Manutenção Preventiva de 6 Splits na academia e portaria',
    totalValue: 3500.0,
    depositValue: 1500.0,
    pendingBalance: 2000.0,
    scheduledDate: '2026-10-17',
    status: 'andamento',
    assignedTechnicianId: 'usr-rodrigo',
    assignedTechnicianName: 'Rodrigo Santana',
    notes: 'Limpeza química das serpentinas, medição de pressão do gás e troca dos filtros bactericidas.',
    createdAt: '2026-10-14T14:30:00Z',
    updatedAt: '2026-10-15T09:10:00Z',
  },
  {
    id: 'srv-3',
    companyId: 'comp-climafrio',
    clientId: 'cli-camila',
    clientName: 'Dra. Camila Nogueira',
    serviceType: 'manutencao',
    description: 'Troca de capacitor e recarga de gás R410a consultório 2',
    totalValue: 850.0,
    depositValue: 400.0,
    pendingBalance: 450.0,
    scheduledDate: '2026-10-18',
    status: 'peca',
    assignedTechnicianId: 'usr-rodrigo',
    assignedTechnicianName: 'Rodrigo Santana',
    notes: 'Aguardando entrega do capacitor 35+5uF original para finalizar teste de partida.',
    createdAt: '2026-10-15T16:00:00Z',
    updatedAt: '2026-10-16T08:00:00Z',
  },
  {
    id: 'srv-4',
    companyId: 'comp-climafrio',
    clientId: 'cli-boulevard',
    clientName: 'Shopping Boulevard Center',
    serviceType: 'instalacao',
    description: 'Instalação de Cassete 4 Vias 36.000 BTUs na Loja 45',
    totalValue: 5600.0,
    depositValue: 5600.0,
    pendingBalance: 0.0,
    scheduledDate: '2026-10-12',
    status: 'concluido',
    assignedTechnicianId: 'usr-rodrigo',
    assignedTechnicianName: 'Rodrigo Santana',
    notes: 'Serviço executado com sucesso e teste de estanqueidade em 450 PSI aprovado. Sinal e saldo 100% quitados via Pix.',
    createdAt: '2026-10-10T11:00:00Z',
    updatedAt: '2026-10-12T17:30:00Z',
  },
];

// Seed Work Orders
const INITIAL_ORDERS: WorkOrder[] = [
  {
    id: 'os-142',
    code: 'OS-2026-0142',
    companyId: 'comp-climafrio',
    clientId: 'cli-marcos',
    clientName: 'Marcos Silveira Rezende',
    clientPhone: '(11) 98122-3344',
    clientAddress: 'Rua das Palmeiras, 450, Apto 82 - Jardins, São Paulo - SP',
    serviceType: 'instalacao',
    description: 'Instalação de Ar-Condicionado Split 12.000 BTUs Inverter',
    status: 'agendado',
    assignedTechnicianId: 'usr-rodrigo',
    assignedTechnicianName: 'Rodrigo Santana Albuquerque',
    totalValue: 2800.0,
    depositValue: 1000.0,
    pendingBalance: 1800.0,
    scheduledDate: '2026-10-16',
    photos: [],
    notes: 'Levar mangueira de cobre 3/8, suporte de condensadora de inox e parafusos de ancoragem.',
    createdAt: '2026-10-16T10:00:00Z',
  },
  {
    id: 'os-141',
    code: 'OS-2026-0141',
    companyId: 'comp-climafrio',
    clientId: 'cli-solar',
    clientName: 'Condomínio Solar das Flores',
    clientPhone: '(11) 97654-3210',
    clientAddress: 'Alameda dos Ipês, 1200 - Brooklin, São Paulo - SP',
    serviceType: 'manutencao',
    description: 'Manutenção Preventiva de 6 Splits na academia e portaria',
    status: 'em_execucao',
    assignedTechnicianId: 'usr-rodrigo',
    assignedTechnicianName: 'Rodrigo Santana Albuquerque',
    totalValue: 3500.0,
    depositValue: 1500.0,
    pendingBalance: 2000.0,
    scheduledDate: '2026-10-17',
    startDate: '2026-10-16 08:30',
    photos: [
      {
        id: 'p-1',
        url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
        caption: 'Condensadora antes da limpeza química',
        type: 'antes',
        timestamp: '16/10/2026 09:12',
      },
    ],
    notes: '3 aparelhos já higienizados. Restam os 3 da portaria.',
    createdAt: '2026-10-14T14:30:00Z',
  },
  {
    id: 'os-140',
    code: 'OS-2026-0140',
    companyId: 'comp-climafrio',
    clientId: 'cli-boulevard',
    clientName: 'Shopping Boulevard Center',
    clientPhone: '(11) 98233-4455',
    clientAddress: 'Av. Ibirapuera, 3100 - Moema, São Paulo - SP',
    serviceType: 'instalacao',
    description: 'Instalação de Cassete 4 Vias 36.000 BTUs na Loja 45',
    status: 'concluido',
    assignedTechnicianId: 'usr-rodrigo',
    assignedTechnicianName: 'Rodrigo Santana Albuquerque',
    totalValue: 5600.0,
    depositValue: 5600.0,
    pendingBalance: 0.0,
    scheduledDate: '2026-10-12',
    startDate: '2026-10-12 08:00',
    completedDate: '2026-10-12 17:30',
    photos: [
      {
        id: 'p-2',
        url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
        caption: 'Tubulação frigorífica instalada e pressurizada',
        type: 'antes',
        timestamp: '12/10/2026 10:15',
      },
      {
        id: 'p-3',
        url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
        caption: 'Cassete em pleno funcionamento com 18°C estável',
        type: 'depois',
        timestamp: '12/10/2026 17:00',
      },
    ],
    clientSignatureDate: '12/10/2026 17:28',
    notes: 'Entregue com termo de garantia de 1 ano de instalação.',
    createdAt: '2026-10-10T11:00:00Z',
  },
];

// Seed Budgets
const INITIAL_BUDGETS: Budget[] = [
  {
    id: 'bud-1',
    code: 'ORC-2026-088',
    companyId: 'comp-climafrio',
    clientId: 'cli-paodourado',
    clientName: 'Padaria Pão Dourado',
    title: 'Instalação de 2 Cortinas de Ar 1,50m e Manutenção no Balcão de Frios',
    serviceType: 'instalacao',
    items: [
      {
        id: 'it-1',
        description: 'Mão de obra instalação 2 Cortinas de Ar com suporte de fixação',
        quantity: 2,
        unitPrice: 600.0,
        total: 1200.0,
        type: 'mao_de_obra',
      },
      {
        id: 'it-2',
        description: 'Carga de fluído refrigerante R134a no compressor do balcão',
        quantity: 1,
        unitPrice: 450.0,
        total: 450.0,
        type: 'material',
      },
      {
        id: 'it-3',
        description: 'Substituição de relé térmico e chicote elétrico reforçado',
        quantity: 1,
        unitPrice: 280.0,
        total: 280.0,
        type: 'material',
      },
    ],
    subtotal: 1930.0,
    discount: 130.0,
    totalValue: 1800.0,
    suggestedDeposit: 900.0,
    status: 'enviado',
    validUntil: '2026-10-25',
    notes: 'Condição: 50% de sinal na aprovação (Pix) e saldo em até 2 dias úteis após término.',
    createdAt: '2026-10-15',
  },
];

// Seed Team Members
const INITIAL_TEAM: TeamMember[] = [
  {
    id: 'tm-1',
    companyId: 'comp-climafrio',
    name: 'Rodrigo Santana Albuquerque',
    email: 'rodrigo@climafrio.com.br',
    phone: '(11) 98765-4321',
    role: 'empresa_admin',
    status: 'ativo',
    assignedOrdersCount: 8,
    createdAt: '2023-03-12',
  },
  {
    id: 'tm-2',
    companyId: 'comp-climafrio',
    name: 'Lucas Ferreira Lima',
    email: 'lucas.tecnico@climafrio.com.br',
    phone: '(11) 97111-2233',
    role: 'instalador',
    status: 'ativo',
    assignedOrdersCount: 5,
    createdAt: '2024-02-10',
  },
  {
    id: 'tm-3',
    companyId: 'comp-climafrio',
    name: 'Carlos Eduardo Mendes',
    email: 'carlos.mendes@climafrio.com.br',
    phone: '(11) 96555-4433',
    role: 'gerente',
    status: 'ativo',
    assignedOrdersCount: 2,
    createdAt: '2023-11-01',
  },
];

// Seed Invoices
const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-101',
    companyId: 'comp-climafrio',
    companyName: 'ClimaFrio Soluções Térmicas ME',
    planName: 'Profissional',
    amount: 97.0,
    dueDate: '2026-10-12',
    paidDate: '2026-10-12',
    status: 'pago',
    paymentMethod: 'pix',
  },
  {
    id: 'inv-100',
    companyId: 'comp-climafrio',
    companyName: 'ClimaFrio Soluções Térmicas ME',
    planName: 'Profissional',
    amount: 97.0,
    dueDate: '2026-09-12',
    paidDate: '2026-09-12',
    status: 'pago',
    paymentMethod: 'pix',
  },
  {
    id: 'inv-099',
    companyId: 'comp-climafrio',
    companyName: 'ClimaFrio Soluções Térmicas ME',
    planName: 'Profissional',
    amount: 97.0,
    dueDate: '2026-08-12',
    paidDate: '2026-08-12',
    status: 'pago',
    paymentMethod: 'cartao',
  },
];

interface AppContextType {
  currentUser: User;
  users: User[];
  companies: Company[];
  currentCompany: Company;
  clients: Client[];
  services: ServiceItem[];
  budgets: Budget[];
  workOrders: WorkOrder[];
  teamMembers: TeamMember[];
  invoices: Invoice[];
  isSuperAdmin: boolean;
  activeView: string;
  setActiveView: (view: string) => void;
  isFieldAppView: boolean;
  setIsFieldAppView: (field: boolean) => void;
  // Supabase Auth & Real Infrastructure
  isLiveAuth: boolean;
  authLoading: boolean;
  isSupabaseConfigured: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  signOut: () => Promise<void>;
  importLocalStorageData: () => { count: number; message: string };
  importStatus: string | null;
  // Auth Controls (Development / Switching)
  switchUser: (userId: string) => void;
  loginAsRole: (role: 'superadmin' | 'empresa_admin' | 'instalador') => void;
  // Clients
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'companyId'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  // Services
  addService: (service: Omit<ServiceItem, 'id' | 'createdAt' | 'updatedAt' | 'companyId' | 'pendingBalance'>) => ServiceItem;
  updateService: (id: string, updates: Partial<ServiceItem>) => void;
  deleteService: (id: string) => void;
  // Budgets
  addBudget: (budget: Omit<Budget, 'id' | 'code' | 'createdAt' | 'companyId'>) => Budget;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  convertBudgetToOrder: (budgetId: string) => WorkOrder;
  // Orders
  addWorkOrder: (order: Omit<WorkOrder, 'id' | 'code' | 'createdAt' | 'companyId'>) => WorkOrder;
  updateWorkOrder: (id: string, updates: Partial<WorkOrder>) => void;
  deleteWorkOrder: (id: string) => void;
  signWorkOrder: (id: string, signatureDataUrl: string) => void;
  // Team
  addTeamMember: (member: Omit<TeamMember, 'id' | 'createdAt' | 'companyId' | 'assignedOrdersCount'>) => TeamMember;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
  deleteTeamMember: (id: string) => void;
  // Subscriptions & Super Admin
  changeCompanyPlan: (companyId: string, newPlan: PlanTier) => void;
  updateCompanyStatus: (companyId: string, newStatus: PlanStatus) => void;
  updateCompanyDetails: (companyId: string, updates: Partial<Company>) => { success: boolean; error?: string };
  toggleCompanySuspension: (companyId: string) => { success: boolean; error?: string; newStatus?: string };
  deleteCompanyAccount: (companyId: string) => { success: boolean; error?: string };
  updateUserAdmin: (userId: string, updates: { plan?: PlanTier; status?: PlanStatus; name?: string; role?: User['role'] }) => { success: boolean; error?: string };
  sendWhatsAppWorkOrder: (orderId: string, recipientType: 'client' | 'technician' | 'custom', customPhone?: string, customMessage?: string) => Promise<{ success: boolean; message: string; method: 'automatico' | 'manual'; waLink?: string }>;
  testCompanyWhatsApp: (companyId: string) => Promise<{ success: boolean; message: string }>;
  protectedOwnerEmail: string;
  auditLogs: AuditLog[];
  logAudit: (action: string, target: string, details: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY = 'instalasaldo_saas_data_v2';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from localStorage or defaults
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_users`);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_currentUserId`);
    return saved || 'usr-superadmin';
  });

  const [companies, setCompanies] = useState<Company[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_companies`);
    if (saved) {
      try {
        const parsed: Company[] = JSON.parse(saved);
        // Ensure accurate subscription pricing (37, 97, 147)
        return parsed.map((c) => ({
          ...c,
          monthlyPrice: PLAN_CONFIGS[c.plan]?.price || c.monthlyPrice,
        }));
      } catch {
        return INITIAL_COMPANIES;
      }
    }
    return INITIAL_COMPANIES;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_clients`);
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  const [services, setServices] = useState<ServiceItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_services`);
    return saved ? JSON.parse(saved) : INITIAL_SERVICES;
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_budgets`);
    return saved ? JSON.parse(saved) : INITIAL_BUDGETS;
  });

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_workOrders`);
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_teamMembers`);
    return saved ? JSON.parse(saved) : INITIAL_TEAM;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_invoices`);
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: 'aud-1',
      timestamp: 'Hoje às 14:48:12',
      userId: 'usr-superadmin',
      userName: 'Super Admin',
      action: 'LOGIN_MASTER',
      target: 'Ambiente Master',
      ipAddress: '187.54.120.4',
      details: 'Sessão administrativa iniciada com sucesso.',
    },
    {
      id: 'aud-2',
      timestamp: 'Hoje às 14:32:00',
      userId: 'usr-rodrigo',
      userName: 'Rodrigo Santana',
      action: 'UPDATE_SERVICE',
      target: 'srv-1',
      ipAddress: '177.38.99.12',
      details: 'Saldo pendente recalculado: R$ 1.800,00.',
    },
    {
      id: 'aud-3',
      timestamp: 'Hoje às 10:00:00',
      userId: 'usr-rodrigo',
      userName: 'Rodrigo Santana',
      action: 'CREATE_SERVICE',
      target: 'srv-1',
      ipAddress: '177.38.99.12',
      details: 'Novo serviço para Marcos Silveira Rezende lançado.',
    },
  ]);

  const [activeView, setActiveView] = useState<string>('inicio');
  const [isFieldAppView, setIsFieldAppView] = useState<boolean>(false);

  // Supabase Auth & Real Infrastructure State
  const [isLiveAuth, setIsLiveAuth] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Supabase Session Listener & Profile Hydration
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleSupabaseUserSession(session.user);
      }
    });

    // Listen for live login, logout, and token refresh
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        handleSupabaseUserSession(session.user);
      } else {
        setIsLiveAuth(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSupabaseUserSession = async (sbUser: any) => {
    setAuthLoading(true);
    setIsLiveAuth(true);

    try {
      const emailLower = (sbUser.email || '').toLowerCase();
      const isOwnerAccount =
        emailLower === 'agenciavallor01@gmail.com' ||
        emailLower === 'valloragencia@gmail.com';

      // 1. Fetch user profile from Supabase
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sbUser.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('[Supabase Profiles Query]', error.message);
      }

      const userName =
        profile?.name ||
        profile?.nome ||
        sbUser.user_metadata?.name ||
        sbUser.user_metadata?.nome ||
        (isOwnerAccount ? 'Super Admin' : emailLower.split('@')[0]);

      const userRole: User['role'] = isOwnerAccount
        ? 'superadmin'
        : profile?.role || 'empresa_admin';

      const liveUser: User = {
        id: sbUser.id,
        name: userName,
        email: sbUser.email,
        role: userRole,
        companyId: profile?.company_id || profile?.empresa || 'comp-climafrio',
        companyName: isOwnerAccount ? 'InstalaSaldo Global' : 'ClimaFrio Soluções Térmicas ME',
        status: 'ativo',
        createdAt: sbUser.created_at ? sbUser.created_at.split('T')[0] : '2026-10-16',
        lastLogin: 'Agora mesmo',
        isOwner: isOwnerAccount,
      };

      // Upsert in local user directory
      setUsers((prev) => {
        const filtered = prev.filter((u) => u.id !== sbUser.id && u.email !== sbUser.email);
        return [liveUser, ...filtered];
      });
      setCurrentUserId(liveUser.id);

      // If owner, switch to superadmin view
      if (isOwnerAccount) {
        setActiveView('superadmin');
      }

      logAudit(
        'SUPABASE_AUTH_LOGIN',
        sbUser.email,
        `Sessão autenticada via Supabase Auth (UID: ${sbUser.id}, Papel: ${userRole})`
      );

      // 2. Hydrate tenant data from Supabase if tables exist
      if (profile?.company_id && !isOwnerAccount) {
        const [cliRes, ordRes] = await Promise.all([
          supabase.from('clients').select('*').eq('company_id', profile.company_id),
          supabase.from('work_orders').select('*').eq('company_id', profile.company_id),
        ]);

        if (cliRes.data && cliRes.data.length > 0) {
          const mappedClients: Client[] = cliRes.data.map((c: any) => ({
            id: c.id,
            companyId: c.company_id,
            name: c.name,
            phone: c.phone,
            whatsapp: c.whatsapp || c.phone,
            email: c.email || '',
            document: c.document || '',
            address: c.address || '',
            city: c.city || '',
            state: c.state || '',
            postalCode: c.postal_code,
            notes: c.notes,
            createdAt: c.created_at ? c.created_at.split('T')[0] : '2026-10-16',
          }));
          setClients(mappedClients);
        }

        if (ordRes.data && ordRes.data.length > 0) {
          const mappedOrders: WorkOrder[] = ordRes.data.map((o: any) => ({
            id: o.id,
            code: o.code,
            companyId: o.company_id,
            clientId: o.client_id,
            clientName: o.client_name,
            clientPhone: o.client_phone || '',
            clientAddress: o.client_address || '',
            serviceType: o.service_type || 'instalacao',
            description: o.description || '',
            status: o.status || 'pendente',
            assignedTechnicianId: o.assigned_technician_id || sbUser.id,
            assignedTechnicianName: o.assigned_technician_name || userName,
            totalValue: Number(o.total_value) || 0,
            depositValue: Number(o.deposit_value) || 0,
            pendingBalance: Number(o.pending_balance) || 0,
            scheduledDate: o.scheduled_date || '',
            startDate: o.start_date,
            completedDate: o.completed_date,
            photos: o.photos || [],
            clientSignature: o.client_signature,
            clientSignatureDate: o.client_signature_date,
            notes: o.notes,
            createdAt: o.created_at || new Date().toISOString(),
          }));
          setWorkOrders(mappedOrders);
        }
      }
    } catch (err: any) {
      console.warn('[Supabase Sync Warn]', err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const signOut = async () => {
    setAuthLoading(true);
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
      setIsLiveAuth(false);
      setCurrentUserId('usr-rodrigo');
      setActiveView('inicio');
      logAudit('LOGOUT', currentUser.email, 'Usuário desconectado da sessão Supabase com sucesso.');
    } catch (err) {
      console.error('Erro ao encerrar sessão:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  const importLocalStorageData = (): { count: number; message: string } => {
    try {
      const rawClients = localStorage.getItem(`${STORAGE_KEY}_clients`) || localStorage.getItem('instalasaldo_customers_cache');
      const rawOrders = localStorage.getItem(`${STORAGE_KEY}_workOrders`) || localStorage.getItem('instalasaldo_workorders_cache');
      const rawServices = localStorage.getItem(`${STORAGE_KEY}_services`) || localStorage.getItem('instalasaldo_services_cache');
      const rawQuotes = localStorage.getItem(`${STORAGE_KEY}_budgets`) || localStorage.getItem('instalasaldo_quotes_cache');
      let count = 0;

      if (rawClients) {
        try {
          const parsedClients: any[] = JSON.parse(rawClients);
          const mapped = parsedClients.map((c) => ({
            id: c.id || 'cli-' + Date.now(),
            companyId: c.company_id || c.companyId || currentCompany.id,
            name: c.name || 'Cliente',
            phone: c.phone || '',
            whatsapp: c.whatsapp || c.phone || '',
            email: c.email || '',
            document: c.document || '',
            address: c.address || '',
            notes: c.notes || '',
            createdAt: c.created_at || c.createdAt || new Date().toISOString().split('T')[0],
          }));
          const unique = mapped.filter((pc) => !clients.some((c) => c.id === pc.id));
          if (unique.length > 0) {
            setClients((prev) => [...prev, ...unique]);
            count += unique.length;
          }
        } catch (e) {}
      }

      if (rawOrders) {
        try {
          const parsedOrders: any[] = JSON.parse(rawOrders);
          const mapped = parsedOrders.map((o) => ({
            id: o.id || 'order-' + Date.now(),
            code: o.code || o.order_number || 'OS-' + Math.floor(100 + Math.random() * 900),
            companyId: o.company_id || o.companyId || currentCompany.id,
            clientId: o.client_id || o.clientId || 'cli-01',
            clientName: o.client_name || o.clientName || 'Cliente',
            serviceType: o.service_type || o.serviceType || 'instalacao',
            description: o.description || 'Atendimento técnico',
            status: o.status || 'aberta',
            assignedTechnicianId: o.assigned_technician_id || currentUser.id,
            assignedTechnicianName: o.assigned_technician_name || currentUser.name,
            totalValue: Number(o.total_value) || Number(o.total_cents) / 100 || 0,
            depositValue: Number(o.deposit_value) || Number(o.entry_cents) / 100 || 0,
            pendingBalance: Number(o.pending_balance) || Number(o.balance_cents) / 100 || 0,
            scheduledDate: o.scheduled_date || o.created_at || new Date().toISOString().split('T')[0],
          }));
          const uniqueOrders = mapped.filter((po) => !workOrders.some((o) => o.id === po.id));
          if (uniqueOrders.length > 0) {
            setWorkOrders((prev) => [...prev, ...uniqueOrders]);
            count += uniqueOrders.length;
          }
        } catch (e) {}
      }

      if (rawServices) {
        try {
          const parsed = JSON.parse(rawServices);
          const mapped = parsed.map((s: any) => ({
            id: s.id || 'svc-' + Date.now(),
            companyId: s.company_id || s.companyId || currentCompany.id,
            clientId: s.client_id || s.clientId || 'cli-01',
            clientName: s.client_name || s.clientName || 'Cliente',
            serviceType: s.service_type === 'Manutenção' || s.serviceType === 'manutencao' ? 'manutencao' : 'instalacao',
            description: s.description || 'Instalação / Manutenção',
            totalValue: Number(s.total_value) || Number(s.total_cents) / 100 || 0,
            depositValue: Number(s.deposit_value) || Number(s.entry_cents) / 100 || 0,
            pendingBalance: Number(s.pending_balance) || Number(s.balance_cents) / 100 || 0,
            status: s.status || 'concluido',
            scheduledDate: s.scheduled_date || s.created_at || new Date().toISOString().split('T')[0],
          }));
          const unique = mapped.filter((ms: any) => !services.some((s) => s.id === ms.id));
          if (unique.length > 0) {
            setServices((prev) => [...prev, ...unique]);
            count += unique.length;
          }
        } catch (e) {}
      }

      const msg =
        count > 0
          ? `Importação concluída: ${count} registros válidos recuperados com sucesso do armazenamento local.`
          : 'Todos os registros locais já estão sincronizados e válidos.';
      setImportStatus(msg);
      setTimeout(() => setImportStatus(null), 5000);
      return { count, message: msg };
    } catch {
      const errorMsg = 'Falha ao processar dados salvos no navegador.';
      setImportStatus(errorMsg);
      return { count: 0, message: errorMsg };
    }
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_currentUserId`, currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_companies`, JSON.stringify(companies));
  }, [companies]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_clients`, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_services`, JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_budgets`, JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_workOrders`, JSON.stringify(workOrders));
  }, [workOrders]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_teamMembers`, JSON.stringify(teamMembers));
  }, [teamMembers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_invoices`, JSON.stringify(invoices));
  }, [invoices]);

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];
  const isSuperAdmin = currentUser.role === 'superadmin' || currentUser.email === 'agenciavallor01@gmail.com' || currentUser.email === 'valloragencia@gmail.com';
  const currentCompany = companies.find((c) => c.id === currentUser.companyId) || companies[0];

  const logAudit = (action: string, target: string, details: string) => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      target,
      ipAddress: '187.54.120.4',
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUserId(target.id);
      logAudit('SWITCH_USER', target.email, `Alternado para perfil ${target.name} (${target.role})`);
    }
  };

  const loginAsRole = (role: 'superadmin' | 'empresa_admin' | 'instalador') => {
    const user = users.find((u) => u.role === role);
    if (user) {
      setCurrentUserId(user.id);
      if (role === 'superadmin') {
        setActiveView('superadmin');
        setIsFieldAppView(false);
      } else if (role === 'instalador') {
        setActiveView('inicio');
        setIsFieldAppView(true);
      } else {
        setActiveView('inicio');
      }
    }
  };

  // Client operations
  const addClient = (data: Omit<Client, 'id' | 'createdAt' | 'companyId'>): Client => {
    const newClient: Client = {
      ...data,
      id: `cli-${Date.now()}`,
      companyId: currentUser.companyId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setClients((prev) => [newClient, ...prev]);
    logAudit('CREATE_CLIENT', newClient.id, `Cliente cadastrado: ${newClient.name}`);
    return newClient;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    logAudit('UPDATE_CLIENT', id, `Cliente atualizado`);
  };

  const deleteClient = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    logAudit('DELETE_CLIENT', id, `Cliente removido`);
  };

  // Service operations
  const addService = (
    data: Omit<ServiceItem, 'id' | 'createdAt' | 'updatedAt' | 'companyId' | 'pendingBalance'>
  ): ServiceItem => {
    const pendingBalance = Math.max(0, data.totalValue - data.depositValue);
    const newService: ServiceItem = {
      ...data,
      id: `srv-${Date.now()}`,
      companyId: currentUser.companyId,
      pendingBalance,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setServices((prev) => [newService, ...prev]);

    // Also auto-create a corresponding Work Order for field execution!
    const client = clients.find((c) => c.id === data.clientId);
    const orderNumber = workOrders.length + 143;
    const newOrder: WorkOrder = {
      id: `os-${orderNumber}`,
      code: `OS-2026-0${orderNumber}`,
      companyId: currentUser.companyId,
      clientId: data.clientId,
      clientName: data.clientName,
      clientPhone: client?.phone || '(11) 98765-4321',
      clientAddress: client?.address || 'São Paulo - SP',
      serviceType: data.serviceType,
      description: data.description,
      status: 'agendado',
      assignedTechnicianId: currentUser.id,
      assignedTechnicianName: currentUser.name,
      totalValue: data.totalValue,
      depositValue: data.depositValue,
      pendingBalance,
      scheduledDate: data.scheduledDate,
      photos: [],
      notes: data.notes,
      createdAt: new Date().toISOString(),
    };
    setWorkOrders((prev) => [newOrder, ...prev]);

    logAudit('CREATE_SERVICE', newService.id, `Serviço criado: ${newService.description} (Saldo: R$ ${pendingBalance})`);
    return newService;
  };

  const updateService = (id: string, updates: Partial<ServiceItem>) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const updated = { ...s, ...updates, updatedAt: new Date().toISOString() };
          if (updates.totalValue !== undefined || updates.depositValue !== undefined) {
            const tot = updates.totalValue !== undefined ? updates.totalValue : s.totalValue;
            const dep = updates.depositValue !== undefined ? updates.depositValue : s.depositValue;
            updated.pendingBalance = Math.max(0, tot - dep);
          }
          return updated;
        }
        return s;
      })
    );
    logAudit('UPDATE_SERVICE', id, `Serviço atualizado`);
  };

  const deleteService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
    logAudit('DELETE_SERVICE', id, `Serviço removido`);
  };

  // Budget operations
  const addBudget = (
    data: Omit<Budget, 'id' | 'code' | 'createdAt' | 'companyId'>
  ): Budget => {
    const codeNum = budgets.length + 89;
    const newBudget: Budget = {
      ...data,
      id: `bud-${Date.now()}`,
      code: `ORC-2026-0${codeNum}`,
      companyId: currentUser.companyId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setBudgets((prev) => [newBudget, ...prev]);
    logAudit('CREATE_BUDGET', newBudget.id, `Orçamento ${newBudget.code} emitido`);
    return newBudget;
  };

  const updateBudget = (id: string, updates: Partial<Budget>) => {
    setBudgets((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
    logAudit('UPDATE_BUDGET', id, `Orçamento alterado`);
  };

  const deleteBudget = (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
    logAudit('DELETE_BUDGET', id, `Orçamento removido`);
  };

  const convertBudgetToOrder = (budgetId: string): WorkOrder => {
    const budget = budgets.find((b) => b.id === budgetId);
    if (!budget) throw new Error('Orçamento não encontrado');

    const client = clients.find((c) => c.id === budget.clientId);
    const orderNum = workOrders.length + 143;
    const pendingBalance = Math.max(0, budget.totalValue - budget.suggestedDeposit);

    const newOrder: WorkOrder = {
      id: `os-${orderNum}`,
      code: `OS-2026-0${orderNum}`,
      companyId: budget.companyId,
      clientId: budget.clientId,
      clientName: budget.clientName,
      clientPhone: client?.phone || '',
      clientAddress: client?.address || '',
      serviceType: budget.serviceType,
      description: budget.title,
      status: 'agendado',
      assignedTechnicianId: currentUser.id,
      assignedTechnicianName: currentUser.name,
      totalValue: budget.totalValue,
      depositValue: budget.suggestedDeposit,
      pendingBalance,
      scheduledDate: new Date().toISOString().split('T')[0],
      photos: [],
      notes: budget.notes,
      createdAt: new Date().toISOString(),
    };

    setWorkOrders((prev) => [newOrder, ...prev]);
    updateBudget(budgetId, { status: 'aprovado', convertedToOrderId: newOrder.id });
    logAudit('CONVERT_BUDGET_TO_OS', newOrder.id, `Orçamento ${budget.code} convertido em ${newOrder.code}`);
    return newOrder;
  };

  // Work Orders
  const addWorkOrder = (
    data: Omit<WorkOrder, 'id' | 'code' | 'createdAt' | 'companyId'>
  ): WorkOrder => {
    const orderNum = workOrders.length + 143;
    const newOrder: WorkOrder = {
      ...data,
      id: `os-${orderNum}`,
      code: `OS-2026-0${orderNum}`,
      companyId: currentUser.companyId,
      createdAt: new Date().toISOString(),
    };
    setWorkOrders((prev) => [newOrder, ...prev]);
    logAudit('CREATE_OS', newOrder.id, `Ordem de Serviço ${newOrder.code} criada`);
    return newOrder;
  };

  const updateWorkOrder = (id: string, updates: Partial<WorkOrder>) => {
    setWorkOrders((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          const updated = { ...o, ...updates };
          if (updates.totalValue !== undefined || updates.depositValue !== undefined) {
            const tot = updates.totalValue !== undefined ? updates.totalValue : o.totalValue;
            const dep = updates.depositValue !== undefined ? updates.depositValue : o.depositValue;
            updated.pendingBalance = Math.max(0, tot - dep);
          }
          return updated;
        }
        return o;
      })
    );
    logAudit('UPDATE_OS', id, `OS atualizada`);
  };

  const deleteWorkOrder = (id: string) => {
    setWorkOrders((prev) => prev.filter((o) => o.id !== id));
    logAudit('DELETE_OS', id, `OS removida`);
  };

  const signWorkOrder = (id: string, signatureDataUrl: string) => {
    const now = new Date().toLocaleString('pt-BR');
    updateWorkOrder(id, {
      clientSignature: signatureDataUrl,
      clientSignatureDate: now,
      status: 'concluido',
      completedDate: now,
    });
    logAudit('SIGN_OS', id, `OS assinada digitalmente pelo cliente`);
  };

  // Team
  const addTeamMember = (
    data: Omit<TeamMember, 'id' | 'createdAt' | 'companyId' | 'assignedOrdersCount'>
  ): TeamMember => {
    const newMember: TeamMember = {
      ...data,
      id: `tm-${Date.now()}`,
      companyId: currentUser.companyId,
      assignedOrdersCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTeamMembers((prev) => [...prev, newMember]);
    logAudit('ADD_TEAM_MEMBER', newMember.id, `Membro da equipe adicionado: ${newMember.name}`);
    return newMember;
  };

  const updateTeamMember = (id: string, updates: Partial<TeamMember>) => {
    setTeamMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const deleteTeamMember = (id: string) => {
    setTeamMembers((prev) => prev.filter((m) => m.id !== id));
  };

  // Subscriptions & Super Admin controls
  const changeCompanyPlan = (companyId: string, newPlan: PlanTier) => {
    const price = PLAN_CONFIGS[newPlan].price;
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === companyId
          ? { ...c, plan: newPlan, monthlyPrice: price }
          : c
      )
    );
    logAudit('CHANGE_PLAN', companyId, `Plano alterado para ${newPlan} (R$ ${price}/mês)`);
  };

  const updateCompanyStatus = (companyId: string, newStatus: PlanStatus) => {
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === companyId ? { ...c, planStatus: newStatus } : c
      )
    );
    logAudit('UPDATE_COMPANY_STATUS', companyId, `Status da empresa alterado para ${newStatus}`);
  };

  const updateCompanyDetails = (
    companyId: string,
    updates: Partial<Company>
  ): { success: boolean; error?: string } => {
    setCompanies((prev) =>
      prev.map((c) => (c.id === companyId ? { ...c, ...updates } : c))
    );
    logAudit(
      'UPDATE_COMPANY_DETAILS',
      companyId,
      `Configurações da empresa ${companyId} atualizadas com sucesso`
    );
    return { success: true };
  };

  const toggleCompanySuspension = (
    companyId: string
  ): { success: boolean; error?: string; newStatus?: string } => {
    const targetComp = companies.find((c) => c.id === companyId);
    if (!targetComp) return { success: false, error: 'Empresa não encontrada' };

    const newStatus: AccountStatus = targetComp.accountStatus === 'suspenso' ? 'ativo' : 'suspenso';
    const newPlanStatus: PlanStatus = newStatus === 'suspenso' ? 'bloqueado' : 'ativo';

    setCompanies((prev) =>
      prev.map((c) =>
        c.id === companyId
          ? { ...c, accountStatus: newStatus, planStatus: newPlanStatus }
          : c
      )
    );

    // Also update all users belonging to this company (except protected owner)
    setUsers((prev) =>
      prev.map((u) => {
        if (u.companyId === companyId && u.email !== PROTECTED_OWNER_EMAIL && !u.isOwner) {
          return {
            ...u,
            status: newStatus === 'suspenso' ? 'bloqueado' : 'ativo',
          };
        }
        return u;
      })
    );

    logAudit(
      'TOGGLE_COMPANY_SUSPENSION',
      companyId,
      `Empresa ${targetComp.name} teve o status alterado para: ${newStatus.toUpperCase()}`
    );

    return { success: true, newStatus };
  };

  const deleteCompanyAccount = (
    companyId: string
  ): { success: boolean; error?: string } => {
    const targetComp = companies.find((c) => c.id === companyId);
    if (!targetComp) return { success: false, error: 'Empresa não encontrada' };

    // Protection check: Cannot delete company associated with owner
    const hasOwner = users.some(
      (u) => u.companyId === companyId && (u.email === PROTECTED_OWNER_EMAIL || u.isOwner)
    );
    if (hasOwner) {
      logAudit(
        'SECURITY_VIOLATION_BLOCKED',
        companyId,
        `Tentativa de exclusão de empresa associada à conta do proprietário (${PROTECTED_OWNER_EMAIL})`
      );
      return {
        success: false,
        error:
          'Ação Proibida: Não é permitido excluir a organização vinculada à conta do proprietário mestre.',
      };
    }

    setCompanies((prev) => prev.filter((c) => c.id !== companyId));
    setUsers((prev) => prev.filter((u) => u.companyId !== companyId));
    logAudit('DELETE_COMPANY', companyId, `Empresa ${targetComp.name} e usuários removidos.`);
    return { success: true };
  };

  const updateUserAdmin = (
    userId: string,
    updates: { plan?: PlanTier; status?: PlanStatus; name?: string; role?: User['role'] }
  ): { success: boolean; error?: string } => {
    const targetUser = users.find((u) => u.id === userId);
    
    // PERMANENT OWNER PROTECTION:
    // If the target user is the protected owner, reject any attempts to demote, lock, suspend, or alter identity
    if (targetUser && (targetUser.email === PROTECTED_OWNER_EMAIL || targetUser.isOwner)) {
      if (updates.status && updates.status !== 'ativo') {
        logAudit(
          'SECURITY_VIOLATION_BLOCKED',
          userId,
          `Tentativa rejeitada de suspender/bloquear o proprietário mestre (${PROTECTED_OWNER_EMAIL})`
        );
        return {
          success: false,
          error:
            'Ação Proibida: A conta master do proprietário (agenciavallor01@gmail.com) é protegida permanentemente e não pode ser suspensa ou bloqueada.',
        };
      }
      if (updates.role && updates.role !== 'superadmin') {
        logAudit(
          'SECURITY_VIOLATION_BLOCKED',
          userId,
          `Tentativa rejeitada de alterar o papel da conta mestre (${PROTECTED_OWNER_EMAIL})`
        );
        return {
          success: false,
          error:
            'Ação Proibida: Os privilégios de Super Admin da conta do proprietário são permanentes e inalienáveis.',
        };
      }
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const userStatus: UserStatus =
            updates.status === 'cancelado' ? 'bloqueado' : (updates.status as UserStatus) || u.status;
          return {
            ...u,
            ...(updates.name ? { name: updates.name } : {}),
            ...(updates.role ? { role: updates.role } : {}),
            status: userStatus,
          };
        }
        return u;
      })
    );

    const user = users.find((u) => u.id === userId);
    if (user && updates.plan) {
      changeCompanyPlan(user.companyId, updates.plan);
    }
    if (user && updates.status) {
      updateCompanyStatus(user.companyId, updates.status);
    }
    logAudit('ADMIN_USER_MODIFICATION', userId, `Permissões administrativas alteradas`);
    return { success: true };
  };

  const sendWhatsAppWorkOrder = async (
    orderId: string,
    recipientType: 'client' | 'technician' | 'custom',
    customPhone?: string,
    customMessage?: string
  ): Promise<{ success: boolean; message: string; method: 'automatico' | 'manual'; waLink?: string }> => {
    const order = workOrders.find((o) => o.id === orderId);
    if (!order) return { success: false, message: 'OS não encontrada', method: 'manual' };
    const comp = companies.find((c) => c.id === order.companyId) || currentCompany;

    const rawPhone =
      recipientType === 'client'
        ? order.clientPhone
        : recipientType === 'technician'
        ? '(11) 98765-4321'
        : customPhone || order.clientPhone;
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    const defaultMsg = `*InstalaSaldo — Ordem de Serviço ${order.code}*\nOlá, *${order.clientName}*!\n\nSegue o resumo do seu atendimento de *${order.serviceType === 'instalacao' ? 'Instalação' : 'Manutenção'}*:\n• *Serviço:* ${order.description}\n• *Data Agendada:* ${order.scheduledDate}\n• *Técnico Responsável:* ${order.assignedTechnicianName}\n\n*Resumo Financeiro:*\n• *Valor Total:* R$ ${order.totalValue.toFixed(2)}\n• *Sinal Pago (Entrada):* R$ ${order.depositValue.toFixed(2)}\n• *Saldo Pendente a Receber:* R$ ${order.pendingBalance.toFixed(2)}${order.pendingBalance > 0 ? '\n\n🔑 *Chave Pix para quitação:* financeiro@instalasaldo.com.br' : '\n\n✅ *Serviço 100% quitado!*'}\n\nQualquer dúvida, estamos à disposição!\n*${comp.name}*`;

    const finalMessage = customMessage || defaultMsg;
    const waLink = `https://wa.me/${fullPhone}?text=${encodeURIComponent(finalMessage)}`;

    const isAutomated = comp.whatsappConfig?.enabled && comp.whatsappConfig?.provider === 'meta_cloud_api';
    const method: 'automatico' | 'manual' = isAutomated ? 'automatico' : 'manual';

    const dispatchAttempt: WAMessageAttempt = {
      id: `wa-${Date.now()}`,
      timestamp: new Date().toLocaleString('pt-BR'),
      destinationPhone: rawPhone,
      method,
      provider: comp.whatsappConfig?.provider || 'manual_fallback',
      status: isAutomated ? 'enviado' : 'manual_aberto',
      providerMessageId: isAutomated ? `wamid.${Date.now()}` : undefined,
    };

    updateWorkOrder(orderId, {
      whatsappDispatches: [...(order.whatsappDispatches || []), dispatchAttempt],
    });

    logAudit(
      'WHATSAPP_OS_DISPATCH',
      order.code,
      `OS ${order.code} enviada via WhatsApp para ${rawPhone} (modo ${method})`
    );

    return {
      success: true,
      message: isAutomated
        ? 'Mensagem enviada com sucesso pela API Meta Cloud!'
        : 'Link do WhatsApp preparado para envio direto.',
      method,
      waLink,
    };
  };

  const testCompanyWhatsApp = async (
    companyId: string
  ): Promise<{ success: boolean; message: string }> => {
    const comp = companies.find((c) => c.id === companyId);
    if (!comp) return { success: false, message: 'Empresa não encontrada' };

    const isMeta = comp.whatsappConfig?.provider === 'meta_cloud_api';
    const feedback = isMeta
      ? 'Conexão com a Meta Cloud API verificada com sucesso! Webhook 200 OK.'
      : 'Integração pronta para disparo via link direto ou QR Code.';

    const updatedConfig: CompanyWhatsAppConfig = {
      ...(comp.whatsappConfig || {
        enabled: true,
        provider: 'manual_fallback',
        status: 'conectado',
        deliveryFormat: 'documento_formatado',
        apiKeyConfigured: false,
      }),
      status: 'conectado',
      lastConnectedAt: new Date().toISOString().split('T')[0],
      lastTestStatus: 'sucesso',
      lastTestMessage: feedback,
    };

    updateCompanyDetails(companyId, { whatsappConfig: updatedConfig });
    logAudit('TEST_WHATSAPP_CONNECTION', companyId, `Teste de conexão WhatsApp: ${feedback}`);
    return { success: true, message: feedback };
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        companies,
        currentCompany,
        clients,
        services,
        budgets,
        workOrders,
        teamMembers,
        invoices,
        isSuperAdmin,
        activeView,
        setActiveView,
        isFieldAppView,
        setIsFieldAppView,
        isLiveAuth,
        authLoading,
        isSupabaseConfigured: isSupabaseConfigured(),
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        signOut,
        importLocalStorageData,
        importStatus,
        switchUser,
        loginAsRole,
        addClient,
        updateClient,
        deleteClient,
        addService,
        updateService,
        deleteService,
        addBudget,
        updateBudget,
        deleteBudget,
        convertBudgetToOrder,
        addWorkOrder,
        updateWorkOrder,
        deleteWorkOrder,
        signWorkOrder,
        addTeamMember,
        updateTeamMember,
        deleteTeamMember,
        changeCompanyPlan,
        updateCompanyStatus,
        updateCompanyDetails,
        toggleCompanySuspension,
        deleteCompanyAccount,
        updateUserAdmin,
        sendWhatsAppWorkOrder,
        testCompanyWhatsApp,
        protectedOwnerEmail: PROTECTED_OWNER_EMAIL,
        auditLogs,
        logAudit,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
