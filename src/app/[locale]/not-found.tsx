'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui';
import { Ghost, Home, LogIn, Loader2 } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();
  const locale = useLocale();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    
    if (!token) {
      // If no token, redirect to login
      router.push('/login');
    } else {
      setIsCheckingAuth(false);
    }
  }, [router]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-500" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] overflow-hidden flex flex-col items-center justify-center p-4 relative font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-900/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      
      {/* Main Content Card */}
      <div className="relative z-10 w-full max-w-lg">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl flex flex-col items-center text-center">
          
          {/* Animated 404 Text */}
          <div className="relative mb-8">
            <h1 className="text-8xl sm:text-9xl font-black text-white/10 select-none">404</h1>
            <div className="absolute inset-0 flex items-center justify-center animate-bounce duration-[2000ms]">
              <Ghost size={80} className="text-primary-400 drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
            </div>
          </div>
          
          <div className="space-y-4 mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {locale === 'en' ? 'Oops! Page Disappeared' : locale === 'ar' ? 'عذراً! اختفت الصفحة' : 'اوپس! صفحہ غائب ہو گیا'}
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xs mx-auto">
              {locale === 'en' 
                ? "The page you're looking for was moved or doesn't exist anymore." 
                : locale === 'ar' 
                  ? "الصفحة التي تبحث عنها تم نقلها أو لم تعد موجودة." 
                  : "آپ جس صفحہ کو تلاش کر رہے ہیں وہ منتقل کر دیا گیا ہے یا اب موجود نہیں ہے۔"}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <Button 
              onClick={() => router.push('/dashboard')} 
              className="flex-1 h-12 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-xl group transition-all duration-300 transform hover:scale-[1.02]"
              startIcon={<Home size={18} className="group-hover:-translate-y-0.5 transition-transform" />}
            >
              {locale === 'en' ? 'Dashboard' : locale === 'ar' ? 'لوحة القيادة' : 'ڈیش بورڈ'}
            </Button>
            
            <Button 
              variant="outlined"
              onClick={() => router.push('/login')}
              className="flex-1 h-12 border-white/20 text-white hover:bg-white/10 font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02]"
              startIcon={<LogIn size={18} />}
            >
              {locale === 'en' ? 'Login' : locale === 'ar' ? 'تسجيل الدخول' : 'لاگ ان'}
            </Button>
          </div>
        </div>
        
        {/* Footer Text */}
        <p className="text-center mt-8 text-slate-500 text-xs uppercase tracking-[0.2em]">
          Powered by Maktab Mohammadiya
        </p>
      </div>
      
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
    </div>
  );
}
