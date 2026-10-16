// src/main.js
import {
  fetchServices as getAllServices,
  createService as addService,
  updateService,
  deleteService,
  loginUser,
  logoutUser,
  resetPassword,
  updateUserPassword,
  getSession,
  onAuthStateChange,
  isSuperAdmin,
  fetchAdminUsers,
  fetchAdminStats,
  createAdminUser,
  updateAdminUser,
  toggleUserStatus,
  deleteAdminUser,
  fetchAuditLogs,
} from './api.js';

(function () {
  'use strict';

  // ---- DOM References ----
  const screens = {
    login: document.getElementById('screen-login'),
    resetPassword: document.getElementById('screen-reset-password'),
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
    btnEntrar: document.getElementById('btn-entrar'),
    loginFeedback: document.getElementById('login-feedback'),

    // Reset Password
    resetForm: document.getElementById('reset-password-form'),
    inputNewPassword: document.getElementById('input-new-password'),
    inputConfirmPassword: document.getElementById('input-confirm-password'),
    btnShowResetSenha: document.getElementById('btn-show-reset-senha'),
    btnSalvarNovaSenha: document.getElementById('btn-salvar-nova-senha'),
    btnVoltarLoginReset: document.getElementById('btn-voltar-login-reset'),
    resetFeedback: document.getElementById('reset-feedback'),

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

    // Super Admin Dashboard Elements
    btnVoltarAdmin: document.getElementById('btn-voltar-admin'),
    btnAdminAddUser: document.getElementById('btn-admin-add-user'),
    adminSearchInput: document.getElementById('admin-search-input'),
    adminUsersList: document.getElementById('admin-users-list'),
    adminAuditLogs: document.getElementById('admin-audit-logs'),

    // Admin Metrics Cards
    statTotalUsuarios: document.getElementById('stat-total-usuarios'),
    statTotalEmpresas: document.getElementById('stat-total-empresas'),
    statUsuariosAtivos: document.getElementById('stat-usuarios-ativos'),
    statUsuariosBloqueados: document.getElementById('stat-usuarios-bloqueados'),
    statPlanoBasico: document.getElementById('stat-plano-basico'),
    statPlanoPro: document.getElementById('stat-plano-pro'),
    statPlanoEnterprise: document.getElementById('stat-plano-enterprise'),
    statAssinaturasAtivas: document.getElementById('stat-assinaturas-ativas'),

    // Toast
    toast: document.getElementById('toast'),
  };

  // ---- State Helpers ----
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
  function formatDateTime(isoString) {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return isoString;
    }
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
    setTimeout(() => els.toast.classList.remove('show'), 2800);
  }
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }

  // ---- Screen Router ----
  function showScreen(screenName) {
    Object.values(screens).forEach((s) => {
      if (s) s.classList.remove('active');
    });
    if (screens[screenName]) screens[screenName].classList.add('active');
    window.scrollTo(0, 0);
  }

  // ---- Visual Feedback Helpers ----
  function showFeedback(element, msg, type = 'error') {
    if (!element) return;
    element.textContent = msg;
    element.style.display = 'block';
    if (type === 'error') {
      element.style.backgroundColor = 'var(--danger-light)';
      element.style.color = 'var(--danger)';
      element.style.border = '1px solid var(--danger)';
    } else if (type === 'success') {
      element.style.backgroundColor = 'var(--green-light)';
      element.style.color = 'var(--green-dark)';
      element.style.border = '1px solid var(--green)';
    } else {
      element.style.backgroundColor = 'var(--blue-light)';
      element.style.color = 'var(--blue-accent)';
      element.style.border = '1px solid var(--blue-accent)';
    }
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
      els.navVendas.classList.remove('active');
      els.tabResumo.style.display = 'none';
      els.tabServicos.style.display = 'block';
    });
  }

  // ---- Password Visibility Toggles ----
  function setupPasswordToggles() {
    if (els.btnShowSenha && els.inputSenha) {
      els.btnShowSenha.addEventListener('click', (e) => {
        e.preventDefault();
        const isPassword = els.inputSenha.type === 'password';
        els.inputSenha.type = isPassword ? 'text' : 'password';
        els.btnShowSenha.textContent = isPassword ? '🙈' : '👁️';
      });
    }
    if (els.btnShowResetSenha && els.inputNewPassword) {
      els.btnShowResetSenha.addEventListener('click', (e) => {
        e.preventDefault();
        const isPassword = els.inputNewPassword.type === 'password';
        els.inputNewPassword.type = isPassword ? 'text' : 'password';
        els.btnShowResetSenha.textContent = isPassword ? '🙈' : '👁️';
      });
    }
  }

  // ---- Authentication Flow ----
  let isPasswordRecoveryMode = false;

  async function initAuth() {
    setupPasswordToggles();

    // 1. Detect if URL is for password recovery
    const hash = window.location.hash || '';
    const path = window.location.pathname || '';
    const search = window.location.search || '';

    if (
      path.includes('redefinir-senha') ||
      hash.includes('type=recovery') ||
      hash.includes('access_token') ||
      search.includes('type=recovery')
    ) {
      isPasswordRecoveryMode = true;
      showScreen('resetPassword');
    }

    // 2. Listen to Supabase Auth state changes
    onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        isPasswordRecoveryMode = true;
        showScreen('resetPassword');
        showFeedback(els.resetFeedback, 'Modo de recuperação de senha ativado. Digite sua nova senha abaixo.', 'info');
        return;
      }

      if (event === 'SIGNED_IN' && session && session.user) {
        setUser(session.user.email);
        if (!isPasswordRecoveryMode) {
          showDashboard();
        }
      } else if (event === 'SIGNED_OUT') {
        clearUser();
        if (!isPasswordRecoveryMode) {
          showScreen('login');
        }
      }
    });

    // 3. Check existing active session if not in recovery mode
    if (!isPasswordRecoveryMode) {
      try {
        const session = await getSession();
        if (session && session.user) {
          setUser(session.user.email);
          showDashboard();
          return;
        }
      } catch (err) {}

      // If user was previously saved, keep them or require fresh auth
      const user = getUser();
      if (user) {
        showDashboard();
      } else {
        showScreen('login');
      }
    }
  }

  // ---- Login Handler ----
  if (els.loginForm) {
    els.loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = els.inputEmail.value.trim();
      const password = els.inputSenha.value;

      if (!email || !password) {
        showFeedback(els.loginFeedback, 'Por favor, preencha email e senha.', 'error');
        return;
      }

      if (els.btnEntrar) {
        els.btnEntrar.disabled = true;
        els.btnEntrar.textContent = 'Entrando...';
      }
      showFeedback(els.loginFeedback, 'Verificando credenciais no Supabase...', 'info');

      try {
        const session = await loginUser(email, password);
        const userEmail = session && session.user ? session.user.email : email;
        setUser(userEmail);
        showDashboard();
        showToast(`Bem-vindo, ${userEmail}!`);
      } catch (error) {
        let msg = error.message || 'Erro ao realizar login.';
        if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
          msg = 'E-mail ou senha incorretos.';
        } else if (msg.includes('Email not confirmed')) {
          msg = 'E-mail não confirmado. Verifique sua caixa de entrada.';
        }
        showFeedback(els.loginFeedback, msg, 'error');
        showToast(msg);
      } finally {
        if (els.btnEntrar) {
          els.btnEntrar.disabled = false;
          els.btnEntrar.textContent = 'Entrar';
        }
      }
    });
  }

  // ---- Forgot Password Handler ----
  window.handleForgotPassword = async function () {
    const email = els.inputEmail?.value.trim();
    if (!email) {
      showFeedback(els.loginFeedback, 'Digite seu e-mail no campo acima para receber o link de recuperação.', 'error');
      showToast('Informe o email para recuperação');
      return;
    }

    showFeedback(els.loginFeedback, `Enviando e-mail de recuperação para ${email}...`, 'info');
    try {
      await resetPassword(email);
      showFeedback(
        els.loginFeedback,
        `E-mail de recuperação enviado para ${email}! Verifique sua caixa de entrada e clique no link.`,
        'success'
      );
      showToast('E-mail de recuperação enviado!');
    } catch (err) {
      showFeedback(els.loginFeedback, err.message || 'Erro ao enviar e-mail de recuperação.', 'error');
      showToast(err.message || 'Erro ao recuperar senha');
    }
  };

  if (els.forgotPassword) {
    els.forgotPassword.addEventListener('click', (e) => {
      e.preventDefault();
      window.handleForgotPassword();
    });
  }

  // ---- Reset Password Submission Form ----
  if (els.resetForm) {
    els.resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newPassword = els.inputNewPassword.value;
      const confirmPassword = els.inputConfirmPassword.value;

      if (!newPassword || newPassword.length < 6) {
        showFeedback(els.resetFeedback, 'A senha deve conter no mínimo 6 caracteres.', 'error');
        return;
      }
      if (newPassword !== confirmPassword) {
        showFeedback(els.resetFeedback, 'A confirmação de senha não confere.', 'error');
        return;
      }

      if (els.btnSalvarNovaSenha) {
        els.btnSalvarNovaSenha.disabled = true;
        els.btnSalvarNovaSenha.textContent = 'Salvando senha...';
      }
      showFeedback(els.resetFeedback, 'Atualizando senha no Supabase Auth...', 'info');

      try {
        await updateUserPassword(newPassword);
        showFeedback(els.resetFeedback, 'Senha alterada com sucesso! Redirecionando...', 'success');
        showToast('Senha redefinida com sucesso! ✓');
        isPasswordRecoveryMode = false;
        setTimeout(() => {
          showDashboard();
        }, 1500);
      } catch (err) {
        showFeedback(els.resetFeedback, err.message || 'Erro ao redefinir senha.', 'error');
        showToast(err.message || 'Erro ao redefinir senha');
      } finally {
        if (els.btnSalvarNovaSenha) {
          els.btnSalvarNovaSenha.disabled = false;
          els.btnSalvarNovaSenha.textContent = 'Salvar Nova Senha';
        }
      }
    });
  }

  if (els.btnVoltarLoginReset) {
    els.btnVoltarLoginReset.addEventListener('click', () => {
      isPasswordRecoveryMode = false;
      showScreen('login');
    });
  }

  // ---- Logout Handler ----
  if (els.btnLogout) {
    els.btnLogout.addEventListener('click', async () => {
      try {
        await logoutUser();
      } catch (e) {}
      clearUser();
      if (els.inputEmail) els.inputEmail.value = '';
      if (els.inputSenha) els.inputSenha.value = '';
      if (els.loginFeedback) els.loginFeedback.style.display = 'none';
      showScreen('login');
      showToast('Você saiu do sistema.');
    });
  }

  // ---- Dashboard Navigation & Rendering ----
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

  function checkSuperAdminAccess() {
    const currentUser = getUser();
    const isSuper = isSuperAdmin(currentUser);

    // Show/hide Master Gear icon in Header
    if (els.btnAdminNav) {
      els.btnAdminNav.style.display = isSuper ? 'inline-flex' : 'none';
    }

    return isSuper;
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

  // -------------------------------------------------------------
  // Super Admin Dashboard Complete Implementation (Item 6)
  // -------------------------------------------------------------
  async function showAdminDashboard() {
    const currentUser = getUser();
    if (!isSuperAdmin(currentUser)) {
      showToast('Acesso negado: Somente o Super Admin possui permissão.');
      return;
    }
    showScreen('admin');
    await loadAdminDashboardData();
  }

  async function loadAdminDashboardData(searchQuery = '') {
    // 1. Load Metrics
    try {
      const stats = await fetchAdminStats();
      if (els.statTotalUsuarios) els.statTotalUsuarios.textContent = stats.totalUsuarios;
      if (els.statTotalEmpresas) els.statTotalEmpresas.textContent = stats.totalEmpresas;
      if (els.statUsuariosAtivos) els.statUsuariosAtivos.textContent = stats.usuariosAtivos;
      if (els.statUsuariosBloqueados) els.statUsuariosBloqueados.textContent = stats.usuariosBloqueados;
      if (els.statPlanoBasico) els.statPlanoBasico.textContent = stats.empresasPorPlano.Basico;
      if (els.statPlanoPro) els.statPlanoPro.textContent = stats.empresasPorPlano.Pro;
      if (els.statPlanoEnterprise) els.statPlanoEnterprise.textContent = stats.empresasPorPlano.Enterprise;
      if (els.statAssinaturasAtivas) els.statAssinaturasAtivas.textContent = stats.assinaturasAtivas;
    } catch (e) {}

    // 2. Load Users
    try {
      const users = await fetchAdminUsers(searchQuery);
      renderAdminUsersList(users);
    } catch (err) {
      if (els.adminUsersList) {
        els.adminUsersList.innerHTML = `<p style="color:var(--danger); font-size:13px;">Erro ao carregar usuários: ${escapeHtml(err.message)}</p>`;
      }
    }

    // 3. Load Audit Logs
    try {
      const logs = await fetchAuditLogs();
      renderAdminAuditLogs(logs);
    } catch (e) {}
  }

  function renderAdminUsersList(users) {
    if (!els.adminUsersList) return;

    if (users.length === 0) {
      els.adminUsersList.innerHTML = '<p style="font-size:13px; color:var(--text-muted); text-align:center; padding:16px;">Nenhum usuário encontrado com esse filtro.</p>';
      return;
    }

    els.adminUsersList.innerHTML = users
      .map((u) => {
        const isRoot = isSuperAdmin(u.email);
        const isSuspended = u.status === 'suspended';
        return `
          <div class="service-item ${isSuspended ? 'pendente' : 'quitado'}" style="margin-bottom: 12px; border-left-color: ${isRoot ? 'var(--blue-accent)' : isSuspended ? 'var(--danger)' : 'var(--green)'};">
            <div class="service-item-header">
              <div>
                <div class="service-cliente" style="font-weight: 700; display:flex; align-items:center; gap:6px;">
                  ${escapeHtml(u.nome || u.email)}
                  ${isRoot ? '<span style="background:var(--blue-light); color:var(--blue-accent); font-size:10px; padding:2px 6px; border-radius:4px;">MASTER</span>' : ''}
                </div>
                <div class="service-tipo">${escapeHtml(u.email)} • 🏢 ${escapeHtml(u.empresa || 'Empresa Padrão')}</div>
              </div>
              <span class="service-status ${isSuspended ? 'pendente' : 'quitado'}">
                ${isSuspended ? '🔴 Bloqueado' : '🟢 Ativo'}
              </span>
            </div>

            <div class="service-values" style="margin: 8px 0; background: var(--bg); padding: 8px; border-radius: 8px;">
              <div class="service-val">
                <div class="service-val-label">Papel</div>
                <div style="font-size: 12px; font-weight: 600; color: var(--text);">${escapeHtml(u.role || 'Usuário')}</div>
              </div>
              <div class="service-val">
                <div class="service-val-label">Plano</div>
                <div style="font-size: 12px; font-weight: 600; color: var(--blue-accent);">${escapeHtml(u.plano || 'Básico')}</div>
              </div>
              <div class="service-val">
                <div class="service-val-label">Cadastro</div>
                <div style="font-size: 11px; color: var(--text-muted);">${formatDate(u.created_at ? u.created_at.split('T')[0] : '')}</div>
              </div>
            </div>

            <div class="service-actions" style="margin-top: 10px; display: flex; gap: 6px; flex-wrap: wrap;">
              <button class="btn-editar btn-edit-user" data-id="${u.id}" data-email="${u.email}" data-nome="${u.nome || ''}" data-role="${u.role || ''}" data-empresa="${u.empresa || ''}" data-plano="${u.plano || ''}">✏️ Editar Perfil</button>
              
              ${!isRoot ? `
                <button class="btn-quitar btn-toggle-status" data-id="${u.id}" style="background-color: ${isSuspended ? 'var(--green)' : 'var(--orange-dark)'}; color: white;">
                  ${isSuspended ? '🔓 Reativar' : '🔒 Suspender'}
                </button>
                <button class="btn-quitar btn-del-user" data-id="${u.id}" style="background-color: var(--danger); color: white;">🗑️ Excluir</button>
              ` : ''}
            </div>
          </div>`;
      })
      .join('');

    // Bind action events
    els.adminUsersList.querySelectorAll('.btn-edit-user').forEach((btn) => {
      btn.addEventListener('click', () => handleEditUserModal(btn.dataset));
    });
    els.adminUsersList.querySelectorAll('.btn-toggle-status').forEach((btn) => {
      btn.addEventListener('click', () => handleToggleUserStatus(btn.dataset.id));
    });
    els.adminUsersList.querySelectorAll('.btn-del-user').forEach((btn) => {
      btn.addEventListener('click', () => handleDeleteUser(btn.dataset.id));
    });
  }

  function renderAdminAuditLogs(logs) {
    if (!els.adminAuditLogs) return;
    if (logs.length === 0) {
      els.adminAuditLogs.innerHTML = '<p style="font-size:12px; color:var(--text-muted);">Nenhuma ação registrada ainda.</p>';
      return;
    }

    els.adminAuditLogs.innerHTML = logs
      .map(
        (log) => `
        <div style="border-bottom: 1px solid var(--border); padding: 8px 0; font-size: 12px;">
          <div style="display:flex; justify-content:space-between; color:var(--text-muted); font-size:11px;">
            <strong style="color:var(--text);">${escapeHtml(log.action)}</strong>
            <span>${formatDateTime(log.timestamp)}</span>
          </div>
          <div style="color:var(--text-secondary); margin-top: 2px;">${escapeHtml(log.details)}</div>
        </div>
      `
      )
      .join('');
  }

  async function handleEditUserModal(data) {
    const nome = prompt(`Editar nome de ${data.email}:`, data.nome || '');
    if (nome === null) return;
    const role = prompt(`Editar papel/cargo (ex: super_admin, technician, financial, user):`, data.role || 'user');
    if (role === null) return;
    const empresa = prompt(`Editar empresa:`, data.empresa || 'Agência Vallor');
    if (empresa === null) return;
    const plano = prompt(`Editar plano (Básico, Pro, Enterprise):`, data.plano || 'Básico');
    if (plano === null) return;

    try {
      await updateAdminUser(data.id, {
        nome: nome.trim(),
        role: role.trim(),
        empresa: empresa.trim(),
        plano: plano.trim(),
      });
      showToast('Perfil de usuário atualizado com sucesso!');
      await loadAdminDashboardData(els.adminSearchInput ? els.adminSearchInput.value : '');
    } catch (err) {
      showToast(err.message || 'Erro ao atualizar usuário');
    }
  }

  async function handleToggleUserStatus(id) {
    try {
      const updated = await toggleUserStatus(id);
      showToast(`Usuário ${updated.status === 'suspended' ? 'bloqueado' : 'reativado'} com sucesso!`);
      await loadAdminDashboardData(els.adminSearchInput ? els.adminSearchInput.value : '');
    } catch (err) {
      showToast(err.message || 'Erro ao alterar status');
    }
  }

  async function handleDeleteUser(id) {
    if (!confirm('Tem certeza de que deseja remover este usuário permanentemente?')) return;
    try {
      await deleteAdminUser(id);
      showToast('Usuário removido com sucesso!');
      await loadAdminDashboardData(els.adminSearchInput ? els.adminSearchInput.value : '');
    } catch (err) {
      showToast(err.message || 'Erro ao excluir usuário');
    }
  }

  // Admin Search filter
  if (els.adminSearchInput) {
    els.adminSearchInput.addEventListener('input', (e) => {
      loadAdminDashboardData(e.target.value);
    });
  }

  // Admin Create User Button
  if (els.btnAdminAddUser) {
    els.btnAdminAddUser.addEventListener('click', async () => {
      const email = prompt('Digite o e-mail do novo usuário:');
      if (!email || !email.trim()) return;
      const nome = prompt('Digite o nome completo:', 'Novo Usuário') || 'Novo Usuário';
      const role = prompt('Digite o papel (technician, financial, user):', 'technician') || 'technician';
      const empresa = prompt('Digite a empresa:', 'Minha Empresa') || 'Minha Empresa';
      const plano = prompt('Digite o plano (Básico, Pro, Enterprise):', 'Pro') || 'Pro';

      try {
        await createAdminUser({
          email: email.trim().toLowerCase(),
          nome: nome.trim(),
          role: role.trim(),
          empresa: empresa.trim(),
          plano: plano.trim(),
        });
        showToast('Novo usuário cadastrado!');
        await loadAdminDashboardData();
      } catch (err) {
        showToast(err.message || 'Erro ao criar usuário');
      }
    });
  }

  // Admin Navigation Buttons
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

  // ---- New Service Handlers ----
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

  // ---- Edit Service Handlers ----
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
          reg.update();
        })
        .catch(() => {});
    });
  }

  // ---- Initialize Application ----
  initTabs();
  initAuth();
})();
