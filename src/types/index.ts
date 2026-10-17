export type UserRole = 'superadmin' | 'empresa_admin' | 'gerente' | 'instalador';

export type UserStatus = 'ativo' | 'pendente' | 'bloqueado';

export type AccountStatus = 'ativo' | 'inativo' | 'suspenso' | 'trial';

export type PlanTier = 'essencial' | 'profissional' | 'empresa';

export type PlanStatus = 'ativo' | 'pendente' | 'bloqueado' | 'cancelado';

export type WhatsAppProvider = 'meta_cloud_api' | 'qr_code_webhook' | 'manual_fallback';

export type WhatsAppStatus = 'conectado' | 'desconectado' | 'erro' | 'pendente';

export type OSDeliveryFormat = 'documento_formatado' | 'pdf_comprovante' | 'link_seguro';

export interface CompanyWhatsAppConfig {
  enabled: boolean;
  provider: WhatsAppProvider;
  status: WhatsAppStatus;
  phoneNumber?: string;
  phoneNumberId?: string; // ID do número no Meta Cloud API
  businessAccountId?: string; // WABA ID
  apiKeyConfigured: boolean; // True se token foi configurado no servidor (sem expor o segredo)
  webhookUrl?: string;
  deliveryFormat: OSDeliveryFormat;
  lastConnectedAt?: string;
  lastTestStatus?: 'sucesso' | 'erro' | null;
  lastTestMessage?: string;
  errorMessage?: string;
}

export interface WAMessageAttempt {
  id: string;
  timestamp: string;
  destinationPhone: string;
  method: 'automatico' | 'manual';
  provider: WhatsAppProvider;
  status: 'enviado' | 'em_fila' | 'falha' | 'manual_aberto';
  providerMessageId?: string;
  errorDetails?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string;
  companyName: string;
  status: UserStatus;
  avatarUrl?: string;
  phone?: string;
  createdAt: string;
  lastLogin?: string;
  connectedDevice?: string;
  isOwner?: boolean; // Proteção permanente da conta exclusiva agenciavallor01@gmail.com
}

export interface CompanyFeatures {
  whatsappAutomated: boolean;
  digitalSignature: boolean;
  advancedReports: boolean;
  customBranding: boolean;
  multiTechnicianDispatch: boolean;
}

export interface Company {
  id: string;
  name: string;
  document: string; // CNPJ ou CPF
  email: string;
  phone: string;
  plan: PlanTier;
  planStatus: PlanStatus;
  accountStatus: AccountStatus; // ativo | inativo | suspenso | trial
  monthlyPrice: number;
  nextBillingDate: string;
  address?: string;
  city?: string;
  state?: string;
  ownerName: string;
  ownerEmail: string;
  totalOrdersCount: number;
  totalVolume: number;
  lastActivity?: string;
  teamMembersCount?: number;
  whatsappConfig?: CompanyWhatsAppConfig;
  features?: CompanyFeatures;
  osPrefix?: string;
  warrantyTermsDays?: number;
  defaultDepositPercentage?: number;
  createdAt: string;
}

export interface Client {
  id: string;
  companyId: string;
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  document: string; // CPF ou CNPJ
  address: string;
  city: string;
  state: string;
  postalCode?: string;
  notes?: string;
  createdAt: string;
}

export type ServiceType = 'instalacao' | 'manutencao';

export type ServiceStatus = 'agendado' | 'andamento' | 'peca' | 'concluido';

export interface ServiceItem {
  id: string;
  companyId: string;
  clientId: string;
  clientName: string;
  serviceType: ServiceType; // Instalação ou Manutenção
  description: string;
  totalValue: number;
  depositValue: number; // Sinal recebido
  pendingBalance: number; // Saldo pendente (total - sinal)
  scheduledDate: string;
  status: ServiceStatus;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  type: 'mao_de_obra' | 'material';
}

export type BudgetStatus = 'rascunho' | 'enviado' | 'aprovado' | 'recusado';

export interface Budget {
  id: string;
  code: string;
  companyId: string;
  clientId: string;
  clientName: string;
  title: string;
  serviceType: ServiceType;
  items: BudgetItem[];
  subtotal: number;
  discount: number;
  totalValue: number;
  suggestedDeposit: number;
  status: BudgetStatus;
  validUntil: string;
  notes?: string;
  convertedToOrderId?: string;
  createdAt: string;
}

export type OrderStatus =
  | 'agendado'
  | 'em_deslocamento'
  | 'em_execucao'
  | 'aguardando_peca'
  | 'concluido'
  | 'cancelado';

export interface OrderPhoto {
  id: string;
  url: string;
  caption: string;
  type: 'antes' | 'depois';
  timestamp: string;
}

export interface WorkOrder {
  id: string;
  code: string; // ex: OS-2026-0142
  companyId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  serviceType: ServiceType;
  description: string;
  status: OrderStatus;
  assignedTechnicianId: string;
  assignedTechnicianName: string;
  totalValue: number;
  depositValue: number;
  pendingBalance: number;
  scheduledDate: string;
  startDate?: string;
  completedDate?: string;
  photos: OrderPhoto[];
  clientSignature?: string; // Base64 data URL
  clientSignatureDate?: string;
  whatsappDispatches?: WAMessageAttempt[]; // Histórico de envios de OS via WhatsApp
  notes?: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  companyId: string;
  name: string;
  email: string;
  phone: string;
  role: 'empresa_admin' | 'gerente' | 'instalador';
  status: 'ativo' | 'inativo';
  avatar?: string;
  assignedOrdersCount: number;
  createdAt: string;
}

export interface PlanConfig {
  id: PlanTier;
  name: string;
  price: number;
  badge?: string;
  description: string;
  features: string[];
  limits: {
    maxClients: number | 'unlimited';
    maxOrdersPerMonth: number | 'unlimited';
    maxTeamMembers: number | 'unlimited';
    supportChannel: string;
  };
}

export interface Invoice {
  id: string;
  companyId: string;
  companyName: string;
  planName: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'pago' | 'pendente' | 'vencido';
  paymentMethod: 'pix' | 'cartao';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  ipAddress: string;
  details: string;
}
