'use client';

import Link from 'next/link';
import { Instagram, Phone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

// أيقونة واتساب مخصصة
const WhatsAppIcon = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
    <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
  </svg>
);

// أيقونة تيك توك مخصصة
const TikTokIcon = ({ size = 16, className = '' }: { size?: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

const socialLinks = [
  {
    icon: WhatsAppIcon,
    href: 'https://wa.me/905387869871',
    label: 'WhatsApp'
  },
  {
    icon: Instagram,
    href: 'https://www.instagram.com/yasmin_alsham_fashion?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
    label: 'Instagram'
  },
  {
    icon: TikTokIcon,
    href: 'https://www.tiktok.com/@_yasmin._.alsham?_r=1&_t=ZM-91YotIDgTaCa',
    label: 'TikTok'
  },
  {
    icon: Phone,
    href: 'tel:+905387869871',
    label: 'Phone'
  },
];

export default function Footer() {
  const { t, direction } = useLanguage();
  return (
    <footer className="bg-primary text-white py-12 md:py-16 relative z-20">
      <div className="container mx-auto px-4">
        {/* Brand and Social Icons - Centered */}
        <div className="text-center mb-8 md:mb-10">
          <h3 className="text-xl md:text-2xl font-headline font-bold mb-3 md:mb-4">
            {t('footer.brand.name')}
          </h3>
          <p className="text-gray-300 text-sm md:text-base mb-4 md:mb-6 max-w-md mx-auto">
            {t('footer.brand.tagline')}
          </p>
          <div className="flex justify-center items-center gap-3 md:gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-accent-gold transition-all hover:scale-110"
              >
                <social.icon size={18} className="md:w-5 md:h-5" />
              </a>
            ))}
          </div>
        </div>

        {/* Legal Links - Centered */}
        <div className="border-t border-white/10 pt-6 md:pt-8">
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 mb-4">
            <Link
              href="/privacy-policy"
              className="text-gray-300 hover:text-accent-gold transition-colors text-sm md:text-base"
            >
              {t('footer.legal.privacy')}
            </Link>
            <span className="text-gray-500">•</span>
            <Link
              href="/terms-of-service"
              className="text-gray-300 hover:text-accent-gold transition-colors text-sm md:text-base"
            >
              {t('footer.legal.terms')}
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-center text-gray-400 text-xs md:text-sm">
            <p>{t('footer.copyright')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

