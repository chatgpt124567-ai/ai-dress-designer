# حل سريع: Google OAuth على الدومين المخصص
# Quick Fix: Google OAuth on Custom Domain

## 🚨 المشكلة
تسجيل الدخول بجوجل يوجه إلى `localhost` بدلاً من `https://yasmin-alsham-ai.com`

---

## ⚡ الحل السريع (3 دقائق)

### 1️⃣ Google Cloud Console (دقيقة واحدة)

**الرابط:** https://console.cloud.google.com/apis/credentials

1. افتح OAuth 2.0 Client ID الخاص بك
2. في **Authorized JavaScript origins**، أضف:
   ```
   https://yasmin-alsham-ai.com
   https://www.yasmin-alsham-ai.com
   ```
3. اضغط **Save**

---

### 2️⃣ Supabase Dashboard (دقيقة واحدة)

**الرابط:** https://supabase.com/dashboard/project/ugszpeinlqlxhejplqdh/auth/url-configuration

1. **Site URL** → غيّره إلى:
   ```
   https://yasmin-alsham-ai.com
   ```

2. **Redirect URLs** → أضف:
   ```
   https://yasmin-alsham-ai.com/auth/callback
   https://www.yasmin-alsham-ai.com/auth/callback
   ```

3. اضغط **Save**

---

### 3️⃣ الاختبار (دقيقة واحدة)

1. انتظر **5 دقائق** (مهم!)
2. افتح وضع التصفح الخاص
3. اذهب إلى: https://yasmin-alsham-ai.com/auth/login
4. اضغط "تسجيل الدخول بجوجل"
5. ✅ يجب أن يعمل!

---

## 📋 Checklist

- [ ] أضفت الدومين في Google Cloud Console
- [ ] حفظت التغييرات
- [ ] غيّرت Site URL في Supabase
- [ ] أضفت Redirect URLs في Supabase
- [ ] حفظت التغييرات
- [ ] انتظرت 5 دقائق
- [ ] مسحت الكاش
- [ ] جربت في وضع التصفح الخاص

---

## 🆘 لا يزال لا يعمل؟

### جرب هذا:
1. امسح الكاش والكوكيز (Ctrl+Shift+Delete)
2. انتظر 10 دقائق إضافية
3. جرب من متصفح آخر
4. تأكد من أنك حفظت التغييرات في كلا الموقعين

### إذا رأيت "redirect_uri_mismatch":
- تأكد من كتابة الدومين بشكل صحيح (بدون `/` في النهاية)
- تأكد من استخدام `https://` وليس `http://`

---

## 📚 للمزيد من التفاصيل

راجع الدليل الكامل: `GOOGLE_OAUTH_CUSTOM_DOMAIN_SETUP.md`

---

**تم! 🎉**

