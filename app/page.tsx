'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { Sparkles, Wand2, Download } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Button from "@/components/Button";

export default function Home() {
  const { t, direction } = useLanguage();
  const [isMobile, setIsMobile] = useState(false);
  const { scrollY } = useScroll();

  // Scroll effects for mobile hero
  const heroBgOpacity = useTransform(scrollY, [0, 150], [0, 1]); // Full white opacity faster
  const heroShadowOpacity = useTransform(scrollY, [0, 150], [0, 0.1]); // Shadow appears with background
  const heroContentOpacity = useTransform(scrollY, [0, 200], [1, 0]); // Fade out hero content when scrolling
  const heroContentY = useTransform(scrollY, [0, 200], [0, -50]); // Move hero content up when scrolling

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const sampleDesigns = [
    { id: 1, alt: t('home.gallery.sample1') },
    { id: 2, alt: t('home.gallery.sample2') },
    { id: 3, alt: t('home.gallery.sample3') },
    { id: 4, alt: t('home.gallery.sample4') },
  ];

  const processSteps = [
    {
      icon: Sparkles,
      title: t('home.process.step1.title'),
      description: t('home.process.step1.description'),
    },
    {
      icon: Wand2,
      title: t('home.process.step2.title'),
      description: t('home.process.step2.description'),
    },
    {
      icon: Download,
      title: t('home.process.step3.title'),
      description: t('home.process.step3.description'),
    },
  ];
  return (
    <div className="min-h-screen bg-muted-beige">
      <Header />

      <main className="relative">
        {/* Mobile: Fixed Background Image */}
        <div className="lg:hidden fixed inset-0 w-full h-screen z-0">
          <Image
            src="/Generated Image September 07, 2025 - 1_13AM.jpeg"
            alt="Hero Background"
            fill
            className="object-cover"
            priority
            quality={100}
          />
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Mobile: Hero Content - Fixed at bottom of first screen */}
        <motion.div
          className="lg:hidden fixed bottom-0 left-0 right-0 z-20 pointer-events-none"
          style={{
            height: '40vh',
            opacity: heroContentOpacity,
            y: heroContentY
          }}
        >
          <div className="h-full flex flex-col justify-end pb-8 px-6 pointer-events-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="w-full text-center"
            >
              <motion.h1
                className="text-2xl sm:text-3xl font-headline font-bold mb-6 leading-tight text-white drop-shadow-2xl"
              >
                {t('home.hero.title')}
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <Link href="/design">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full text-lg font-semibold shadow-2xl hover:shadow-3xl transition-all py-4 px-8"
                  >
                    {t('home.hero.cta')}
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Mobile: Scrollable Content */}
        <div className="lg:hidden relative z-10">
          {/* Transparent Spacer for full viewport hero */}
          <div className="h-screen w-full" />

          {/* Unified Background Wrapper */}
          <motion.div
            className="rounded-t-3xl overflow-hidden"
            style={{
              backgroundColor: useTransform(heroBgOpacity, opacity => `rgba(255, 255, 255, ${opacity})`),
              boxShadow: useTransform(heroShadowOpacity, opacity => `0 -10px 40px rgba(0,0,0,${opacity})`)
            }}
          >

            {/* Process Strip - Mobile */}
            <section className="py-16 relative z-20">
              <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 gap-8">
                  {processSteps.map((step, index) => (
                    <motion.div
                      key={step.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="text-center"
                    >
                      <div className="w-16 h-16 mx-auto mb-4 bg-accent-gold/10 rounded-full flex items-center justify-center">
                        <step.icon className="text-accent-gold" size={32} />
                      </div>
                      <h3 className="text-xl font-headline font-bold text-primary mb-2">
                        {step.title}
                      </h3>
                      <p className="text-base text-neutral-500 px-4">{step.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>

            {/* Sample Gallery - Mobile */}
            <section className="py-16 px-4 bg-muted-beige">
              <div className="container mx-auto">
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-headline font-bold text-primary mb-4">
                    {t('home.gallery.title')}
                  </h2>
                  <p className="text-lg text-neutral-500">
                    {t('home.gallery.subtitle')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {sampleDesigns.map((design, index) => (
                    <motion.div
                      key={design.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="elegant-frame bg-white"
                    >
                      <div className="aspect-[3/4] bg-gradient-to-br from-accent-gold/10 to-primary/5 flex items-center justify-center">
                        <p className="text-neutral-500 text-xs text-center px-2">
                          {design.alt}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="text-center mt-10">
                  <Link href="/design">
                    <Button variant="primary" size="lg" className="w-full text-lg py-4">
                      {t('home.hero.cta')}
                    </Button>
                  </Link>
                </div>
              </div>
            </section>
          </motion.div>
        </div>

        {/* Desktop Hero - Original Layout */}
        <section className="hidden lg:block relative pt-32 pb-24 px-4">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
              {/* Left Column - Text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-headline font-bold text-primary mb-4 md:mb-6 leading-tight">
                  {t('home.hero.title')}
                </h1>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-neutral-500 mb-6 md:mb-8 font-medium">
                  {t('home.hero.subtitle')}
                </p>
                <div>
                  <Link href="/design">
                    <Button variant="primary" size="lg" className="w-full sm:w-auto text-base md:text-lg">
                      {t('home.hero.cta')}
                    </Button>
                  </Link>
                </div>
              </motion.div>

              {/* Right Column - Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="elegant-frame"
              >
                <div className="aspect-[3/4] relative">
                  <Image
                    src="/Generated Image September 07, 2025 - 1_13AM.jpeg"
                    alt="Dress Design Preview"
                    fill
                    className="object-cover rounded-lg"
                    priority
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Desktop: Process Strip */}
        <section className="hidden lg:block py-12 md:py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
              {processSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 bg-accent-gold/10 rounded-full flex items-center justify-center">
                    <step.icon className="text-accent-gold" size={28} />
                  </div>
                  <h3 className="text-lg md:text-xl font-headline font-bold text-primary mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm md:text-base text-neutral-500">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Desktop: Sample Gallery */}
        <section className="hidden lg:block py-16 md:py-24 px-4">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8 md:mb-12"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-headline font-bold text-primary mb-3 md:mb-4">
                {t('home.gallery.title')}
              </h2>
              <p className="text-base md:text-lg lg:text-xl text-neutral-500">
                {t('home.gallery.subtitle')}
              </p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
              {sampleDesigns.map((design, index) => (
                <motion.div
                  key={design.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ y: -8, rotate: -1 }}
                  className="elegant-frame"
                >
                  <div className="aspect-[3/4] bg-gradient-to-br from-accent-gold/10 to-primary/5 flex items-center justify-center">
                    <p className="text-neutral-500 text-xs md:text-sm text-center px-3 md:px-4">
                      {design.alt}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-8 md:mt-12">
              <Link href="/design">
                <Button variant="primary" size="lg" className="w-full sm:w-auto text-base md:text-lg">
                  {t('home.hero.cta')}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
