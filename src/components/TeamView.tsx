import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TeamMember } from '../types';
import { formatPhone } from '../utils/formatters';

export const TeamView: React.FC = () => {
  const { teamMembers, addTeamMember, updateTeamMember, deleteTeamMember, currentCompany } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'empresa_admin' | 'gerente' | 'instalador'>('instalador');
  const [status, setStatus] = useState<'ativo' | 'inativo'>('ativo');

  const openCreateModal = () => {
    setEditingMember(null);
    setName('');
    setEmail('');
    setPhone('');
    setRole('instalador');
    setStatus('ativo');
    setIsModalOpen(true);
  };

  const openEditModal = (m: TeamMember) => {
    setEditingMember(m);
    setName(m.name);
    setEmail(m.email);
    setPhone(m.phone);
    setRole(m.role);
    setStatus(m.status);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    if (editingMember) {
      updateTeamMember(editingMember.id, {
        name,
        email,
        phone,
        role,
        status,
      });
    } else {
      addTeamMember({
        name,
        email,
        phone,
        role,
        status,
      });
    }

    setIsModalOpen(false);
  };

  const filteredMembers = teamMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.includes(searchTerm)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-bold text-[#04122e]">
            Equipes & Funcionários de Campo
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestão de técnicos instaladores, gerentes operacionais e permissões da empresa{' '}
            <span className="font-bold text-slate-800">{currentCompany.name}</span>.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="h-11 px-5 bg-[#04122e] hover:bg-[#1a2744] text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          <span>Adicionar Membro</span>
        </button>
      </div>

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
            placeholder="Buscar membro por nome, e-mail ou telefone..."
            className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#1a2744]"
          />
        </div>
        <span className="text-xs text-slate-500 font-semibold">
          {filteredMembers.length} membros na equipe
        </span>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {filteredMembers.map((member) => (
          <div
            key={member.id}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#04122e] text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {member.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-sm text-[#04122e]">
                      {member.name}
                    </h3>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                        member.role === 'empresa_admin'
                          ? 'bg-blue-100 text-blue-900'
                          : member.role === 'gerente'
                          ? 'bg-purple-100 text-purple-900'
                          : 'bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      {member.role === 'empresa_admin'
                        ? 'Administrador'
                        : member.role === 'gerente'
                        ? 'Gerente'
                        : 'Instalador'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(member)}
                    className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-600 flex items-center justify-center"
                    title="Editar"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Deseja remover ${member.name} da equipe?`)) {
                        deleteTeamMember(member.id);
                      }
                    }}
                    className="w-8 h-8 rounded-lg hover:bg-red-50 text-red-500 flex items-center justify-center"
                    title="Remover"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400 text-[16px]">mail</span>
                  <span className="truncate">{member.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400 text-[16px]">call</span>
                  <span>{formatPhone(member.phone)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Ordens Atribuídas: <strong className="text-slate-900">{member.assignedOrdersCount}</strong>
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  member.status === 'ativo'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {member.status.toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Criar/Editar Membro */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-[#04122e] text-white p-4 flex items-center justify-between">
              <h3 className="font-headline font-bold text-base">
                {editingMember ? 'Editar Membro da Equipe' : 'Adicionar Membro da Equipe'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Carlos Silva"
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#04122e]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail de Acesso *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="carlos@empresa.com.br"
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#04122e]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#04122e]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Papel / Função *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 outline-none cursor-pointer"
                  >
                    <option value="instalador">Instalador de Campo</option>
                    <option value="gerente">Gerente Operacional</option>
                    <option value="empresa_admin">Administrador da Empresa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 outline-none cursor-pointer"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
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
                  Salvar Membro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
