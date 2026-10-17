import React, { useState } from 'react';
import { Company, PlanTier, PlanStatus, AccountStatus, User, CompanyWhatsAppConfig, WhatsAppProvider } from '../types';
import { useApp, PLAN_CONFIGS } from '../context/AppContext';
import { formatCurrency, formatDocument, formatPhone } from '../utils/formatters';

interface CustomerManagementModalProps {
  company: Company;
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerManagementModal: React.FC<CustomerManagementModalProps> = ({
  company,
  isOpen,
  onClose,
}) => {
  const {
    updateCompanyDetails,
    toggleCompanySuspension,
    deleteCompanyAccount,
    testCompanyWhatsApp,
    users,
    teamMembers,
    auditLogs,
    protectedOwnerEmail,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'cadastro' | 'assinatura' | 'permissoes' | 'config_os' | 'whatsapp' | 'equipe' | 'auditoria'
  >('cadastro');

  // Form State
  const [name, setName] = useState(company.name);
  const [document, setDocument] = useState(company.document);
  const [ownerName, setOwnerName] = useState(company.ownerName || '');
  const [ownerEmail, setOwnerEmail] = useState(company.ownerEmail || company.email);
  const [phone, setPhone] = useState(company.phone);
  const [address, setAddress] = useState(company.address || '');
  const [city, setCity] = useState(company.city || '');
  const [state, setState] = useState(company.state || '');

  // Subscription state
  const [plan, setPlan] = useState<PlanTier>(company.plan);
  const [planStatus, setPlanStatus] = useState<PlanStatus>(company.planStatus);
  const [accountStatus, setAccountStatus] = useState<AccountStatus>(company.accountStatus);

  // Features state
  const [features, setFeatures] = useState({
    whatsappAutomated: company.features?.whatsappAutomated ?? true,
    digitalSignature: company.features?.digitalSignature ?? true,
    advancedReports: company.features?.advancedReports ?? true,
    customBranding: company.features?.customBranding ?? false,
    multiTechnicianDispatch: company.features?.multiTechnicianDispatch ?? true,
  });

  // OS Config state
  const [osPrefix, setOsPrefix] = useState(company.osPrefix || 'OS-2026-');
  const [warrantyTermsDays, setWarrantyTermsDays] = useState(company.warrantyTermsDays || 90);
  const [defaultDepositPercentage, setDefaultDepositPercentage] = useState(
    company.defaultDepositPercentage || 50
  );

  // WhatsApp Config state
  const [waConfig, setWaConfig] = useState<CompanyWhatsAppConfig>(
    company.whatsappConfig || {
      enabled: true,
      provider: 'manual_fallback' as WhatsAppProvider,
      status: 'conectado',
      phoneNumber: company.phone,
      phoneNumberId: '',
      businessAccountId: '',
      apiKeyConfigured: false,
      deliveryFormat: 'documento_formatado',
      lastConnectedAt: new Date().toISOString().split('T')[0],
    }
  );

  // Testing & Save feedback
  const [isTestingWa, setIsTestingWa] = useState(false);
  const [waTestFeedback, setWaTestFeedback] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Confirmation dialog state for suspension
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);

  if (!isOpen) return null;

  const isOwnerCompany = users.some(
    (u) => u.companyId === company.id && (u.email === protectedOwnerEmail || u.isOwner)
  );

  const companyUsers = users.filter((u) => u.companyId === company.id);
  const companyTeam = teamMembers.filter((t) => t.companyId === company.id);
  const companyAudits = auditLogs.filter(
    (a) => a.target === company.id || a.target.includes(company.name)
  );

  const handleSave = () => {
    setErrorMessage(null);
    const monthlyPrice = PLAN_CONFIGS[plan]?.price || 97;

    const res = updateCompanyDetails(company.id, {
      name,
      document,
      ownerName,
      ownerEmail,
      phone,
      address,
      city,
      state,
      plan,
      planStatus,
      accountStatus,
      monthlyPrice,
      features,
      osPrefix,
      warrantyTermsDays,
      defaultDepositPercentage,
      whatsappConfig: waConfig,
    });

    if (res.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } else {
      setErrorMessage(res.error || 'Erro ao atualizar dados.');
    }
  };

  const handleToggleSuspension = () => {
    if (isOwnerCompany) {
      setErrorMessage(
        'Ação Proibida: A organização associada ao proprietário (agenciavallor01@gmail.com) é protegida permanentemente.'
      );
      setShowSuspendConfirm(false);
      return;
    }

    const res = toggleCompanySuspension(company.id);
    if (res.success && res.newStatus) {
      setAccountStatus(res.newStatus as AccountStatus);
      setPlanStatus(res.newStatus === 'suspenso' ? 'bloqueado' : 'ativo');
      setShowSuspendConfirm(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  const handleTestWhatsApp = async () => {
    setIsTestingWa(true);
    setWaTestFeedback(null);
    const res = await testCompanyWhatsApp(company.id);
    setIsTestingWa(false);
    setWaTestFeedback(res.message);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-[#04122e] text-white p-4 sm:p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-[#1a2744] text-white flex items-center justify-center font-bold text-lg shadow-md">
              <span className="material-symbols-outlined text-[26px]">apartment</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-headline font-bold text-lg text-white">
                  {company.name}
                </h2>
                {isOwnerCompany && (
                  <span className="bg-amber-400 text-[#04122e] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <span className="material-symbols-outlined text-[13px]">verified</span>
                    Proprietário Protegido
                  </span>
                )}
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    accountStatus === 'ativo'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : accountStatus === 'trial'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-red-500/20 text-red-300'
                  }`}
                >
                  Status: {accountStatus}
                </span>
                <span className="text-[10px] bg-blue-500/20 text-blue-200 font-bold px-2 py-0.5 rounded-full uppercase">
                  Plano {plan} (R$ {PLAN_CONFIGS[plan].price}/mês)
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Responsável: <span className="font-semibold text-white">{ownerName || company.ownerName}</span> • CNPJ/CPF: <span className="font-mono text-white">{formatDocument(document)}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 px-4 pt-2 border-b border-slate-200 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'cadastro', label: 'Dados da Empresa', icon: 'badge' },
            { id: 'assinatura', label: 'Plano & Assinatura', icon: 'credit_card' },
            { id: 'permissoes', label: 'Recursos & Permissões', icon: 'toggle_on' },
            { id: 'config_os', label: 'Configurações de OS', icon: 'assignment' },
            { id: 'whatsapp', label: 'Integração WhatsApp', icon: 'chat' },
            { id: 'equipe', label: `Equipe (${companyUsers.length})`, icon: 'groups' },
            { id: 'auditoria', label: 'Auditoria & Logs', icon: 'shield' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2.5 rounded-t-lg text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-[#04122e] border-t-2 border-t-[#04122e] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-800 flex-1">
          {/* TAB 1: DADOS DA EMPRESA */}
          {activeTab === 'cadastro' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-headline font-bold text-sm text-[#04122e]">
                  Informações Institucionais e Contato
                </h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Dados cadastrais do cliente e informações fiscais da empresa prestadora de serviços.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Razão Social / Nome Fantasia
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#04122e] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    CNPJ ou CPF
                  </label>
                  <input
                    type="text"
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#04122e] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Nome do Responsável / Titular da Conta
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#04122e] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    E-mail do Titular (Acesso)
                  </label>
                  <input
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    disabled={isOwnerCompany}
                    className={`w-full h-10 px-3 border border-slate-200 rounded-lg text-xs outline-none ${
                      isOwnerCompany ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-slate-50 focus:ring-2 focus:ring-[#04122e]'
                    }`}
                  />
                  {isOwnerCompany && (
                    <span className="text-[10px] text-amber-700 font-bold block mt-1">
                      🔒 O e-mail master do proprietário é protegido contra alteração.
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Telefone / WhatsApp Comercial
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#04122e] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Endereço / Logradouro
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Av. Paulista, 1000, Sala 42"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#04122e] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#04122e] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Estado (UF)
                  </label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    maxLength={2}
                    placeholder="SP"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs uppercase font-bold focus:ring-2 focus:ring-[#04122e] outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PLANO & ASSINATURA */}
          {activeTab === 'assinatura' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-headline font-bold text-sm text-[#04122e]">
                  Gestão Comercial e Assinatura Recorrente Mensal
                </h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Planos mensais oficiais do InstalaSaldo (Micro SaaS). Não existem planos vitalícios.
                </p>
              </div>

              {/* Plans selector cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { id: 'essencial', name: 'Essencial', price: 37, desc: 'Instalador individual autônomo' },
                  { id: 'profissional', name: 'Profissional', price: 97, desc: 'Equipes & Sinal Pix Automático' },
                  { id: 'empresa', name: 'Empresa', price: 147, desc: 'Frotas, multi-técnicos e gestão VIP' },
                ].map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setPlan(p.id as PlanTier)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      plan === p.id
                        ? 'border-[#04122e] bg-[#04122e]/5 ring-2 ring-[#04122e]'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#04122e]">{p.name}</span>
                      {plan === p.id && (
                        <span className="material-symbols-outlined text-[#006c49] text-[20px]">
                          check_circle
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <span className="font-headline text-2xl font-black text-[#04122e]">
                        R$ {p.price},00
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">/mês</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{p.desc}</p>
                  </div>
                ))}
              </div>

              {/* Status selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Status da Conta no Sistema
                  </label>
                  <select
                    value={accountStatus}
                    onChange={(e) => setAccountStatus(e.target.value as AccountStatus)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="ativo">Ativo (Acesso Total Liberado)</option>
                    <option value="trial">Trial / Período de Testes</option>
                    <option value="inativo">Inativo (Sem uso recente)</option>
                    <option value="suspenso">Suspenso (Acesso Bloqueado)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Status de Faturamento / Pagamento
                  </label>
                  <select
                    value={planStatus}
                    onChange={(e) => setPlanStatus(e.target.value as PlanStatus)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="ativo">Ativo (Assinatura em dia)</option>
                    <option value="pendente">Pendente (Fatura em aberto)</option>
                    <option value="bloqueado">Bloqueado (Inadimplente &gt; 5 dias)</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
              </div>

              {/* Critical Account Action: Suspension / Reactivation */}
              <div className="pt-4 border-t border-slate-200">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">
                      Controle de Acesso da Organização
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Suspender uma conta revoga instantaneamente as sessões dos técnicos e gerentes vinculados.
                    </p>
                  </div>

                  {accountStatus === 'suspenso' ? (
                    <button
                      type="button"
                      onClick={() => setShowSuspendConfirm(true)}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">lock_open</span>
                      <span>Reativar Conta</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isOwnerCompany}
                      onClick={() => setShowSuspendConfirm(true)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">block</span>
                      <span>Suspender Conta</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RECURSOS & PERMISSÕES */}
          {activeTab === 'permissoes' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-headline font-bold text-sm text-[#04122e]">
                  Habilitação de Módulos e Recursos (Feature Flags)
                </h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Ative ou restrinja módulos específicos para a conta deste cliente.
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    key: 'whatsappAutomated',
                    title: 'Automação de WhatsApp (OS & Sinal)',
                    desc: 'Permite disparar ordens de serviço, comprovantes e lembretes com 1 clique.',
                  },
                  {
                    key: 'digitalSignature',
                    title: 'Assinatura Digital do Cliente',
                    desc: 'Coleta de assinatura na tela do celular pelo instalador em campo.',
                  },
                  {
                    key: 'advancedReports',
                    title: 'Relatórios Financeiros e DRE Avançada',
                    desc: 'Visualização de gráficos de faturamento, margem e exportação CSV.',
                  },
                  {
                    key: 'customBranding',
                    title: 'Personalização com Marca Própria',
                    desc: 'Logotipo e cores customizadas nos comprovantes PDF e links de acompanhamento.',
                  },
                  {
                    key: 'multiTechnicianDispatch',
                    title: 'Despacho Multi-técnicos e Equipes',
                    desc: 'Atribuição de serviços específicos a técnicos individuais com painel isolado.',
                  },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer transition-colors"
                  >
                    <div className="pr-4">
                      <span className="font-bold text-xs text-[#04122e] block">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        {item.desc}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={(features as any)[item.key]}
                      onChange={(e) =>
                        setFeatures({
                          ...features,
                          [item.key]: e.target.checked,
                        })
                      }
                      className="w-5 h-5 rounded border-slate-300 text-[#04122e] focus:ring-[#04122e] cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CONFIGURAÇÕES DE OS */}
          {activeTab === 'config_os' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-headline font-bold text-sm text-[#04122e]">
                  Configurações Operacionais de Ordens de Serviço
                </h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Parâmetros de numeração, garantia e termos contratuais para serviços gerados pela empresa.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Prefixo da Numeração de OS
                  </label>
                  <input
                    type="text"
                    value={osPrefix}
                    onChange={(e) => setOsPrefix(e.target.value)}
                    placeholder="OS-2026-"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-[#04122e] outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Ex: OS-2026-0142</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Prazo de Garantia Padrão (Dias)
                  </label>
                  <input
                    type="number"
                    value={warrantyTermsDays}
                    onChange={(e) => setWarrantyTermsDays(Number(e.target.value))}
                    min={0}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[#04122e] outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Padrão CDC: 90 dias</span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Sinal Sugerido (%)
                  </label>
                  <input
                    type="number"
                    value={defaultDepositPercentage}
                    onChange={(e) => setDefaultDepositPercentage(Number(e.target.value))}
                    min={0}
                    max={100}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[#04122e] outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Sinal de entrada padrão</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: INTEGRAÇÃO WHATSAPP */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-headline font-bold text-sm text-[#04122e]">
                  Configurações do Canal WhatsApp
                </h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Conexão oficial via Meta Cloud API ou link direto para envio de ordens de serviço.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Provedor / Modo de Envio
                  </label>
                  <select
                    value={waConfig.provider}
                    onChange={(e) =>
                      setWaConfig({
                        ...waConfig,
                        provider: e.target.value as any,
                      })
                    }
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="meta_cloud_api">Meta Cloud API (Oficial Meta)</option>
                    <option value="qr_code_webhook">Webhook QR Code (Evolution / Baileys)</option>
                    <option value="manual_fallback">WhatsApp Web Direto (Link wa.me)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Formato Padrão de OS
                  </label>
                  <select
                    value={waConfig.deliveryFormat}
                    onChange={(e) =>
                      setWaConfig({
                        ...waConfig,
                        deliveryFormat: e.target.value as any,
                      })
                    }
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value="documento_formatado">Documento Formatado (Sinal & Saldo Pix)</option>
                    <option value="pdf_comprovante">Recibo / Comprovante PDF</option>
                    <option value="link_seguro">Link Seguro do Cliente</option>
                  </select>
                </div>

                {waConfig.provider === 'meta_cloud_api' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Phone Number ID (Meta)
                      </label>
                      <input
                        type="text"
                        value={waConfig.phoneNumberId || ''}
                        onChange={(e) =>
                          setWaConfig({ ...waConfig, phoneNumberId: e.target.value })
                        }
                        placeholder="Ex: 1098472910398"
                        className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Business Account ID (WABA)
                      </label>
                      <input
                        type="text"
                        value={waConfig.businessAccountId || ''}
                        onChange={(e) =>
                          setWaConfig({ ...waConfig, businessAccountId: e.target.value })
                        }
                        placeholder="Ex: WABA-992384"
                        className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono outline-none"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Status and test button */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#25D366] animate-pulse"></span>
                  <span className="text-xs font-bold text-slate-900">
                    Status da Integração: {waConfig.status.toUpperCase()}
                  </span>
                  {waConfig.lastConnectedAt && (
                    <span className="text-slate-400 text-[10px]">
                      (Última sincronia: {waConfig.lastConnectedAt})
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleTestWhatsApp}
                  disabled={isTestingWa}
                  className="px-4 py-2 bg-[#075E54] hover:bg-[#128C7E] text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isTestingWa ? 'sync' : 'network_check'}
                  </span>
                  <span>{isTestingWa ? 'Testando Conexão...' : 'Testar Conexão WhatsApp'}</span>
                </button>
              </div>

              {waTestFeedback && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>{waTestFeedback}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: EQUIPE & USUÁRIOS */}
          {activeTab === 'equipe' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-headline font-bold text-sm text-[#04122e]">
                  Usuários e Membros da Equipe ({companyUsers.length})
                </h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Técnicos, gerentes e operadores vinculados a esta empresa.
                </p>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {companyUsers.map((u) => (
                  <div key={u.id} className="p-3.5 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#04122e] text-white flex items-center justify-center font-bold text-xs">
                        {u.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{u.name}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold uppercase">
                            {u.role}
                          </span>
                          {u.isOwner && (
                            <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                              Owner
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block">{u.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          u.status === 'ativo'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {u.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: AUDITORIA & SEGURANÇA */}
          {activeTab === 'auditoria' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-headline font-bold text-sm text-[#04122e]">
                  Trilha de Auditoria & Modificações da Conta
                </h3>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Registro cronológico de alterações realizadas pelo Super Admin para conformidade e segurança.
                </p>
              </div>

              {companyAudits.length > 0 ? (
                <div className="space-y-2">
                  {companyAudits.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400 text-[16px]">
                          history
                        </span>
                        <span className="font-bold text-[#04122e]">{log.action}</span>
                        <span className="text-slate-600">• {log.details}</span>
                      </div>
                      <div className="text-slate-400 text-[10px]">
                        {log.timestamp} • Por: {log.userName}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                  Nenhum registro de auditoria específico gravado para esta organização.
                </div>
              )}
            </div>
          )}

          {/* Error and Success banners */}
          {errorMessage && (
            <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>Configurações atualizadas e gravadas na auditoria com sucesso!</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Fechar
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 bg-[#04122e] hover:bg-[#1a2744] active:scale-95 text-white font-headline text-xs font-bold rounded-lg shadow-md transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            <span>Salvar Alterações</span>
          </button>
        </div>
      </div>

      {/* Confirmation Dialog for Suspension */}
      {showSuspendConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">warning</span>
            </div>

            <div className="text-center">
              <h3 className="font-headline font-bold text-base text-[#04122e]">
                {accountStatus === 'suspenso' ? 'Confirmar Reativação' : 'Confirmar Suspensão da Conta'}
              </h3>
              <p className="text-xs text-slate-600 mt-2">
                {accountStatus === 'suspenso'
                  ? `Deseja reativar o acesso da empresa "${company.name}"? Todos os técnicos e gestores vinculados voltarão a ter acesso total ao aplicativo.`
                  : `Tem certeza que deseja suspender a empresa "${company.name}"? Os usuários vinculados perderão imediatamente o acesso operacional às ordens de serviço até nova deliberação.`}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSuspendConfirm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleToggleSuspension}
                className={`px-5 py-2 text-white text-xs font-bold rounded-lg shadow-md ${
                  accountStatus === 'suspenso'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {accountStatus === 'suspenso' ? 'Sim, Reativar Conta' : 'Sim, Suspender Conta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
