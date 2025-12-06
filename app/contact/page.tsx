'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Instagram, MessageCircle } from 'lucide-react';

// Custom WhatsApp icon
const WhatsAppIcon = ({ className = '' }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
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

// Custom TikTok icon
const TikTokIcon = ({ className = '' }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

export default function ContactPage() {
  const { direction } = useLanguage();

  const contactInfo = [
    {
      icon: WhatsAppIcon,
      titleAr: 'واتساب',
      titleEn: 'WhatsApp',
      valueAr: '+90 538 786 9871',
      valueEn: '+90 538 786 9871',
      href: 'https://wa.me/905387869871',
    },
    {
      icon: Phone,
      titleAr: 'الهاتف',
      titleEn: 'Phone',
      valueAr: '+90 538 786 9871',
      valueEn: '+90 538 786 9871',
      href: 'tel:+905387869871',
    },
    {
      icon: Mail,
      titleAr: 'البريد الإلكتروني',
      titleEn: 'Email',
      valueAr: 'info@yasmin-alsham.com',
      valueEn: 'info@yasmin-alsham.com',
      href: 'mailto:info@yasmin-alsham.com',
    },
    {
      icon: MapPin,
      titleAr: 'الموقع',
      titleEn: 'Location',
      valueAr: 'تركيا',
      valueEn: 'Turkey',
      href: null,
    },
  ];

  const socialLinks = [
    {
      icon: Instagram,
      titleAr: 'انستجرام',
      titleEn: 'Instagram',
      valueAr: '@yasmin_alsham_fashion',
      valueEn: '@yasmin_alsham_fashion',
      href: 'https://www.instagram.com/yasmin_alsham_fashion',
    },
    {
      icon: TikTokIcon,
      titleAr: 'تيك توك',
      titleEn: 'TikTok',
      valueAr: '@_yasmin._.alsham',
      valueEn: '@_yasmin._.alsham',
      href: 'https://www.tiktok.com/@_yasmin._.alsham',
    },
  ];

  return (
    <div className="min-h-screen bg-muted-beige">
      <Header />

      <main className="pt-24 md:pt-32 pb-16 md:pb-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-headline font-bold text-primary mb-4 text-center">
              {direction === 'rtl' ? 'تواصلي معنا' : 'Contact Us'}
            </h1>
            <p className="text-neutral-500 text-center mb-10 max-w-2xl mx-auto">
              {direction === 'rtl'
                ? 'نحن هنا للإجابة على جميع استفساراتك ومساعدتك في تصميم فستان أحلامك'
                : 'We are here to answer all your questions and help you design your dream dress'}
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Contact Information */}
              <div className="luxury-card p-6 md:p-8 space-y-6">
                <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">
                  {direction === 'rtl' ? 'معلومات التواصل' : 'Contact Information'}
                </h2>
                {contactInfo.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: direction === 'rtl' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-full bg-accent-gold/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-accent-gold" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500">
                        {direction === 'rtl' ? item.titleAr : item.titleEn}
                      </p>
                      {item.href ? (
                        <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:text-accent-gold transition-colors">
                          {direction === 'rtl' ? item.valueAr : item.valueEn}
                        </a>
                      ) : (
                        <p className="text-primary font-medium">
                          {direction === 'rtl' ? item.valueAr : item.valueEn}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Social Media */}
              <div className="luxury-card p-6 md:p-8 space-y-6">
                <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">
                  {direction === 'rtl' ? 'تابعينا' : 'Follow Us'}
                </h2>
                {socialLinks.map((item, index) => (
                  <motion.a
                    key={index}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, x: direction === 'rtl' ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 group"
                  >
                    <div className="w-12 h-12 rounded-full bg-accent-gold/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent-gold/20 transition-colors">
                      <item.icon className="w-5 h-5 text-accent-gold" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500">
                        {direction === 'rtl' ? item.titleAr : item.titleEn}
                      </p>
                      <p className="text-primary font-medium group-hover:text-accent-gold transition-colors">
                        {direction === 'rtl' ? item.valueAr : item.valueEn}
                      </p>
                    </div>
                  </motion.a>
                ))}

                <div className="pt-6 border-t border-gray-100">
                  <p className="text-neutral-500 text-sm">
                    {direction === 'rtl'
                      ? 'ساعات العمل: 9 صباحاً - 9 مساءً (بتوقيت تركيا)'
                      : 'Working Hours: 9 AM - 9 PM (Turkey Time)'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

