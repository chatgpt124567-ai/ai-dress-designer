'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';

export default function PrivacyPolicyPage() {
    const { t, direction } = useLanguage();

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
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-headline font-bold text-primary mb-6 md:mb-8 text-center">
                            {direction === 'rtl' ? 'سياسة الخصوصية' : 'Privacy Policy'}
                        </h1>

                        <div className="luxury-card p-6 md:p-8 lg:p-10 space-y-6 md:space-y-8">
                            {direction === 'rtl' ? (
                                <>
                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">مقدمة</h2>
                                        <p className="text-neutral-500 leading-relaxed">
                                            نحن في مصمم ياسمين الشام الذكي نلتزم بحماية خصوصيتك. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية معلوماتك الشخصية عند استخدام خدماتنا.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">المعلومات التي نجمعها</h2>
                                        <p className="text-neutral-500 leading-relaxed mb-3">نقوم بجمع المعلومات التالية:</p>
                                        <ul className="list-disc list-inside space-y-2 text-neutral-500 mr-4">
                                            <li>معلومات الحساب: الاسم الكامل، البريد الإلكتروني</li>
                                            <li>تصاميم الفساتين: الأوصاف والصور التي تقومين بإنشائها</li>
                                            <li>معلومات الاستخدام: كيفية تفاعلك مع خدماتنا</li>
                                            <li>معلومات تقنية: عنوان IP، نوع المتصفح، نظام التشغيل</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">كيفية استخدام المعلومات</h2>
                                        <p className="text-neutral-500 leading-relaxed mb-3">نستخدم معلوماتك من أجل:</p>
                                        <ul className="list-disc list-inside space-y-2 text-neutral-500 mr-4">
                                            <li>توفير وتحسين خدماتنا</li>
                                            <li>إنشاء وإدارة حسابك</li>
                                            <li>حفظ تصاميمك وتمكينك من الوصول إليها</li>
                                            <li>التواصل معك بخصوص حسابك وخدماتنا</li>
                                            <li>تحسين تجربة المستخدم</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">حماية المعلومات</h2>
                                        <p className="text-neutral-500 leading-relaxed">
                                            نستخدم تدابير أمنية متقدمة لحماية معلوماتك الشخصية، بما في ذلك التشفير وبروتوكولات الأمان الحديثة. يتم تخزين جميع البيانات في خوادم آمنة مع تطبيق سياسات صارمة للتحكم في الوصول.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">مشاركة المعلومات</h2>
                                        <p className="text-neutral-500 leading-relaxed">
                                            نحن لا نبيع أو نؤجر أو نشارك معلوماتك الشخصية مع أطراف ثالثة إلا في الحالات التالية:
                                        </p>
                                        <ul className="list-disc list-inside space-y-2 text-neutral-500 mr-4 mt-3">
                                            <li>بموافقتك الصريحة</li>
                                            <li>لمقدمي الخدمات الموثوقين الذين يساعدوننا في تشغيل خدماتنا</li>
                                            <li>عند الضرورة القانونية أو لحماية حقوقنا</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">ملفات تعريف الارتباط (Cookies)</h2>
                                        <p className="text-neutral-500 leading-relaxed">
                                            نستخدم ملفات تعريف الارتباط لتحسين تجربتك على موقعنا. يمكنك التحكم في ملفات تعريف الارتباط من خلال إعدادات المتصفح الخاص بك.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">حقوقك</h2>
                                        <p className="text-neutral-500 leading-relaxed mb-3">لديك الحق في:</p>
                                        <ul className="list-disc list-inside space-y-2 text-neutral-500 mr-4">
                                            <li>الوصول إلى معلوماتك الشخصية</li>
                                            <li>تصحيح أو تحديث معلوماتك</li>
                                            <li>حذف حسابك ومعلوماتك</li>
                                            <li>الاعتراض على معالجة معلوماتك</li>
                                            <li>طلب نسخة من بياناتك</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">خصوصية الأطفال</h2>
                                        <p className="text-neutral-500 leading-relaxed">
                                            خدماتنا غير موجهة للأطفال دون سن 13 عاماً. نحن لا نجمع عن قصد معلومات شخصية من الأطفال.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">التغييرات على سياسة الخصوصية</h2>
                                        <p className="text-neutral-500 leading-relaxed">
                                            قد نقوم بتحديث سياسة الخصوصية من وقت لآخر. سنقوم بإخطارك بأي تغييرات جوهرية عبر البريد الإلكتروني أو من خلال إشعار على موقعنا.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">اتصلي بنا</h2>
                                        <p className="text-neutral-500 leading-relaxed">
                                            إذا كان لديك أي أسئلة حول سياسة الخصوصية هذه، يرجى التواصل معنا:
                                        </p>
                                        <div className="mt-4 space-y-2 text-neutral-500">
                                            <p>📧 البريد الإلكتروني: info@yasmin-alsham.com</p>
                                            <p>📱 واتساب: <a href="https://wa.me/905387869871" className="text-accent-gold hover:underline">+905387869871</a></p>
                                            <p>📷 انستجرام: <a href="https://www.instagram.com/yasmin_alsham_fashion" className="text-accent-gold hover:underline">@yasmin_alsham_fashion</a></p>
                                        </div>
                                    </section>

                                    <section className="border-t border-gray-200 pt-6">
                                        <p className="text-sm text-neutral-500 text-center">
                                            آخر تحديث: نوفمبر 2024
                                        </p>
                                    </section>
                                </>
                            ) : (
                                <>
                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">Introduction</h2>
                                        <p className="text-neutral-500 leading-relaxed">
                                            At Yasmine Al-Sham Smart Designer, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and protect your personal information when you use our services.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">Information We Collect</h2>
                                        <p className="text-neutral-500 leading-relaxed mb-3">We collect the following information:</p>
                                        <ul className="list-disc list-inside space-y-2 text-neutral-500 ml-4">
                                            <li>Account information: Full name, email address</li>
                                            <li>Dress designs: Descriptions and images you create</li>
                                            <li>Usage information: How you interact with our services</li>
                                            <li>Technical information: IP address, browser type, operating system</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">How We Use Your Information</h2>
                                        <p className="text-neutral-500 leading-relaxed mb-3">We use your information to:</p>
                                        <ul className="list-disc list-inside space-y-2 text-neutral-500 ml-4">
                                            <li>Provide and improve our services</li>
                                            <li>Create and manage your account</li>
                                            <li>Save your designs and enable access to them</li>
                                            <li>Communicate with you about your account and services</li>
                                            <li>Enhance user experience</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">Information Protection</h2>
                                        <p className="text-neutral-500 leading-relaxed">
                                            We use advanced security measures to protect your personal information, including encryption and modern security protocols. All data is stored on secure servers with strict access control policies.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">Information Sharing</h2>
                                        <p className="text-neutral-500 leading-relaxed">
                                            We do not sell, rent, or share your personal information with third parties except in the following cases:
                                        </p>
                                        <ul className="list-disc list-inside space-y-2 text-neutral-500 ml-4 mt-3">
                                            <li>With your explicit consent</li>
                                            <li>To trusted service providers who help us operate our services</li>
                                            <li>When legally required or to protect our rights</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">Cookies</h2>
                                        <p className="text-neutral-500 leading-relaxed">
                                            We use cookies to improve your experience on our site. You can control cookies through your browser settings.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">Your Rights</h2>
                                        <p className="text-neutral-500 leading-relaxed mb-3">You have the right to:</p>
                                        <ul className="list-disc list-inside space-y-2 text-neutral-500 ml-4">
                                            <li>Access your personal information</li>
                                            <li>Correct or update your information</li>
                                            <li>Delete your account and information</li>
                                            <li>Object to processing of your information</li>
                                            <li>Request a copy of your data</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">Children's Privacy</h2>
                                        <p className="text-neutral-500 leading-relaxed">
                                            Our services are not directed to children under 13. We do not knowingly collect personal information from children.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">Changes to Privacy Policy</h2>
                                        <p className="text-neutral-500 leading-relaxed">
                                            We may update this Privacy Policy from time to time. We will notify you of any material changes via email or through a notice on our site.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">Contact Us</h2>
                                        <p className="text-neutral-500 leading-relaxed">
                                            If you have any questions about this Privacy Policy, please contact us:
                                        </p>
                                        <div className="mt-4 space-y-2 text-neutral-500">
                                            <p>📧 Email: info@yasmin-alsham.com</p>
                                            <p>📱 WhatsApp: <a href="https://wa.me/905387869871" className="text-accent-gold hover:underline">+905387869871</a></p>
                                            <p>📷 Instagram: <a href="https://www.instagram.com/yasmin_alsham_fashion" className="text-accent-gold hover:underline">@yasmin_alsham_fashion</a></p>
                                        </div>
                                    </section>

                                    <section className="border-t border-gray-200 pt-6">
                                        <p className="text-sm text-neutral-500 text-center">
                                            Last updated: November 2024
                                        </p>
                                    </section>
                                </>
                            )}
                        </div>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
