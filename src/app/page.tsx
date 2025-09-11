'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const [currentMessage, setCurrentMessage] = useState(0);
  const [currentVideo, setCurrentVideo] = useState('BG1');

  const motivationalMessages = [
    "باور داشته باش، می‌تونی",
    "امروز روز جدیدی است",
    "قدم به قدم تا موفقیت",
    "هیچ وقت تسلیم نشو",
    "رویاهایت را دنبال کن",
    "تو قوی‌تر از تصورت هستی",
    "تغییر از خودت شروع می‌شود",
    "هر روز فرصت جدیدی است",
    "به خودت ایمان داشته باش",
    "کوچک شروع کن، بزرگ بیندیش",
    "شکست پایان راه نیست",
    "انرژی مثبت جذب می‌کنی",
    "آینده در دستان توست",
    "محدودیت فقط در ذهن است",
    "امروز بهتر از دیروز باش",
    "موفقیت حق توست",
    "خودت را دست کم نگیر",
    "هدفت را گم نکن",
    "یادگیری هیچ وقت تمام نمی‌شود",
    "شادی را انتخاب کن",
    // Complete Persian Poetry Verses (مصراع)
    "اگر نتوانی چو شمع سر و سامان بسوزی، چراغ راه کسی نتوانی شدن",
    "بیا که غم خوردن آسان نگیرند از ما، که سخت عاشق و رند و جوانیم ما",
    "دوش از مسجد سوی میخانه آمدم، پیر مغان مرا گفت ای جان جان",
    "گر عاشق شدی هویت ببازی، گر نشدی هویت نداری",
    "دل برده‌ام به صحرای خیال آن یار، که آن جا نه خزان است نه بهار",
    "صبا به لطف بگو آن غزال رعنا را، که سر به کوه و بیابان تو دادهایم",
    "گل همچو عارض جانان سرخ است، خار همچو موی سیاه او",
    "سر زلف تو پریشان من پریشانم، دل از کف رفته و جان پریشانم",
    "بگذار تا نفسی آسوده بکشم، از غم عشق تو جانی شاده بکشم",
    "عشق است و کار او آسان نمی‌شود، تا نکشی در این ره جان نمی‌شود",
    "خوشا کسی که در آسایش جان باشد، چو من اسیر محبت نهان باشد",
    "دل که آینه خاطر صافی ست، عکس روی همه چیز در وی هست",
    "دریای دل که از توفان خاموشی، هر موج آن هزار طوفان پیدا کرد",
    "مهر آن ماه که بر عرش معلی می‌تابد، تا ابد در دل عاشقان پیدا کرد",
    "در طلب آن نگار گم گشته‌ام، در کوی او چو خاک رهگذار شده‌ام",
    "ساقی بیا که عالم پر شور و شر است، کار جهان همه بر خلاف مقرر است",
    "در کوی تو اگر خاری در پا کند، آن خار نعمتی است که خدا کند",
    "عاشق شدن خوش است ولیکن در خفا، کز عشق آشکار بلا خیزد",
    "دل زنده است و دریا و کوه و بیابان، زنده و پیوسته در شور",
    "مرا به سینه چون طوفان دلی هست، که می‌خواهد زمین را برکند",
    "بهار آمد و نوید صلح آورد، گل آمد و قدوم رقیب آورد",
    "شب تاریک و بیم موج و گردابی چنین هائل، کجا دانند حال ما سبکباران ساحل",
    "عاقبت کار عالم تاریکی است، این چراغ آخر شب روشن کن",
    "باز آ ای بلبل خوش نوا باز آ، که گل بی تو چه معنی دارد",
    "چون صبح صادق آمد شمع را چه کار است، روی یار آمد رقیب را چه کار است"
  ];

  useEffect(() => {
    // Message rotation every 8 seconds
    const messageInterval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % motivationalMessages.length);
    }, 8000);

    // Video rotation every 30 minutes (1800000 ms)
    const videoInterval = setInterval(() => {
      setCurrentVideo((prev) => prev === 'BG1' ? 'BG2' : 'BG1');
    }, 1800000); // 30 minutes = 30 * 60 * 1000 ms

    // Cleanup intervals on component unmount
    return () => {
      clearInterval(messageInterval);
      clearInterval(videoInterval);
    };
  }, [motivationalMessages.length]);

  return (
    <div className="relative min-h-screen min-h-[100dvh] w-full flex flex-col items-center justify-center overflow-hidden px-4 py-8" dir="rtl">
      {/* Blurry Black-Orange Background */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: '#2d1810',
          filter: 'blur(50px)',
          zIndex: -20
        }}
      ></div>

      {/* Video Background - Mobile-first vertical display */}
      <video
        key={currentVideo} // Force re-render when video changes
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="fixed inset-0 w-full h-full md:blur-lg"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          objectPosition: 'center center',
          zIndex: -10
        }}
      >
        <source src={`/${currentVideo}.mp4`} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Dark overlay for better readability */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 0
        }}
      ></div>

      {/* Content - Mobile-optimized buttons */}
      <div className="flex gap-1.5 flex-col w-full max-w-52 relative z-10">
        {/* Neon glow behind signup button */}
        <div className="relative">
          <div className="absolute inset-0 bg-blue-400/30 rounded-lg blur-sm animate-pulse"></div>
          <Link
            href="/signup"
            className="relative glass-button w-full px-2.5 py-1.5 text-center font-medium text-xs rounded-lg backdrop-blur-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all duration-300 shadow-2xl block"
          >
            ثبت نام
          </Link>
        </div>

        {/* Neon glow behind login button */}
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-400/30 rounded-lg blur-sm animate-pulse"></div>
          <Link
            href="/login"
            className="relative glass-button w-full px-2.5 py-1.5 text-center font-medium text-xs rounded-lg backdrop-blur-xl bg-white/5 border border-white/20 hover:bg-white/15 transition-all duration-300 shadow-2xl block"
          >
            ورود
          </Link>
        </div>
      </div>

      {/* Motivational Messages - Mobile optimized */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 px-4 text-center">
        <p
          key={currentMessage}
          className="text-white/80 text-sm sm:text-base font-light animate-fade-in-out max-w-xs"
        >
          {motivationalMessages[currentMessage]}
        </p>
      </div>
    </div>
  );
}
