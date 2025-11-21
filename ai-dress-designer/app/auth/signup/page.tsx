'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, UserPlus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Button from '@/components/Button';
import Toast, { ToastType } from '@/components/Toast';

export default function SignupPage() {
  const { t, direction } = useLanguage();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('error');

  const showToast = (message: string, type: ToastType) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirectTo=/design`,
        },
      });

      if (error) {
        console.error('Google signup error:', error);
        showToast(error.message, 'error');
      }
      // If successful, user will be redirected to Google
    } catch (error) {
      console.error('Google signup error:', error);
      showToast(t('auth.signup.errors.networkError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!fullName) {
      showToast(t('auth.signup.errors.fullNameRequired'), 'error');
      return;
    }
    if (!email) {
      showToast(t('auth.signup.errors.emailRequired'), 'error');
      return;
    }
    if (!password) {
      showToast(t('auth.signup.errors.passwordRequired'), 'error');
      return;
    }
    if (!confirmPassword) {
      showToast(t('auth.signup.errors.confirmPasswordRequired'), 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast(t('auth.signup.errors.passwordMismatch'), 'error');
      return;
    }
    if (password.length < 8) {
      showToast(t('auth.signup.errors.weakPassword'), 'error');
      return;
    }
    if (!agreeToTerms) {
      showToast(t('auth.signup.errors.termsRequired'), 'error');
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
            full_name: fullName,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          showToast(t('auth.signup.errors.emailExists'), 'error');
        } else {
          showToast(error.message, 'error');
        }
        return;
      }

      if (data.user) {
        showToast(t('auth.signup.verificationSent'), 'success');
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      }
    } catch (error) {
      console.error('Signup error:', error);
      showToast(t('auth.signup.errors.networkError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted-beige flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-headline font-bold text-primary mb-2">
                {t('auth.signup.title')}
              </h1>
              <p className="text-neutral-500">
                {t('auth.signup.subtitle')}
              </p>
            </div>

            {/* Signup Form */}
            <form onSubmit={handleSignup} className="space-y-5">
              {/* Full Name Field */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-neutral-700 mb-2">
                  {t('auth.signup.fullName')}
                </label>
                <div className="relative">
                  <User className="absolute top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" 
                    style={{ [direction === 'rtl' ? 'right' : 'left']: '12px' }} />
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t('auth.signup.fullNamePlaceholder')}
                    className={`w-full ${direction === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                  {t('auth.signup.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5"
                    style={{ [direction === 'rtl' ? 'right' : 'left']: '12px' }} />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.signup.emailPlaceholder')}
                    className={`w-full ${direction === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                  {t('auth.signup.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5"
                    style={{ [direction === 'rtl' ? 'right' : 'left']: '12px' }} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.signup.passwordPlaceholder')}
                    className={`w-full ${direction === 'rtl' ? 'pr-10 pl-12' : 'pl-10 pr-12'} py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                    style={{ [direction === 'rtl' ? 'left' : 'right']: '12px' }}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                  {t('auth.signup.confirmPassword')}
                </label>
                <div className="relative">
                  <Lock className="absolute top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5"
                    style={{ [direction === 'rtl' ? 'right' : 'left']: '12px' }} />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('auth.signup.confirmPasswordPlaceholder')}
                    className={`w-full ${direction === 'rtl' ? 'pr-10 pl-12' : 'pl-10 pr-12'} py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                    style={{ [direction === 'rtl' ? 'left' : 'right']: '12px' }}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start">
                <input
                  id="terms"
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="w-4 h-4 mt-1 text-primary border-neutral-300 rounded focus:ring-primary"
                />
                <label htmlFor="terms" className={`${direction === 'rtl' ? 'mr-2' : 'ml-2'} text-sm text-neutral-700`}>
                  {t('auth.signup.agreeToTerms')}{' '}
                  <Link href="/terms" className="text-primary hover:text-primary-dark">
                    {t('auth.signup.termsOfService')}
                  </Link>{' '}
                  {t('auth.signup.and')}{' '}
                  <Link href="/privacy" className="text-primary hover:text-primary-dark">
                    {t('auth.signup.privacyPolicy')}
                  </Link>
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    {t('auth.signup.signingUp')}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    {t('auth.signup.signupButton')}
                  </span>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-neutral-500">
                  {t('auth.signup.orContinueWith')}
                </span>
              </div>
            </div>

            {/* Google Signup */}
            <button
              type="button"
              onClick={handleGoogleSignup}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t('auth.signup.googleSignup')}
            </button>

            {/* Login Link */}
            <p className="text-center text-sm text-neutral-600 mt-6">
              {t('auth.signup.haveAccount')}{' '}
              <Link href="/auth/login" className="text-primary hover:text-primary-dark font-medium transition-colors">
                {t('auth.signup.loginLink')}
              </Link>
            </p>
          </div>
        </motion.div>
      </main>

      <Footer />

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
      />
    </div>
  );
}

