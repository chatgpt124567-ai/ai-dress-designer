'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

interface ProfileSettingsProps {
  userId: string;
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
}

export default function ProfileSettings({
  userId,
  currentLanguage,
  onLanguageChange,
}: ProfileSettingsProps) {
  const { t, direction, setLanguage } = useLanguage();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      alert(t('profile.settings.passwordMismatch'));
      return;
    }

    try {
      setLoading(true);
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      alert(t('profile.settings.passwordUpdateSuccess'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      alert(t('profile.settings.passwordUpdateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = async (lang: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({ preferred_language: lang })
        .eq('id', userId);

      if (error) throw error;

      setLanguage(lang as 'ar' | 'en');
      onLanguageChange(lang);
    } catch (error) {
      console.error('Error updating language:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm(t('profile.settings.deleteAccountWarning'))) return;
    if (!confirm(t('profile.settings.deleteAccountConfirm'))) return;

    try {
      setLoading(true);
      const supabase = createClient();

      // Delete all user designs first
      await supabase.from('designs').delete().eq('user_id', userId);

      // Delete profile
      await supabase.from('profiles').delete().eq('id', userId);

      // Sign out
      await supabase.auth.signOut();

      router.push('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert(t('profile.settings.deleteAccountError'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Error logging out:', error);
      alert(t('profile.settings.logoutError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Change Password */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="luxury-card p-6"
      >
        <h3 className="text-xl font-headline font-bold text-primary mb-4">
          {t('profile.settings.changePassword')}
        </h3>
        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {t('profile.settings.currentPassword')}
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={cn(
                'w-full px-4 py-3 border-2 border-gray-200 rounded-lg',
                'focus:border-accent-gold focus:outline-none',
                direction === 'rtl' ? 'text-right' : 'text-left'
              )}
              dir={direction}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {t('profile.settings.newPassword')}
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={cn(
                'w-full px-4 py-3 border-2 border-gray-200 rounded-lg',
                'focus:border-accent-gold focus:outline-none',
                direction === 'rtl' ? 'text-right' : 'text-left'
              )}
              dir={direction}
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {t('profile.settings.confirmPassword')}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={cn(
                'w-full px-4 py-3 border-2 border-gray-200 rounded-lg',
                'focus:border-accent-gold focus:outline-none',
                direction === 'rtl' ? 'text-right' : 'text-left'
              )}
              dir={direction}
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-accent-gold text-white rounded-lg hover:bg-accent-gold/90 transition-colors disabled:opacity-50"
          >
            {loading ? '...' : t('profile.settings.updatePassword')}
          </button>
        </form>
      </motion.div>

      {/* Language Preference */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="luxury-card p-6"
      >
        <h3 className="text-xl font-headline font-bold text-primary mb-4">
          {t('profile.settings.languagePreference')}
        </h3>
        <div className="flex gap-4">
          <button
            onClick={() => handleLanguageChange('ar')}
            className={cn(
              'flex-1 px-6 py-3 rounded-lg border-2 transition-all',
              currentLanguage === 'ar'
                ? 'border-accent-gold bg-accent-gold text-white'
                : 'border-gray-200 hover:border-accent-gold'
            )}
          >
            {t('profile.settings.arabic')}
          </button>
          <button
            onClick={() => handleLanguageChange('en')}
            className={cn(
              'flex-1 px-6 py-3 rounded-lg border-2 transition-all',
              currentLanguage === 'en'
                ? 'border-accent-gold bg-accent-gold text-white'
                : 'border-gray-200 hover:border-accent-gold'
            )}
          >
            {t('profile.settings.english')}
          </button>
        </div>
      </motion.div>

      {/* Logout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="luxury-card p-6 border-2 border-orange-200"
      >
        <h3 className="text-xl font-headline font-bold text-orange-600 mb-4">
          {t('profile.settings.logout')}
        </h3>
        <p className="text-sm text-neutral-600 mb-4">
          {t('profile.settings.logoutDescription')}
        </p>
        <button
          onClick={handleLogout}
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          <LogOut className="w-5 h-5" />
          {loading ? '...' : t('profile.settings.logoutButton')}
        </button>
      </motion.div>

      {/* Delete Account */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="luxury-card p-6 border-2 border-red-200"
      >
        <h3 className="text-xl font-headline font-bold text-red-600 mb-4">
          {t('profile.settings.deleteAccount')}
        </h3>
        <p className="text-sm text-neutral-600 mb-4">
          {t('profile.settings.deleteAccountWarning')}
        </p>
        <button
          onClick={handleDeleteAccount}
          disabled={loading}
          className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          {loading ? '...' : t('profile.settings.deleteAccountButton')}
        </button>
      </motion.div>
    </div>
  );
}

