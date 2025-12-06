'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { Sparkles, Wand2, Download, Scissors, Palette, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/Button';

export default function HowItWorksPage() {
  const { t, direction } = useLanguage();

  const steps = [
    {
      number: '01',
      icon: Sparkles,
      titleAr: 'اختاري طريقة التصميم',
      titleEn: 'Choose Your Design Method',
      descriptionAr: 'اختاري من بين ثلاثة خيارات: ابتكري تصميمك من الصفر، أو عدّلي تصميماً موجوداً، أو استخدمي قماشك الخاص.',
      descriptionEn: 'Choose from three options: Create your design from scratch, modify an existing design, or use your own fabric.',
    },
    {
      number: '02',
      icon: MessageSquare,
      titleAr: 'أجيبي على الأسئلة',
      titleEn: 'Answer the Questions',
      descriptionAr: 'أجيبي على استبيان بسيط حول تفضيلاتك: نوع الفستان، الأكمام، طول الفستان، والمزيد من التفاصيل.',
      descriptionEn: 'Answer a simple questionnaire about your preferences: dress type, sleeves, length, and more details.',
    },
    {
      number: '03',
      icon: Wand2,
      titleAr: 'الذكاء الاصطناعي يعمل سحره',
      titleEn: 'AI Works Its Magic',
      descriptionAr: 'يقوم الذكاء الاصطناعي بتحليل إجاباتك وتوليد تصميم فستان فريد ومخصص لك.',
      descriptionEn: 'AI analyzes your answers and generates a unique, customized dress design for you.',
    },
    {
      number: '04',
      icon: Palette,
      titleAr: 'عدّلي حسب رغبتك',
      titleEn: 'Customize as You Like',
      descriptionAr: 'يمكنك إجراء تعديلات على التصميم: تغيير الأكمام، القصة، التفاصيل، أو أي جزء آخر.',
      descriptionEn: 'You can make modifications: change sleeves, cut, details, or any other part.',
    },
    {
      number: '05',
      icon: Download,
      titleAr: 'احفظي وحمّلي تصميمك',
      titleEn: 'Save & Download Your Design',
      descriptionAr: 'احفظي تصميمك في حسابك الشخصي وحمّليه بجودة عالية لمشاركته مع الخياطة.',
      descriptionEn: 'Save your design to your account and download it in high quality to share with your tailor.',
    },
  ];

  const features = [
    {
      icon: Sparkles,
      titleAr: 'تصميم من الصفر',
      titleEn: 'Design from Scratch',
      descriptionAr: 'ابتكري فستان أحلامك من خلال الإجابة على أسئلة بسيطة',
      descriptionEn: 'Create your dream dress by answering simple questions',
    },
    {
      icon: Wand2,
      titleAr: 'تعديل تصميم موجود',
      titleEn: 'Modify Existing Design',
      descriptionAr: 'ارفعي صورة فستان وعدّليها حسب ذوقك',
      descriptionEn: 'Upload a dress image and modify it to your taste',
    },
    {
      icon: Scissors,
      titleAr: 'استخدمي قماشك',
      titleEn: 'Use Your Fabric',
      descriptionAr: 'ارفعي صورة قماشك وشاهدي كيف سيبدو على فستان',
      descriptionEn: 'Upload your fabric image and see how it will look on a dress',
    },
  ];

  return (
    <div className="min-h-screen bg-muted-beige">
      <Header />

      <main className="pt-24 md:pt-32 pb-16 md:pb-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Hero Section */}
            <div className="text-center mb-16">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-headline font-bold text-primary mb-4">
                {direction === 'rtl' ? 'كيف يعمل التطبيق؟' : 'How Does It Work?'}
              </h1>
              <p className="text-neutral-500 text-lg max-w-2xl mx-auto">
                {direction === 'rtl'
                  ? 'خمس خطوات بسيطة لتصميم فستان أحلامك باستخدام الذكاء الاصطناعي'
                  : 'Five simple steps to design your dream dress using AI'}
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-8 mb-16">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: direction === 'rtl' ? 50 : -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="luxury-card p-6 md:p-8 flex flex-col md:flex-row items-start gap-6"
                >
                  <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-gold to-accent-gold/70 flex items-center justify-center">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-accent-gold font-bold text-lg">{step.number}</span>
                      <h3 className="text-xl md:text-2xl font-headline font-bold text-primary">
                        {direction === 'rtl' ? step.titleAr : step.titleEn}
                      </h3>
                    </div>
                    <p className="text-neutral-500 leading-relaxed">
                      {direction === 'rtl' ? step.descriptionAr : step.descriptionEn}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Features Grid */}
            <div className="mb-16">
              <h2 className="text-2xl md:text-3xl font-headline font-bold text-primary text-center mb-8">
                {direction === 'rtl' ? 'ثلاث طرق للتصميم' : 'Three Ways to Design'}
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="luxury-card p-6 text-center"
                  >
                    <div className="w-14 h-14 rounded-full bg-accent-gold/10 flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="w-7 h-7 text-accent-gold" />
                    </div>
                    <h3 className="text-lg font-headline font-bold text-primary mb-2">
                      {direction === 'rtl' ? feature.titleAr : feature.titleEn}
                    </h3>
                    <p className="text-neutral-500 text-sm">
                      {direction === 'rtl' ? feature.descriptionAr : feature.descriptionEn}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-center"
            >
              <Link href="/design">
                <Button variant="primary" size="lg" className="px-12">
                  {direction === 'rtl' ? 'ابدئي التصميم الآن' : 'Start Designing Now'}
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

