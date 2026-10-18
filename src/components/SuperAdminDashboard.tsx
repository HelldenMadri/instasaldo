import React, { useState } from 'react';
import { useApp, PLAN_CONFIGS } from '../context/AppContext';
import { User, PlanTier, PlanStatus, Company } from '../types';
import { formatCurrency } from '../utils/formatters';
import { Logo } from './Logo';
import { CustomerManagementModal } from './CustomerManagementModal';

export const SuperAdminDashboard: React.FC = () => {
  const {
    currentUser,
    users,
    companies,
    updateUserAdmin,
    toggleCompanySuspension,
    changeCompanyPlan,
    auditLogs,
    setActiveView,
    loginAsRole,
    switchUser,
    protectedOwnerEmail,
  } = useApp();

  // Search & filter state for customer/user directory
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterAccountStatus, setFilterAccountStatus] = useState<string>('all');
  const [filterSubscriptionStatus, setFilterSubscriptionStatus] = useState<string>('all');
  const [activeTabPill, setActiveTabPill] = useState<string>('visao-geral');

  // Customer Management Modal State
  const [manageModalCompany, setManageModalCompany] = useState<Company | null>(null);

  // Selected user for quick drawer
  const [selectedUserId, setSelectedUserId] = useState<string>(() => {
    const rodrigo = users.find((u) => u.name.includes('Rodrigo'));
    return rodrigo ? rodrigo.id : users[0].id;
  });

  const selectedUser = users.find((u) => u.id === selectedUserId) || users[0];
  const selectedCompany = companies.find((c) => c.id === selectedUser.companyId) || companies[0];

  // Drawer form state
  const [drawerPlan, setDrawerPlan] = useState<PlanTier>(selectedCompany.plan);
  const [drawerStatus, setDrawerStatus] = useState<PlanStatus>(selectedCompany.planStatus);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Sync drawer when selected user changes
  const handleSelectUser = (u: User) => {
    setSelectedUserId(u.id);
    const comp = companies.find((c) => c.id === u.companyId);
    if (comp) {
      setDrawerPlan(comp.plan);
      setDrawerStatus(comp.planStatus);
    }
  };

  const handleSaveDrawer = () => {
    setIsSaving(true);
    setDrawerError(null);
    setTimeout(() => {
      const res = updateUserAdmin(selectedUserId, {
        plan: drawerPlan,
        status: drawerStatus,
      });
      setIsSaving(false);
      if (res && !res.success) {
        setDrawerError(res.error || 'Erro ao atualizar usuário.');
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    }, 400);
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const comp = companies.find((c) => c.id === u.companyId);
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (comp && comp.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (comp && comp.document.includes(searchTerm));

    const matchesPlan = filterPlan === 'all' || (comp && comp.plan === filterPlan);
    const matchesAccountStatus =
      filterAccountStatus === 'all' || (comp && comp.accountStatus === filterAccountStatus);
    const matchesSubStatus =
      filterSubscriptionStatus === 'all' || (comp && comp.planStatus === filterSubscriptionStatus);

    return matchesSearch && matchesPlan && matchesAccountStatus && matchesSubStatus;
  });

  // Owner Authorization Check (agenciavallor01@gmail.com exclusive access)
  const isAuthorizedOwner = currentUser.email === protectedOwnerEmail;

  if (!isAuthorizedOwner) {
    return (
      <div className="min-h-screen bg-[#04122e] text-white flex items-center justify-center p-6">
        <div className="bg-[#1a2744] rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-slate-700/80 text-center space-y-6 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30 shadow-inner">
            <span className="material-symbols-outlined text-[36px]">shield_lock</span>
          </div>

          <div>
            <span className="bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-amber-400/30">
              Segurança Multiempresa
            </span>
            <h1 className="font-headline font-bold text-xl text-white mt-3">
              Área Restrita ao Proprietário Master
            </h1>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              O Painel Super Admin é acessível exclusivamente pelo proprietário autorizado:{' '}
              <span className="font-mono font-bold text-amber-300 bg-black/40 px-2 py-0.5 rounded">
                {protectedOwnerEmail}
              </span>.
            </p>
            <p className="text-[11px] text-slate-400 mt-2">
              Usuário logado atualmente: <strong className="text-white">{currentUser.name}</strong> ({currentUser.email}).
              Tentativas de acesso não autorizadas são bloqueadas e registradas na auditoria.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setActiveView('inicio')}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors"
            >
              Voltar ao Meu Painel
            </button>
            <button
              onClick={() => {
                switchUser('usr-superadmin');
              }}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#04122e] text-xs font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              <span>Entrar como Proprietário Autorizado</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleExportReport = () => {
    showToast(
      'Relatório Consolidado InstalaSaldo (CSV/Excel) gerado com sucesso! Total Usuários: 3.890 | Empresas Ativas: 1.248 | MRR: R$ 94.110,00'
    );
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex">
      {/* Super Admin Left Sidebar (Image 7) */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-[#eff4ff] shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex flex-col justify-between border-r border-slate-200/80">
        <div className="flex flex-col">
          {/* Logo & Header */}
          <div className="h-16 px-4 flex items-center gap-2.5 bg-[#eff4ff] border-b border-slate-200/60">
            <Logo size="sm" iconOnly />
            <div className="flex flex-col">
              <span className="font-headline text-base text-[#04122e] tracking-tight font-bold">
                InstalaSaldo
              </span>
              <span className="text-[11px] text-[#45464d] font-medium">
                Painel Global
              </span>
            </div>
            <span className="ml-auto bg-[#04122e] text-[#4edea3] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Super Admin
            </span>
          </div>

          {/* Mode Pill */}
          <div className="px-4 py-3">
            <div className="bg-[#e5eeff] rounded-lg p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#006c49] animate-pulse"></span>
                <span className="text-xs text-[#0b1c30] font-semibold">
                  Produção (Demo Ativo)
                </span>
              </div>
              <span className="material-symbols-outlined text-[16px] text-slate-500">
                lock_open
              </span>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="px-4 pt-1">
            <p className="px-2 pb-2 text-[11px] text-[#45464d] uppercase tracking-wider font-bold">
              Menu Principal
            </p>
            <nav className="flex flex-col gap-1">
              {[
                { id: 'visao-geral', label: 'Visão Geral', icon: 'grid_view' },
                { id: 'empresas', label: 'Empresas', icon: 'apartment' },
                { id: 'usuarios', label: 'Usuários', icon: 'manage_accounts' },
                { id: 'assinaturas', label: 'Assinaturas & Planos', icon: 'credit_card' },
                { id: 'equipes', label: 'Equipes & Técnicos', icon: 'groups' },
                { id: 'auditoria', label: 'Auditoria & Logs', icon: 'shield' },
                { id: 'configuracoes', label: 'Configurações do Sistema', icon: 'tune' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTabPill(item.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left ${
                    activeTabPill === item.id
                      ? 'bg-[#1a2744] text-white shadow-sm'
                      : 'text-[#45464d] hover:bg-blue-100/60 hover:text-[#0b1c30]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[19px]">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* User Card at Bottom */}
        <div className="p-3 bg-white/90 mx-3 mb-3 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#04122e] text-white flex items-center justify-center font-bold text-xs">
              AD
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-[#0b1c30] truncate">
                Adm. Operacional
              </span>
              <span className="text-[10px] text-[#006c49] font-semibold truncate">
                Super Administrador
              </span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-[10px] text-slate-400 font-mono">Versão 2.4.0-core</span>
            <button
              onClick={() => loginAsRole('empresa_admin')}
              title="Alternar para conta de instalador/empresa"
              className="text-[#04122e] hover:text-[#006c49] transition-colors flex items-center gap-0.5 text-[10px] font-bold"
            >
              <span>Ver App</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel Content Area (Offset by 72 = 18rem) */}
      <div className="pl-72 flex-1 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="h-16 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-30 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar empresa, usuário, CNPJ ou e-mail..."
                className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-[#0b1c30] placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#1a2744] transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
              <span className="w-2 h-2 rounded-full bg-[#6cf8bb]"></span>
              <span className="text-xs text-[#0b1c30] font-semibold">
                Ambiente de Produção (Modo Demo Ativo)
              </span>
            </div>

            <button
              onClick={() => showToast('Sem novos alertas críticos no servidor de pagamentos.')}
              className="relative w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-600 ring-2 ring-white"></span>
            </button>

            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#04122e] text-white flex items-center justify-center font-bold text-xs">
                SA
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-[#0b1c30] leading-tight">
                  Super Admin
                </span>
                <span className="text-[10px] text-slate-500">Acesso Irrestrito</span>
              </div>
            </div>
          </div>
        </header>

        {/* Master Dashboard Body */}
        <main className="p-6 lg:p-8 space-y-6 max-w-[1600px] w-full mx-auto">
          {/* Tarja de Advertência / Homologação & Ações Rápidas (Image 7) */}
          <div className="bg-[#e5eeff] rounded-2xl p-5 shadow-sm border border-blue-200/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-200 flex items-center justify-center shrink-0 shadow-sm text-amber-900">
                <span className="material-symbols-outlined text-[24px]">verified_user</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-headline text-base text-[#04122e] font-bold">
                    Ambiente Administrativo Master
                  </span>
                  <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-amber-300">
                    Homologação
                  </span>
                </div>
                <span className="text-xs text-[#45464d] mt-0.5">
                  Dados operacionais agregados em tempo real de clientes, instaladores e liquidações bancárias Pix.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="bg-white px-3 py-2 rounded-lg shadow-sm border border-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#006c49] animate-ping"></span>
                <span className="text-xs font-semibold text-[#0b1c30]">Sync: 14:48:12</span>
              </div>
              <button
                onClick={handleExportReport}
                className="h-10 px-4 bg-[#dce9ff] hover:bg-[#d3e4fe] text-[#04122e] text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span>Exportar Relatório</span>
              </button>
              <button
                onClick={() => showToast('Módulo de cadastro de novo usuário: clique em Gerenciar em qualquer empresa para convidar membros.')}
                className="h-10 px-4 bg-[#04122e] hover:bg-[#1a2744] text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                <span>Cadastrar Usuário</span>
              </button>
            </div>
          </div>

          {/* Navegação em Pílulas / Módulos do Sistema (Image 7) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'visao-geral', label: 'Visão Geral & KPIs', icon: 'speed' },
              { id: 'empresas', label: `Empresas (${companies.length})`, icon: 'apartment' },
              { id: 'usuarios', label: `Usuários (${users.length})`, icon: 'manage_accounts' },
              { id: 'assinaturas', label: 'Planos & Assinaturas', icon: 'credit_card' },
              { id: 'equipes', label: 'Equipes & Técnicos', icon: 'groups' },
              { id: 'auditoria', label: 'Auditoria & Segurança', icon: 'shield' },
              { id: 'configuracoes', label: 'Configurações', icon: 'tune' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTabPill(tab.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 shadow-sm flex items-center gap-1.5 transition-all ${
                  activeTabPill === tab.id
                    ? 'bg-[#04122e] text-white'
                    : 'bg-white hover:bg-slate-100 text-[#45464d] border border-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ABA 1: VISÃO GERAL */}
          {activeTabPill === 'visao-geral' && (
            <div className="space-y-6 animate-fade-in">
              {/* Top 6 KPI Metric Cards (Image 7) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* KPI 1 */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold">Total Empresas</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#04122e]">
                  <span className="material-symbols-outlined text-[18px]">apartment</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="font-headline font-bold text-2xl text-[#04122e] leading-tight">
                  1.248
                </div>
                <div className="flex items-center gap-1 mt-1 text-[11px]">
                  <span className="text-[#006c49] font-bold flex items-center">
                    <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                    +12.4%
                  </span>
                  <span className="text-slate-400">42 novas no mês</span>
                </div>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold">Total Usuários</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#04122e]">
                  <span className="material-symbols-outlined text-[18px]">group</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="font-headline font-bold text-2xl text-[#04122e] leading-tight">
                  3.890
                </div>
                <div className="flex items-center gap-1 mt-1 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#006c49] shrink-0"></span>
                  <span className="text-slate-500">3.620 ativos no app</span>
                </div>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold">Assinaturas Ativas</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-[#006c49]">
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="font-headline font-bold text-2xl text-[#04122e] leading-tight">
                  1.180
                </div>
                <div className="flex items-center gap-1 mt-1 text-[11px]">
                  <span className="text-[#006c49] font-bold">96.8%</span>
                  <span className="text-slate-400">retenção 30d</span>
                </div>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold">MRR Mensal</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#04122e]">
                  <span className="material-symbols-outlined text-[18px]">payments</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="font-headline font-bold text-xl text-[#04122e] leading-tight">
                  R$ 94.110
                </div>
                <div className="flex items-center gap-1 mt-1 text-[11px]">
                  <span className="text-[#006c49] font-bold flex items-center">
                    <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                    +8.2%
                  </span>
                  <span className="text-slate-400">vs mês anterior</span>
                </div>
              </div>
            </div>

            {/* KPI 5 */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold">Inadimplência</span>
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
                  <span className="material-symbols-outlined text-[18px]">pending_actions</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="font-headline font-bold text-xl text-amber-700 leading-tight">
                  R$ 3.420
                </div>
                <div className="flex items-center gap-1 mt-1 text-[11px]">
                  <span className="bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded text-[10px]">
                    28 faturas
                  </span>
                  <span className="text-slate-400">a regularizar</span>
                </div>
              </div>
            </div>

            {/* KPI 6 */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold">Bloqueados</span>
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-700">
                  <span className="material-symbols-outlined text-[18px]">block</span>
                </div>
              </div>
              <div className="mt-3">
                <div className="font-headline font-bold text-2xl text-red-600 leading-tight">
                  14
                </div>
                <div className="flex items-center gap-1 mt-1 text-[11px]">
                  <span className="text-slate-400">Fraude ou &gt; 30d</span>
                  <span className="text-red-600 font-bold cursor-pointer hover:underline">
                    Verificar
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Seção Central de Métricas Avançadas (2 Colunas - Image 7) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Coluna 1: Evolução do MRR & Faturamento (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-headline text-base font-bold text-[#04122e]">
                      Evolução do MRR & Faturamento
                    </span>
                    <span className="bg-[#6ffbbe] text-[#002113] text-xs px-2.5 py-0.5 rounded-full font-bold">
                      +14.2% YoY
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Histórico mensal de faturamento líquido recorrente de assinaturas (Mai a Nov).
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-[11px] text-slate-600 font-medium">
                    <span className="w-3 h-3 rounded-sm bg-[#04122e]"></span> MRR Pago
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-600 font-medium">
                    <span className="w-3 h-3 rounded-sm bg-[#4edea3]"></span> Previsão
                  </div>
                </div>
              </div>

              {/* Realistic SVG Area & Line Chart */}
              <div className="relative w-full h-60 mt-4 pt-2">
                {/* Horizontal Guide Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                  <div className="h-px bg-slate-400 w-full"></div>
                  <div className="h-px bg-slate-400 w-full"></div>
                  <div className="h-px bg-slate-400 w-full"></div>
                  <div className="h-px bg-slate-400 w-full"></div>
                </div>

                <svg className="w-full h-full overflow-visible" viewBox="0 0 700 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#04122e" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#04122e" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {/* Fill Area */}
                  <polygon
                    fill="url(#chartGradient)"
                    points="50,150 145,138 240,118 335,95 430,78 525,58 620,25 620,185 50,185"
                  />
                  {/* Main Line */}
                  <polyline
                    fill="none"
                    stroke="#04122e"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points="50,150 145,138 240,118 335,95 430,78 525,58 620,25"
                  />
                  {/* Forecast Line */}
                  <polyline
                    fill="none"
                    stroke="#4edea3"
                    strokeWidth="3"
                    strokeDasharray="5,5"
                    points="525,58 620,25"
                  />
                  {/* Data Circles */}
                  <circle cx="50" cy="150" r="4.5" fill="#04122e" />
                  <circle cx="145" cy="138" r="4.5" fill="#04122e" />
                  <circle cx="240" cy="118" r="4.5" fill="#04122e" />
                  <circle cx="335" cy="95" r="4.5" fill="#04122e" />
                  <circle cx="430" cy="78" r="4.5" fill="#04122e" />
                  <circle cx="525" cy="58" r="4.5" fill="#04122e" />
                  <circle cx="620" cy="25" r="6" fill="#006c49" />
                </svg>

                {/* X-axis labels */}
                <div className="flex justify-between text-slate-500 text-xs mt-3 px-2 font-medium">
                  <div className="text-center"><span>Mai</span><span className="block text-[10px] text-slate-400">R$ 68.2k</span></div>
                  <div className="text-center"><span>Jun</span><span className="block text-[10px] text-slate-400">R$ 73.0k</span></div>
                  <div className="text-center"><span>Jul</span><span className="block text-[10px] text-slate-400">R$ 78.8k</span></div>
                  <div className="text-center"><span>Ago</span><span className="block text-[10px] text-slate-400">R$ 84.3k</span></div>
                  <div className="text-center"><span>Set</span><span className="block text-[10px] text-slate-400">R$ 88.1k</span></div>
                  <div className="text-center"><span>Out</span><span className="block text-[10px] text-slate-400">R$ 91.4k</span></div>
                  <div className="text-center font-bold text-[#04122e]"><span>Nov</span><span className="block text-[10px] text-[#006c49] font-bold">R$ 94.1k</span></div>
                </div>
              </div>

              {/* Bottom Target Banner */}
              <div className="mt-5 pt-3 bg-slate-50 rounded-xl p-3 flex items-center justify-between text-xs border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#006c49] text-[20px]">trending_up</span>
                  <span className="font-bold text-slate-800">
                    Meta Trimestral Q4: R$ 105.000,00
                  </span>
                </div>
                <span className="text-slate-500 font-medium">
                  89.6% atingido (Faltam 38 dias)
                </span>
              </div>
            </div>

            {/* Coluna 2: Distribuição de Planos Ativos (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1">
                  <span className="font-headline text-base font-bold text-[#04122e]">
                    Planos Ativos
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">Total: 1.180 assinaturas</span>
                </div>
                <p className="text-xs text-slate-500 mb-5">
                  Repartição da carteira entre os níveis operacionais recorrentes.
                </p>

                <div className="space-y-4">
                  {/* Plano Essencial */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-slate-500"></span>
                        <span className="text-slate-900 font-bold">Essencial (R$ 37/mês)</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#04122e] font-bold">485</span>
                        <span className="text-slate-400 text-[11px] font-normal"> (41.1%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-slate-500 h-2.5 rounded-full" style={{ width: '41.1%' }}></div>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Instalador Individual</span>
                      <span className="font-semibold text-slate-700">R$ 17.945,00/mês</span>
                    </div>
                  </div>

                  {/* Plano Profissional */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#04122e]"></span>
                        <span className="text-slate-900 font-bold">Profissional (R$ 97/mês)</span>
                        <span className="bg-blue-100 text-[#04122e] text-[10px] font-bold px-1.5 py-0.2 rounded">
                          Mais Popular
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#04122e] font-bold">520</span>
                        <span className="text-slate-400 text-[11px] font-normal"> (44.1%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-[#04122e] h-2.5 rounded-full" style={{ width: '44.1%' }}></div>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Multi-equipes & Sinal Pix Automático</span>
                      <span className="font-semibold text-slate-700">R$ 50.440,00/mês</span>
                    </div>
                  </div>

                  {/* Plano Empresa */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#006c49]"></span>
                        <span className="text-slate-900 font-bold">Empresa (R$ 147/mês)</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#04122e] font-bold">175</span>
                        <span className="text-slate-400 text-[11px] font-normal"> (14.8%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-[#006c49] h-2.5 rounded-full" style={{ width: '14.8%' }}></div>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Grandes Frotas & Integração Contábil</span>
                      <span className="font-semibold text-slate-700">R$ 25.725,00/mês</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conversion Callout */}
              <div className="mt-6 pt-3 bg-slate-50 rounded-xl p-3 flex items-center justify-between border border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#04122e] text-[20px]">swap_vert</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">
                      Taxa de Upgrade de Plano
                    </span>
                    <span className="text-[11px] text-slate-500">
                      18 instaladores migraram para Profissional esta semana
                    </span>
                  </div>
                </div>
                <span className="text-[#006c49] font-headline text-base font-bold">
                  +18.5%
                </span>
              </div>
            </div>
          </div>

          {/* Seção Inferior: Atividade de Segurança & Monitoramento de Webhooks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#04122e] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">security</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#04122e]">Liquidações Pix Banco Central</span>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    Gateways ativos operando com 99.98% de SLA nas confirmações em lote.
                  </span>
                  <span className="text-[#006c49] text-[11px] font-bold mt-1">
                    Status: Normal (Latência 240ms)
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#04122e] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">fingerprint</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#04122e]">2FA & Autenticação de Técnicos</span>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    3.140 instaladores com biometria ou código SMS obrigatório ativados no aparelho.
                  </span>
                  <span className="text-[#04122e] text-[11px] font-bold mt-1">
                    Conformidade: 80.7%
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#04122e] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">cloud_sync</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#04122e]">Backups Contábeis em Nuvem</span>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    Último snapshot criptografado das tabelas financeiras gravado com sucesso.
                  </span>
                  <span className="text-slate-400 text-[11px] font-medium mt-1">
                    Hoje às 03:00 UTC-3
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA: USUÁRIOS & OPERADORES */}
        {activeTabPill === 'usuarios' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
            {/* Table Header Filter Bar */}
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-headline text-base font-bold text-[#04122e]">
                    Diretório de Usuários & Assinantes
                  </span>
                  <span className="bg-blue-100 text-[#04122e] text-xs px-2.5 py-0.5 rounded-full font-bold">
                    {users.length} Registros
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pesquise, filtre status bancário e edite permissões completas de acesso de cada conta.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative min-w-[240px]">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar nome, empresa, CNPJ..."
                    className="w-full h-10 pl-9 pr-4 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#1a2744]"
                  />
                </div>

                <select
                  value={filterPlan}
                  onChange={(e) => setFilterPlan(e.target.value)}
                  className="h-10 px-3 bg-white border border-slate-200 text-xs text-slate-700 font-semibold rounded-lg outline-none cursor-pointer"
                >
                  <option value="all">Planos: Todos</option>
                  <option value="essencial">Essencial (R$ 37/mês)</option>
                  <option value="profissional">Profissional (R$ 97/mês)</option>
                  <option value="empresa">Empresa (R$ 147/mês)</option>
                </select>

                <select
                  value={filterAccountStatus}
                  onChange={(e) => setFilterAccountStatus(e.target.value)}
                  className="h-10 px-3 bg-white border border-slate-200 text-xs text-slate-700 font-semibold rounded-lg outline-none cursor-pointer"
                >
                  <option value="all">Status da Conta: Todos</option>
                  <option value="ativo">Ativo</option>
                  <option value="trial">Trial (Testes)</option>
                  <option value="inativo">Inativo</option>
                  <option value="suspenso">Suspenso</option>
                </select>

                <select
                  value={filterSubscriptionStatus}
                  onChange={(e) => setFilterSubscriptionStatus(e.target.value)}
                  className="h-10 px-3 bg-white border border-slate-200 text-xs text-slate-700 font-semibold rounded-lg outline-none cursor-pointer"
                >
                  <option value="all">Faturamento: Todos</option>
                  <option value="ativo">Assinatura Ativa</option>
                  <option value="pendente">Fatura Pendente</option>
                  <option value="bloqueado">Inadimplente Bloqueado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>

            {/* Split Grid: 7 cols table + 5 cols drawer */}
            <div className="grid grid-cols-1 xl:grid-cols-12 min-h-[500px]">
              {/* Left Table */}
              <div className="xl:col-span-7 overflow-x-auto border-r border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Usuário</th>
                      <th className="py-3 px-4">Empresa / Documento</th>
                      <th className="py-3 px-4">Plano</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Cadastro</th>
                      <th className="py-3 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {filteredUsers.map((u) => {
                      const comp = companies.find((c) => c.id === u.companyId);
                      const isSelected = u.id === selectedUserId;
                      return (
                        <tr
                          key={u.id}
                          onClick={() => handleSelectUser(u)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50/80 font-medium' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-full bg-[#04122e] text-white flex items-center justify-center font-bold text-xs shrink-0">
                                {u.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join('')}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900 truncate">
                                    {u.name}
                                  </span>
                                  {(u.email === protectedOwnerEmail || u.isOwner) && (
                                    <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.2 rounded uppercase flex items-center gap-0.5">
                                      <span className="material-symbols-outlined text-[11px]">shield</span>
                                      Owner
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-slate-400 truncate">
                                  {u.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-800 truncate">
                                {comp?.name || 'InstalaSaldo Global'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {comp?.document || '00.000.000/0001-00'}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="text-[11px] bg-blue-100 text-[#04122e] px-2 py-0.5 rounded-full font-bold capitalize">
                              {comp?.plan || 'Profissional'}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold ${
                                u.status === 'ativo'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : u.status === 'pendente'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  u.status === 'ativo'
                                    ? 'bg-emerald-600'
                                    : u.status === 'pendente'
                                    ? 'bg-amber-600'
                                    : 'bg-red-600'
                                }`}
                              ></span>
                              <span className="capitalize">{u.status}</span>
                            </span>
                          </td>

                          <td className="py-3 px-4 text-slate-400 text-[11px]">
                            {u.createdAt}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectUser(u);
                                }}
                                className="w-8 h-8 rounded-lg hover:bg-slate-200 text-[#04122e] inline-flex items-center justify-center transition-colors"
                                title="Visualizar na gaveta rápida"
                              >
                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setManageModalCompany(comp || companies[0]);
                                }}
                                className="px-2 py-1 rounded-md bg-[#04122e] hover:bg-[#1a2744] text-white text-[11px] font-bold inline-flex items-center gap-1 shadow-sm transition-all"
                                title="Abrir gestão completa da conta"
                              >
                                <span className="material-symbols-outlined text-[13px]">settings</span>
                                <span>Gerenciar</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Table Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Exibindo 1 a {filteredUsers.length} de 3.890 instaladores</span>
                  <div className="flex items-center gap-1">
                    <button className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center disabled:opacity-50">
                      <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                    <button className="w-8 h-8 rounded-lg bg-[#04122e] text-white font-bold text-xs flex items-center justify-center">
                      1
                    </button>
                    <button className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-700 text-xs flex items-center justify-center">
                      2
                    </button>
                    <button className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-700 text-xs flex items-center justify-center">
                      3
                    </button>
                    <span className="px-1 text-slate-400">...</span>
                    <button className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Detail Drawer (Image 7) */}
              <div className="xl:col-span-5 bg-[#eff4ff] p-6 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Drawer Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-[#04122e] text-white flex items-center justify-center text-xl font-bold shadow-md">
                        {selectedUser.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-headline text-base font-bold text-[#04122e]">
                            {selectedUser.name}
                          </h3>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                              drawerStatus === 'ativo'
                                ? 'bg-emerald-100 text-emerald-800'
                                : drawerStatus === 'pendente'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {drawerStatus.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                          {selectedUser.email}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Operacional & Cadastrais */}
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                      Dados Operacionais & Cadastrais
                    </span>

                    {/* Empresa Vinculada */}
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1 font-semibold">
                        Empresa Vinculada & CNPJ
                      </label>
                      <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 text-slate-800 text-xs border border-slate-200">
                        <span className="material-symbols-outlined text-[#04122e] text-[18px]">
                          domain
                        </span>
                        <span className="truncate font-bold">
                          {selectedCompany.name} ({selectedCompany.document})
                        </span>
                      </div>
                    </div>

                    {/* Plano e Status Selectors */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1 font-semibold">
                          Plano Vigente
                        </label>
                        <select
                          value={drawerPlan}
                          onChange={(e) => setDrawerPlan(e.target.value as PlanTier)}
                          className="w-full h-10 px-3 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg outline-none font-bold cursor-pointer"
                        >
                          <option value="profissional">Profissional (R$ 97/mês)</option>
                          <option value="essencial">Essencial (R$ 37/mês)</option>
                          <option value="empresa">Empresa (R$ 147/mês)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1 font-semibold">
                          Status de Conectividade
                        </label>
                        <select
                          value={drawerStatus}
                          onChange={(e) => setDrawerStatus(e.target.value as PlanStatus)}
                          className="w-full h-10 px-3 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-lg outline-none font-bold cursor-pointer"
                        >
                          <option value="ativo">Conta Ativa (Irrestrita)</option>
                          <option value="pendente">Pendente Regularização</option>
                          <option value="bloqueado">Bloquear Acesso Total</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Usage Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-3.5 rounded-xl shadow-sm border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">Ordens de Serviço</span>
                      <span className="font-headline text-2xl font-bold text-[#04122e]">
                        {selectedCompany.totalOrdersCount}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Cadastradas no app</span>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl shadow-sm border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">Volume Movimentado</span>
                      <span className="font-headline text-2xl font-bold text-[#006c49]">
                        {formatCurrency(selectedCompany.totalVolume)}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Sinal + Saldo recebidos</span>
                    </div>
                  </div>

                  {/* Sessions & Connected Hardware */}
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        Sessões & Hardware Conectado
                      </span>
                      <span className="text-[#006c49] text-[11px] font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#006c49]"></span> Online agora
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-800 text-xs">
                      <span className="material-symbols-outlined text-slate-400 text-[18px]">
                        smartphone
                      </span>
                      <span>{selectedUser.connectedDevice || 'iPhone 14 Pro — iOS 17.4 (PWA App v2.4.0)'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                      <span className="material-symbols-outlined text-slate-400 text-[16px]">
                        schedule
                      </span>
                      <span>Último fechamento de sinal Pix: {selectedUser.lastLogin || 'Hoje às 14:32'}</span>
                    </div>
                  </div>
                </div>

                {/* Drawer Footer Actions */}
                <div className="mt-6 pt-4 border-t border-slate-200/80 space-y-3">
                  {drawerError && (
                    <div className="p-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">error</span>
                      <span>{drawerError}</span>
                    </div>
                  )}

                  <button
                    onClick={() => setManageModalCompany(selectedCompany)}
                    className="w-full h-11 bg-white hover:bg-slate-100 text-[#04122e] font-bold text-xs rounded-lg border border-slate-300 shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px] text-[#006c49]">settings_suggest</span>
                    <span>Abrir Gestão Completa da Conta & WhatsApp</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveDrawer}
                      disabled={isSaving}
                      className={`flex-1 h-11 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 ${
                        saveSuccess
                          ? 'bg-[#006c49]'
                          : 'bg-[#04122e] hover:bg-[#1a2744] active:scale-95'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {saveSuccess ? 'done' : isSaving ? 'refresh' : 'save'}
                      </span>
                      <span>
                        {saveSuccess
                          ? 'Modificações Salvas!'
                          : isSaving
                          ? 'Atualizando...'
                          : 'Salvar Alterações'}
                      </span>
                    </button>

                    <button
                      onClick={() => showToast(`Link seguro de redefinição de credencial enviado para ${selectedUser.email}`)}
                      className="h-11 px-3 bg-white hover:bg-slate-100 text-[#04122e] border border-slate-200 rounded-lg transition-colors flex items-center justify-center"
                      title="Reenviar link de redefinição de credencial"
                    >
                      <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                    </button>

                    <button
                      onClick={() => showToast(`Auditoria Financeira da Conta (${selectedUser.id}): Volume ${formatCurrency(selectedCompany.totalVolume)} — Conformidade 100% OK`)}
                      className="h-11 px-3 bg-white hover:bg-slate-100 text-[#04122e] border border-slate-200 rounded-lg transition-colors flex items-center justify-center"
                      title="Histórico de auditoria e auditoria financeira"
                    >
                      <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                    <span>ID Interno: UUID-8941-{selectedCompany.name.slice(0, 5).toUpperCase()}-BR</span>
                    <button
                      onClick={() => showToast('Dispositivos desvinculados com sucesso. Próximo acesso exigirá revalidação.')}
                      className="text-red-600 hover:underline font-bold"
                    >
                      Desvincular Dispositivos
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA: EMPRESAS */}
        {activeTabPill === 'empresas' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-headline text-base font-bold text-[#04122e]">
                    Empresas & Negócios Cadastrados
                  </span>
                  <span className="bg-blue-100 text-[#04122e] text-xs px-2.5 py-0.5 rounded-full font-bold">
                    {companies.length} Empresas
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gerencie permissões empresariais, planos de cobrança e suspensão de contas.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative min-w-[240px]">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar empresa, CNPJ, cidade..."
                    className="w-full h-10 pl-9 pr-4 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#1a2744]"
                  />
                </div>
                <select
                  value={filterPlan}
                  onChange={(e) => setFilterPlan(e.target.value)}
                  className="h-10 px-3 bg-white border border-slate-200 text-xs text-slate-700 font-semibold rounded-lg outline-none cursor-pointer"
                >
                  <option value="all">Planos: Todos</option>
                  <option value="essencial">Essencial (R$ 37/mês)</option>
                  <option value="profissional">Profissional (R$ 97/mês)</option>
                  <option value="empresa">Empresa (R$ 147/mês)</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Empresa / Documento</th>
                    <th className="py-3 px-4">Responsável / E-mail</th>
                    <th className="py-3 px-4">Localização</th>
                    <th className="py-3 px-4">Plano Vigente</th>
                    <th className="py-3 px-4">Status da Assinatura</th>
                    <th className="py-3 px-4">Ordens de Serviço</th>
                    <th className="py-3 px-4">Volume Faturado</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {companies
                    .filter((c) => {
                      const matchesSearch =
                        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.document.includes(searchTerm) ||
                        c.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.email.toLowerCase().includes(searchTerm.toLowerCase());
                      const matchesPlan = filterPlan === 'all' || c.plan === filterPlan;
                      return matchesSearch && matchesPlan;
                    })
                    .map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-[#04122e] text-white flex items-center justify-center font-bold text-xs shrink-0">
                              <span className="material-symbols-outlined text-[18px]">apartment</span>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-slate-900 truncate">{c.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{c.document || 'Sem CNPJ informado'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800">{c.ownerName || 'Responsável'}</span>
                            <span className="text-[11px] text-slate-400 truncate">{c.email}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {c.city && c.state ? `${c.city}/${c.state}` : 'Brasil'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[11px] bg-blue-100 text-[#04122e] px-2.5 py-0.5 rounded-full font-bold capitalize">
                            {c.plan} (R$ {c.monthlyPrice}/mês)
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold ${
                              c.planStatus === 'ativo'
                                ? 'bg-emerald-100 text-emerald-800'
                                : c.planStatus === 'pendente'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                c.planStatus === 'ativo'
                                  ? 'bg-emerald-600'
                                  : c.planStatus === 'pendente'
                                  ? 'bg-amber-600'
                                  : 'bg-red-600'
                              }`}
                            />
                            <span className="capitalize">{c.planStatus}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">{c.totalOrdersCount} OS</td>
                        <td className="py-3 px-4 font-bold text-[#006c49]">{formatCurrency(c.totalVolume)}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {c.planStatus !== 'ativo' && (
                              <button
                                onClick={() => {
                                  changeCompanyPlan(c.id, c.plan || 'essencial');
                                  showToast(`Plano da empresa ${c.name} liberado com sucesso pelo Super Admin!`);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold inline-flex items-center gap-1 shadow-sm transition-all"
                                title="Ativar plano manualmente (Pix direto / autorização do Super Admin)"
                              >
                                <span className="material-symbols-outlined text-[14px]">bolt</span>
                                <span>Liberar Plano</span>
                              </button>
                            )}
                            <button
                              onClick={() => setManageModalCompany(c)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#04122e] hover:bg-[#1a2744] text-white text-[11px] font-bold inline-flex items-center gap-1 shadow-sm transition-all"
                            >
                              <span className="material-symbols-outlined text-[14px]">settings</span>
                              <span>Gerenciar</span>
                            </button>
                            <button
                              onClick={() => {
                                toggleCompanySuspension(c.id);
                                showToast(`Status da empresa ${c.name} atualizado com sucesso.`);
                              }}
                              className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                                c.accountStatus === 'suspenso'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                  : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                              }`}
                              title={c.accountStatus === 'suspenso' ? 'Reativar conta' : 'Suspender acesso'}
                            >
                              {c.accountStatus === 'suspenso' ? 'Reativar' : 'Suspender'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA: ASSINATURAS & PLANOS */}
        {activeTabPill === 'assinaturas' && (
          <div className="space-y-6 animate-fade-in">
            {/* 3 Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  tier: 'essencial',
                  name: 'Essencial',
                  price: 'R$ 37,00',
                  period: '/mês',
                  subscribers: '485 assinantes',
                  mrr: 'R$ 17.945,00/mês',
                  badge: 'Autônomos',
                  features: ['Suporte exclusivo por E-mail', 'Até 5 clientes ativos', 'Cadastro de serviços e saldos', 'Comprovante Pix básico'],
                },
                {
                  tier: 'profissional',
                  name: 'Profissional',
                  price: 'R$ 97,00',
                  period: '/mês',
                  subscribers: '520 assinantes',
                  mrr: 'R$ 50.440,00/mês',
                  badge: 'Mais Popular',
                  features: ['Suporte via WhatsApp e E-mail', 'Orçamentos & conversão em OS', 'Fotos antes/depois e assinatura na tela', 'Até 250 clientes'],
                },
                {
                  tier: 'empresa',
                  name: 'Empresa',
                  price: 'R$ 147,00',
                  period: '/mês',
                  subscribers: '175 assinantes',
                  mrr: 'R$ 25.725,00/mês',
                  badge: 'Frotas & Equipes',
                  features: ['Gestão multi-técnicos e equipes', 'Distribuição de rotas de campo', 'Relatórios contábeis e exportação', 'Clientes e OS ilimitados'],
                },
              ].map((p) => (
                <div key={p.tier} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-headline font-bold text-lg text-[#04122e]">{p.name}</span>
                      <span className="bg-blue-100 text-[#04122e] text-[10px] font-bold px-2 py-0.5 rounded-full">{p.badge}</span>
                    </div>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="font-headline font-extrabold text-2xl text-[#04122e]">{p.price}</span>
                      <span className="text-xs text-slate-500">{p.period}</span>
                    </div>
                    <div className="text-xs text-emerald-700 font-bold mb-4 flex items-center gap-2">
                      <span>{p.subscribers}</span>
                      <span>•</span>
                      <span>{p.mrr}</span>
                    </div>
                    <ul className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                      {p.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            {/* Subscriptions Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-headline text-base font-bold text-[#04122e]">Faturamento & Cobrança de Assinaturas</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Visão consolidada das cobranças ativas e renovações Pix recorrentes.</p>
                </div>
                <span className="text-xs font-bold text-[#006c49] bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  MRR Total: R$ 94.110,00/mês
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Empresa</th>
                      <th className="py-3 px-4">Plano</th>
                      <th className="py-3 px-4">Mensalidade</th>
                      <th className="py-3 px-4">Status Cobrança</th>
                      <th className="py-3 px-4">Próxima Renovação</th>
                      <th className="py-3 px-4">Método</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {companies.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold">{c.name}</td>
                        <td className="py-3 px-4 capitalize font-semibold">{c.plan}</td>
                        <td className="py-3 px-4 font-bold text-[#04122e]">{formatCurrency(c.monthlyPrice)}/mês</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${c.planStatus === 'ativo' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
                            {c.planStatus.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{c.nextBillingDate || 'Aguardando Ativação'}</td>
                        <td className="py-3 px-4 font-semibold text-slate-700">Pix Recorrente</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ABA: EQUIPES */}
        {activeTabPill === 'equipes' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-headline text-base font-bold text-[#04122e]">Gestão de Equipes & Técnicos Multiempresa</h3>
                <p className="text-xs text-slate-500 mt-0.5">Visão unificada de instaladores, operadores e administradores de cada empresa parceira.</p>
              </div>
              <span className="bg-blue-100 text-[#04122e] text-xs px-3 py-1 rounded-full font-bold">
                {users.length} Colaboradores
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Profissional</th>
                    <th className="py-3 px-4">Empresa Vinculada</th>
                    <th className="py-3 px-4">Cargo / Função</th>
                    <th className="py-3 px-4">Dispositivo Conectado</th>
                    <th className="py-3 px-4">Telefone / WhatsApp</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {users.map((u) => {
                    const comp = companies.find((c) => c.id === u.companyId);
                    return (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#04122e] text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {u.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900">{u.name}</span>
                              <span className="text-[11px] text-slate-400">{u.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700">{comp?.name || u.companyName || 'InstalaSaldo'}</td>
                        <td className="py-3 px-4">
                          <span className="bg-blue-50 text-[#04122e] px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px]">
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-slate-400">smartphone</span>
                          <span>{u.connectedDevice || 'PWA Mobile v2.4'}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono">{u.phone || '(11) 98765-4321'}</td>
                        <td className="py-3 px-4">
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold text-[10px] capitalize">
                            {u.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA: AUDITORIA & LOGS */}
        {activeTabPill === 'auditoria' && (
          <div className="space-y-6 animate-fade-in">
            {/* 3 Security Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#04122e] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">security</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#04122e]">Liquidações Pix Banco Central</span>
                  <span className="text-[11px] text-slate-500 mt-0.5">Gateways operando com 99.98% de SLA nas confirmações em lote.</span>
                  <span className="text-[#006c49] text-[11px] font-bold mt-1">Status: Normal (Latência 240ms)</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#04122e] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">fingerprint</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#04122e]">2FA & Autenticação de Técnicos</span>
                  <span className="text-[11px] text-slate-500 mt-0.5">3.140 instaladores com biometria ou código SMS obrigatório ativados.</span>
                  <span className="text-[#04122e] text-[11px] font-bold mt-1">Conformidade: 80.7%</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#04122e] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">cloud_sync</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#04122e]">Backups Contábeis em Nuvem</span>
                  <span className="text-[11px] text-slate-500 mt-0.5">Último snapshot criptografado das tabelas financeiras gravado com sucesso.</span>
                  <span className="text-slate-400 text-[11px] font-medium mt-1">Hoje às 03:00 UTC-3</span>
                </div>
              </div>
            </div>

            {/* Live Audit Log Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-headline text-base font-bold text-[#04122e]">Logs de Auditoria do Sistema em Tempo Real</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Rastreamento de autenticação, operações de saldo, orçamentos e alterações contratuais.</p>
                </div>
                <span className="bg-blue-100 text-[#04122e] text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {auditLogs.length} Eventos Registrados
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Data / Hora</th>
                      <th className="py-3 px-4">Usuário</th>
                      <th className="py-3 px-4">Ação</th>
                      <th className="py-3 px-4">Alvo</th>
                      <th className="py-3 px-4">IP</th>
                      <th className="py-3 px-4">Detalhes da Operação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{log.userName}</td>
                        <td className="py-3 px-4">
                          <span className="bg-slate-100 text-[#04122e] font-mono px-2 py-0.5 rounded text-[10px] font-bold">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">{log.target}</td>
                        <td className="py-3 px-4 font-mono text-slate-400">{log.ipAddress}</td>
                        <td className="py-3 px-4 text-slate-600">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ABA: CONFIGURAÇÕES */}
        {activeTabPill === 'configuracoes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#04122e] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">payments</span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-base text-[#04122e]">Gateways de Pagamento Pix</h3>
                  <p className="text-xs text-slate-500">Configuração de liquidações automáticas e chave Pix recebedora master.</p>
                </div>
              </div>
              <div className="space-y-3 border-t border-slate-100 pt-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chave Pix Master (Recebimento de Mensalidades)</label>
                  <input
                    type="text"
                    readOnly
                    value="agenciavallor01@gmail.com"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono text-xs font-bold"
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="font-bold text-emerald-900 text-xs">Webhook Pix Banco Central Ativo</span>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-mono">SLA 99.98%</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#006c49] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">chat</span>
                </div>
                <div>
                  <h3 className="font-headline font-bold text-base text-[#04122e]">WhatsApp & Meta Cloud API</h3>
                  <p className="text-xs text-slate-500">Envio automático de ordens de serviço e recibos de sinal Pix.</p>
                </div>
              </div>
              <div className="space-y-3 border-t border-slate-100 pt-3 text-xs">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <div>
                    <span className="font-bold text-[#04122e] block">Modo Híbrido Ativado</span>
                    <span className="text-[11px] text-slate-500">Disparo via link wa.me direto ou via Meta Cloud API</span>
                  </div>
                  <span className="bg-[#04122e] text-[#4edea3] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Pronto</span>
                </div>
                <button
                  onClick={() => showToast('Configurações salvas e aplicadas em todos os servidores com sucesso!')}
                  className="w-full h-10 bg-[#04122e] hover:bg-[#1a2744] text-white font-bold rounded-xl text-xs transition-all shadow-sm"
                >
                  Salvar Parâmetros Globais
                </button>
              </div>
            </div>
          </div>
        )}
        </main>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#04122e] text-white px-5 py-3.5 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-fade-in max-w-md">
          <span className="material-symbols-outlined text-[#4edea3] text-[20px]">info</span>
          <span className="text-xs font-semibold leading-relaxed">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-auto text-slate-400 hover:text-white text-xs"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Full Customer Account Management Modal */}
      {manageModalCompany && (
        <CustomerManagementModal
          company={manageModalCompany}
          isOpen={!!manageModalCompany}
          onClose={() => setManageModalCompany(null)}
        />
      )}
    </div>
  );
};
