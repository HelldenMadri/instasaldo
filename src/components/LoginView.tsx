import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Logo } from './Logo';

export const LoginView: React.FC = () => {
  const { loginWithCredentials, signupWithCredentials } = useApp();
  const [tab, setTab] = useState<'login' | 'signup' | 'forgot'>('login');
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // Signup State
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage('Por favor, informe seu e-mail cadastrado.');
      return;
    }

    if (!password) {
      setErrorMessage('Por favor, informe sua senha de acesso.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await loginWithCredentials(email.trim(), password);
      if (!result.success) {
        setErrorMessage(result.error || 'Credenciais inválidas. Verifique os dados informados.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado ao realizar login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage('Por favor, informe seu nome completo.');
      return;
    }
    if (!companyName.trim()) {
      setErrorMessage('Por favor, informe o nome da sua empresa ou negócio.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Por favor, informe seu e-mail profissional.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Por favor, informe seu WhatsApp com DDD.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (email.trim().toLowerCase() === 'agenciavallor01@gmail.com') {
      setErrorMessage('Este e-mail não pode ser usado para criar conta.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signupWithCredentials({
        name: name.trim(),
        companyName: companyName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
      if (!result.success) {
        setErrorMessage(result.error || 'Não foi possível criar a conta. Tente novamente.');
      } else {
        setSuccessMessage('Conta criada com sucesso! Aguarde, redirecionando...');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado ao criar conta.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#04122e] flex flex-col justify-center items-center p-4 relative overflow-hidden font-body selection:bg-[#6cf8bb] selection:text-[#002113]">
      {/* Background Glow Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex justify-center p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl">
            <Logo size={48} showText={false} />
          </div>
          <h1 className="text-2xl font-extrabold text-white font-headline tracking-tight">
            InstalaSaldo <span className="text-[#4edea3]">2.0</span>
          </h1>
          <p className="text-xs text-blue-200/80 max-w-xs mx-auto">
            Plataforma de gestão financeira, ordens de serviço e recebimentos para técnicos e instaladores
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80">
          {/* Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                tab === 'login'
                  ? 'bg-white text-[#04122e] shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('signup');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                tab === 'signup'
                  ? 'bg-white text-[#04122e] shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Criar Conta
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-shake">
              <span className="material-symbols-outlined text-[18px] text-red-500 shrink-0">error</span>
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
              <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0">check_circle</span>
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          {tab === 'login' && (
            <form onSubmit={handleSubmitLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  E-mail de Acesso
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-slate-400">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex: seuemail@empresa.com"
                    className="w-full h-11 pl-10 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-[#04122e] focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setTab('forgot');
                      setErrorMessage(null);
                    }}
                    className="text-[11px] text-[#006c49] font-bold hover:underline"
                  >
                    Esqueceu?
                  </button>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-slate-400">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 pl-10 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-[#04122e] focus:ring-2 focus:ring-blue-100 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#006c49] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 font-medium">Manter conectado</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#04122e] hover:bg-[#1a2744] active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-950/20 transition-all flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px] text-[#4edea3]">login</span>
                    <span>Entrar no Sistema</span>
                  </>
                )}
              </button>
            </form>
          )}

          {tab === 'signup' && (
            <form onSubmit={handleSubmitSignup} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Seu Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: João da Silva"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-[#04122e]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome da Empresa ou Negócio
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="ex: ClimaBom Ar Condicionado"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-[#04122e]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail Profissional
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: contato@climabom.com.br"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-[#04122e]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WhatsApp com DDD
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(85) 99999-9999"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-[#04122e]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Senha Segura (Mínimo 6 dígitos)
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-[#04122e]"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-[#006c49] hover:bg-[#005236] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <span>Criando Conta...</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span>Criar Minha Conta Grátis</span>
                  </>
                )}
              </button>
            </form>
          )}

          {tab === 'forgot' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <span className="material-symbols-outlined text-[36px] text-amber-500">lock_reset</span>
                <h3 className="font-headline font-bold text-sm text-slate-900">
                  Recuperação de Acesso
                </h3>
                <p className="text-xs text-slate-500">
                  Informe o e-mail cadastrado para enviarmos as instruções de redefinição de senha.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail Cadastrado
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@empresa.com"
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-[#04122e]"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setSuccessMessage('Se o e-mail estiver cadastrado, um link de recuperação foi enviado.');
                  setTimeout(() => setTab('login'), 3000);
                }}
                className="w-full h-11 bg-[#04122e] text-white text-xs font-bold rounded-xl hover:bg-[#1a2744] transition-all"
              >
                Enviar Link de Recuperação
              </button>

              <button
                type="button"
                onClick={() => setTab('login')}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-900 font-bold"
              >
                Voltar para o Login
              </button>
            </div>
          )}
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-blue-200/60 font-medium">
          <span className="material-symbols-outlined text-[14px]">lock</span>
          <span>Ambiente Criptografado & Protegido por Token SSL</span>
        </div>
      </div>
    </div>
  );
};
