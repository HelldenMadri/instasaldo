// src/main.js
import { fetchServices as getAllServices, createService as addService, updateService, deleteService } from './api.js';
import { createClient } from '@supabase/supabase-js';

// Supabase client (optional, can be used later)
const SUPABASE_URL = 'https://hptaarigzvndqkhpaodp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_pfg6HPxYxwhlog3l42pQ-A_fKbTRLI2';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

(function () {
  'use strict';

  // ---- DOM References ----
  const screens = {
    login: document.getElementById('screen-login'),
    dashboard: document.getElementById('screen-dashboard'),
    newService: document.getElementById('screen-new-service'),
    editService: document.getElementById('screen-edit-service'),
  };

  const els = {
    // Login
    loginForm: document.getElementById('login-form'),
    inputNome: document.getElementById('input-nome'),

    // Dashboard
    greetingTime: document.getElementById('greeting-time'),
    greetingName: document.getElementById('greeting-name'),
    totalRecebido: document.getElementById('total-recebido'),
    totalPendente: document.getElementById('total-pendente'),
    servicosPendentes: document.getElementById('servicos-pendentes'),
    servicesList: document.getElementById('services-list'),
    emptyState: document.getElementById('empty-state'),
    btnNovoServico: document.getElementById('btn-novo-servico'),
    btnLogout: document.getElementById('btn-logout'),

    // Tabs
    tabResumo: document.getElementById('tab-resumo'),
    tabServicos: document.getElementById('tab-servicos'),
    navResumo: document.getElementById('nav-resumo'),
    navVendas: document.getElementById('nav-vendas'),

    // New Service
    serviceForm: document.getElementById('service-form'),
    campoCliente: document.getElementById('campo-cliente'),
    campoTipo: document.getElementById('campo-tipo'),
    campoValorTotal: document.getElementById('campo-valor-total'),
    campoValorRecebido: document.getElementById('campo-valor-recebido'),
    campoData: document.getElementById('campo-data'),
    btnVoltar: document.getElementById('btn-voltar'),

    // Edit Service
    editForm: document.getElementById('edit-service-form'),
    editId: document.getElementById('edit-id'),
    editCliente: document.getElementById('edit-cliente'),
    editTipo: document.getElementById('edit-tipo'),
    editValorTotal: document.getElementById('edit-valor-total'),
    editValorRecebido: document.getElementById('edit-valor-recebido'),
    editData: document.getElementById('edit-data'),
    btnVoltarEdit: document.getElementById('btn-voltar-edit'),
    btnDeleteService: document.getElementById('btn-delete-service'),

    // Toast
    toast: document.getElementById('toast'),
  };

  // ---- Helpers ----
  const LS_USER = 'instalaSaldo_user';

  function getUser() {
    return localStorage.getItem(LS_USER);
  }
  function setUser(name) {
    localStorage.setItem(LS_USER, name);
  }
  function clearUser() {
    localStorage.removeItem(LS_USER);
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
  }
  function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  function getGreetingTime() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia,';
    if (hour < 18) return 'Boa tarde,';
    return 'Boa noite,';
  }
  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add('show');
    setTimeout(() => els.toast.classList.remove('show'), 2500);
  }

  // ---- Screen Navigation ----
  function showScreen(screenName) {
    Object.values(screens).forEach((s) => {
      if (s) s.classList.remove('active');
    });
    if (screens[screenName]) screens[screenName].classList.add('active');
    window.scrollTo(0, 0);
  }

  // ---- Tab Navigation ----
  function initTabs() {
    if (!els.navResumo || !els.navVendas) return;
    els.navResumo.addEventListener('click', () => {
      els.navResumo.classList.add('active');
      els.navVendas.classList.remove('active');
      els.tabResumo.style.display = 'block';
      els.tabServicos.style.display = 'none';
    });
    els.navVendas.addEventListener('click', () => {
      els.navVendas.classList.add('active');
      els.navResumo.classList.remove('active');
      els.tabResumo.style.display = 'none';
      els.tabServicos.style.display = 'block';
    });
  }

  // ---- Login ----
  function initLogin() {
    const user = getUser();
    if (user) {
      showDashboard();
    }
  }

  els.loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = els.inputNome.value.trim();
    if (!nome) return;
    setUser(nome);
    showDashboard();
    showToast(`Bem-vindo, ${nome}!`);
  });

  els.btnLogout.addEventListener('click', () => {
    clearUser();
    els.inputNome.value = '';
    showScreen('login');
  });

  // ---- Dashboard ----
  function showDashboard() {
    showScreen('dashboard');
    const user = getUser();
    els.greetingTime.textContent = getGreetingTime();
    els.greetingName.textContent = user ? `${user}.` : 'Usuário.';
    renderServices();
  }

  async function renderServices() {
    const services = await getAllServices();
    // Calculate totals
    let totalRecebido = 0;
    let totalPendente = 0;
    let countPendentes = 0;
    services.forEach((s) => {
      const saldo = s.valorTotal - s.valorRecebido;
      totalRecebido += s.valorRecebido;
      totalPendente += Math.max(0, saldo);
      if (saldo > 0) countPendentes++;
    });
    if (els.totalRecebido) els.totalRecebido.textContent = formatCurrency(totalRecebido);
    if (els.totalPendente) els.totalPendente.textContent = formatCurrency(totalPendente);
    if (els.servicosPendentes) els.servicosPendentes.textContent = `Vendas: ${countPendentes}`;

    if (services.length === 0) {
      els.servicesList.innerHTML = '';
      els.emptyState.style.display = 'block';
      return;
    }
    els.emptyState.style.display = 'none';
    const sorted = [...services].sort((a, b) => {
      const saldoA = a.valorTotal - a.valorRecebido;
      const saldoB = b.valorTotal - b.valorRecebido;
      const statusA = saldoA > 0 ? 0 : 1;
      const statusB = saldoB > 0 ? 0 : 1;
      if (statusA !== statusB) return statusA - statusB;
      return a.cliente.localeCompare(b.cliente);
    });
    els.servicesList.innerHTML = sorted
      .map((s, i) => {
        const saldo = s.valorTotal - s.valorRecebido;
        const status = saldo > 0 ? 'pendente' : 'quitado';
        const statusLabel = saldo > 0 ? 'Pendente' : 'Quitado';
        const dateStr = s.dataPagamentoFinal ? `📅 Pagamento: ${formatDate(s.dataPagamentoFinal)}` : '';
        return `
          <div class="service-item ${status}" style="animation-delay: ${i * 0.05}s">
            <div class="service-item-header">
              <div>
                <div class="service-cliente">${escapeHtml(s.cliente)}</div>
                ${s.tipoInstalacao ? `<div class="service-tipo">${escapeHtml(s.tipoInstalacao)}</div>` : ''}
              </div>
              <span class="service-status ${status}">${statusLabel}</span>
            </div>
            <div class="service-values">
              <div class="service-val">
                <div class="service-val-label">Total</div>
                <div class="service-val-amount total">${formatCurrency(s.valorTotal)}</div>
              </div>
              <div class="service-val">
                <div class="service-val-label">Recebido</div>
                <div class="service-val-amount recebido">${formatCurrency(s.valorRecebido)}</div>
              </div>
              <div class="service-val">
                <div class="service-val-label">Saldo</div>
                <div class="service-val-amount saldo">${formatCurrency(Math.max(0, saldo))}</div>
              </div>
            </div>
            ${dateStr ? `<div class="service-date">${dateStr}</div>` : ''}
            <div class="service-actions">
              <button class="btn-quitar" data-id="${s.id}" ${status === 'quitado' ? 'disabled' : ''}>${status === 'quitado' ? '✓ Quitado' : '✓ Marcar como Quitado'}</button>
              <button class="btn-editar" data-id="${s.id}">✏️ Editar</button>
            </div>
          </div>`;
      })
      .join('');

    // Bind action buttons
    els.servicesList.querySelectorAll('.btn-quitar:not([disabled])').forEach((btn) => {
      btn.addEventListener('click', () => quitarServico(btn.dataset.id));
    });
    els.servicesList.querySelectorAll('.btn-editar').forEach((btn) => {
      btn.addEventListener('click', () => editarServico(btn.dataset.id));
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async function quitarServico(id) {
    const services = await getAllServices();
    const service = services.find((s) => s.id === id);
    if (!service) return;
    service.valorRecebido = service.valorTotal;
    await updateService(service);
    renderServices();
    showToast(`${service.cliente} — Quitado! ✓`);
  }

  async function editarServico(id) {
    const services = await getAllServices();
    const service = services.find((s) => s.id === id);
    if (!service) return;
    els.editId.value = service.id;
    els.editCliente.value = service.cliente;
    els.editTipo.value = service.tipoInstalacao || '';
    els.editValorTotal.value = service.valorTotal;
    els.editValorRecebido.value = service.valorRecebido;
    els.editData.value = service.dataPagamentoFinal || '';
    showScreen('editService');
  }

  // ---- New Service ----
  els.btnNovoServico.addEventListener('click', () => {
    els.serviceForm.reset();
    showScreen('newService');
  });
  els.btnVoltar.addEventListener('click', () => {
    showDashboard();
  });
  els.serviceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cliente = els.campoCliente.value.trim();
    const tipoInstalacao = els.campoTipo.value.trim();
    const valorTotal = parseFloat(els.campoValorTotal.value) || 0;
    const valorRecebido = parseFloat(els.campoValorRecebido.value) || 0;
    const dataPagamentoFinal = els.campoData.value || '';
    if (!cliente || valorTotal <= 0) {
      showToast('Preencha os campos obrigatórios');
      return;
    }
    if (valorRecebido > valorTotal) {
      showToast('Valor recebido não pode ser maior que o total');
      return;
    }
    const newService = {
      id: generateId(),
      cliente,
      tipoInstalacao,
      valorTotal,
      valorRecebido,
      dataPagamentoFinal,
    };
    await addService(newService);
    showDashboard();
    showToast('Serviço adicionado com sucesso! ✓');
  });

  // ---- Edit Service ----
  els.btnVoltarEdit.addEventListener('click', () => {
    showDashboard();
  });
  els.editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = els.editId.value;
    const cliente = els.editCliente.value.trim();
    const tipoInstalacao = els.editTipo.value.trim();
    const valorTotal = parseFloat(els.editValorTotal.value) || 0;
    const valorRecebido = parseFloat(els.editValorRecebido.value) || 0;
    const dataPagamentoFinal = els.editData.value || '';
    if (!cliente || valorTotal <= 0) {
      showToast('Preencha os campos obrigatórios');
      return;
    }
    if (valorRecebido > valorTotal) {
      showToast('Valor recebido não pode ser maior que o total');
      return;
    }
    const services = await getAllServices();
    const index = services.findIndex((s) => s.id === id);
    if (index === -1) return;
    const updated = {
      ...services[index],
      cliente,
      tipoInstalacao,
      valorTotal,
      valorRecebido,
      dataPagamentoFinal,
    };
    await updateService(updated);
    showDashboard();
    showToast('Serviço atualizado! ✓');
  });
  els.btnDeleteService.addEventListener('click', async () => {
    const id = els.editId.value;
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;
    await deleteService(id);
    showDashboard();
    showToast('Serviço excluído');
  });

  // ---- Service Worker Registration ----
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./service-worker.js')
        .then((reg) => {
          console.log('Service Worker registrado:', reg.scope);
        })
        .catch((err) => {
          console.warn('Falha ao registrar Service Worker:', err);
        });
    });
  }

  // ---- Init ----
  initLogin();
  initTabs();
})();
