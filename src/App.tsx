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

const AppContent: React.FC = () => {
  const {
    activeView,
    isFieldAppView,
    setIsFieldAppView,
    currentUser,
    loginAsRole,
    isAuthModalOpen,
    closeAuthModal,
    importStatus,
  } = useApp();

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

  // If in Super Admin view, render the dedicated Super Admin layout (Image 7)
  if (activeView === 'superadmin') {
    return (
      <div className="min-h-screen bg-[#f8f9ff]">
        <SuperAdminDashboard />
      </div>
    );
  }

  // Standard Web App Dashboard Layout
  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col font-body">
      <Navbar />

      <main className="flex-1 pb-16">
        {activeView === 'inicio' && <MainDashboard />}
        {activeView === 'clientes' && <ClientsView />}
        {activeView === 'servicos' && <ServicesView />}
        {activeView === 'orcamentos' && <BudgetsView />}
        {activeView === 'ordens' && <OrdersView />}
        {activeView === 'equipe' && <TeamView />}
        {activeView === 'planos' && <PlansView />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-headline font-bold text-slate-800">InstalaSaldo</span>
            <span>• Micro SaaS para Técnicos e Prestadores de Manutenção</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => loginAsRole('superadmin')}
              className={`hover:underline font-bold ${
                currentUser.role === 'superadmin' ? 'text-[#006c49]' : 'text-slate-600'
              }`}
            >
              Super Admin Master
            </button>
            <span>•</span>
            <button
              onClick={() => loginAsRole('empresa_admin')}
              className={`hover:underline font-bold ${
                currentUser.role === 'empresa_admin' ? 'text-[#006c49]' : 'text-slate-600'
              }`}
            >
              Administrador (ClimaFrio)
            </button>
            <span>•</span>
            <button
              onClick={() => loginAsRole('instalador')}
              className="text-[#04122e] hover:underline font-bold flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">smartphone</span>
              Modo Instalador de Campo
            </button>
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
