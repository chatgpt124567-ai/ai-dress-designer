'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, LogIn, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import LanguageToggle from './LanguageToggle';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { t, direction } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();

  // Check if we're on pages that should have white header always
  const isWhiteHeaderPage = pathname === '/design' || pathname === '/profile';

  // Monitor scroll to detect when hero section ends
  useEffect(() => {
    // If we're on design or profile page, always show white header
    if (isWhiteHeaderPage) {
      setIsScrolled(true);
      return;
    }

    const handleScroll = () => {
      // Close mobile menu when scrolling
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }

      // Check if we've scrolled past the hero section
      // Hero section is typically viewport height, so we check if scrolled past 80vh
      const heroHeight = window.innerHeight * 0.8;
      setIsScrolled(window.scrollY > heroHeight);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobileMenuOpen, isWhiteHeaderPage]);

  useEffect(() => {
    const supabase = createClient();

    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled || isMobileMenuOpen
          ? 'bg-white backdrop-blur-2xl shadow-xl py-4' // Unified solid white with glass effect
          : 'bg-transparent py-6'
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-full relative">
          {/* Logo - Centered on Mobile, Left/Right on Desktop */}
          <Link
            href="/"
            className={cn(
              "z-10 transition-all duration-300",
              // Mobile: centered absolute
              "absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2",
              // Desktop: normal positioning (right for RTL, left for LTR)
              "lg:static lg:transform-none",
              direction === 'rtl' ? 'lg:order-first' : 'lg:order-first'
            )}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              className={cn(
                "text-lg sm:text-xl lg:text-2xl font-headline font-bold whitespace-nowrap transition-colors duration-300",
                // Mobile: white when transparent, primary when scrolled
                isScrolled || isMobileMenuOpen ? "text-primary" : "text-white lg:text-primary"
              )}
            >
              {t('footer.brand.name')}
            </motion.div>
          </Link>

          {/* Desktop Navigation - Flexible with responsive spacing */}
          <nav className={cn(
            "hidden lg:flex items-center flex-grow justify-center",
            direction === 'rtl' ? 'space-x-reverse' : '',
            "gap-3 lg:gap-4 xl:gap-6 2xl:gap-8"
          )}>
            <Link href="/" className="text-sm lg:text-base xl:text-sm font-medium text-primary hover:text-accent-gold transition-colors whitespace-nowrap">
              {t('header.home')}
            </Link>
            <Link href="/design" className="text-sm lg:text-base xl:text-sm font-medium text-primary hover:text-accent-gold transition-colors whitespace-nowrap">
              {t('header.designs')}
            </Link>
            <Link href="#how-it-works" className="text-sm lg:text-base xl:text-sm font-medium text-primary hover:text-accent-gold transition-colors whitespace-nowrap">
              {t('header.howItWorks')}
            </Link>
            <Link href="#pricing" className="text-sm lg:text-base xl:text-sm font-medium text-primary hover:text-accent-gold transition-colors whitespace-nowrap">
              {t('header.pricing')}
            </Link>
            <Link href="#contact" className="text-sm lg:text-base xl:text-sm font-medium text-primary hover:text-accent-gold transition-colors whitespace-nowrap">
              {t('header.contact')}
            </Link>
          </nav>

          {/* Language Toggle & Auth Buttons - Flexible with responsive spacing */}
          <div className={cn(
            "hidden lg:flex items-center flex-shrink-0",
            direction === 'rtl' ? 'space-x-reverse' : '',
            "gap-3 xl:gap-4"
          )}>
            <LanguageToggle />

            {!loading && (
              <>
                {user ? (
                  <Link
                    href="/profile"
                    className="inline-flex items-center gap-2 px-4 lg:px-5 xl:px-6 py-2 lg:py-2.5 xl:py-3 bg-accent-gold text-white text-sm lg:text-base xl:text-sm font-medium rounded-md hover:bg-opacity-90 transition-all hover:shadow-lg hover:-translate-y-0.5 whitespace-nowrap"
                  >
                    <User className="w-4 h-4" />
                    {t('header.profile')}
                  </Link>
                ) : (
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-2 px-4 lg:px-5 xl:px-6 py-2 lg:py-2.5 xl:py-3 bg-accent-gold text-white text-sm lg:text-base xl:text-sm font-medium rounded-md hover:bg-opacity-90 transition-all hover:shadow-lg hover:-translate-y-0.5 whitespace-nowrap"
                  >
                    <LogIn className="w-4 h-4" />
                    {t('header.login')}
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={cn(
              "lg:hidden p-2 flex-shrink-0 transition-colors duration-300",
              direction === 'rtl' ? 'mr-auto' : 'ml-auto',
              isScrolled || isMobileMenuOpen ? "text-primary" : "text-white"
            )}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="lg:hidden fixed top-[72px] left-0 right-0 z-40 bg-white backdrop-blur-2xl shadow-xl border-b border-gray-200/20"
          >
            <nav className="container mx-auto px-6 py-8 flex flex-col space-y-5">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-lg font-medium text-primary hover:text-accent-gold transition-all hover:translate-x-1 py-2"
              >
                {t('header.home')}
              </Link>
              <Link
                href="/design"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-lg font-medium text-primary hover:text-accent-gold transition-all hover:translate-x-1 py-2"
              >
                {t('header.designs')}
              </Link>
              <Link
                href="#how-it-works"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-lg font-medium text-primary hover:text-accent-gold transition-all hover:translate-x-1 py-2"
              >
                {t('header.howItWorks')}
              </Link>
              <Link
                href="#pricing"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-lg font-medium text-primary hover:text-accent-gold transition-all hover:translate-x-1 py-2"
              >
                {t('header.pricing')}
              </Link>
              <Link
                href="#contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-lg font-medium text-primary hover:text-accent-gold transition-all hover:translate-x-1 py-2"
              >
                {t('header.contact')}
              </Link>

              <div className="pt-4 border-t border-gray-200/50">
                <LanguageToggle />
              </div>

              {!loading && (
                <>
                  {user ? (
                    <Link
                      href="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-accent-gold text-white font-semibold rounded-xl hover:bg-opacity-90 transition-all shadow-lg hover:shadow-xl"
                    >
                      <User className="w-5 h-5" />
                      {t('header.profile')}
                    </Link>
                  ) : (
                    <Link
                      href="/auth/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-accent-gold text-white font-semibold rounded-xl hover:bg-opacity-90 transition-all shadow-lg hover:shadow-xl"
                    >
                      <LogIn className="w-5 h-5" />
                      {t('header.login')}
                    </Link>
                  )}
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

