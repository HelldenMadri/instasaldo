import React from 'react';
import { useApp } from '../context/AppContext';

export const UpgradeLimitModal: React.FC = () => {
  const {
    isUpgradeModalOpen,
    upgradeModalReason,
    closeUpgradeModal,
    setActiveView,
    companyClientsCount,
    maxClientsLimit,
    companyMonthServicesCount,
    maxServicesLimit,
    currentCompany,
  } = useApp();

  if (!isUpgradeModalOpen) return null;

  const currentPlan = currentCompany?.plan || 'essencial';
  const isUpgradingToEmpresa = currentPlan === 'profissional';

  const isClientLimit = upgradeModalReason === 'clients';
  const isServiceLimit = upgradeModalReason === 'services';

  const handleUpgrade = () => {
    closeUpgradeModal();
    setActiveView('planos');
  };

  const handleViewAllPlans = () => {
    closeUpgradeModal();
    setActiveView('planos');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#04122e]/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 transform transition-all">
        {/* Top Gradient Banner */}
        <div className="relative bg-gradient-to-br from-[#04122e] via-[#102347] to-[#006c49] p-6 text-white text-center overflow-hidden">
          {/* Background Ambient Glow */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#6cf8bb]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            onClick={closeUpgradeModal}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Fechar"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
            <span className="material-symbols-outlined text-[15px]">lock</span>
            <span>
              {isUpgradingToEmpresa ? 'Cota do Plano Profissional Atingida' : 'Cota do Plano Essencial Atingida'}
            </span>
          </div>

          {/* Icon */}
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-[#006c49] to-[#6cf8bb] p-0.5 shadow-lg flex items-center justify-center">
            <div className="w-full h-full bg-[#04122e]/40 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[32px] text-[#6cf8bb]">
                {isClientLimit ? 'person_add_disabled' : isServiceLimit ? 'event_busy' : 'workspace_premium'}
              </span>
            </div>
          </div>

          <h2 className="font-headline text-2xl font-black text-white leading-tight">
            {isClientLimit && (isUpgradingToEmpresa ? 'Limite de 50 Clientes Atingido!' : 'Limite de 5 Clientes Atingido!')}
            {isServiceLimit && (isUpgradingToEmpresa ? 'Limite de 120 Serviços no Mês!' : 'Limite de 10 Serviços no Mês!')}
            {!isClientLimit && !isServiceLimit && 'Faça o Upgrade do seu Plano'}
          </h2>

          <p className="text-xs text-slate-200 mt-2 max-w-sm mx-auto leading-relaxed">
            {isClientLimit && (
              isUpgradingToEmpresa ? (
                <>
                  Seu <strong>Plano Profissional</strong> atingiu a cota máxima de <strong>{maxClientsLimit} clientes ativos</strong>.
                  Para cadastrar clientes <strong>sem limites</strong> e expandir sua operação, faça o upgrade para o <strong>Plano Empresa</strong>.
                </>
              ) : (
                <>
                  Seu <strong>Plano Essencial</strong> atingiu a cota máxima de <strong>{maxClientsLimit} clientes ativos</strong>.
                  Para continuar cadastrando novos clientes, faça o upgrade para o <strong>Plano Profissional (até 50 clientes)</strong>.
                </>
              )
            )}
            {isServiceLimit && (
              isUpgradingToEmpresa ? (
                <>
                  Seu <strong>Plano Profissional</strong> atingiu a cota de <strong>{maxServicesLimit} serviços neste mês</strong>.
                  Para emitir ordens de serviço <strong>ilimitadas</strong> e gerenciar técnicos, faça o upgrade para o <strong>Plano Empresa</strong>.
                </>
              ) : (
                <>
                  Seu <strong>Plano Essencial</strong> atingiu a cota de <strong>{maxServicesLimit} serviços neste mês</strong>.
                  Para emitir novas ordens de serviço e cobrar mais clientes, faça o upgrade para o <strong>Plano Profissional</strong>.
                </>
              )
            )}
            {!isClientLimit && !isServiceLimit && (
              <>
                Desbloqueie recursos avançados para expandir sua operação e faturar mais todo mês.
              </>
            )}
          </p>

          {/* Current Quota Gauge */}
          <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/15 max-w-xs mx-auto">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">
                {isUpgradingToEmpresa ? 'Uso no Plano Profissional' : 'Uso no Plano Essencial'}
              </span>
              <span className="text-amber-300 font-bold">100% atingido</span>
            </div>
            <div className="w-full bg-black/30 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-400 to-red-400 h-full rounded-full w-full"></div>
            </div>
            <div className="text-[11px] text-slate-300 text-center mt-1.5">
              {isClientLimit && `${companyClientsCount} de ${maxClientsLimit} clientes cadastrados`}
              {isServiceLimit && `${companyMonthServicesCount} de ${maxServicesLimit} serviços neste mês`}
            </div>
          </div>
        </div>

        {/* Modal Body / Offer */}
        <div className="p-6 space-y-5 bg-slate-50/60">
          <div className="bg-white rounded-2xl p-4 border-2 border-emerald-500/30 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#006c49] text-[#6cf8bb] text-[10px] font-black px-3 py-0.5 rounded-bl-xl uppercase tracking-wider">
              {isUpgradingToEmpresa ? 'Plano Completo' : 'Recomendado'}
            </div>

            <div className="flex items-baseline justify-between mb-3 border-b border-slate-100 pb-2">
              <div>
                <span className="text-[11px] text-slate-500 font-bold uppercase block">Upgrade Imediato</span>
                <h3 className="font-headline text-lg font-black text-[#04122e]">
                  {isUpgradingToEmpresa ? 'Plano Empresa' : 'Plano Profissional'}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 line-through block">
                  {isUpgradingToEmpresa ? 'R$ 199,00' : 'R$ 149,00'}
                </span>
                <span className="font-headline font-black text-2xl text-[#006c49]">
                  {isUpgradingToEmpresa ? 'R$ 147,00' : 'R$ 97,00'}
                  <span className="text-xs font-normal text-slate-500">/mês</span>
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-3 font-medium">
              {isUpgradingToEmpresa
                ? 'A solução definitiva para frotas de instalação, técnicos e crescimento sem limites:'
                : 'Tudo que você precisa para acelerar seu atendimento e nunca mais perder clientes:'}
            </p>

            {/* Feature List */}
            <ul className="space-y-2 text-xs text-slate-700">
              {isUpgradingToEmpresa ? (
                <>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#006c49] shrink-0 font-bold">check_circle</span>
                    <span><strong>Clientes ILIMITADOS</strong> (cadastre quantos clientes precisar, sem travas)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#006c49] shrink-0 font-bold">check_circle</span>
                    <span><strong>Serviços e OS ILIMITADOS</strong> todo mês sem bloqueio</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#006c49] shrink-0 font-bold">check_circle</span>
                    <span><strong>Gestão multi-técnicos e equipes de campo</strong> ilimitadas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#006c49] shrink-0 font-bold">check_circle</span>
                    <span><strong>Painel para Gerentes e Instaladores</strong> com permissões granulares</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#006c49] shrink-0 font-bold">check_circle</span>
                    <span><strong>Distribuição inteligente de serviços e rotas de campo</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#006c49] shrink-0 font-bold">check_circle</span>
                    <span><strong>Relatórios contábeis e exportação Excel/PDF</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#006c49] shrink-0 font-bold">check_circle</span>
                    <span><strong>Suporte VIP via WhatsApp dedicado</strong></span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#006c49] shrink-0 font-bold">check_circle</span>
                    <span><strong>Até 50 clientes ativos</strong> (10x mais capacidade que o Essencial)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#006c49] shrink-0 font-bold">check_circle</span>
                    <span><strong>Até 120 serviços por mês</strong> (12x mais capacidade de faturamento)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#006c49] shrink-0 font-bold">check_circle</span>
                    <span><strong>Orçamentos completos</strong> com conversão em OS em 1 clique</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#006c49] shrink-0 font-bold">check_circle</span>
                    <span><strong>OS Digital com fotos antes/depois</strong> e assinatura do cliente na tela</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#006c49] shrink-0 font-bold">check_circle</span>
                    <span><strong>Disparo de comprovantes via WhatsApp</strong> para seus clientes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#006c49] shrink-0 font-bold">check_circle</span>
                    <span><strong>Suporte prioritário</strong> via WhatsApp e E-mail</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleUpgrade}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-[#006c49] to-[#04122e] hover:from-[#005236] hover:to-[#1a2744] text-white font-headline font-bold text-sm rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px] text-[#6cf8bb]">rocket_launch</span>
              <span>
                {isUpgradingToEmpresa
                  ? 'Fazer Upgrade para Plano Empresa (R$ 147/mês)'
                  : 'Fazer Upgrade para Profissional (R$ 97/mês)'}
              </span>
            </button>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleViewAllPlans}
                className="flex-1 py-2 text-xs font-bold text-slate-600 hover:text-[#04122e] hover:bg-slate-200/60 rounded-lg transition-colors text-center cursor-pointer"
              >
                Ver todos os planos
              </button>

              <span className="text-slate-300 text-xs">•</span>

              <button
                type="button"
                onClick={closeUpgradeModal}
                className="flex-1 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors text-center cursor-pointer"
              >
                {isUpgradingToEmpresa ? 'Permanecer no Profissional' : 'Permanecer no Essencial'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="bg-slate-100/80 px-6 py-2.5 border-t border-slate-200 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <span className="material-symbols-outlined text-[14px] text-emerald-600">verified</span>
          <span>Sem fidelidade • Cancele quando quiser • Ativação imediata via Pix</span>
        </div>
      </div>
    </div>
  );
};
