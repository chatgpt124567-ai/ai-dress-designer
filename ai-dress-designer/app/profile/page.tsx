'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ProfileHeader from '@/components/profile/ProfileHeader';
import DesignGallery from '@/components/profile/DesignGallery';
import ProfileSettings from '@/components/profile/ProfileSettings';
import { Palette, Settings } from 'lucide-react';
import type { QuestionnaireAnswers } from '@/types';

type Tab = 'designs' | 'settings';

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
  created_at: string;
  preferred_language: string;
}

interface Design {
  id: string;
  image_url: string;
  enhanced_prompt: string;
  created_at: string;
  is_favorite: boolean;
  questionnaire_answers?: QuestionnaireAnswers | null;
}

export default function ProfilePage() {
  const { t, direction } = useLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('designs');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [designsLoading, setDesignsLoading] = useState(true);

  useEffect(() => {
    loadProfile();
    loadDesigns();
  }, []);

  const loadProfile = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, created_at, preferred_language')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setProfile({
        ...data,
        email: user.email || '',
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDesigns = async () => {
    try {
      setDesignsLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Optimized query - select only needed fields
      const { data, error } = await supabase
        .from('designs')
        .select('id, image_url, enhanced_prompt, created_at, is_favorite, questionnaire_answers')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50); // Limit to 50 most recent designs

      if (error) throw error;

      setDesigns(data || []);
    } catch (error) {
      console.error('Error loading designs:', error);
    } finally {
      setDesignsLoading(false);
    }
  };

  const stats = {
    totalDesigns: designs.length,
    lastDesign: designs[0]?.created_at
      ? new Date(designs[0].created_at).toLocaleDateString(
          direction === 'rtl' ? 'ar-SA' : 'en-US',
          { year: 'numeric', month: 'short', day: 'numeric' }
        )
      : '-',
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-muted-beige flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted-beige">
      <Header />

      <main className="pt-24 md:pt-32 pb-16 md:pb-24 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-2">
              {t('profile.title')}
            </h1>
            <p className="text-neutral-500">{t('profile.subtitle')}</p>
          </motion.div>

          {/* Profile Header */}
          <ProfileHeader profile={profile} onProfileUpdate={loadProfile} />

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8"
          >
            <div className="luxury-card p-6 text-center">
              <p className="text-3xl font-headline font-bold text-accent-gold mb-2">
                {stats.totalDesigns}
              </p>
              <p className="text-neutral-600">{t('profile.stats.totalDesigns')}</p>
            </div>
            <div className="luxury-card p-6 text-center">
              <p className="text-lg font-headline font-bold text-accent-gold mb-2">
                {stats.lastDesign}
              </p>
              <p className="text-neutral-600">{t('profile.stats.lastDesign')}</p>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex gap-2 border-b-2 border-gray-200">
              <button
                onClick={() => setActiveTab('designs')}
                className={cn(
                  'flex items-center gap-2 px-6 py-3 font-medium transition-all',
                  activeTab === 'designs'
                    ? 'text-accent-gold border-b-2 border-accent-gold -mb-0.5'
                    : 'text-neutral-500 hover:text-primary'
                )}
              >
                <Palette className="w-5 h-5" />
                {t('profile.tabs.designs')}
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={cn(
                  'flex items-center gap-2 px-6 py-3 font-medium transition-all',
                  activeTab === 'settings'
                    ? 'text-accent-gold border-b-2 border-accent-gold -mb-0.5'
                    : 'text-neutral-500 hover:text-primary'
                )}
              >
                <Settings className="w-5 h-5" />
                {t('profile.tabs.settings')}
              </button>
            </div>
          </motion.div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'designs' && (
              <DesignGallery
                designs={designs}
                loading={designsLoading}
                onDesignsUpdate={loadDesigns}
              />
            )}
            {activeTab === 'settings' && (
              <ProfileSettings
                userId={profile.id}
                currentLanguage={profile.preferred_language || 'ar'}
                onLanguageChange={loadProfile}
              />
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

