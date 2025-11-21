'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';

export default function TermsOfServicePage() {
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
                            {direction === 'rtl' ? 'شروط الخدمة' : 'Terms of Service'}
                        </h1>

                        <div className="luxury-card p-6 md:p-8 lg:p-10 space-y-6 md:space-y-8">
                            {direction === 'rtl' ? (
                                <>
                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">مقدمة</h2>
                                        <p className="text-neutral-500 leading-relaxed">
                                            مرحباً بك في مصمم ياسمين الشام الذكي. باستخدامك لخدماتنا، فإنك توافقين على الالتزام بشروط الخدمة هذه. يرجى قراءتها بعناية قبل استخدام منصتنا.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">قبول الشروط</h2>
                                        <p className="text-neutral-500 leading-relaxed">
                                            باستخدام خدماتنا، فإنك توافقين على الالتزام بشروط الخدمة هذه وجميع القوانين واللوائح المعمول بها. إذا كنت لا توافقين على أي من هذه الشروط، يرجى عدم استخدام خدماتنا.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">وصف الخدمة</h2>
                                        <p className="text-neutral-500 leading-relaxed">
                                            مصمم ياسمين الشام الذكي هو منصة تستخدم الذكاء الاصطناعي لإنشاء تصاميم فساتين مخصصة بناءً على أوصافك ومتطلباتك. نحن نوفر:
                                        </p>
                                        <ul className="list-disc list-inside space-y-2 text-neutral-500 mr-4 mt-3">
                                            <li>أداة تصميم فساتين بالذكاء الاصطناعي</li>
                                            <li>حفظ وإدارة تصاميمك</li>
                                            <li>تحميل التصاميم بجودة عالية</li>
                                            <li>استبيان تفصيلي لتخصيص التصميم</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">حساب المستخدم</h2>
                                        <p className="text-neutral-500 leading-relaxed mb-3">عند إنشاء حساب، فإنك توافقين على:</p>
                                        <ul className="list-disc list-inside space-y-2 text-neutral-500 mr-4">
                                            <li>تقديم معلومات دقيقة وكاملة</li>
                                            <li>الحفاظ على سرية كلمة المرور الخاصة بك</li>
                                            <li>إخطارنا فوراً بأي استخدام غير مصرح به لحسابك</li>
                                            <li>تحمل المسؤولية عن جميع الأنشطة التي تحدث تحت حسابك</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">الاستخدام المقبول</h2>
                                        <p className="text-neutral-500 leading-relaxed mb-3">توافقين على عدم استخدام خدماتنا من أجل:</p>
                                        <ul className="list-disc list-inside space-y-2 text-neutral-500 mr-4">
                                            <li>أي غرض غير قانوني أو محظور</li>
                                            <li>انتهاك أي حقوق ملكية فكرية</li>
                                            <li>نشر محتوى مسيء أو ضار</li>
                                            <li>محاولة الوصول غير المصرح به إلى أنظمتنا</li>
                                            <li>التدخل في عمل الخدمة أو إزعاج المستخدمين الآخرين</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">الملكية الفكرية</h2>
                                        <p className="text-neutral-500 leading-relaxed">
                                            التصاميم التي تنشئينها باستخدام خدماتنا تعود ملكيتها لك. ومع ذلك، فإنك تمنحيننا ترخيصاً محدوداً لاستخدام هذه التصاميم لأغراض تحسين خدماتنا وعرض أمثلة (مع إخفاء هويتك).
                                        </p>
                                        <p className="text-neutral-500 leading-relaxed mt-3">
                                            جميع حقوق الملكية الفكرية في المنصة والتكنولوجيا المستخدمة تعود لمصمم ياسمين الشام الذكي.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">الرسوم والدفع</h2>
                                        <p className="text-neutral-500 leading-relaxed">
                                            نحن نقدم خدمات مجانية ومدفوعة. قد تتغير الأسعار في أي وقت، ولكن سيتم إخطارك مسبقاً بأي تغييرات تؤثر على اشتراكك الحالي.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">إخلاء المسؤولية</h2>
                                        <p className="text-neutral-500 leading-relaxed">
                                            يتم توفير خدماتنا "كما هي" دون أي ضمانات من أي نوع. نحن لا نضمن أن:
                                        </p>
                                        <ul className="list-disc list-inside space-y-2 text-neutral-500 mr-4 mt-3">
                                            <li>الخدمة ستكون متاحة دائماً أو خالية من الأخطاء</li>
                                            <li>النتائج ستلبي توقعاتك دائماً</li>
                                            <li>أي أخطاء سيتم تصحيحها فوراً</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">تحديد المسؤولية</h2>
                                        <p className="text-neutral-500 leading-relaxed">
                                            لن نكون مسؤولين عن أي أضرار غير مباشرة أو عرضية أو خاصة أو تبعية ناتجة عن استخدامك أو عدم قدرتك على استخدام خدماتنا.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">إنهاء الخدمة</h2>
                                        <p className="text-neutral-500 leading-relaxed">
                                            نحتفظ بالحق في تعليق أو إنهاء حسابك في أي وقت إذا انتهكت شروط الخدمة هذه. يمكنك أيضاً إنهاء حسابك في أي وقت من خلال إعدادات الحساب.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">التغييرات على الشروط</h2>
                                        <p className="text-neutral-500 leading-relaxed">
                                            نحتفظ بالحق في تعديل شروط الخدمة هذه في أي وقت. سنقوم بإخطارك بأي تغييرات جوهرية عبر البريد الإلكتروني أو من خلال إشعار على منصتنا. استمرارك في استخدام الخدمة بعد هذه التغييرات يعني موافقتك عليها.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">القانون الحاكم</h2>
                                        <p className="text-neutral-500 leading-relaxed">
                                            تخضع شروط الخدمة هذه وتفسر وفقاً لقوانين تركيا، دون النظر إلى تعارض أحكام القانون.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">اتصلي بنا</h2>
                                        <p className="text-neutral-500 leading-relaxed">
                                            إذا كان لديك أي أسئلة حول شروط الخدمة هذه، يرجى التواصل معنا:
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
                                            Welcome to Yasmine Al-Sham Smart Designer. By using our services, you agree to comply with these Terms of Service. Please read them carefully before using our platform.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">Acceptance of Terms</h2>
                                        <p className="text-neutral-500 leading-relaxed">
                                            By using our services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, please do not use our services.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">Service Description</h2>
                                        <p className="text-neutral-500 leading-relaxed">
                                            Yasmine Al-Sham Smart Designer is a platform that uses artificial intelligence to create custom dress designs based on your descriptions and requirements. We provide:
                                        </p>
                                        <ul className="list-disc list-inside space-y-2 text-neutral-500 ml-4 mt-3">
                                            <li>AI-powered dress design tool</li>
                                            <li>Save and manage your designs</li>
                                            <li>Download high-quality designs</li>
                                            <li>Detailed questionnaire for design customization</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">User Account</h2>
                                        <p className="text-neutral-500 leading-relaxed mb-3">When creating an account, you agree to:</p>
                                        <ul className="list-disc list-inside space-y-2 text-neutral-500 ml-4">
                                            <li>Provide accurate and complete information</li>
                                            <li>Maintain the confidentiality of your password</li>
                                            <li>Notify us immediately of any unauthorized use of your account</li>
                                            <li>Be responsible for all activities that occur under your account</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">Acceptable Use</h2>
                                        <p className="text-neutral-500 leading-relaxed mb-3">You agree not to use our services for:</p>
                                        <ul className="list-disc list-inside space-y-2 text-neutral-500 ml-4">
                                            <li>Any illegal or prohibited purpose</li>
                                            <li>Violating any intellectual property rights</li>
                                            <li>Publishing offensive or harmful content</li>
                                            <li>Attempting unauthorized access to our systems</li>
                                            <li>Interfering with the service or disturbing other users</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">Intellectual Property</h2>
                                        <p className="text-neutral-500 leading-relaxed">
                                            The designs you create using our services belong to you. However, you grant us a limited license to use these designs for improving our services and displaying examples (anonymously).
                                        </p>
                                        <p className="text-neutral-500 leading-relaxed mt-3">
                                            All intellectual property rights in the platform and technology used belong to Yasmine Al-Sham Smart Designer.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">Fees and Payment</h2>
                                        <p className="text-neutral-500 leading-relaxed">
                                            We offer both free and paid services. Prices may change at any time, but you will be notified in advance of any changes affecting your current subscription.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">Disclaimer</h2>
                                        <p className="text-neutral-500 leading-relaxed">
                                            Our services are provided "as is" without warranties of any kind. We do not guarantee that:
                                        </p>
                                        <ul className="list-disc list-inside space-y-2 text-neutral-500 ml-4 mt-3">
                                            <li>The service will always be available or error-free</li>
                                            <li>Results will always meet your expectations</li>
                                            <li>Any errors will be corrected immediately</li>
                                        </ul>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">Limitation of Liability</h2>
                                        <p className="text-neutral-500 leading-relaxed">
                                            We shall not be liable for any indirect, incidental, special, or consequential damages arising from your use or inability to use our services.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">Service Termination</h2>
                                        <p className="text-neutral-500 leading-relaxed">
                                            We reserve the right to suspend or terminate your account at any time if you violate these Terms of Service. You may also terminate your account at any time through account settings.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">Changes to Terms</h2>
                                        <p className="text-neutral-500 leading-relaxed">
                                            We reserve the right to modify these Terms of Service at any time. We will notify you of any material changes via email or through a notice on our platform. Your continued use of the service after such changes constitutes your acceptance of them.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">Governing Law</h2>
                                        <p className="text-neutral-500 leading-relaxed">
                                            These Terms of Service shall be governed by and construed in accordance with the laws of Turkey, without regard to conflict of law provisions.
                                        </p>
                                    </section>

                                    <section>
                                        <h2 className="text-xl md:text-2xl font-headline font-bold text-primary mb-4">Contact Us</h2>
                                        <p className="text-neutral-500 leading-relaxed">
                                            If you have any questions about these Terms of Service, please contact us:
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
