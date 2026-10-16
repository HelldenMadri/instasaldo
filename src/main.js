// src/main.js — InstalaSaldo 2.0 Micro SaaS Application Logic
import {
  loginUser,
  logoutUser,
  resetPassword,
  updateUserPassword,
  getSession,
  onAuthStateChange,
  verifySuperAdminRole,
  isSuperAdmin,
  fetchCurrentCompany,
  fetchCustomers,
  createCustomer,
  fetchQuotes,
  createQuote,
  convertQuoteToWorkOrder,
  fetchWorkOrders,
  startWorkOrder,
  addWorkOrderPhoto,
  addWorkOrderSignature,
  completeWorkOrder,
  fetchMaintenances,
  createMaintenance,
  fetchServices,
  createService,
  fetchAdminUsers,
  fetchAdminStats,
  toggleUserStatus,
  deleteAdminUser,
  fetchAuditLogs,
} from './api.js';

import { formatBRL, toCents, validatePayment } from './money.js';
import { openQuoteVoucher, buildWhatsAppLink } from './pdf.js';

(function () {
  'use strict';

  // State
  let currentSession = null;
  let currentCompany = null;
  let isSuper = false;
  let activeTab = 'inicio';
  let activeOS = null;
  let customerStatusFilter = '';
  let osStatusFilter = '';

  // Elements
  const screens = {
    login: document.getElementById('screen-login'),
    resetPassword: document.getElementById('screen-reset-password'),
    dashboard: document.getElementById('screen-dashboard'),
    admin: document.getElementById('screen-admin'),
  };

  const tabs = {
    inicio: document.getElementById('tab-inicio'),
    clientes: document.getElementById('tab-clientes'),
    os: document.getElementById('tab-os'),
    agenda: document.getElementById('tab-agenda'),
    mais: document.getElementById('tab-mais'),
  };

  const navBtns = {
    inicio: document.getElementById('nav-btn-inicio'),
    clientes: document.getElementById('nav-btn-clientes'),
    fabOs: document.getElementById('nav-btn-fab-os'),
    os: document.getElementById('nav-btn-os'),
    agenda: document.getElementById('nav-btn-agenda'),
    mais: document.getElementById('nav-btn-mais'),
  };

  // Toast
  const toast = document.getElementById('toast');
  function showToast(msg, duration = 3000) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
  }

  // Screen Switcher
  function showScreen(name) {
    Object.keys(screens).forEach((key) => {
      if (screens[key]) {
        screens[key].classList.toggle('active', key === name);
      }
    });
  }

  // Tab Switcher
  function switchTab(tabName) {
    activeTab = tabName;
    Object.keys(tabs).forEach((key) => {
      if (tabs[key]) {
        tabs[key].style.display = key === tabName ? 'block' : 'none';
      }
    });

    Object.keys(navBtns).forEach((key) => {
      if (navBtns[key] && key !== 'fabOs') {
        navBtns[key].classList.toggle('active', key === tabName);
      }
    });

    // Refresh content for selected tab
    if (tabName === 'inicio') loadFinanceSummary();
    if (tabName === 'clientes') loadCustomers();
    if (tabName === 'os') loadWorkOrders();
    if (tabName === 'agenda') loadMaintenances();
  }

  // -------------------------------------------------------------
  // 1. SERVICE WORKER & UPDATE DETECTION
  // -------------------------------------------------------------
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('./service-worker.js')
      .then((reg) => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                const toastBox = document.getElementById('sw-update-toast');
                if (toastBox) toastBox.style.display = 'flex';
              }
            });
          }
        });
      })
      .catch((err) => console.warn('SW registration fail:', err));

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    document.getElementById('btn-update-app')?.addEventListener('click', () => {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg?.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    });
  }

  // -------------------------------------------------------------
  // 2. AUTHENTICATION & SESSION HANDLING
  // -------------------------------------------------------------
  const loginForm = document.getElementById('login-form');
  const inputEmail = document.getElementById('input-email');
  const inputSenha = document.getElementById('input-senha');
  const loginFeedback = document.getElementById('login-feedback');
  const btnForgotPassword = document.getElementById('btn-forgot-password');

  function showFeedback(el, text, isError = true) {
    if (!el) return;
    el.textContent = text;
    el.className = `feedback-msg ${isError ? 'error' : 'success'}`;
    el.style.display = 'block';
  }

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = inputEmail.value.trim();
    const senha = inputSenha.value;

    if (!email || !senha) {
      showFeedback(loginFeedback, 'Preencha o e-mail e a senha.');
      return;
    }

    const btnEntrar = document.getElementById('btn-entrar');
    if (btnEntrar) {
      btnEntrar.disabled = true;
      btnEntrar.textContent = 'Entrando...';
    }

    try {
      await loginUser(email, senha);
      showFeedback(loginFeedback, 'Login realizado com sucesso!', false);
    } catch (err) {
      showFeedback(loginFeedback, err.message || 'E-mail ou senha incorretos.');
    } finally {
      if (btnEntrar) {
        btnEntrar.disabled = false;
        btnEntrar.textContent = 'Entrar na Conta';
      }
    }
  });

  // Forgot Password
  btnForgotPassword?.addEventListener('click', async () => {
    let email = inputEmail.value.trim();
    if (!email) {
      email = prompt('Digite o e-mail da sua conta para receber o link de recuperação:');
    }
    if (!email) return;

    try {
      const res = await resetPassword(email);
      showFeedback(loginFeedback, res.message, false);
      showToast('Solicitação de recuperação enviada.');
    } catch (err) {
      showFeedback(loginFeedback, 'Se o e-mail existir, enviaremos o link.');
    }
  });

  // Reset Password Screen Form
  const resetForm = document.getElementById('reset-password-form');
  const inputNewPass = document.getElementById('input-new-password');
  const inputConfirmPass = document.getElementById('input-confirm-password');
  const resetFeedback = document.getElementById('reset-feedback');
  const btnVoltarReset = document.getElementById('btn-voltar-login-reset');

  resetForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pass1 = inputNewPass.value;
    const pass2 = inputConfirmPass.value;

    if (!pass1 || pass1.length < 6) {
      showFeedback(resetFeedback, 'A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (pass1 !== pass2) {
      showFeedback(resetFeedback, 'As senhas não coincidem.');
      return;
    }

    const btn = document.getElementById('btn-salvar-nova-senha');
    if (btn) btn.disabled = true;

    try {
      await updateUserPassword(pass1);
      showFeedback(resetFeedback, 'Senha alterada com sucesso! Redirecionando...', false);
      setTimeout(() => {
        showScreen('login');
      }, 2000);
    } catch (err) {
      showFeedback(resetFeedback, err.message || 'Erro ao redefinir senha.');
    } finally {
      if (btn) btn.disabled = false;
    }
  });

  btnVoltarReset?.addEventListener('click', () => showScreen('login'));

  // Logout
  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    if (confirm('Deseja realmente sair da sua conta?')) {
      await logoutUser();
      showScreen('login');
      showToast('Você saiu da sua conta.');
    }
  });

  // Listen to Supabase Auth State
  onAuthStateChange(async (event, session) => {
    currentSession = session;

    if (event === 'PASSWORD_RECOVERY' || window.location.pathname.includes('/redefinir-senha')) {
      showScreen('resetPassword');
      return;
    }

    if (session) {
      currentCompany = await fetchCurrentCompany();
      isSuper = await verifySuperAdminRole();

      // Update header
      const greetingName = document.getElementById('greeting-name');
      if (greetingName) {
        greetingName.textContent = currentCompany?.name || session.user.email.split('@')[0];
      }

      // Show Super Admin icon only if verified
      const btnAdminNav = document.getElementById('btn-admin-nav');
      if (btnAdminNav) {
        btnAdminNav.style.display = isSuper ? 'flex' : 'none';
      }

      showScreen('dashboard');
      switchTab('inicio');
    } else {
      showScreen('login');
    }
  });

  // -------------------------------------------------------------
  // 3. ABA 1: RESUMO FINANCEIRO (INÍCIO)
  // -------------------------------------------------------------
  async function loadFinanceSummary() {
    const services = await fetchServices();
    const workOrders = await fetchWorkOrders();
    const maintenances = await fetchMaintenances();

    let totalRec = 0;
    let totalPend = 0;

    services.forEach((s) => {
      const v = s.valor_cents !== undefined ? s.valor_cents : toCents(s.valor);
      const r = s.recebido_cents !== undefined ? s.recebido_cents : toCents(s.valor_recebido);
      totalRec += r;
      totalPend += Math.max(0, v - r);
    });

    const elRec = document.getElementById('total-recebido');
    const elPend = document.getElementById('total-pendente');
    if (elRec) elRec.textContent = formatBRL(totalRec);
    if (elPend) elPend.textContent = formatBRL(totalPend);

    // Fast counters
    const openOS = workOrders.filter((o) => o.status === 'Em execução' || o.status === 'Aberta').length;
    const mCount = maintenances.length;
    const elOS = document.getElementById('metric-os-abertas');
    const elM = document.getElementById('metric-maint-30d');
    if (elOS) elOS.textContent = openOS;
    if (elM) elM.textContent = mCount;

    // Render Recent Services
    const list = document.getElementById('services-list');
    const empty = document.getElementById('empty-state-services');
    if (!list) return;

    if (services.length === 0) {
      list.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';

    list.innerHTML = services
      .slice(0, 5)
      .map((s) => {
        const val = s.valor_cents !== undefined ? s.valor_cents : toCents(s.valor);
        const rec = s.recebido_cents !== undefined ? s.recebido_cents : toCents(s.valor_recebido);
        const pend = Math.max(0, val - rec);
        const isDone = pend === 0;

        return `
        <div class="card-item" style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <strong style="font-size:14px; color:var(--text);">${s.cliente}</strong>
            <p style="font-size:12px; color:var(--text-secondary);">${s.tipo || 'Serviço'}</p>
          </div>
          <div style="text-align:right;">
            <span style="font-size:14px; font-weight:700; color:${isDone ? 'var(--green-dark)' : 'var(--orange-dark)'};">
              ${formatBRL(val)}
            </span>
            <span class="badge ${isDone ? 'badge-done' : 'badge-exec'}" style="display:block; margin-top:2px;">
              ${isDone ? 'Recebido' : 'Resta ' + formatBRL(pend)}
            </span>
          </div>
        </div>
      `;
      })
      .join('');
  }

  // Quick New Service Modal
  const modalSvc = document.getElementById('modal-new-service');
  document.getElementById('btn-novo-lancamento-rapido')?.addEventListener('click', () => {
    if (modalSvc) modalSvc.style.display = 'flex';
  });
  document.getElementById('btn-close-service-modal')?.addEventListener('click', () => {
    if (modalSvc) modalSvc.style.display = 'none';
  });

  document.getElementById('form-new-service')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cliente = document.getElementById('input-svc-cliente').value.trim();
    const tipo = document.getElementById('input-svc-tipo').value.trim();
    const totalVal = document.getElementById('input-svc-total').value;
    const recVal = document.getElementById('input-svc-recebido').value;
    const data = document.getElementById('input-svc-data').value;

    const vCents = toCents(totalVal);
    const rCents = toCents(recVal);

    const check = validatePayment(vCents, rCents);
    if (!check.valid) {
      alert(check.error);
      return;
    }

    try {
      await createService({
        cliente,
        tipo,
        valor_cents: vCents,
        recebido_cents: rCents,
        data,
      });
      if (modalSvc) modalSvc.style.display = 'none';
      e.target.reset();
      showToast('Serviço financeiro registrado com sucesso!');
      loadFinanceSummary();
    } catch (err) {
      alert(err.message || 'Erro ao registrar serviço.');
    }
  });

  // -------------------------------------------------------------
  // 4. ABA 2: CLIENTES (CARTEIRA ATIVA)
  // -------------------------------------------------------------
  async function loadCustomers() {
    const query = document.getElementById('input-search-customers')?.value.trim() || '';
    const customers = await fetchCustomers(query, customerStatusFilter);
    const container = document.getElementById('customers-list');
    if (!container) return;

    if (customers.length === 0) {
      container.innerHTML = `<div class="empty-state"><p>Nenhum cliente encontrado</p></div>`;
      return;
    }

    container.innerHTML = customers
      .map((c) => {
        const cleanPhone = (c.phone || '').replace(/\D/g, '');
        const waLink = buildWhatsAppLink(cleanPhone, `Olá, ${c.name}! Aqui é da ${currentCompany?.name || 'nossa equipe de instalação'}.`);

        return `
        <div class="card-item">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
            <div>
              <strong style="font-size:15px; color:var(--text);">${c.name}</strong>
              <span class="badge" style="margin-left:6px; font-size:10px;">${c.person_type || 'PF'}</span>
            </div>
            <span class="badge ${c.status === 'Ativo' ? 'badge-done' : 'badge-open'}">${c.status}</span>
          </div>
          
          <p style="font-size:13px; color:var(--text-secondary); margin-bottom:4px;">📞 ${c.phone} ${c.address ? `| 📍 ${c.address}` : ''}</p>
          ${c.notes ? `<p style="font-size:12px; color:var(--text-muted); margin-bottom:8px;">${c.notes}</p>` : ''}

          <div style="display:flex; gap:8px; margin-top:8px;">
            <a href="${waLink}" target="_blank" class="btn btn-sm" style="flex:1; border:1px solid var(--green); color:var(--green-dark); text-align:center; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:4px;">
              💬 Abrir WhatsApp
            </a>
            <button type="button" class="btn btn-sm btn-action-quote" data-custid="${c.id}" data-custname="${c.name}" style="flex:1; border:1px solid var(--border);">
              📄 + Orçamento
            </button>
          </div>
        </div>
      `;
      })
      .join('');

    // Attach quote action buttons
    container.querySelectorAll('.btn-action-quote').forEach((btn) => {
      btn.addEventListener('click', () => {
        openNewQuoteModal(btn.dataset.custid, btn.dataset.custname);
      });
    });
  }

  document.getElementById('input-search-customers')?.addEventListener('input', loadCustomers);

  document.querySelectorAll('#tab-clientes .pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#tab-clientes .pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      customerStatusFilter = pill.dataset.status;
      loadCustomers();
    });
  });

  const modalCustomer = document.getElementById('modal-customer');
  document.getElementById('btn-novo-cliente')?.addEventListener('click', () => {
    if (modalCustomer) modalCustomer.style.display = 'flex';
  });
  document.getElementById('btn-close-customer-modal')?.addEventListener('click', () => {
    if (modalCustomer) modalCustomer.style.display = 'none';
  });

  document.getElementById('form-customer')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const person_type = document.getElementById('cust-type').value;
    const documentVal = document.getElementById('cust-doc').value.trim();
    const address = document.getElementById('cust-address').value.trim();
    const notes = document.getElementById('cust-notes').value.trim();

    try {
      const created = await createCustomer({
        name,
        phone,
        person_type,
        document: documentVal,
        address,
        notes,
      });

      if (created.isDuplicateWarning) {
        showToast('Aviso: Cliente cadastrado, mas o telefone já existia na carteira.');
      } else {
        showToast('Cliente cadastrado com sucesso!');
      }

      if (modalCustomer) modalCustomer.style.display = 'none';
      e.target.reset();
      loadCustomers();
    } catch (err) {
      alert(err.message || 'Erro ao cadastrar cliente.');
    }
  });

  // -------------------------------------------------------------
  // 5. ABA 3: ORDENS DE SERVIÇO (MÓDULO CENTRAL)
  // -------------------------------------------------------------
  async function loadWorkOrders() {
    const list = await fetchWorkOrders(osStatusFilter);
    const container = document.getElementById('work-orders-list');
    if (!container) return;

    if (list.length === 0) {
      container.innerHTML = `<div class="empty-state"><p>Nenhuma Ordem de Serviço nesta visualização</p></div>`;
      return;
    }

    container.innerHTML = list
      .map((os) => {
        let badgeClass = 'badge-open';
        if (os.status === 'Em execução') badgeClass = 'badge-exec';
        if (os.status === 'Concluída') badgeClass = 'badge-done';

        return `
        <div class="card-item card-os-item" data-osid="${os.id}" style="cursor:pointer;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <strong style="font-size:15px; color:var(--text);">OS #${os.order_number}</strong>
            <span class="badge ${badgeClass}">${os.status}</span>
          </div>
          <p style="font-size:13px; font-weight:600; color:var(--primary); margin-bottom:2px;">${os.customer?.name || 'Cliente'}</p>
          <p style="font-size:12px; color:var(--text-secondary); margin-bottom:6px;">🛠️ ${os.service_type || 'Instalação'}</p>
          <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-muted); border-top:1px solid var(--border); padding-top:6px; margin-top:6px;">
            <span>📅 ${os.scheduled_date || 'A combinar'} ${os.scheduled_time ? `às ${os.scheduled_time}` : ''}</span>
            <span>📷 ${os.photos?.length || 0} fotos | ✍️ ${os.signatures?.length ? 'Assinada' : 'Pendente'}</span>
          </div>
        </div>
      `;
      })
      .join('');

    container.querySelectorAll('.card-os-item').forEach((item) => {
      item.addEventListener('click', () => {
        openOSModal(item.dataset.osid);
      });
    });
  }

  document.querySelectorAll('#tab-os .pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#tab-os .pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      osStatusFilter = pill.dataset.osStatus;
      loadWorkOrders();
    });
  });

  // OS Modal & Execution Logic
  const modalOS = document.getElementById('modal-os-execution');
  const canvas = document.getElementById('signature-canvas');
  let ctx = null;
  let isDrawing = false;
  let hasSigned = false;

  function initCanvas() {
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1a2744';

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    }

    function startDraw(e) {
      e.preventDefault();
      isDrawing = true;
      hasSigned = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }

    function draw(e) {
      if (!isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }

    function stopDraw() {
      isDrawing = false;
    }

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDraw);

    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    window.addEventListener('touchend', stopDraw);
  }

  document.getElementById('btn-clear-signature')?.addEventListener('click', () => {
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hasSigned = false;
    }
  });

  // Absent client toggle
  document.getElementById('chk-client-absent')?.addEventListener('change', (e) => {
    const box = document.getElementById('box-absent-reason');
    if (box) box.style.display = e.target.checked ? 'block' : 'none';
  });

  async function openOSModal(osId) {
    const list = await fetchWorkOrders();
    activeOS = list.find((o) => o.id === osId);
    if (!activeOS || !modalOS) return;

    document.getElementById('modal-os-id').value = activeOS.id;
    document.getElementById('modal-os-title').textContent = `OS #${activeOS.order_number} — ${activeOS.service_type}`;
    document.getElementById('os-modal-client-info').innerHTML = `<strong>Cliente:</strong> ${activeOS.customer?.name || 'Cliente'} (Tel: ${activeOS.customer?.phone || 'N/I'})`;
    document.getElementById('os-modal-address').textContent = `Endereço: ${activeOS.customer?.address || 'Nenhum endereço informado'}`;

    // Subtab initial state
    switchOSTab('details');

    // Start button state
    const btnStart = document.getElementById('btn-iniciar-atendimento');
    const labelStarted = document.getElementById('label-atendimento-iniciado');
    const timeStarted = document.getElementById('time-started');

    if (activeOS.status === 'Em execução' || activeOS.status === 'Concluída') {
      if (btnStart) btnStart.style.display = 'none';
      if (labelStarted) labelStarted.style.display = 'block';
      if (timeStarted) timeStarted.textContent = new Date(activeOS.execution_started_at || Date.now()).toLocaleTimeString('pt-BR');
    } else {
      if (btnStart) btnStart.style.display = 'block';
      if (labelStarted) labelStarted.style.display = 'none';
    }

    // Populate notes & photos
    document.getElementById('os-input-notes').value = activeOS.execution_notes || '';
    document.getElementById('os-input-materials').value = activeOS.materials_used || '';
    renderOSPhotos();

    // Reset signature
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hasSigned = false;
    }

    modalOS.style.display = 'flex';
  }

  function switchOSTab(tabKey) {
    document.querySelectorAll('.os-tab-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.ostab === tabKey);
    });

    document.querySelectorAll('.os-subtab').forEach((sub) => {
      sub.style.display = 'none';
    });

    const activeSub = document.getElementById(`os-subtab-${tabKey}`);
    if (activeSub) activeSub.style.display = 'block';

    if (tabKey === 'sig' && !ctx) {
      setTimeout(initCanvas, 100);
    }
  }

  document.querySelectorAll('.os-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchOSTab(btn.dataset.ostab));
  });

  document.getElementById('btn-close-os-modal')?.addEventListener('click', () => {
    if (modalOS) modalOS.style.display = 'none';
    loadWorkOrders();
  });

  // Start Service Button
  document.getElementById('btn-iniciar-atendimento')?.addEventListener('click', async () => {
    if (!activeOS) return;
    try {
      const updated = await startWorkOrder(activeOS.id);
      activeOS = updated;
      document.getElementById('btn-iniciar-atendimento').style.display = 'none';
      document.getElementById('label-atendimento-iniciado').style.display = 'block';
      document.getElementById('time-started').textContent = new Date().toLocaleTimeString('pt-BR');
      showToast('Atendimento iniciado com registro de horário no servidor!');
      switchOSTab('exec');
    } catch (err) {
      alert(err.message || 'Erro ao iniciar atendimento.');
    }
  });

  // Camera Photo Input
  const inputPhoto = document.getElementById('input-camera-photo');
  inputPhoto?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file || !activeOS) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      await addWorkOrderPhoto(activeOS.id, dataUrl, 'Foto da instalação');
      renderOSPhotos();
      showToast('Foto adicionada à Ordem de Serviço.');
    };
    reader.readAsDataURL(file);
  });

  function renderOSPhotos() {
    const gallery = document.getElementById('os-photos-gallery');
    const badge = document.getElementById('count-os-photos');
    if (!gallery || !activeOS) return;

    const photos = activeOS.photos || [];
    if (badge) badge.textContent = photos.length;

    gallery.innerHTML = photos
      .map(
        (p) => `
      <div style="position:relative; border-radius:6px; overflow:hidden; border:1px solid var(--border);">
        <img src="${p.file_url}" style="width:100%; height:80px; object-fit:cover; display:block;">
      </div>
    `
      )
      .join('');
  }

  // Complete OS Final Button
  document.getElementById('btn-concluir-os-final')?.addEventListener('click', async () => {
    if (!activeOS) return;

    const notes = document.getElementById('os-input-notes').value.trim();
    const materials = document.getElementById('os-input-materials').value.trim();
    const isAbsent = document.getElementById('chk-client-absent').checked;
    const absentReason = document.getElementById('input-absent-reason').value.trim();
    const signerName = document.getElementById('input-signer-name').value.trim();

    // Save signature if drawn
    if (hasSigned && canvas && signerName) {
      const sigData = canvas.toDataURL('image/png');
      await addWorkOrderSignature(activeOS.id, signerName, sigData);
    }

    try {
      await completeWorkOrder(activeOS.id, notes, materials, isAbsent ? absentReason : '');
      showToast('Ordem de Serviço CONCLUÍDA com sucesso!');
      if (modalOS) modalOS.style.display = 'none';
      loadWorkOrders();
      loadFinanceSummary();
    } catch (err) {
      alert(err.message || 'Erro ao concluir OS.');
    }
  });

  // Voucher PDF Generation
  document.getElementById('btn-comprovante-pdf')?.addEventListener('click', () => {
    if (!activeOS) return;
    openQuoteVoucher(
      {
        quote_number: activeOS.order_number,
        issue_date: activeOS.scheduled_date,
        total_cents: 0,
        notes: `Execução: ${activeOS.execution_notes || 'Serviço realizado'}. Materiais: ${activeOS.materials_used || 'Nenhum'}.`,
        items: [{ description: activeOS.service_type, quantity: 1, unit_price_cents: 0, total_price_cents: 0 }],
      },
      currentCompany || { name: 'InstalaSaldo' },
      activeOS.customer || { name: 'Cliente' }
    );
  });

  // FAB button triggers new OS
  navBtns.fabOs?.addEventListener('click', () => {
    switchTab('os');
    showToast('Selecione um cliente para criar a Ordem de Serviço.');
  });

  // -------------------------------------------------------------
  // 6. ABA 4: AGENDA & MANUTENÇÃO PREVENTIVA
  // -------------------------------------------------------------
  async function loadMaintenances() {
    const list = await fetchMaintenances();
    const container = document.getElementById('maintenance-list');
    if (!container) return;

    if (list.length === 0) {
      container.innerHTML = `<div class="empty-state"><p>Nenhuma manutenção preventiva agendada</p></div>`;
      return;
    }

    container.innerHTML = list
      .map((m) => {
        const cleanPhone = (m.customer?.phone || '').replace(/\D/g, '');
        const msg = `Olá, ${m.customer?.name || 'Cliente'}! Aqui é da ${currentCompany?.name || 'equipe técnica'}. Está chegando o período previsto para a manutenção do seu equipamento (${m.equipment}). Deseja agendar uma visita preventiva?`;
        const waLink = buildWhatsAppLink(cleanPhone, msg);

        return `
        <div class="card-item">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
            <div>
              <strong style="font-size:14px; color:var(--text);">${m.customer?.name || 'Cliente'}</strong>
              <p style="font-size:12px; color:var(--primary); font-weight:600;">${m.equipment}</p>
            </div>
            <span class="badge ${m.status === 'Concluída' ? 'badge-done' : 'badge-exec'}">${m.status}</span>
          </div>

          <div style="background:#f8fafc; border:1px solid var(--border); border-radius:6px; padding:8px; margin:8px 0; font-size:12px;">
            <span>📅 Previsão de Retorno: </span>
            <input type="date" value="${m.estimated_return_date}" class="input-edit-maint-date" data-mid="${m.id}" style="padding:4px 6px; border:1px solid var(--border); border-radius:4px; font-weight:700;">
          </div>

          <a href="${waLink}" target="_blank" class="btn btn-sm btn-block" style="border:1px solid var(--green); color:var(--green-dark); text-align:center; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:6px;">
            💬 Enviar Lembrete no WhatsApp
          </a>
        </div>
      `;
      })
      .join('');
  }

  const modalMaint = document.getElementById('modal-maintenance');
  document.getElementById('btn-nova-manutencao')?.addEventListener('click', async () => {
    const select = document.getElementById('maint-select-customer');
    if (select) {
      const customers = await fetchCustomers();
      select.innerHTML = customers.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
    }
    if (modalMaint) modalMaint.style.display = 'flex';
  });

  document.getElementById('btn-close-maint-modal')?.addEventListener('click', () => {
    if (modalMaint) modalMaint.style.display = 'none';
  });

  document.getElementById('form-maintenance')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const customer_id = document.getElementById('maint-select-customer').value;
    const equipment = document.getElementById('maint-equipment').value.trim();
    const interval_months = parseInt(document.getElementById('maint-interval').value) || 6;
    const estimated_return_date = document.getElementById('maint-date').value;
    const notes = document.getElementById('maint-notes').value.trim();

    try {
      await createMaintenance({
        customer_id,
        equipment,
        interval_months,
        estimated_return_date,
        notes,
      });
      showToast('Manutenção preventiva agendada!');
      if (modalMaint) modalMaint.style.display = 'none';
      e.target.reset();
      loadMaintenances();
    } catch (err) {
      alert(err.message || 'Erro ao agendar manutenção.');
    }
  });

  // -------------------------------------------------------------
  // 7. ORÇAMENTOS (QUOTES) & CONVERSÃO
  // -------------------------------------------------------------
  const modalQuote = document.getElementById('modal-quote');
  async function openNewQuoteModal(defaultCustId = '', defaultCustName = '') {
    const select = document.getElementById('quote-select-customer');
    if (select) {
      const customers = await fetchCustomers();
      select.innerHTML = customers.map((c) => `<option value="${c.id}" ${c.id === defaultCustId ? 'selected' : ''}>${c.name}</option>`).join('');
    }
    if (modalQuote) modalQuote.style.display = 'flex';
  }

  document.getElementById('btn-close-quote-modal')?.addEventListener('click', () => {
    if (modalQuote) modalQuote.style.display = 'none';
  });

  document.getElementById('form-quote')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const customer_id = document.getElementById('quote-select-customer').value;
    const issue_date = document.getElementById('quote-issue-date').value || new Date().toISOString().split('T')[0];
    const valid_until = document.getElementById('quote-valid-until').value;
    const descItem = document.getElementById('quote-desc-item').value.trim();
    const totalVal = document.getElementById('quote-total-val').value;
    const entryVal = document.getElementById('quote-entry-val').value;
    const terms = document.getElementById('quote-terms').value.trim();

    const tCents = toCents(totalVal);
    const eCents = toCents(entryVal);

    try {
      const created = await createQuote(
        {
          customer_id,
          issue_date,
          valid_until,
          entry_cents: eCents,
          payment_terms: terms,
        },
        [{ description: descItem, quantity: 1, unit_price_cents: tCents, total_price_cents: tCents }]
      );

      showToast(`Orçamento #${created.quote_number} criado com sucesso!`);
      if (modalQuote) modalQuote.style.display = 'none';
      e.target.reset();

      // Offer WhatsApp sharing immediately
      const cust = (await fetchCustomers()).find((c) => c.id === customer_id);
      if (cust) {
        const msg = `Olá, ${cust.name}! Segue o Orçamento #${created.quote_number} no valor de ${formatBRL(created.total_cents)} emitido por ${currentCompany?.name || 'InstalaSaldo'}.`;
        const waLink = buildWhatsAppLink(cust.phone, msg);
        if (confirm('Deseja abrir o WhatsApp para enviar este orçamento ao cliente agora?')) {
          window.open(waLink, '_blank');
        }
      }
    } catch (err) {
      alert(err.message || 'Erro ao criar orçamento.');
    }
  });

  // -------------------------------------------------------------
  // 8. ABA 5: MAIS (ORÇAMENTOS, PLANOS, LEGAL)
  // -------------------------------------------------------------
  document.getElementById('menu-btn-quotes')?.addEventListener('click', () => {
    openNewQuoteModal();
  });

  document.getElementById('menu-btn-teams')?.addEventListener('click', () => {
    alert('Módulo de Equipes: seu plano atual (Solo) suporta 1 usuário. Acesse "Planos" para gerenciar mais membros.');
  });

  const modalPlans = document.getElementById('modal-plans');
  document.getElementById('menu-btn-plans')?.addEventListener('click', () => {
    if (modalPlans) modalPlans.style.display = 'flex';
  });
  document.getElementById('btn-close-plans-modal')?.addEventListener('click', () => {
    if (modalPlans) modalPlans.style.display = 'none';
  });

  const modalLegal = document.getElementById('modal-legal');
  document.getElementById('menu-btn-terms')?.addEventListener('click', () => {
    if (modalLegal) modalLegal.style.display = 'flex';
  });
  document.getElementById('btn-close-legal-modal')?.addEventListener('click', () => {
    if (modalLegal) modalLegal.style.display = 'none';
  });

  document.getElementById('menu-btn-support')?.addEventListener('click', () => {
    const waLink = buildWhatsAppLink('11999999999', 'Olá, suporte da Agência Vallor! Gostaria de ajuda com o InstalaSaldo.');
    window.open(waLink, '_blank');
  });

  // -------------------------------------------------------------
  // 9. SUPER ADMIN DASHBOARD
  // -------------------------------------------------------------
  const btnAdminNav = document.getElementById('btn-admin-nav');
  const btnVoltarAdmin = document.getElementById('btn-voltar-admin');

  btnAdminNav?.addEventListener('click', async () => {
    if (!isSuper) {
      alert('Acesso restrito ao Super Administrador.');
      return;
    }
    showScreen('admin');
    await loadAdminDashboard();
  });

  btnVoltarAdmin?.addEventListener('click', () => showScreen('dashboard'));

  async function loadAdminDashboard() {
    const stats = await fetchAdminStats();
    document.getElementById('stat-total-usuarios').textContent = stats.totalUsuarios;
    document.getElementById('stat-total-empresas').textContent = stats.totalEmpresas;
    document.getElementById('stat-usuarios-ativos').textContent = stats.usuariosAtivos;
    document.getElementById('stat-usuarios-bloqueados').textContent = stats.usuariosBloqueados;

    document.getElementById('stat-plano-basico').textContent = stats.empresasPorPlano.Solo || 0;
    document.getElementById('stat-plano-pro').textContent = stats.empresasPorPlano.Equipe || 0;
    document.getElementById('stat-plano-enterprise').textContent = stats.empresasPorPlano.Empresa || 0;

    await loadAdminUsersList();
    await loadAdminAuditLogs();
  }

  async function loadAdminUsersList() {
    const query = document.getElementById('admin-search-input')?.value.trim() || '';
    const users = await fetchAdminUsers(query);
    const container = document.getElementById('admin-users-list');
    if (!container) return;

    container.innerHTML = users
      .map((u) => {
        const isRoot = isSuperAdmin(u.email);
        const isActive = u.status === 'ativo' || u.status === 'active';

        return `
        <div class="card-item" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <div>
            <strong style="font-size:14px; color:var(--text);">${u.email}</strong>
            <p style="font-size:12px; color:var(--text-secondary);">${u.nome || 'Usuário'} | ${u.empresa || 'Empresa'}</p>
          </div>
          <div style="display:flex; gap:6px; align-items:center;">
            <span class="badge ${isActive ? 'badge-done' : 'badge-exec'}">${u.status}</span>
            ${
              isRoot
                ? `<span style="font-size:11px; font-weight:700; color:var(--blue-accent);">ROOT</span>`
                : `<button type="button" class="btn btn-sm btn-toggle-status" data-uid="${u.id}" style="border:1px solid var(--border); font-size:11px;">
                    ${isActive ? 'Bloquear' : 'Reativar'}
                   </button>`
            }
          </div>
        </div>
      `;
      })
      .join('');

    container.querySelectorAll('.btn-toggle-status').forEach((b) => {
      b.addEventListener('click', async () => {
        try {
          await toggleUserStatus(b.dataset.uid);
          showToast('Status do usuário atualizado.');
          await loadAdminDashboard();
        } catch (err) {
          alert(err.message || 'Erro ao alterar status.');
        }
      });
    });
  }

  document.getElementById('admin-search-input')?.addEventListener('input', loadAdminUsersList);

  async function loadAdminAuditLogs() {
    const logs = await fetchAuditLogs();
    const container = document.getElementById('admin-audit-logs');
    if (!container) return;

    container.innerHTML = logs
      .map(
        (l) => `
      <div style="border-bottom:1px solid var(--border); padding:6px 0; font-size:12px;">
        <div style="display:flex; justify-content:space-between; color:var(--text-muted); font-size:10px;">
          <span>${l.action}</span>
          <span>${new Date(l.timestamp).toLocaleString('pt-BR')}</span>
        </div>
        <div style="color:var(--text); font-weight:500; margin-top:2px;">${l.details || ''}</div>
      </div>
    `
      )
      .join('');
  }

  // -------------------------------------------------------------
  // 10. BOTTOM NAVIGATION EVENT LISTENERS
  // -------------------------------------------------------------
  navBtns.inicio?.addEventListener('click', () => switchTab('inicio'));
  navBtns.clientes?.addEventListener('click', () => switchTab('clientes'));
  navBtns.os?.addEventListener('click', () => switchTab('os'));
  navBtns.agenda?.addEventListener('click', () => switchTab('agenda'));
  navBtns.mais?.addEventListener('click', () => switchTab('mais'));
})();
