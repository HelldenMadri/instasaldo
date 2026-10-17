import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Logo } from './Logo';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    users,
    switchUser,
    activeView,
    setActiveView,
    isFieldAppView,
    setIsFieldAppView,
    isSuperAdmin,
    currentCompany,
    isLiveAuth,
    openAuthModal,
    signOut,
    logout,
    importLocalStorageData,
  } = useApp();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navLinks = [
    { id: 'inicio', label: 'Início', icon: 'dashboard' },
    { id: 'clientes', label: 'Clientes', icon: 'group' },
    { id: 'servicos', label: 'Serviços & Saldos', icon: 'calculate' },
    { id: 'orcamentos', label: 'Orçamentos', icon: 'request_quote' },
    { id: 'ordens', label: 'Ordens (OS)', icon: 'assignment' },
    { id: 'equipe', label: 'Equipe', icon: 'groups' },
    { id: 'planos', label: 'Assinatura', icon: 'credit_card' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_1px_4px_rgba(26,39,68,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Company context */}
        <div className="flex items-center gap-4">
          <div
            onClick={() => setActiveView('inicio')}
            className="cursor-pointer flex items-center"
          >
            <Logo size="md" />
          </div>

          <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-slate-200">
            <span className="text-xs font-bold text-slate-800 truncate max-w-[200px]">
              {currentCompany.name}
            </span>
            <span className="text-[10px] bg-blue-100 text-[#04122e] font-bold px-2 py-0.5 rounded-full capitalize">
              Plano {currentCompany.plan}
            </span>
          </div>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden xl:flex items-center gap-1">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                setActiveView(link.id);
                setIsFieldAppView(false);
              }}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeView === link.id && !isFieldAppView
                  ? 'bg-[#1a2744] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[17px]">{link.icon}</span>
              <span>{link.label}</span>
            </button>
          ))}

          {/* Super Admin Tab - STRICTLY ONLY for agenciavallor01@gmail.com */}
          {isSuperAdmin && (
            <button
              onClick={() => {
                setActiveView('superadmin');
                setIsFieldAppView(false);
              }}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeView === 'superadmin'
                  ? 'bg-[#04122e] text-[#4edea3] shadow-sm'
                  : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
              }`}
            >
              <span className="material-symbols-outlined text-[17px] text-amber-500">
                admin_panel_settings
              </span>
              <span>Super Admin</span>
            </button>
          )}
        </nav>

        {/* Right: Field App Simulator Toggle & User Menu */}
        <div className="flex items-center gap-2.5">
          {/* Supabase Real Auth Trigger */}
          {isLiveAuth ? (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Sessão Supabase</span>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-[#04122e] hover:bg-[#1a2744] text-white shadow-sm transition-all"
              title="Acessar ou registrar conta oficial no Supabase Auth"
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-400">lock</span>
              <span className="hidden sm:inline">Entrar / Supabase</span>
            </button>
          )}

          {/* Mode Toggle Button: Field App (Image 5) vs Desktop Dashboard */}
          <button
            onClick={() => setIsFieldAppView(!isFieldAppView)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
              isFieldAppView
                ? 'bg-[#04122e] text-white border-[#04122e] shadow-sm'
                : 'bg-emerald-50 text-[#006c49] border-emerald-200 hover:bg-emerald-100'
            }`}
            title="Alternar entre visualização de app de campo móvel do instalador e painel de escritório"
          >
            <span className="material-symbols-outlined text-[16px]">
              {isFieldAppView ? 'desktop_windows' : 'smartphone'}
            </span>
            <span className="hidden sm:inline">
              {isFieldAppView ? 'Ver Painel Web' : 'App de Campo Móvel'}
            </span>
          </button>

          {/* User Account Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#04122e] text-white flex items-center justify-center font-bold text-xs ring-2 ring-blue-100">
                {currentUser.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[140px]">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-500 capitalize">
                  {isSuperAdmin ? 'Super Admin Global' : currentUser.role === 'empresa_admin' ? 'Administrador' : 'Técnico'}
                </span>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-[18px]">
                arrow_drop_down
              </span>
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-fade-in">
                <div className="p-3 border-b border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Conta Ativa
                  </span>
                  <p className="font-bold text-xs text-slate-900 mt-0.5">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                  {isSuperAdmin && (
                    <span className="inline-block mt-1 text-[9px] font-extrabold uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                      Root Super Admin
                    </span>
                  )}
                </div>

                {/* Only Super Admin can switch accounts */}
                {isSuperAdmin && (
                  <div className="p-2 border-b border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-2 py-1">
                      Alternar Conta (Super Admin)
                    </span>
                    {users.slice(0, 4).map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          switchUser(u.id);
                          setIsUserMenuOpen(false);
                        }}
                        className={`w-full p-2 rounded-lg text-left text-xs flex items-center justify-between transition-colors ${
                          u.id === currentUser.id
                            ? 'bg-blue-50 font-bold text-[#04122e]'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="min-w-0">
                          <span className="block truncate">{u.name}</span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {u.email}
                          </span>
                        </div>
                        {u.id === currentUser.id && (
                          <span className="material-symbols-outlined text-emerald-600 text-[16px]">
                            check
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                <div className="pt-1 space-y-0.5">
                  {isSuperAdmin && (
                    <button
                      onClick={() => {
                        setActiveView('superadmin');
                        setIsFieldAppView(false);
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full p-2 text-xs font-bold text-amber-700 hover:bg-amber-50 rounded-lg flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">shield</span>
                      <span>Painel Super Admin Master</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      importLocalStorageData();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full p-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-1.5"
                    title="Recupera registros do navegador e sincroniza com a base de dados ativa"
                  >
                    <span className="material-symbols-outlined text-[16px] text-blue-600">cloud_upload</span>
                    <span>Importar Dados Locais</span>
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full p-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">logout</span>
                    <span>Sair do Sistema</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Secondary Bar for small screens */}
      <div className="xl:hidden flex items-center overflow-x-auto px-4 py-2 bg-slate-50 border-t border-slate-200/60 no-scrollbar gap-1.5">
        {navLinks.map((link) => (
          <button
            key={link.id}
            onClick={() => {
              setActiveView(link.id);
              setIsFieldAppView(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeView === link.id && !isFieldAppView
                ? 'bg-[#1a2744] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            {link.label}
          </button>
        ))}
        {isSuperAdmin && (
          <button
            onClick={() => {
              setActiveView('superadmin');
              setIsFieldAppView(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeView === 'superadmin'
                ? 'bg-[#04122e] text-[#4edea3]'
                : 'text-amber-800 bg-amber-50'
            }`}
          >
            Super Admin
          </button>
        )}
      </div>
    </header>
  );
};
