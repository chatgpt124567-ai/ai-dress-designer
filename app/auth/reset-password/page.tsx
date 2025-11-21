'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Button from '@/components/Button';
import Toast, { ToastType } from '@/components/Toast';

export default function ResetPasswordPage() {
  const { t, direction } = useLanguage();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('error');

  const showToast = (message: string, type: ToastType) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      showToast(t('auth.resetPassword.errors.emailRequired'), 'error');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) {
        showToast(error.message, 'error');
        return;
      }

      setEmailSent(true);
      showToast(t('auth.resetPassword.emailSent'), 'success');
    } catch (error) {
      console.error('Reset password error:', error);
      showToast(t('auth.resetPassword.errors.networkError'), 'error');
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
                {t('auth.resetPassword.title')}
              </h1>
              <p className="text-neutral-500">
                {t('auth.resetPassword.subtitle')}
              </p>
            </div>

            {!emailSent ? (
              <form onSubmit={handleResetPassword} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                    {t('auth.resetPassword.email')}
                  </label>
                  <div className="relative">
                    <Mail className="absolute top-1/2 -translate-y-1/2 text-neutral-400 w-5 h-5" 
                      style={{ [direction === 'rtl' ? 'right' : 'left']: '12px' }} />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('auth.resetPassword.emailPlaceholder')}
                      className={`w-full ${direction === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
                      disabled={loading}
                    />
                  </div>
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
                      {t('auth.resetPassword.sending')}
                    </span>
                  ) : (
                    t('auth.resetPassword.sendButton')
                  )}
                </Button>
              </form>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-800 mb-2">
                  {t('auth.resetPassword.emailSent')}
                </h3>
                <p className="text-neutral-600">
                  {t('auth.resetPassword.checkEmail')}
                </p>
              </div>
            )}

            {/* Back to Login Link */}
            <div className="mt-6">
              <Link 
                href="/auth/login" 
                className="flex items-center justify-center gap-2 text-sm text-primary hover:text-primary-dark transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('auth.resetPassword.backToLogin')}
              </Link>
            </div>
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

