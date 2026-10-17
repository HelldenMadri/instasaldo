import React from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/formatters';

export const MainDashboard: React.FC = () => {
  const {
    services,
    clients,
    workOrders,
    setActiveView,
    setIsFieldAppView,
    currentCompany,
  } = useApp();

  // Metrics
  const totalReceived = services.reduce((acc, s) => acc + s.depositValue, 0);
  const totalPending = services.reduce((acc, s) => acc + s.pendingBalance, 0);
  const inProgressServices = services.filter((s) => s.status === 'andamento').length;
  const completedServices = services.filter((s) => s.status === 'concluido').length;
  const upcomingMaintenance = services.filter((s) => s.serviceType === 'manutencao');

  return (
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-6 w-full">
      {/* Welcome & Context Banner */}
      <div className="bg-[#1a2744] text-white rounded-2xl p-6 shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-blue-200 font-bold">
              Painel Operacional & Financeiro
            </span>
            <span className="bg-[#6cf8bb] text-[#002113] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              Ao Vivo
            </span>
          </div>
          <h1 className="font-headline text-2xl font-bold text-white">
            {currentCompany?.name || 'InstalaSaldo'}
          </h1>
          <p className="text-xs text-blue-100">
            Controle de serviços, liquidação de entradas Pix e saldo pendente em campo.
          </p>
        </div>

        {/* Quick Launch Mobile Field Simulator */}
        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={() => setIsFieldAppView(true)}
            className="px-4 py-2.5 bg-[#006c49] hover:bg-[#005236] text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">smartphone</span>
            <span>Abrir App de Campo (Técnico)</span>
          </button>
        </div>
      </div>

      {/* 5 Main KPI Cards (Requirement 5) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Recebido */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Recebido (Sinal)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#006c49] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">payments</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="font-headline text-2xl font-bold text-[#006c49] leading-tight">
              {formatCurrency(totalReceived)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Pix ou Dinheiro</span>
          </div>
        </div>

        {/* Total a Receber */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total a Receber (Saldo)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">pending_actions</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="font-headline text-2xl font-bold text-amber-600 leading-tight">
              {formatCurrency(totalPending)}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Liquidação na entrega</span>
          </div>
        </div>

        {/* Serviços em Andamento */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Em Andamento</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">engineering</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="font-headline text-2xl font-bold text-slate-900 leading-tight">
              {inProgressServices}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Atendimentos ativos</span>
          </div>
        </div>

        {/* Serviços Concluídos */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Concluídos</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#006c49] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">task_alt</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="font-headline text-2xl font-bold text-slate-900 leading-tight">
              {completedServices}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">100% finalizados</span>
          </div>
        </div>

        {/* Quantidade de Clientes */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Clientes</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-900 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">group</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="font-headline text-2xl font-bold text-slate-900 leading-tight">
              {clients.length}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Empresas e residências</span>
          </div>
        </div>
      </div>

      {/* Ações Rápidas (Requirement 5) */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-3">
        <h3 className="font-headline text-sm font-bold text-[#04122e]">Ações Rápidas</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setActiveView('clientes')}
            className="p-3.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl flex items-center gap-3 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-[#04122e] text-white flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">person_add</span>
            </div>
            <div>
              <span className="font-bold text-xs text-slate-900 block">Novo Cliente</span>
              <span className="text-[10px] text-slate-400">Cadastrar contato</span>
            </div>
          </button>

          <button
            onClick={() => setActiveView('servicos')}
            className="p-3.5 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl flex items-center gap-3 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-[#006c49] text-white flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
            </div>
            <div>
              <span className="font-bold text-xs text-slate-900 block">Novo Serviço</span>
              <span className="text-[10px] text-slate-400">Lançar sinal e saldo</span>
            </div>
          </button>

          <button
            onClick={() => setActiveView('orcamentos')}
            className="p-3.5 bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 rounded-xl flex items-center gap-3 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-700 text-white flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">request_quote</span>
            </div>
            <div>
              <span className="font-bold text-xs text-slate-900 block">Novo Orçamento</span>
              <span className="text-[10px] text-slate-400">Mão de obra & peças</span>
            </div>
          </button>

          <button
            onClick={() => setActiveView('ordens')}
            className="p-3.5 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 rounded-xl flex items-center gap-3 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px]">assignment</span>
            </div>
            <div>
              <span className="font-bold text-xs text-slate-900 block">Nova Ordem (OS)</span>
              <span className="text-[10px] text-slate-400">Execução e fotos</span>
            </div>
          </button>
        </div>
      </div>

      {/* Two Column Layout: Próximas Manutenções & Histórico de Movimentações */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Próximas Manutenções (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-headline text-base font-bold text-[#04122e]">
                Próximas Manutenções
              </h3>
              <p className="text-xs text-slate-500">Preventivas e corretivas agendadas</p>
            </div>
            <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">
              {upcomingMaintenance.length} agendadas
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {upcomingMaintenance.map((m) => (
              <div key={m.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full inline-block mb-1">
                    Manutenção
                  </span>
                  <h4 className="font-bold text-xs text-slate-900 truncate">
                    {m.clientName}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{m.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-semibold text-slate-700 block">
                    {formatDate(m.scheduledDate)}
                  </span>
                  <span className="text-[11px] text-amber-600 font-bold">
                    Saldo: {formatCurrency(m.pendingBalance)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Histórico de Movimentações Recentes (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-headline text-base font-bold text-[#04122e]">
                Histórico de Movimentações
              </h3>
              <p className="text-xs text-slate-500">Últimos lançamentos de serviços e recebimentos</p>
            </div>
            <button
              onClick={() => setActiveView('servicos')}
              className="text-xs text-[#04122e] hover:underline font-bold"
            >
              Ver Extrato Completo
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {services.map((s) => (
              <div key={s.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      s.serviceType === 'instalacao'
                        ? 'bg-blue-50 text-blue-900'
                        : 'bg-amber-50 text-amber-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {s.serviceType === 'instalacao' ? 'bolt' : 'build'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-slate-900 block truncate">
                      {s.description}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Cliente: {s.clientName} • {formatDate(s.scheduledDate)}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-headline text-xs font-bold text-slate-900 block">
                    {formatCurrency(s.totalValue)}
                  </span>
                  <span className="text-[10px] text-[#006c49] font-bold">
                    Sinal: {formatCurrency(s.depositValue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
