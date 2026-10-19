import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ServiceType, ServiceStatus } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Logo } from './Logo';
import { BtuCalculatorView } from './BtuCalculatorView';
import { OrdersView } from './OrdersView';
import { BudgetsView } from './BudgetsView';
import { PlansView } from './PlansView';
import { TeamView } from './TeamView';

export const MobileFieldApp: React.FC = () => {
  const {
    clients,
    services,
    addService,
    currentUser,
    workOrders,
    setActiveView,
    setIsFieldAppView,
    currentCompany,
    logout,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'inicio' | 'clientes' | 'servicos' | 'agenda' | 'novo-servico' | 'btus' | 'ordens' | 'orcamentos' | 'planos' | 'equipe'
  >('inicio');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Novo Serviço Form State (matching Image 5 defaults)
  const [selectedClientName, setSelectedClientName] = useState<string>('Marcos Silveira Rezende');
  const [selectedClientId, setSelectedClientId] = useState<string>('cli-marcos');
  const [serviceType, setServiceType] = useState<ServiceType>('instalacao');
  const [description, setDescription] = useState<string>('Instalação de Ar-Condicionado Split 12.000 BTUs Inverter');
  const [totalValueStr, setTotalValueStr] = useState<string>('2.800,00');
  const [depositValueStr, setDepositValueStr] = useState<string>('1.000,00');
  const [scheduledDate, setScheduledDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<ServiceStatus>('agendado');
  const [notes, setNotes] = useState<string>('Necessário levar escada de 6 degraus e tubulação extra. Cliente prefere pagar o saldo restante de R$ 1.800,00 via Pix.');
  
  // Feedback Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ title: '', subtitle: '' });

  // Calculation helpers
  const parseVal = (str: string): number => {
    const clean = str.replace(/[^\d]/g, '');
    return (parseFloat(clean) || 0) / 100;
  };

  const totalNum = parseVal(totalValueStr);
  const depositNum = parseVal(depositValueStr);
  const pendingNum = Math.max(0, totalNum - depositNum);
  const paidPercent = totalNum > 0 ? Math.min(100, Math.round((depositNum / totalNum) * 1000) / 10) : 0;

  const handleCurrencyInput = (val: string, setter: (v: string) => void) => {
    const digits = val.replace(/\D/g, '');
    const num = (parseFloat(digits) || 0) / 100;
    setter(num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  const setDatePreset = (offsetDays: number) => {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    setScheduledDate(target.toISOString().split('T')[0]);
  };

  const handleSelectFrequentClient = (name: string) => {
    setSelectedClientName(name);
    const found = clients.find((c) => c.name.toLowerCase().includes(name.toLowerCase()));
    if (found) {
      setSelectedClientId(found.id);
    }
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      alert('Por favor, informe a descrição do serviço.');
      return;
    }

    if (totalNum <= 0) {
      alert('Por favor, informe o valor total do serviço.');
      return;
    }

    addService({
      clientId: selectedClientId || 'cli-marcos',
      clientName: selectedClientName,
      serviceType,
      description,
      totalValue: totalNum,
      depositValue: depositNum,
      scheduledDate,
      status,
      assignedTechnicianId: currentUser.id,
      assignedTechnicianName: currentUser.name,
      notes,
    });

    setToastMessage({
      title: 'Serviço Cadastrado!',
      subtitle: `Saldo de ${formatCurrency(pendingNum)} lançado na agenda.`,
    });
    setShowToast(true);

    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  const handleDiscard = () => {
    setSelectedClientName('Marcos Silveira Rezende');
    setServiceType('instalacao');
    setDescription('');
    setTotalValueStr('0,00');
    setDepositValueStr('0,00');
    setNotes('');
  };

  return (
    <div className="w-full max-w-md mx-auto bg-[#f8f9ff] text-[#0b1c30] min-h-screen flex flex-col relative pb-20 shadow-2xl rounded-2xl overflow-hidden border border-slate-200">
      {/* Mobile Top Header (Image 5) */}
      <header className="sticky top-0 w-full z-40 bg-[#f8f9ff]/90 backdrop-blur-xl border-b border-slate-200/60 shadow-[0_1px_8px_rgba(26,39,68,0.04)]">
        <div className="h-16 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Logo size="sm" iconOnly />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-headline text-base text-[#04122e] font-bold tracking-tight truncate">
                  InstalaSaldo
                </span>
                <span className="text-[11px] font-semibold bg-[#6cf8bb] text-[#005236] px-1.5 py-0.2 rounded-full">
                  PRO
                </span>
              </div>
              <span className="text-[11px] text-[#45464d] truncate">
                {activeTab === 'novo-servico' ? 'Novo Lançamento' : activeTab.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              aria-label="Notificações"
              onClick={() => alert('Sistemas de notificações push e lembretes de saldo ativos.')}
              className="relative w-9 h-9 flex items-center justify-center rounded-full text-[#0b1c30] hover:bg-slate-200 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full ring-2 ring-white"></span>
            </button>
            
            {/* Botão Menu no Canto Direito para Abrir Todas as Páginas */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="h-9 px-3 rounded-xl bg-[#04122e] hover:bg-[#1a2744] text-white flex items-center gap-1.5 text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer"
              title="Abrir Todas as Páginas"
            >
              <span className="material-symbols-outlined text-[19px]">menu</span>
              <span>Menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out Navigation Drawer for Mobile (Menu Lateral) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-5/6 max-w-xs h-full flex flex-col shadow-2xl border-l border-slate-200 animate-slide-left">
            {/* Drawer Header */}
            <div className="bg-[#04122e] text-white p-5 flex items-center justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Logo size="sm" iconOnly />
                  <span className="font-headline font-bold text-sm truncate">
                    {currentCompany?.name || 'InstalaSaldo'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] bg-emerald-500/20 text-[#6ffbbe] font-bold px-2 py-0.5 rounded-full capitalize">
                    Plano {currentCompany?.plan || 'Essencial'}
                  </span>
                  <span className="text-[11px] text-blue-200 truncate">
                    {currentUser?.name}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Drawer Navigation Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-2 pb-1">
                Todas as Páginas
              </span>

              {[
                { id: 'inicio', label: 'Início (Dashboard)', icon: 'home', color: 'text-blue-600' },
                { id: 'btus', label: 'Calculadora de BTUs', icon: 'mode_fan', color: 'text-emerald-600', badge: 'Novo' },
                { id: 'ordens', label: 'Ordens de Serviço (OS)', icon: 'assignment', color: 'text-indigo-600' },
                { id: 'orcamentos', label: 'Orçamentos & Propostas', icon: 'request_quote', color: 'text-purple-600' },
                { id: 'servicos', label: 'Serviços & Saldos', icon: 'calculate', color: 'text-teal-600' },
                { id: 'clientes', label: 'Meus Clientes', icon: 'group', color: 'text-amber-600' },
                { id: 'agenda', label: 'Agenda de Campo', icon: 'calendar_month', color: 'text-blue-500' },
                { id: 'novo-servico', label: 'Cadastrar Novo Serviço', icon: 'add_circle', color: 'text-emerald-500' },
                { id: 'equipe', label: 'Equipe & Técnicos', icon: 'groups', color: 'text-slate-600' },
                { id: 'planos', label: 'Planos & Assinatura', icon: 'credit_card', color: 'text-blue-700' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setIsDrawerOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    activeTab === item.id
                      ? 'bg-blue-50 text-[#04122e] font-bold shadow-sm'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`material-symbols-outlined text-[20px] ${item.color}`}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}

              <div className="pt-3 pb-1 border-t border-slate-100 my-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-2 pb-1">
                  Modo de Exibição
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsFieldAppView(false);
                    setIsDrawerOpen(false);
                  }}
                  className="w-full p-2.5 rounded-xl text-left text-xs font-bold text-[#04122e] bg-slate-100 hover:bg-slate-200 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">desktop_windows</span>
                  <span>Alternar para Painel Web</span>
                </button>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button
                type="button"
                onClick={() => {
                  logout();
                  setIsDrawerOpen(false);
                }}
                className="w-full p-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span>Sair da Conta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col w-full">
        {/* VIEW: NOVO SERVIÇO (Exact replica of Image 5) */}
        {activeTab === 'novo-servico' && (
          <div className="flex flex-col w-full">
            {/* Screen Navigation Bar */}
            <div className="px-4 pt-3 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('inicio')}
                  aria-label="Voltar para Início"
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-200/80 text-[#04122e] hover:bg-slate-300 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                </button>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#04122e] text-[20px]">
                      add_circle
                    </span>
                    <h1 className="font-headline text-lg text-[#04122e] font-bold tracking-tight truncate">
                      Novo Serviço
                    </h1>
                  </div>
                  <p className="text-xs text-[#45464d] truncate">
                    Cadastre o serviço, sinal e saldo restante
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#6cf8bb] text-[#005236] flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">bolt</span>
                Rápido
              </span>
            </div>

            <form onSubmit={handleSaveService} className="px-4 flex flex-col gap-4 pb-6">
              {/* Seção 1: Cliente & Escopo */}
              <section className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-[#04122e]">
                      <span className="material-symbols-outlined text-[18px]">person</span>
                    </div>
                    <h2 className="font-headline text-sm font-bold text-[#04122e]">
                      Cliente & Escopo
                    </h2>
                  </div>
                  <span className="text-[11px] text-[#45464d]">* Obrigatórios</span>
                </div>

                {/* Campo Cliente */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#0b1c30] flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      Cliente
                      <span className="text-red-600 font-bold">*</span>
                    </span>
                    <span
                      onClick={() => handleSelectFrequentClient('Condomínio Solar das Flores')}
                      className="text-[11px] text-[#006c49] flex items-center gap-0.5 cursor-pointer font-medium hover:underline"
                    >
                      <span className="material-symbols-outlined text-[14px]">history</span>
                      Recentes
                    </span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <span className="material-symbols-outlined text-[20px]">badge</span>
                    </div>
                    <input
                      type="text"
                      required
                      value={selectedClientName}
                      onChange={(e) => setSelectedClientName(e.target.value)}
                      placeholder="Nome completo ou Razão Social"
                      className="w-full h-12 pl-11 pr-10 bg-slate-50 border border-slate-200 rounded-lg text-sm text-[#0b1c30] placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#04122e] transition-all"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#006c49]">
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    </div>
                  </div>

                  {/* Sugestões Rápidas de Clientes */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar">
                    <span className="text-[11px] text-[#45464d] shrink-0 font-medium">Frequentes:</span>
                    <button
                      type="button"
                      onClick={() => handleSelectFrequentClient('Condomínio Solar das Flores')}
                      className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-[#45464d] text-xs whitespace-nowrap active:bg-slate-300 transition-colors"
                    >
                      Solar das Flores
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectFrequentClient('Dra. Camila Nogueira')}
                      className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-[#45464d] text-xs whitespace-nowrap active:bg-slate-300 transition-colors"
                    >
                      Dra. Camila
                    </button>
                  </div>
                </div>

                {/* Segmented Control: Tipo de Serviço (Instalação vs Manutenção) */}
                <div className="flex flex-col gap-2 pt-1">
                  <label className="text-xs font-semibold text-[#0b1c30] flex items-center gap-1">
                    Tipo de Serviço
                    <span className="text-red-600 font-bold">*</span>
                  </label>
                  <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => setServiceType('instalacao')}
                      className={`h-12 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all select-none ${
                        serviceType === 'instalacao'
                          ? 'bg-[#04122e] text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">bolt</span>
                      <span>Instalação</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setServiceType('manutencao')}
                      className={`h-12 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all select-none ${
                        serviceType === 'manutencao'
                          ? 'bg-[#04122e] text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">build</span>
                      <span>Manutenção</span>
                    </button>
                  </div>
                </div>

                {/* Campo Descrição */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#0b1c30] flex items-center gap-1">
                      Descrição do Serviço
                      <span className="text-red-600 font-bold">*</span>
                    </label>
                    <span className="text-[11px] text-[#45464d] font-mono">
                      {description.length}/200
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={200}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Instalação de Ar-Condicionado Split 12.000 BTUs Inverter na sala principal"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-[#0b1c30] placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#04122e] transition-all resize-none leading-relaxed"
                  />
                </div>
              </section>

              {/* Seção 2: Financeiro & Sinal (Destaque Fintech) */}
              <section className="bg-[#1a2744] text-white rounded-xl p-4 shadow-md flex flex-col gap-4 relative overflow-hidden">
                {/* Ambient glow */}
                <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none"></div>

                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-[#6ffbbe]">
                      <span className="material-symbols-outlined text-[18px]">payments</span>
                    </div>
                    <h2 className="font-headline text-sm font-bold text-white">
                      Financeiro do Serviço
                    </h2>
                  </div>
                  <span className="text-[11px] font-bold bg-[#006c49] text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">calculate</span>
                    Auto-Saldo
                  </span>
                </div>

                {/* Inputs Financeiros */}
                <div className="grid grid-cols-1 gap-3 relative z-10">
                  {/* Valor Total */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-blue-100 flex items-center gap-1">
                      Valor Total do Serviço
                      <span className="text-red-300 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-blue-200 font-headline font-bold text-base">
                        R$
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={totalValueStr}
                        onChange={(e) => handleCurrencyInput(e.target.value, setTotalValueStr)}
                        className="w-full h-12 pl-12 pr-4 bg-[#04122e] border border-blue-900/50 rounded-lg text-lg font-headline font-bold text-white placeholder:text-blue-300/40 focus:outline-none focus:ring-2 focus:ring-[#6ffbbe] transition-all tracking-tight"
                      />
                    </div>
                  </div>

                  {/* Valor Recebido (Sinal) */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-blue-100">
                        Sinal Recebido (Entrada)
                      </label>
                      <span className="text-[11px] text-[#4edea3] font-medium">Pix ou Dinheiro</span>
                    </div>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#4edea3] font-headline font-bold text-base">
                        R$
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={depositValueStr}
                        onChange={(e) => handleCurrencyInput(e.target.value, setDepositValueStr)}
                        className="w-full h-12 pl-12 pr-4 bg-[#04122e] border border-blue-900/50 rounded-lg text-lg font-headline font-bold text-[#6ffbbe] placeholder:text-blue-300/40 focus:outline-none focus:ring-2 focus:ring-[#6ffbbe] transition-all tracking-tight"
                      />
                    </div>
                    <p className="text-[11px] text-blue-200/70">
                      Confirmação de recebimento no ato da aprovação.
                    </p>
                  </div>
                </div>

                {/* Display Dinâmico de Saldo Pendente (Âmbar Liquidez) */}
                <div className="p-3.5 rounded-xl bg-white text-[#0b1c30] flex flex-col gap-1.5 shadow-sm relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-amber-800 uppercase tracking-wider font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      SALDO PENDENTE A RECEBER
                    </span>
                    <span className="text-[11px] text-[#45464d]">(Total - Sinal)</span>
                  </div>

                  <div className="flex items-baseline justify-between pt-0.5">
                    <div className="flex items-baseline gap-1">
                      <span className="font-headline text-base text-slate-500 font-bold">R$</span>
                      <span className="font-headline font-extrabold text-2xl text-[#04122e] tracking-tight">
                        {pendingNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold ${
                      pendingNum === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {pendingNum === 0 ? 'Quitado' : 'Pendente'}
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
                    <div
                      className="bg-[#006c49] h-full rounded-full transition-all duration-300"
                      style={{ width: `${paidPercent}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#45464d] pt-0.5">
                    <span className="font-semibold">{paidPercent}% quitado de entrada</span>
                    <span>Liquidação na entrega</span>
                  </div>
                </div>
              </section>

              {/* Seção 3: Agendamento & Andamento */}
              <section className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-[#04122e]">
                    <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                  </div>
                  <h2 className="font-headline text-sm font-bold text-[#04122e]">
                    Data & Status
                  </h2>
                </div>

                {/* Data com Shortcuts */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#0b1c30]">
                      Data Prevista do Serviço
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setDatePreset(0)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[#04122e] text-[11px] font-semibold transition-colors"
                      >
                        Hoje
                      </button>
                      <button
                        type="button"
                        onClick={() => setDatePreset(1)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[#04122e] text-[11px] font-semibold transition-colors"
                      >
                        Amanhã
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <span className="material-symbols-outlined text-[20px]">event</span>
                    </div>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="w-full h-12 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-[#0b1c30] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#04122e] transition-all"
                    />
                  </div>
                </div>

                {/* Status Chips Selector */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <label className="text-xs font-semibold text-[#0b1c30]">Status Inicial</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'agendado', label: 'Agendado', icon: 'event_upcoming' },
                      { key: 'andamento', label: 'Em Andamento', icon: 'engineering' },
                      { key: 'peca', label: 'Aguardando Peça', icon: 'hourglass_top' },
                      { key: 'concluido', label: 'Concluído', icon: 'task_alt' },
                    ].map((st) => (
                      <button
                        key={st.key}
                        type="button"
                        onClick={() => setStatus(st.key as ServiceStatus)}
                        className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold transition-all text-left ${
                          status === st.key
                            ? 'bg-[#04122e] text-white shadow-sm'
                            : 'bg-slate-50 border border-slate-200 text-[#45464d] hover:bg-slate-100'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">{st.icon}</span>
                        <span className="truncate">{st.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* Seção 4: Observações Técnicas */}
              <section className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex flex-col gap-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-[#04122e]">
                      <span className="material-symbols-outlined text-[18px]">assignment</span>
                    </div>
                    <h2 className="font-headline text-sm font-bold text-[#04122e]">
                      Observações de Campo
                    </h2>
                  </div>
                  <span className="text-[11px] text-[#45464d]">Opcional</span>
                </div>
                <div className="flex flex-col gap-1.5 pt-1">
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Levar escada de 6 degraus e mangueira de cobre adicional. Cliente prefere Pix no término."
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-[#0b1c30] placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#04122e] transition-all resize-none leading-relaxed"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1 text-[#45464d] text-xs">
                  <span className="material-symbols-outlined text-[16px] text-[#006c49]">verified_user</span>
                  <span>As informações ficam salvas em nuvem e integradas ao extrato.</span>
                </div>
              </section>

              {/* Seção 5: CTAs de Ação (Grandes e ergonômicos para polegar) */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="submit"
                  className="w-full h-14 bg-[#04122e] hover:bg-[#1a2744] text-white font-headline text-base font-bold rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
                >
                  <span className="material-symbols-outlined text-[24px]">check_circle</span>
                  <span>Salvar Serviço & Saldo</span>
                </button>
                <button
                  type="button"
                  onClick={handleDiscard}
                  className="w-full h-11 bg-transparent text-[#45464d] text-xs font-semibold rounded-xl hover:bg-slate-200 active:bg-slate-300 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                  <span>Descartar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* VIEW: INÍCIO (Mobile Dashboard) */}
        {activeTab === 'inicio' && (
          <div className="p-4 flex flex-col gap-4">
            <div className="bg-[#1a2744] text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-wider text-blue-200 font-semibold">
                  Saldo Líquido em Carteira
                </span>
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                  Sincronizado
                </span>
              </div>
              <div className="font-headline text-3xl font-extrabold text-white mb-2">
                {formatCurrency(
                  services.reduce((acc, s) => acc + s.depositValue, 0)
                )}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                <span className="text-blue-200">
                  A Receber na Entrega:
                </span>
                <span className="font-headline font-bold text-amber-300">
                  {formatCurrency(
                    services.reduce((acc, s) => acc + s.pendingBalance, 0)
                  )}
                </span>
              </div>
            </div>

            {/* Ações Rápidas de Campo (Grid 2x3 Completo) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Ações Rápidas de Campo
                </span>
                <span className="text-[11px] text-slate-400">Atalhos</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* 1. Novo Serviço */}
                <button
                  type="button"
                  onClick={() => setActiveTab('novo-servico')}
                  className="p-3 bg-white border border-slate-200/90 rounded-2xl shadow-sm flex items-center gap-2.5 text-left hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#04122e] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">add_circle</span>
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-slate-900 block truncate">Novo Serviço</span>
                    <span className="text-[10px] text-slate-500 block truncate">Lançar sinal</span>
                  </div>
                </button>

                {/* 2. Calculadora de BTUs */}
                <button
                  type="button"
                  onClick={() => setActiveTab('btus')}
                  className="p-3 bg-white border border-emerald-300/80 bg-emerald-50/30 rounded-2xl shadow-sm flex items-center gap-2.5 text-left hover:bg-emerald-50 active:scale-95 transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#006c49] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">mode_fan</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-xs text-emerald-950 block truncate">Calc. BTUs</span>
                      <span className="text-[9px] bg-emerald-200 text-[#003823] px-1 rounded font-bold">NOVO</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 block truncate">Cálculo térmico</span>
                  </div>
                </button>

                {/* 3. Ordens de Serviço (OS) */}
                <button
                  type="button"
                  onClick={() => setActiveTab('ordens')}
                  className="p-3 bg-white border border-slate-200/90 rounded-2xl shadow-sm flex items-center gap-2.5 text-left hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">assignment</span>
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-slate-900 block truncate">Ordens (OS)</span>
                    <span className="text-[10px] text-slate-500 block truncate">Fotos & Assinar</span>
                  </div>
                </button>

                {/* 4. Orçamentos */}
                <button
                  type="button"
                  onClick={() => setActiveTab('orcamentos')}
                  className="p-3 bg-white border border-slate-200/90 rounded-2xl shadow-sm flex items-center gap-2.5 text-left hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">request_quote</span>
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-slate-900 block truncate">Orçamentos</span>
                    <span className="text-[10px] text-slate-500 block truncate">Gerar proposta</span>
                  </div>
                </button>

                {/* 5. Meus Clientes */}
                <button
                  type="button"
                  onClick={() => setActiveTab('clientes')}
                  className="p-3 bg-white border border-slate-200/90 rounded-2xl shadow-sm flex items-center gap-2.5 text-left hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">group</span>
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-slate-900 block truncate">Clientes</span>
                    <span className="text-[10px] text-slate-500 block truncate">Contatos & Zap</span>
                  </div>
                </button>

                {/* 6. Extrato & Saldos */}
                <button
                  type="button"
                  onClick={() => setActiveTab('servicos')}
                  className="p-3 bg-white border border-slate-200/90 rounded-2xl shadow-sm flex items-center gap-2.5 text-left hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">receipt_long</span>
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-slate-900 block truncate">Ver Extrato</span>
                    <span className="text-[10px] text-slate-500 block truncate">Saldos & Pix</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Services for today */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-headline text-sm font-bold text-slate-900">
                  Serviços Recentes
                </h3>
                <span className="text-xs text-blue-800 font-semibold cursor-pointer" onClick={() => setActiveTab('servicos')}>
                  Ver todos
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {services.slice(0, 3).map((s) => (
                  <div key={s.id} className="py-2.5 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          s.serviceType === 'instalacao' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {s.serviceType === 'instalacao' ? 'Instalação' : 'Manutenção'}
                        </span>
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {s.clientName}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {s.description}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-headline text-xs font-bold text-slate-900 block">
                        {formatCurrency(s.totalValue)}
                      </span>
                      <span className="text-[10px] text-amber-600 font-semibold">
                        Saldo: {formatCurrency(s.pendingBalance)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW: CLIENTES (Mobile List) */}
        {activeTab === 'clientes' && (
          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-base font-bold text-slate-900">
                Clientes Cadastrados ({clients.length})
              </h2>
              <button
                onClick={() => setActiveView('clientes')}
                className="px-2.5 py-1 text-xs bg-[#04122e] text-white font-bold rounded-lg flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Novo
              </button>
            </div>

            <div className="space-y-2">
              {clients.map((c) => (
                <div key={c.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 truncate">{c.name}</h4>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{c.address}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{c.phone}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={`https://wa.me/55${c.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center hover:bg-emerald-100"
                      title="Chamar no WhatsApp"
                    >
                      <span className="material-symbols-outlined text-[18px]">chat</span>
                    </a>
                    <button
                      onClick={() => {
                        setSelectedClientName(c.name);
                        setSelectedClientId(c.id);
                        setActiveTab('novo-servico');
                      }}
                      className="w-8 h-8 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center hover:bg-blue-100"
                      title="Novo Serviço para este cliente"
                    >
                      <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: SERVIÇOS (Mobile List) */}
        {activeTab === 'servicos' && (
          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-base font-bold text-slate-900">
                Serviços & Saldos ({services.length})
              </h2>
              <button
                onClick={() => setActiveTab('novo-servico')}
                className="px-2.5 py-1 text-xs bg-[#04122e] text-white font-bold rounded-lg flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Cadastrar
              </button>
            </div>

            <div className="space-y-3">
              {services.map((s) => (
                <div key={s.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      s.serviceType === 'instalacao' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {s.serviceType === 'instalacao' ? 'Instalação' : 'Manutenção'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {formatDate(s.scheduledDate)}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 leading-snug">{s.description}</h4>
                  <p className="text-[11px] text-slate-500">Cliente: <span className="font-semibold text-slate-700">{s.clientName}</span></p>

                  <div className="bg-slate-50 p-2.5 rounded-lg flex items-center justify-between text-xs mt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Sinal Recebido:</span>
                      <span className="font-bold text-emerald-700">{formatCurrency(s.depositValue)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Saldo Pendente:</span>
                      <span className={`font-bold ${s.pendingBalance > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                        {formatCurrency(s.pendingBalance)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: AGENDA */}
        {activeTab === 'agenda' && (
          <div className="p-4 flex flex-col gap-3">
            <h2 className="font-headline text-base font-bold text-slate-900">
              Agenda de Campo
            </h2>
            <div className="space-y-2">
              {workOrders.map((o) => (
                <div key={o.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#04122e] flex flex-col items-center justify-center font-bold text-xs shrink-0">
                    <span>{o.scheduledDate.split('-')[2] || '16'}</span>
                    <span className="text-[9px] uppercase font-normal text-slate-500">Out</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 block">{o.code}</span>
                    <h4 className="font-bold text-xs text-slate-900 truncate">{o.clientName}</h4>
                    <p className="text-[11px] text-slate-500 truncate">{o.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-emerald-700">Total: {formatCurrency(o.totalValue)}</span>
                      <span className="text-[10px] text-slate-300">•</span>
                      <span className="text-[10px] text-amber-600 font-semibold">Saldo: {formatCurrency(o.pendingBalance)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: CALCULADORA DE BTUS */}
        {activeTab === 'btus' && (
          <div className="flex flex-col w-full pb-8">
            <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between sticky top-16 z-30 shadow-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('inicio')}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                  title="Voltar ao Início"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-emerald-600 text-[20px]">mode_fan</span>
                  <span className="font-bold text-sm text-[#04122e]">Calculadora BTUs</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                title="Menu"
              >
                <span className="material-symbols-outlined text-[18px]">menu</span>
              </button>
            </div>
            <div className="w-full">
              <BtuCalculatorView />
            </div>
          </div>
        )}

        {/* VIEW: ORDENS DE SERVIÇO (OS) */}
        {activeTab === 'ordens' && (
          <div className="flex flex-col w-full pb-8">
            <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between sticky top-16 z-30 shadow-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('inicio')}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                  title="Voltar ao Início"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-indigo-600 text-[20px]">assignment</span>
                  <span className="font-bold text-sm text-[#04122e]">Ordens de Serviço (OS)</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                title="Menu"
              >
                <span className="material-symbols-outlined text-[18px]">menu</span>
              </button>
            </div>
            <div className="w-full">
              <OrdersView />
            </div>
          </div>
        )}

        {/* VIEW: ORÇAMENTOS */}
        {activeTab === 'orcamentos' && (
          <div className="flex flex-col w-full pb-8">
            <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between sticky top-16 z-30 shadow-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('inicio')}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                  title="Voltar ao Início"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-purple-600 text-[20px]">request_quote</span>
                  <span className="font-bold text-sm text-[#04122e]">Orçamentos & Propostas</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                title="Menu"
              >
                <span className="material-symbols-outlined text-[18px]">menu</span>
              </button>
            </div>
            <div className="w-full">
              <BudgetsView />
            </div>
          </div>
        )}

        {/* VIEW: PLANOS & ASSINATURA */}
        {activeTab === 'planos' && (
          <div className="flex flex-col w-full pb-8">
            <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between sticky top-16 z-30 shadow-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('inicio')}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                  title="Voltar ao Início"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-blue-700 text-[20px]">credit_card</span>
                  <span className="font-bold text-sm text-[#04122e]">Assinatura & Planos</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                title="Menu"
              >
                <span className="material-symbols-outlined text-[18px]">menu</span>
              </button>
            </div>
            <div className="w-full">
              <PlansView />
            </div>
          </div>
        )}

        {/* VIEW: EQUIPE */}
        {activeTab === 'equipe' && (
          <div className="flex flex-col w-full pb-8">
            <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between sticky top-16 z-30 shadow-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('inicio')}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                  title="Voltar ao Início"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-slate-700 text-[20px]">groups</span>
                  <span className="font-bold text-sm text-[#04122e]">Equipe de Técnicos</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                title="Menu"
              >
                <span className="material-symbols-outlined text-[18px]">menu</span>
              </button>
            </div>
            <div className="w-full">
              <TeamView />
            </div>
          </div>
        )}
      </main>

      {/* Interactive Success Toast (Image 5) */}
      <div
        className={`fixed inset-x-4 bottom-20 z-50 transform transition-all duration-300 ease-out ${
          showToast ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-[#006c49] text-white rounded-xl p-4 shadow-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#6cf8bb] text-[#005236] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">check</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-headline text-sm font-bold truncate">
                {toastMessage.title}
              </span>
              <span className="text-xs text-emerald-100 truncate">
                {toastMessage.subtitle}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowToast(false)}
            className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center text-white hover:bg-black/20"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </div>

      {/* Fixed Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto w-full z-40 bg-[#f8f9ff]/95 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-2px_12px_rgba(26,39,68,0.06)]">
        <div className="flex items-center justify-around h-16 px-2">
          <button
            type="button"
            onClick={() => setActiveTab('inicio')}
            className={`flex flex-col items-center justify-center flex-1 h-12 transition-colors cursor-pointer ${
              activeTab === 'inicio' ? 'text-[#04122e] font-bold' : 'text-[#45464d] hover:text-[#04122e]'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">home</span>
            <span className="text-[10px] mt-0.5">Início</span>
            {activeTab === 'inicio' && <span className="w-1 h-1 rounded-full bg-[#04122e] mt-0.5"></span>}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('btus')}
            className={`flex flex-col items-center justify-center flex-1 h-12 transition-colors cursor-pointer ${
              activeTab === 'btus' ? 'text-[#006c49] font-bold' : 'text-[#45464d] hover:text-[#006c49]'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">mode_fan</span>
            <span className="text-[10px] mt-0.5">BTUs</span>
            {activeTab === 'btus' && <span className="w-1 h-1 rounded-full bg-[#006c49] mt-0.5"></span>}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ordens')}
            className={`flex flex-col items-center justify-center flex-1 h-12 transition-colors cursor-pointer ${
              activeTab === 'ordens' ? 'text-[#04122e] font-bold' : 'text-[#45464d] hover:text-[#04122e]'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">assignment</span>
            <span className="text-[10px] mt-0.5">Ordens</span>
            {activeTab === 'ordens' && <span className="w-1 h-1 rounded-full bg-[#04122e] mt-0.5"></span>}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('servicos')}
            className={`flex flex-col items-center justify-center flex-1 h-12 transition-colors cursor-pointer ${
              activeTab === 'servicos' ? 'text-[#04122e] font-bold' : 'text-[#45464d] hover:text-[#04122e]'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">calculate</span>
            <span className="text-[10px] mt-0.5">Serviços</span>
            {activeTab === 'servicos' && <span className="w-1 h-1 rounded-full bg-[#04122e] mt-0.5"></span>}
          </button>

          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="flex flex-col items-center justify-center flex-1 h-12 text-[#45464d] hover:text-[#04122e] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">menu</span>
            <span className="text-[10px] mt-0.5">Menu</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
