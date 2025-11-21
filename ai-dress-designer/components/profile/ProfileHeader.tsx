'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Camera, Edit2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
  created_at: string;
}

interface ProfileHeaderProps {
  profile: Profile;
  onProfileUpdate: () => void;
}

export default function ProfileHeader({ profile, onProfileUpdate }: ProfileHeaderProps) {
  const { t, direction } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile.full_name || '');

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      onProfileUpdate();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert(t('profile.header.uploadError'));
    } finally {
      setUploading(false);
    }
  };

  const handleNameUpdate = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', profile.id);

      if (error) throw error;

      setEditing(false);
      onProfileUpdate();
    } catch (error) {
      console.error('Error updating name:', error);
      alert(t('profile.header.updateNameError'));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(direction === 'rtl' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="luxury-card p-6 md:p-8"
    >
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
        {/* Avatar */}
        <div className="relative group">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-accent-gold/20 to-primary/10 flex items-center justify-center">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || profile.email}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl font-headline text-accent-gold">
                {(profile.full_name || profile.email).charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <label
            htmlFor="avatar-upload"
            className={cn(
              'absolute inset-0 flex items-center justify-center',
              'bg-black/60 rounded-full opacity-0 group-hover:opacity-100',
              'transition-opacity cursor-pointer'
            )}
          >
            {uploading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera className="w-8 h-8 text-white" />
            )}
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
            disabled={uploading}
          />
        </div>

        {/* Info */}
        <div className="flex-1 text-center md:text-start">
          {editing ? (
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="px-3 py-2 border-2 border-accent-gold rounded-lg focus:outline-none"
                dir={direction}
              />
              <button
                onClick={handleNameUpdate}
                className="px-4 py-2 bg-accent-gold text-white rounded-lg hover:bg-accent-gold/90"
              >
                {t('profile.personalInfo.save')}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setFullName(profile.full_name || '');
                }}
                className="px-4 py-2 bg-gray-200 text-primary rounded-lg hover:bg-gray-300"
              >
                {t('profile.personalInfo.cancel')}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
              <h1 className="text-2xl md:text-3xl font-headline font-bold text-primary">
                {profile.full_name || profile.email.split('@')[0]}
              </h1>
              <button
                onClick={() => setEditing(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Edit2 className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
          )}
          <p className="text-neutral-500 mb-4">{profile.email}</p>
          <p className="text-sm text-neutral-400">
            {t('profile.header.memberSince')} {formatDate(profile.created_at)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

