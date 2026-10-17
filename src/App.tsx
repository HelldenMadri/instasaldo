import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { MainDashboard } from './components/MainDashboard';
import { MobileFieldApp } from './components/MobileFieldApp';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { ClientsView } from './components/ClientsView';
import { ServicesView } from './components/ServicesView';
import { BudgetsView } from './components/BudgetsView';
import { OrdersView } from './components/OrdersView';
import { PlansView } from './components/PlansView';
import { TeamView } from './components/TeamView';
import { AuthModal } from './components/AuthModal';

import { LoginView } from './components/LoginView';

const AppContent: React.FC = () => {
  const {
    isAuthenticated,
    isSuperAdmin,
    activeView,
    isFieldAppView,
    setIsFieldAppView,
    currentUser,
    currentCompany,
    isAuthModalOpen,
    closeAuthModal,
    importStatus,
  } = useApp();

  // If not logged in, ALWAYS render the Login Screen
  if (!isAuthenticated) {
    return <LoginView />;
  }

  // Super Admin view ONLY rendered if user is strictly the Super Admin
  if (activeView === 'superadmin' && isSuperAdmin) {
    return (
      <div className="min-h-screen bg-[#f8f9ff]">
        <SuperAdminDashboard />
      </div>
    );
  }

  // Plan Enforcement Gate:
  // If authenticated and NOT SuperAdmin, user MUST have an active plan.
  // If user has no active plan (planStatus !== 'ativo' or accountStatus === 'suspenso'),
  // lock all operational views and field app simulator, redirecting directly to Plans & Payment.
  const hasActivePlan =
    isSuperAdmin ||
    (currentCompany &&
      currentCompany.planStatus === 'ativo' &&
      currentCompany.accountStatus !== 'suspenso');

  if (!hasActivePlan) {
    return (
      <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col font-body">
        <Navbar />

        {/* Warning Banner */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-4 py-3 shadow-md flex items-center justify-center gap-3 text-xs font-bold border-b border-amber-600">
          <span className="material-symbols-outlined text-[20px] text-slate-950">lock</span>
          <span>
            Acesso Restrito: Sua conta não possui um plano ativo no momento. Escolha um plano abaixo para liberar o uso completo do InstalaSaldo.
          </span>
        </div>

        <main className="flex-1 pb-16">
          <PlansView />
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-6 px-4">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-headline font-bold text-slate-800">InstalaSaldo</span>
              <span>• Micro SaaS para Técnicos e Prestadores de Manutenção</span>
            </div>
            <div className="flex items-center gap-3 text-slate-500">
              <span>Suporte: <strong className="text-slate-800">agenciavallor01@gmail.com</strong></span>
              <span>•</span>
              <span className="text-amber-700 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                Aguardando Pagamento: {currentUser.name}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">v2.4.0-core • Brasil</span>
          </div>
        </footer>
      </div>
    );
  }

  // If Mobile Field App simulator view is active, render MobileFieldApp container with simulator controls
  if (isFieldAppView) {
    return (
      <div className="min-h-screen bg-slate-900/95 py-6 px-4 flex flex-col items-center justify-center">
        {/* Floating Top Control */}
        <div className="w-full max-w-md mb-4 bg-white/10 backdrop-blur-md rounded-2xl p-3 flex items-center justify-between text-white border border-white/20 shadow-xl">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold">Simulador de Campo (Técnico PWA)</span>
          </div>
          <button
            onClick={() => setIsFieldAppView(false)}
            className="px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors flex items-center gap-1 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">desktop_windows</span>
            <span>Painel Web</span>
          </button>
        </div>

        {/* Mobile Field Phone Frame matching Image 5 */}
        <div className="w-full max-w-md shadow-2xl rounded-3xl overflow-hidden ring-8 ring-slate-800">
          <MobileFieldApp />
        </div>
      </div>
    );
  }

  // Standard Web App Dashboard Layout
  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col font-body w-full max-w-full overflow-x-hidden">
      <Navbar />

      <main className="flex-1 pb-16 w-full">
        {activeView === 'inicio' && <MainDashboard />}
        {activeView === 'clientes' && <ClientsView />}
        {activeView === 'servicos' && <ServicesView />}
        {activeView === 'orcamentos' && <BudgetsView />}
        {activeView === 'ordens' && <OrdersView />}
        {activeView === 'equipe' && <TeamView />}
        {activeView === 'planos' && <PlansView />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 sm:px-6 w-full">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-headline font-bold text-slate-800">InstalaSaldo</span>
            <span>• Micro SaaS para Técnicos e Prestadores de Manutenção</span>
          </div>

          <div className="flex items-center gap-3 text-slate-500">
            <span>Suporte: <strong className="text-slate-800">agenciavallor01@gmail.com</strong></span>
            <span>•</span>
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              Sessão Ativa: {currentUser.name}
            </span>
          </div>

          <span className="text-[11px] text-slate-400 font-mono">v2.4.0-core • Brasil</span>
        </div>
      </footer>

      {/* Supabase Auth Modal */}
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={closeAuthModal}
        />
      )}

      {/* Global Import Notification */}
      {importStatus && (
        <div className="fixed bottom-6 left-6 z-50 bg-[#04122e] text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-fade-in max-w-md">
          <span className="material-symbols-outlined text-[#4edea3] text-[20px]">cloud_sync</span>
          <span className="text-xs font-medium">{importStatus}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
