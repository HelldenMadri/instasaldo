import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ServiceItem, ServiceType, ServiceStatus } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

export const ServicesView: React.FC = () => {
  const {
    services,
    clients,
    addService,
    updateService,
    deleteService,
    currentUser,
    currentCompany,
    isServicesLimitReached,
    companyMonthServicesCount,
    maxServicesLimit,
    openUpgradeModal,
    setActiveView,
  } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ServiceType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ServiceStatus>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);

  // Form State
  const [clientId, setClientId] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('instalacao');
  const [description, setDescription] = useState('');
  const [totalValue, setTotalValue] = useState<number>(2800);
  const [depositValue, setDepositValue] = useState<number>(1000);
  const [scheduledDate, setScheduledDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [status, setStatus] = useState<ServiceStatus>('agendado');
  const [notes, setNotes] = useState('');

  // Calculations
  const totalVolume = services.reduce((acc, s) => acc + s.totalValue, 0);
  const totalDeposit = services.reduce((acc, s) => acc + s.depositValue, 0);
  const totalPending = services.reduce((acc, s) => acc + s.pendingBalance, 0);

  const openCreateModal = () => {
    if (isServicesLimitReached) {
      openUpgradeModal('services');
      return;
    }
    setEditingService(null);
    setClientId(clients[0]?.id || '');
    setServiceType('instalacao');
    setDescription('');
    setTotalValue(2800);
    setDepositValue(1000);
    setScheduledDate(new Date().toISOString().split('T')[0]);
    setStatus('agendado');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (s: ServiceItem) => {
    setEditingService(s);
    setClientId(s.clientId);
    setServiceType(s.serviceType);
    setDescription(s.description);
    setTotalValue(s.totalValue);
    setDepositValue(s.depositValue);
    setScheduledDate(s.scheduledDate);
    setStatus(s.status);
    setNotes(s.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (clients.length === 0) {
      alert('Cadastre um cliente antes de lançar um serviço!');
      return;
    }
    if (!description.trim()) {
      alert('A Descrição do Serviço é obrigatória!');
      return;
    }

    const selectedClient = clients.find((c) => c.id === clientId) || clients[0];

    if (editingService) {
      updateService(editingService.id, {
        clientId: selectedClient?.id || clientId,
        clientName: selectedClient?.name || 'Cliente',
        serviceType,
        description,
        totalValue,
        depositValue,
        scheduledDate,
        status,
        notes,
      });
    } else {
      if (isServicesLimitReached) {
        openUpgradeModal('services');
        return;
      }
      addService({
        clientId: selectedClient?.id || clientId,
        clientName: selectedClient?.name || 'Cliente',
        serviceType,
        description,
        totalValue,
        depositValue,
        scheduledDate,
        status,
        assignedTechnicianId: currentUser.id,
        assignedTechnicianName: currentUser.name,
        notes,
      });
    }

    setIsModalOpen(false);
  };

  const filteredServices = services.filter((s) => {
    const matchesSearch =
      s.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || s.serviceType === typeFilter;
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-bold text-[#04122e]">
            Gestão de Serviços & Saldos
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Controle em tempo real de entradas de sinal Pix, saldos pendentes e liquidação na entrega.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className={`h-11 px-5 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95 self-start sm:self-auto cursor-pointer ${
            isServicesLimitReached
              ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 ring-2 ring-amber-300'
              : 'bg-[#04122e] hover:bg-[#1a2744]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {isServicesLimitReached ? 'lock' : 'add_circle'}
          </span>
          <span>{isServicesLimitReached ? 'Limite Mensal Atingido (Fazer Upgrade)' : 'Cadastrar Serviço & Saldo'}</span>
        </button>
      </div>

      {/* Quota Indicator Banner for Limited Plans (Essencial) */}
      {maxServicesLimit !== 'unlimited' && (
        <div
          className={`p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border shadow-sm transition-all ${
            isServicesLimitReached
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-white border-slate-200 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                isServicesLimitReached
                  ? 'bg-amber-500 text-white animate-pulse'
                  : 'bg-[#04122e] text-[#6cf8bb]'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">
                {isServicesLimitReached ? 'lock' : 'calendar_month'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Cota Mensal • Plano {currentCompany.plan.toUpperCase()}
                </span>
                {isServicesLimitReached && (
                  <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Limite 100% Atingido
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-slate-800">
                {companyMonthServicesCount} de {maxServicesLimit} serviços realizados neste mês ({Math.min(100, Math.round((companyMonthServicesCount / Number(maxServicesLimit)) * 100))}%)
              </p>
              <div className="w-48 bg-slate-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isServicesLimitReached ? 'bg-red-500 w-full' : 'bg-emerald-500'
                  }`}
                  style={{
                    width: isServicesLimitReached
                      ? '100%'
                      : `${Math.min(100, (companyMonthServicesCount / Number(maxServicesLimit)) * 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isServicesLimitReached ? (
              <button
                type="button"
                onClick={() => openUpgradeModal('services')}
                className="px-4 py-2.5 bg-gradient-to-r from-[#006c49] to-[#04122e] hover:from-[#005236] hover:to-[#1a2744] text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-[#6cf8bb]">rocket_launch</span>
                <span>
                  {currentCompany.plan === 'profissional'
                    ? 'Fazer Upgrade para Empresa (Serviços Ilimitados)'
                    : 'Fazer Upgrade para Profissional (120 serviços/mês)'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveView('planos')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[15px]">upgrade</span>
                <span>Ver Planos</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Financial Overview 3-Card Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Contratado */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 block">Total em Serviços</span>
          <div className="font-headline text-2xl font-bold text-[#04122e] mt-1">
            {formatCurrency(totalVolume)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {services.length} serviços cadastrados
          </span>
        </div>

        {/* Sinal Recebido */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Sinais Recebidos (Entrada)</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              Pix / Dinheiro
            </span>
          </div>
          <div className="font-headline text-2xl font-bold text-[#006c49] mt-1">
            {formatCurrency(totalDeposit)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {totalVolume > 0 ? Math.round((totalDeposit / totalVolume) * 100) : 0}% liquidado no ato
          </span>
        </div>

        {/* Saldo Pendente a Receber */}
        <div className="bg-[#1a2744] text-white p-5 rounded-2xl shadow-md relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-amber-400/10 blur-xl"></div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-amber-200">Saldo Pendente a Receber</span>
            <span className="text-[10px] bg-amber-400 text-amber-950 font-bold px-2 py-0.5 rounded-full">
              A Cobrar
            </span>
          </div>
          <div className="font-headline text-2xl font-bold text-amber-300 mt-1 relative z-10">
            {formatCurrency(totalPending)}
          </div>
          <span className="text-[11px] text-blue-200/80 mt-1 block relative z-10">
            Cobrança na conclusão do serviço
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por descrição ou cliente..."
            className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#1a2744]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Tipo Filter */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                typeFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setTypeFilter('instalacao')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                typeFilter === 'instalacao' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Instalação
            </button>
            <button
              onClick={() => setTypeFilter('manutencao')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                typeFilter === 'manutencao' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Manutenção
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | ServiceStatus)}
            className="h-9 px-3 bg-white border border-slate-200 text-xs text-slate-700 font-semibold rounded-lg outline-none cursor-pointer"
          >
            <option value="all">Status: Todos</option>
            <option value="agendado">Agendado</option>
            <option value="andamento">Em Andamento</option>
            <option value="peca">Aguardando Peça</option>
            <option value="concluido">Concluído</option>
          </select>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <th className="py-3.5 px-4">Tipo & Descrição</th>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Data Prevista</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Valor Total</th>
                <th className="py-3.5 px-4 text-right">Sinal Pago</th>
                <th className="py-3.5 px-4 text-right">Saldo Pendente</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 px-4 text-center">
                    <div className="max-w-sm mx-auto space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <span className="material-symbols-outlined text-[26px]">calculate</span>
                      </div>
                      <p className="font-bold text-sm text-slate-700">
                        {searchTerm ? 'Nenhum serviço encontrado para a busca' : 'Nenhum serviço registrado ainda'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {searchTerm
                          ? 'Tente ajustar os filtros ou os termos da pesquisa.'
                          : 'Clique no botão "+ Novo Serviço" acima para lançar sua primeira instalação ou manutenção.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredServices.map((service) => {
                  const ratio =
                    service.totalValue > 0
                      ? Math.round((service.depositValue / service.totalValue) * 100)
                      : 0;

                return (
                  <tr key={service.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col min-w-[220px]">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              service.serviceType === 'instalacao'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {service.serviceType === 'instalacao' ? 'Instalação' : 'Manutenção'}
                          </span>
                        </div>
                        <span className="font-bold text-slate-900 line-clamp-1">
                          {service.description}
                        </span>
                        {service.notes && (
                          <span className="text-[11px] text-slate-400 italic line-clamp-1 mt-0.5">
                            {service.notes}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {service.clientName}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {formatDate(service.scheduledDate)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold ${
                          service.status === 'concluido'
                            ? 'bg-emerald-100 text-emerald-800'
                            : service.status === 'andamento'
                            ? 'bg-blue-100 text-blue-800'
                            : service.status === 'peca'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="capitalize">{service.status}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-headline font-bold text-slate-900">
                      {formatCurrency(service.totalValue)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-semibold text-[#006c49]">
                      {formatCurrency(service.depositValue)}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        ({ratio}%)
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`font-headline font-bold ${
                          service.pendingBalance > 0 ? 'text-amber-600' : 'text-slate-400'
                        }`}
                      >
                        {formatCurrency(service.pendingBalance)}
                      </span>
                      {service.pendingBalance === 0 && (
                        <span className="block text-[10px] text-emerald-700 font-bold">100% Quitado</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(service)}
                          className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                          title="Editar Serviço"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Deseja excluir este serviço?')) {
                              deleteService(service.id);
                            }
                          }}
                          className="w-8 h-8 rounded-lg hover:bg-red-50 text-red-500 flex items-center justify-center transition-colors"
                          title="Excluir"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Criar/Editar Serviço (Exact implementation of item 7: Instalação/Manutenção + Descrição obrigatória) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full my-8 overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-[#04122e] text-white p-4 flex items-center justify-between">
              <h3 className="font-headline font-bold text-base">
                {editingService ? 'Editar Serviço & Saldo' : 'Cadastrar Serviço & Saldo'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Cliente */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cliente Vinculado *
                </label>
                <select
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#04122e] font-semibold cursor-pointer"
                >
                  {clients.length === 0 ? (
                    <option value="">Nenhum cliente cadastrado (Cadastre um cliente primeiro)</option>
                  ) : (
                    clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Item / Serviço Principal (Obrigatório: Instalação ou Manutenção) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Item / Serviço Principal * (Obrigatório)
                </label>
                <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setServiceType('instalacao')}
                    className={`h-11 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                      serviceType === 'instalacao'
                        ? 'bg-[#04122e] text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">bolt</span>
                    <span>Instalação</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceType('manutencao')}
                    className={`h-11 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                      serviceType === 'manutencao'
                        ? 'bg-[#04122e] text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">build</span>
                    <span>Manutenção</span>
                  </button>
                </div>
              </div>

              {/* Descrição do Serviço (Obrigatório) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Descrição do Serviço * (Obrigatório)
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {description.length}/200
                  </span>
                </div>
                <textarea
                  required
                  rows={3}
                  maxLength={200}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Instalação de Ar-Condicionado Split 12.000 BTUs Inverter"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#04122e] resize-none leading-relaxed"
                />
              </div>

              {/* Financeiro: Valor Total e Sinal Recebido */}
              <div className="p-4 bg-[#1a2744] rounded-xl text-white space-y-3">
                <span className="text-[11px] font-bold text-[#6ffbbe] uppercase tracking-wider block">
                  Cálculo Automático de Saldo
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-blue-200 font-semibold mb-1">
                      Valor Total (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={totalValue}
                      onChange={(e) => setTotalValue(parseFloat(e.target.value) || 0)}
                      className="w-full h-10 px-3 bg-[#04122e] border border-blue-900 rounded-lg text-white font-bold text-sm outline-none focus:ring-2 focus:ring-[#6ffbbe]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-blue-200 font-semibold mb-1">
                      Sinal Recebido (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={depositValue}
                      onChange={(e) => setDepositValue(parseFloat(e.target.value) || 0)}
                      className="w-full h-10 px-3 bg-[#04122e] border border-blue-900 rounded-lg text-[#6ffbbe] font-bold text-sm outline-none focus:ring-2 focus:ring-[#6ffbbe]"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-slate-300">Saldo Pendente a Cobrar:</span>
                  <span className="font-headline text-base font-bold text-amber-300">
                    {formatCurrency(Math.max(0, totalValue - depositValue))}
                  </span>
                </div>
              </div>

              {/* Data e Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data Prevista
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Inicial
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ServiceStatus)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none font-semibold cursor-pointer"
                  >
                    <option value="agendado">Agendado</option>
                    <option value="andamento">Em Andamento</option>
                    <option value="peca">Aguardando Peça</option>
                    <option value="concluido">Concluído</option>
                  </select>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações de Campo
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instruções para a equipe de instalação..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#04122e] hover:bg-[#1a2744] text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Salvar Serviço & Saldo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
