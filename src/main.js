// src/main.js
import {
  fetchServices as getAllServices,
  createService as addService,
  updateService,
  deleteService,
  loginUser,
  resetPassword,
  isSuperAdmin,
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
} from './api.js';

(function () {
  'use strict';

  // ---- DOM References ----
  const screens = {
    login: document.getElementById('screen-login'),
    dashboard: document.getElementById('screen-dashboard'),
    newService: document.getElementById('screen-new-service'),
    editService: document.getElementById('screen-edit-service'),
    admin: document.getElementById('screen-admin'),
  };

  const els = {
    // Login
    loginForm: document.getElementById('login-form'),
    inputEmail: document.getElementById('input-email'),
    inputSenha: document.getElementById('input-senha'),
    btnShowSenha: document.getElementById('btn-show-senha'),
    forgotPassword: document.getElementById('forgot-password'),

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
    btnAdminNav: document.getElementById('btn-admin-nav'),

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

    // Admin Dashboard
    btnVoltarAdmin: document.getElementById('btn-voltar-admin'),
    btnAdminAddUser: document.getElementById('btn-admin-add-user'),
    adminUsersList: document.getElementById('admin-users-list'),

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
    return (value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.classList.add('show');
    setTimeout(() => els.toast.classList.remove('show'), 2500);
  }
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
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

  // ---- Super Admin Controls & Dashboard ----
  function checkSuperAdminAccess() {
    const currentUser = getUser();
    const isSuper = isSuperAdmin(currentUser);

    // Show/hide gear button in header
    if (els.btnAdminNav) {
      els.btnAdminNav.style.display = isSuper ? 'inline-flex' : 'none';
    }

    // Protect edit buttons if not super admin
    // If you want ONLY super admin to edit services, we can enforce it:
    return isSuper;
  }

  async function showAdminDashboard() {
    const currentUser = getUser();
    if (!isSuperAdmin(currentUser)) {
      showToast('Acesso negado: Somente o Super Admin pode acessar este painel.');
      return;
    }
    showScreen('admin');
    await renderAdminUsers();
  }

  async function renderAdminUsers() {
    if (!els.adminUsersList) return;
    els.adminUsersList.innerHTML = '<p style="font-size:13px; color:var(--text-secondary);">Carregando usuários...</p>';

    try {
      let users = await fetchUsers();
      // Ensure super admin is included in the list view if table is empty
      const superAdminFound = users.some((u) => isSuperAdmin(u.email));
      if (!superAdminFound) {
        users.unshift({
          id: 'super-admin-root',
          email: 'agenciavallor01@gmail.com',
          role: 'Super Admin',
          nome: 'Administrador Principal',
          status: 'Ativo',
        });
      }

      els.adminUsersList.innerHTML = users
        .map((u) => {
          const isRoot = isSuperAdmin(u.email);
          return `
            <div class="service-item quitado" style="margin-bottom: 12px; border-left-color: ${isRoot ? 'var(--blue-accent)' : 'var(--orange)'};">
              <div class="service-item-header">
                <div>
                  <div class="service-cliente" style="font-weight: 700;">${escapeHtml(u.email)}</div>
                  <div class="service-tipo">${escapeHtml(u.nome || (isRoot ? 'Super Administrador' : 'Técnico / Usuário'))}</div>
                </div>
                <span class="service-status ${isRoot ? 'quitado' : 'pendente'}">
                  ${isRoot ? 'Super Admin' : escapeHtml(u.role || 'Usuário')}
                </span>
              </div>
              <div class="service-values" style="margin: 8px 0;">
                <div class="service-val">
                  <div class="service-val-label">ID</div>
                  <div style="font-size: 11px; color: var(--text-muted); word-break: break-all;">${escapeHtml(u.id)}</div>
                </div>
                <div class="service-val">
                  <div class="service-val-label">Status</div>
                  <div style="font-size: 12px; font-weight: 600; color: var(--green-dark);">${escapeHtml(u.status || 'Ativo')}</div>
                </div>
              </div>
              <div class="service-actions" style="margin-top: 10px;">
                <button class="btn-editar btn-edit-user" data-id="${u.id}" data-email="${u.email}" data-role="${u.role || ''}">✏️ Editar Usuário</button>
                ${!isRoot ? `<button class="btn-quitar btn-del-user" data-id="${u.id}" style="background-color: var(--danger); color: white;">🗑️ Remover</button>` : ''}
              </div>
            </div>`;
        })
        .join('');

      // Bind admin actions
      els.adminUsersList.querySelectorAll('.btn-edit-user').forEach((btn) => {
        btn.addEventListener('click', () => handleEditUser(btn.dataset.id, btn.dataset.email, btn.dataset.role));
      });
      els.adminUsersList.querySelectorAll('.btn-del-user').forEach((btn) => {
        btn.addEventListener('click', () => handleDeleteUser(btn.dataset.id));
      });
    } catch (err) {
      els.adminUsersList.innerHTML = `<p style="color:var(--danger); font-size:13px;">Erro ao carregar usuários: ${escapeHtml(err.message)}</p>`;
    }
  }

  async function handleEditUser(id, currentEmail, currentRole) {
    const newRole = prompt(`Alterar cargo/papel para ${currentEmail}:`, currentRole || 'Usuário');
    if (newRole === null) return;
    try {
      await updateUser(id, { role: newRole });
      showToast('Usuário atualizado com sucesso!');
      await renderAdminUsers();
    } catch (err) {
      showToast(err.message || 'Erro ao atualizar usuário');
    }
  }

  async function handleDeleteUser(id) {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      await deleteUser(id);
      showToast('Usuário excluído!');
      await renderAdminUsers();
    } catch (err) {
      showToast(err.message || 'Erro ao remover usuário');
    }
  }

  // ---- Login & Visual Feedback ----
  function showLoginFeedback(msg, type = 'error') {
    const fb = document.getElementById('login-feedback');
    if (!fb) return;
    fb.textContent = msg;
    fb.style.display = 'block';
    if (type === 'error') {
      fb.style.backgroundColor = 'var(--danger-light)';
      fb.style.color = 'var(--danger)';
      fb.style.border = '1px solid var(--danger)';
    } else if (type === 'success') {
      fb.style.backgroundColor = 'var(--green-light)';
      fb.style.color = 'var(--green-dark)';
      fb.style.border = '1px solid var(--green)';
    } else {
      fb.style.backgroundColor = 'var(--blue-light)';
      fb.style.color = 'var(--blue-accent)';
      fb.style.border = '1px solid var(--blue-accent)';
    }
  }

  function initLogin() {
    const user = getUser();
    if (user) {
      showDashboard();
    }
  }

  if (els.loginForm) {
    els.loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = els.inputEmail.value.trim();
      const password = els.inputSenha.value;
      if (!email || !password) {
        showLoginFeedback('Por favor, preencha email e senha.');
        return;
      }
      
      const btnEntrar = document.getElementById('btn-entrar') || els.loginForm.querySelector('button[type="submit"]');
      const originalText = btnEntrar ? btnEntrar.textContent : 'Entrar';
      if (btnEntrar) {
        btnEntrar.disabled = true;
        btnEntrar.textContent = 'Entrando...';
      }
      showLoginFeedback('Verificando credenciais...', 'info');

      try {
        await loginUser(email, password);
        setUser(email);
        showDashboard();
        showToast(`Bem-vindo, ${email}!`);
      } catch (error) {
        let msg = error.message || 'Erro ao fazer login';
        if (msg.includes('Invalid login credentials')) {
          msg = 'Email ou senha incorretos.';
        }
        showLoginFeedback(msg, 'error');
        showToast(msg);
      } finally {
        if (btnEntrar) {
          btnEntrar.disabled = false;
          btnEntrar.textContent = originalText;
        }
      }
    });
  }

  // ---- Logout ----
  if (els.btnLogout) {
    els.btnLogout.addEventListener('click', () => {
      clearUser();
      if (els.inputEmail) els.inputEmail.value = '';
      if (els.inputSenha) els.inputSenha.value = '';
      const fb = document.getElementById('login-feedback');
      if (fb) fb.style.display = 'none';
      showScreen('login');
    });
  }

  // ---- Show password toggle ----
  if (els.btnShowSenha && els.inputSenha) {
    els.btnShowSenha.addEventListener('click', () => {
      const isPassword = els.inputSenha.type === 'password';
      els.inputSenha.type = isPassword ? 'text' : 'password';
      els.btnShowSenha.textContent = isPassword ? '🙈' : '👁️';
    });
  }

  // ---- Forgot password ----
  window.handleForgotPassword = async function () {
    const email = els.inputEmail?.value.trim();
    if (!email) {
      showLoginFeedback('Digite seu email no campo acima para receber o link de recuperação.', 'error');
      showToast('Informe o email para recuperação');
      return;
    }
    showLoginFeedback(`Enviando email de recuperação para ${email}...`, 'info');
    try {
      await resetPassword(email);
      showLoginFeedback(`Email de recuperação enviado para ${email}! Verifique sua caixa de entrada.`, 'success');
      showToast('Email de recuperação enviado!');
    } catch (err) {
      showLoginFeedback(err.message || 'Erro ao recuperar senha', 'error');
      showToast(err.message || 'Erro ao recuperar senha');
    }
  };

  if (els.forgotPassword) {
    els.forgotPassword.addEventListener('click', async (e) => {
      e.preventDefault();
      window.handleForgotPassword();
    });
  }

  function showDashboard() {
    showScreen('dashboard');
    const user = getUser();
    if (els.greetingTime) els.greetingTime.textContent = getGreetingTime();
    if (els.greetingName) {
      els.greetingName.textContent = user
        ? isSuperAdmin(user)
          ? `${user} (Super Admin)`
          : `${user}.`
        : 'Usuário.';
    }
    checkSuperAdminAccess();
    renderServices();
  }

  async function renderServices() {
    const services = await getAllServices();
    const currentUser = getUser();
    const isSuper = isSuperAdmin(currentUser);

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
      if (els.servicesList) els.servicesList.innerHTML = '';
      if (els.emptyState) els.emptyState.style.display = 'block';
      return;
    }
    if (els.emptyState) els.emptyState.style.display = 'none';

    const sorted = [...services].sort((a, b) => {
      const saldoA = a.valorTotal - a.valorRecebido;
      const saldoB = b.valorTotal - b.valorRecebido;
      const statusA = saldoA > 0 ? 0 : 1;
      const statusB = saldoB > 0 ? 0 : 1;
      if (statusA !== statusB) return statusA - statusB;
      return (a.cliente || '').localeCompare(b.cliente || '');
    });

    if (els.servicesList) {
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
  }

  async function quitarServico(id) {
    const services = await getAllServices();
    const service = services.find((s) => s.id === id);
    if (!service) return;
    service.valorRecebido = service.valorTotal;
    await updateService(service.id, service);
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

  // ---- Navigation to Admin Panel ----
  if (els.btnAdminNav) {
    els.btnAdminNav.addEventListener('click', () => {
      showAdminDashboard();
    });
  }
  if (els.btnVoltarAdmin) {
    els.btnVoltarAdmin.addEventListener('click', () => {
      showDashboard();
    });
  }
  if (els.btnAdminAddUser) {
    els.btnAdminAddUser.addEventListener('click', async () => {
      const email = prompt('Digite o email do novo usuário:');
      if (!email) return;
      const role = prompt('Digite o papel/cargo (ex: Técnico, Financeiro):', 'Técnico') || 'Técnico';
      try {
        await createUser({
          id: generateId(),
          email,
          role,
          status: 'Ativo',
        });
        showToast('Usuário cadastrado com sucesso!');
        await renderAdminUsers();
      } catch (err) {
        showToast(err.message || 'Erro ao criar usuário');
      }
    });
  }

  // ---- New Service ----
  if (els.btnNovoServico) {
    els.btnNovoServico.addEventListener('click', () => {
      els.serviceForm.reset();
      showScreen('newService');
    });
  }
  if (els.btnVoltar) {
    els.btnVoltar.addEventListener('click', () => {
      showDashboard();
    });
  }
  if (els.serviceForm) {
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
  }

  // ---- Edit Service ----
  if (els.btnVoltarEdit) {
    els.btnVoltarEdit.addEventListener('click', () => {
      showDashboard();
    });
  }
  if (els.editForm) {
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
      await updateService(id, updated);
      showDashboard();
      showToast('Serviço atualizado! ✓');
    });
  }

  if (els.btnDeleteService) {
    els.btnDeleteService.addEventListener('click', async () => {
      const id = els.editId.value;
      if (!confirm('Tem certeza que deseja excluir este serviço?')) return;
      await deleteService(id);
      showDashboard();
      showToast('Serviço excluído');
    });
  }

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
