import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Logo } from './Logo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: 'login' | 'signup' | 'recovery';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'recovery'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConfigured = isSupabaseConfigured();

  const mapSupabaseError = (err: any): string => {
    const msg = err?.message || String(err);
    if (msg.includes('Invalid login credentials')) {
      return 'E-mail ou senha incorretos. Verifique suas credenciais.';
    }
    if (msg.includes('User already registered')) {
      return 'Este e-mail já está cadastrado no InstalaSaldo. Tente fazer login ou recuperar sua senha.';
    }
    if (msg.includes('Password should be at least')) {
      return 'A senha deve conter no mínimo 6 caracteres.';
    }
    if (msg.includes('rate limit')) {
      return 'Muitas tentativas em pouco tempo. Aguarde alguns instantes.';
    }
    if (msg.includes('Email not confirmed')) {
      return 'E-mail ainda não confirmado. Verifique sua caixa de entrada.';
    }
    return msg || 'Ocorreu um erro na autenticação. Tente novamente.';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (!isConfigured) {
        throw new Error(
          'Supabase ainda não configurado no ambiente de execução. Adicione VITE_SUPABASE_PUBLISHABLE_KEY no arquivo .env.'
        );
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (data.session) {
        setSuccessMessage('Autenticação realizada com sucesso! Carregando dados...');
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      setErrorMessage(mapSupabaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (!isConfigured) {
        throw new Error(
          'Supabase ainda não configurado no ambiente de execução. Adicione VITE_SUPABASE_PUBLISHABLE_KEY no arquivo .env.'
        );
      }

      if (password.length < 6) {
        throw new Error('A senha deve conter no mínimo 6 caracteres.');
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim(),
            phone: phone.trim(),
            company_name: companyName.trim(),
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        setSuccessMessage(
          'Conta criada com sucesso! Caso a confirmação de e-mail esteja ativada no Supabase, verifique sua caixa de entrada.'
        );
        setTimeout(() => {
          if (data.session) {
            onSuccess?.();
            onClose();
          } else {
            setMode('login');
          }
        }, 2000);
      }
    } catch (err: any) {
      setErrorMessage(mapSupabaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (!isConfigured) {
        throw new Error('Supabase ainda não configurado no ambiente de execução.');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });

      if (error) throw error;

      setSuccessMessage(
        'Instruções de redefinição de senha enviadas com sucesso para o seu e-mail.'
      );
    } catch (err: any) {
      setErrorMessage(mapSupabaseError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" iconOnly />
            <div>
              <h2 className="font-headline font-bold text-lg text-[#04122e]">
                {mode === 'login'
                  ? 'Acessar InstalaSaldo'
                  : mode === 'signup'
                  ? 'Criar Nova Conta'
                  : 'Recuperar Senha'}
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">
                Autenticação Segura via Supabase Auth
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Supabase Status Banner */}
        <div className="mt-4">
          {isConfigured ? (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-[11px] text-emerald-800 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span>Supabase Auth Ativo (Ref: hptaarigzvndqkhpaodp)</span>
            </div>
          ) : (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-[11px] text-amber-800 font-medium">
              <span className="material-symbols-outlined text-amber-600 text-[16px]">info</span>
              <span>Modo Prototipação: VITE_SUPABASE_PUBLISHABLE_KEY aguardada.</span>
            </div>
          )}
        </div>

        {/* Messages */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] shrink-0">check_circle</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Forms */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                E-mail Corporativo ou do Instalador
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@empresa.com.br"
                className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#1a2744] transition-all"
              />
              {email.toLowerCase() === 'agenciavallor01@gmail.com' && (
                <span className="text-[10px] text-amber-700 font-bold block mt-1">
                  ★ Conta Proprietária Master Identificada (Acesso Super Admin exclusivo)
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Senha</label>
                <button
                  type="button"
                  onClick={() => setMode('recovery')}
                  className="text-[11px] text-[#04122e] hover:underline font-semibold"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#1a2744] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#04122e] hover:bg-[#1a2744] text-white font-headline text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">
                    progress_activity
                  </span>
                  <span>Autenticando no Supabase...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  <span>Entrar com Supabase Auth</span>
                </>
              )}
            </button>

            <div className="pt-2 text-center text-xs text-slate-500">
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-[#04122e] font-bold hover:underline"
              >
                Cadastre sua empresa
              </button>
            </div>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="mt-5 space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Nome Completo do Responsável
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Carlos Eduardo Silveira"
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#1a2744]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nome da Empresa / Fantasia
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: Silveira Climatização"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#1a2744]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  WhatsApp / Celular
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#1a2744]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                E-mail de Acesso
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@empresa.com.br"
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#1a2744]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Criar Senha (Mínimo 6 dígitos)
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#1a2744]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#04122e] hover:bg-[#1a2744] text-white font-headline text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Registrando...</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  <span>Criar Conta no Supabase</span>
                </>
              )}
            </button>

            <div className="pt-2 text-center text-xs text-slate-500">
              Já possui conta?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-[#04122e] font-bold hover:underline"
              >
                Fazer login
              </button>
            </div>
          </form>
        )}

        {mode === 'recovery' && (
          <form onSubmit={handlePasswordRecovery} className="mt-5 space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Digite seu e-mail cadastrado para receber o link seguro de redefinição de senha gerado pelo Supabase Auth.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Seu E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@empresa.com.br"
                className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:ring-2 focus:ring-[#1a2744]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#04122e] hover:bg-[#1a2744] text-white font-headline text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Enviando link...</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                  <span>Enviar E-mail de Recuperação</span>
                </>
              )}
            </button>

            <div className="pt-2 text-center text-xs text-slate-500">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-[#04122e] font-bold hover:underline flex items-center justify-center gap-1 mx-auto"
              >
                <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                <span>Voltar ao login</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
