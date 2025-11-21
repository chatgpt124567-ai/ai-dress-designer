'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import Button from './Button';
import Toast, { ToastType } from './Toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { t, direction } = useLanguage();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('error');

  const showToast = (message: string, type: ToastType) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirectTo=/design`,
        },
      });

      if (error) {
        console.error('Google auth error:', error);
        showToast(error.message, 'error');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      showToast(t('auth.modal.errors.networkError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      showToast(t('auth.modal.errors.emailRequired'), 'error');
      return;
    }
    if (!password) {
      showToast(t('auth.modal.errors.passwordRequired'), 'error');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        if (error.message.includes('Invalid login credentials')) {
          showToast(t('auth.modal.errors.invalidCredentials'), 'error');
        } else if (error.message.includes('Email not confirmed')) {
          showToast(t('auth.modal.errors.emailNotConfirmed'), 'error');
        } else {
          showToast(error.message, 'error');
        }
        return;
      }

      showToast(t('auth.modal.success.login'), 'success');
      setTimeout(() => {
        onSuccess();
      }, 500);
    } catch (error) {
      console.error('Login error:', error);
      showToast(t('auth.modal.errors.networkError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      showToast(t('auth.modal.errors.emailRequired'), 'error');
      return;
    }
    if (!password) {
      showToast(t('auth.modal.errors.passwordRequired'), 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast(t('auth.modal.errors.passwordMismatch'), 'error');
      return;
    }
    if (password.length < 6) {
      showToast(t('auth.modal.errors.passwordTooShort'), 'error');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || email.split('@')[0],
          },
        },
      });

      if (error) {
        console.error('Signup error:', error);
        if (error.message.includes('already registered')) {
          showToast(t('auth.modal.errors.emailExists'), 'error');
        } else {
          showToast(error.message, 'error');
        }
        return;
      }

      showToast(t('auth.modal.success.signup'), 'success');
      setTimeout(() => {
        onSuccess();
      }, 500);
    } catch (error) {
      console.error('Signup error:', error);
      showToast(t('auth.modal.errors.networkError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    resetForm();
  };

  return (
    <>
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-md w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className={cn(
                  "absolute top-4 z-10 p-2 bg-white/90 rounded-full hover:bg-white transition-colors",
                  direction === 'rtl' ? 'left-4' : 'right-4'
                )}
                aria-label={t('common.close')}
              >
                <X size={20} className="text-primary" />
              </button>

              {/* Header */}
              <div className="bg-gradient-to-br from-accent-gold/10 to-amber-50 p-6 border-b border-accent-gold/20">
                <div className="flex items-center gap-3 mb-2">
                  {mode === 'login' ? (
                    <LogIn className="w-6 h-6 text-accent-gold" />
                  ) : (
                    <UserPlus className="w-6 h-6 text-accent-gold" />
                  )}
                  <h2 className="text-2xl font-headline font-bold text-primary">
                    {mode === 'login' ? t('auth.modal.login.title') : t('auth.modal.signup.title')}
                  </h2>
                </div>
                <p className="text-sm text-neutral-600" dir={direction}>
                  {t('auth.modal.description')}
                </p>
              </div>

              {/* Form */}
              <div className="p-6">
                <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4">
                  {/* Full Name (Signup only) */}
                  {mode === 'signup' && (
                    <div>
                      <label className="block text-sm font-medium text-primary mb-2" dir={direction}>
                        {t('auth.modal.fullName')}
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-gold focus:border-transparent transition-all"
                        placeholder={t('auth.modal.fullNamePlaceholder')}
                        dir={direction}
                      />
                    </div>
                  )}

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2" dir={direction}>
                      {t('auth.modal.email')}
                    </label>
                    <div className="relative">
                      <Mail className={cn(
                        "absolute top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400",
                        direction === 'rtl' ? 'right-3' : 'left-3'
                      )} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={cn(
                          "w-full py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-gold focus:border-transparent transition-all",
                          direction === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'
                        )}
                        placeholder={t('auth.modal.emailPlaceholder')}
                        dir={direction}
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2" dir={direction}>
                      {t('auth.modal.password')}
                    </label>
                    <div className="relative">
                      <Lock className={cn(
                        "absolute top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400",
                        direction === 'rtl' ? 'right-3' : 'left-3'
                      )} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={cn(
                          "w-full py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-gold focus:border-transparent transition-all",
                          direction === 'rtl' ? 'pr-10 pl-10' : 'pl-10 pr-10'
                        )}
                        placeholder={t('auth.modal.passwordPlaceholder')}
                        dir={direction}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={cn(
                          "absolute top-1/2 -translate-y-1/2 text-neutral-400 hover:text-primary transition-colors",
                          direction === 'rtl' ? 'left-3' : 'right-3'
                        )}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password (Signup only) */}
                  {mode === 'signup' && (
                    <div>
                      <label className="block text-sm font-medium text-primary mb-2" dir={direction}>
                        {t('auth.modal.confirmPassword')}
                      </label>
                      <div className="relative">
                        <Lock className={cn(
                          "absolute top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400",
                          direction === 'rtl' ? 'right-3' : 'left-3'
                        )} />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={cn(
                            "w-full py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-gold focus:border-transparent transition-all",
                            direction === 'rtl' ? 'pr-10 pl-10' : 'pl-10 pr-10'
                          )}
                          placeholder={t('auth.modal.confirmPasswordPlaceholder')}
                          dir={direction}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className={cn(
                            "absolute top-1/2 -translate-y-1/2 text-neutral-400 hover:text-primary transition-colors",
                            direction === 'rtl' ? 'left-3' : 'right-3'
                          )}
                        >
                          {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading
                      ? '...'
                      : mode === 'login'
                      ? t('auth.modal.login.button')
                      : t('auth.modal.signup.button')}
                  </Button>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-neutral-500">
                        {t('auth.modal.or')}
                      </span>
                    </div>
                  </div>

                  {/* Google Login */}
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 border-2 border-gray-300 rounded-lg hover:border-accent-gold hover:bg-accent-gold/5 transition-all disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span className="text-sm font-medium text-primary">
                      {mode === 'login'
                        ? t('auth.modal.googleLogin')
                        : t('auth.modal.googleSignup')}
                    </span>
                  </button>
                </form>

                {/* Switch Mode */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-neutral-600" dir={direction}>
                    {mode === 'login'
                      ? t('auth.modal.noAccount')
                      : t('auth.modal.hasAccount')}
                    {' '}
                    <button
                      type="button"
                      onClick={switchMode}
                      className="text-accent-gold hover:text-accent-gold/80 font-medium transition-colors"
                    >
                      {mode === 'login'
                        ? t('auth.modal.signupLink')
                        : t('auth.modal.loginLink')}
                    </button>
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

