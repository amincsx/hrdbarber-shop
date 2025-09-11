
# آرایشگاه HRD - سامانه رزرو نوبت

یک اپلیکیشن Progressive Web App (PWA) برای رزرو نوبت آرایشگاه با قابلیت‌های زیر:

## ویژگی‌ها

- 🔐 سیستم احراز هویت کاربران
- 📅 تقویم شمسی برای انتخاب تاریخ
- ⏰ انتخاب زمان با کنترل تداخل
- 💼 انتخاب آرایشگر و سرویس‌ها
- 📱 طراحی ریسپانسیو و PWA
- 🗃️ ذخیره سازی در دیتابیس و localStorage
- 🔄 همگام‌سازی آفلاین/آنلاین

## تکنولوژی‌ها

- **Frontend**: Next.js 15 با App Router
- **Database**: Supabase PostgreSQL
- **Styling**: Tailwind CSS + Inline Styles
- **PWA**: next-pwa
- **Authentication**: Custom + Supabase Auth

## راه‌اندازی محیط توسعه

### پیش‌نیازها
- Node.js 18+
- npm یا yarn
- حساب Supabase

### مراحل نصب

1. **کلون پروژه**:
```bash
git clone <repository-url>
cd hrdbarber.shop
```

2. **نصب dependencies**:
```bash
npm install
```

3. **تنظیم متغیرهای محیطی**:
فایل `.env.local` را ایجاد کنید:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **راه‌اندازی دیتابیس**:
- به پنل Supabase بروید
- SQL موجود در `database/schema.sql` را اجرا کنید

5. **اجرای پروژه**:
```bash
npm run dev
```

## راه‌اندازی دیتابیس Supabase

### 1. ایجاد حساب و پروژه
- به [supabase.com](https://supabase.com) بروید
- حساب کاربری ایجاد کنید
- پروژه جدید ایجاد کنید

### 2. اجرای SQL Schema
در SQL Editor پنل Supabase، کد موجود در `database/schema.sql` را اجرا کنید.

### 3. تنظیمات Authentication
- در بخش Authentication، Anonymous access را فعال کنید
- RLS policies از فایل schema اعمال می‌شوند

## دیپلوی

### Vercel (توصیه شده)

1. **اتصال به Vercel**:
```bash
npm i -g vercel
vercel
```

2. **تنظیم Environment Variables**:
در پنل Vercel، متغیرهای زیر را اضافه کنید:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **دیپلوی**:
```bash
vercel --prod
```

## PWA Features

- اپ قابل نصب روی موبایل
- کار آفلاین
- کش کردن صفحات
- آیکون اختصاری روی صفحه اصلی

---

ساخته شده با ❤️ برای آرایشگاه HRD