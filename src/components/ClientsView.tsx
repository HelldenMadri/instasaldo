import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Client } from '../types';
import { formatPhone, formatDocument } from '../utils/formatters';

export const ClientsView: React.FC = () => {
  const {
    clients,
    addClient,
    updateClient,
    deleteClient,
    services,
    currentCompany,
    isClientsLimitReached,
    companyClientsCount,
    maxClientsLimit,
    openUpgradeModal,
    setActiveView,
  } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [document, setDocument] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('São Paulo');
  const [state, setState] = useState('SP');
  const [notes, setNotes] = useState('');

  const openCreateModal = () => {
    if (isClientsLimitReached) {
      openUpgradeModal('clients');
      return;
    }
    setEditingClient(null);
    setName('');
    setPhone('');
    setWhatsapp('');
    setEmail('');
    setDocument('');
    setAddress('');
    setCity('São Paulo');
    setState('SP');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Client) => {
    setEditingClient(c);
    setName(c.name);
    setPhone(c.phone);
    setWhatsapp(c.whatsapp);
    setEmail(c.email);
    setDocument(c.document);
    setAddress(c.address);
    setCity(c.city);
    setState(c.state);
    setNotes(c.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingClient) {
      updateClient(editingClient.id, {
        name,
        phone,
        whatsapp,
        email,
        document,
        address,
        city,
        state,
        notes,
      });
    } else {
      if (isClientsLimitReached) {
        openUpgradeModal('clients');
        return;
      }
      addClient({
        name,
        phone,
        whatsapp: whatsapp || phone,
        email,
        document,
        address,
        city,
        state,
        notes,
      });
    }

    setIsModalOpen(false);
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.document.includes(searchTerm)
  );

  return (
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-bold text-[#04122e]">
            Gestão de Clientes
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cadastre contatos, WhatsApp direto, endereços e consulte o histórico de atendimentos.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className={`h-11 px-5 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95 self-start sm:self-auto cursor-pointer ${
            isClientsLimitReached
              ? 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 ring-2 ring-amber-300'
              : 'bg-[#04122e] hover:bg-[#1a2744]'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {isClientsLimitReached ? 'lock' : 'person_add'}
          </span>
          <span>{isClientsLimitReached ? 'Limite Atingido (Fazer Upgrade)' : 'Novo Cliente'}</span>
        </button>
      </div>

      {/* Quota Indicator Banner for Limited Plans (Essencial) */}
      {maxClientsLimit !== 'unlimited' && (
        <div
          className={`p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border shadow-sm transition-all ${
            isClientsLimitReached
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-white border-slate-200 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                isClientsLimitReached
                  ? 'bg-amber-500 text-white animate-pulse'
                  : 'bg-[#04122e] text-[#6cf8bb]'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]">
                {isClientsLimitReached ? 'lock' : 'groups'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Cota do Plano {currentCompany.plan.toUpperCase()}
                </span>
                {isClientsLimitReached && (
                  <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Limite 100% Atingido
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-slate-800">
                {companyClientsCount} de {maxClientsLimit} clientes ativos cadastrados ({Math.min(100, Math.round((companyClientsCount / Number(maxClientsLimit)) * 100))}%)
              </p>
              <div className="w-48 bg-slate-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isClientsLimitReached ? 'bg-red-500 w-full' : 'bg-emerald-500'
                  }`}
                  style={{
                    width: isClientsLimitReached
                      ? '100%'
                      : `${Math.min(100, (companyClientsCount / Number(maxClientsLimit)) * 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isClientsLimitReached ? (
              <button
                type="button"
                onClick={() => openUpgradeModal('clients')}
                className="px-4 py-2.5 bg-gradient-to-r from-[#006c49] to-[#04122e] hover:from-[#005236] hover:to-[#1a2744] text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-[#6cf8bb]">rocket_launch</span>
                <span>
                  {currentCompany.plan === 'profissional'
                    ? 'Fazer Upgrade para Empresa (Clientes Ilimitados)'
                    : 'Fazer Upgrade para Profissional (50 clientes)'}
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

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, telefone, CPF/CNPJ ou e-mail..."
            className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#1a2744]"
          />
        </div>
        <span className="text-xs text-slate-500 font-semibold">
          {filteredClients.length} clientes encontrados
        </span>
      </div>

      {/* Clients Cards Grid or Empty State */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[32px]">group_off</span>
          </div>
          <h3 className="font-headline font-bold text-base text-slate-800">
            {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado ainda'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm
              ? `Não encontramos nenhum cliente correspondente à busca "${searchTerm}".`
              : 'Cadastre o primeiro cliente da sua empresa para lançar serviços, orçamentos e ordens de serviço.'}
          </p>
          {!searchTerm && (
            <button
              onClick={openCreateModal}
              className="mt-2 px-4 py-2 bg-[#04122e] text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 hover:bg-[#1a2744] transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">person_add</span>
              <span>Cadastrar Primeiro Cliente</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => {
            const clientServices = services.filter((s) => s.clientId === client.id);
            const totalSpent = clientServices.reduce((acc, s) => acc + s.totalValue, 0);

            return (
              <div
                key={client.id}
                className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#04122e] flex items-center justify-center font-bold text-sm shrink-0">
                        {client.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-headline font-bold text-sm text-[#04122e] truncate">
                          {client.name}
                        </h3>
                        <span className="text-[11px] text-slate-400 block font-mono">
                          {formatDocument(client.document)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(client)}
                        className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-600 flex items-center justify-center"
                        title="Editar"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Deseja realmente excluir ${client.name}?`)) {
                            deleteClient(client.id);
                          }
                        }}
                        className="w-8 h-8 rounded-lg hover:bg-red-50 text-red-500 flex items-center justify-center"
                        title="Excluir"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-400 text-[16px]">call</span>
                      <span>{formatPhone(client.phone)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-400 text-[16px]">mail</span>
                      <span className="truncate">{client.email}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-slate-400 text-[16px] shrink-0 mt-0.5">
                        location_on
                      </span>
                      <span className="line-clamp-2">{client.address}</span>
                    </div>
                    {client.notes && (
                      <div className="p-2 bg-slate-50 rounded-lg text-[11px] text-slate-500 italic mt-2">
                        &quot;{client.notes}&quot;
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom stats and WhatsApp Direct CTA */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total em Serviços</span>
                    <span className="font-bold text-xs text-slate-900">
                      {totalSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>

                  <a
                    href={`https://wa.me/55${client.whatsapp.replace(/\D/g, '')}?text=Olá%20${encodeURIComponent(
                      client.name
                    )},%20sou%20da%20equipe%20de%20instalação!`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-[#006c49] hover:bg-[#005236] text-white text-[11px] font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <span className="material-symbols-outlined text-[15px]">chat</span>
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Criar/Editar Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-[#04122e] text-white p-4 flex items-center justify-between">
              <h3 className="font-headline font-bold text-base">
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo / Razão Social *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: João da Silva ou Condomínio Solar"
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#04122e]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#04122e]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="11987654321"
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#04122e]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#04122e]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CPF ou CNPJ
                  </label>
                  <input
                    type="text"
                    value={document}
                    onChange={(e) => setDocument(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#04122e]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Endereço Completo
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, número, complemento, bairro"
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#04122e]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações Técnicas / Acesso
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Portaria 2, horário comercial, precisa de autorização prévia."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#04122e] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
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
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
