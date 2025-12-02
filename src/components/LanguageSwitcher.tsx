// src/components/LanguageSwitcher.tsx
'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { useTransition } from 'react';

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale(); // Get current active locale (en, ar, or ur)
  const [isPending, startTransition] = useTransition();

  const onSelectChange = (nextLocale: string) => {
    startTransition(() => {
      // This replaces the URL from /en/dashboard -> /ur/dashboard
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <div className='flex gap-2'>
      <button
        onClick={() => onSelectChange('en')}
        disabled={isPending}
        className={`px-3 py-1 rounded ${
          currentLocale === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-200'
        }`}
      >
        English
      </button>
      <button
        onClick={() => onSelectChange('ur')}
        disabled={isPending}
        className={`px-3 py-1 rounded ${
          currentLocale === 'ur' ? 'bg-green-600 text-white' : 'bg-gray-200'
        }`}
      >
        اردو
      </button>
      <button
        onClick={() => onSelectChange('ar')}
        disabled={isPending}
        className={`px-3 py-1 rounded ${
          currentLocale === 'ar' ? 'bg-green-600 text-white' : 'bg-gray-200'
        }`}
      >
        العربية
      </button>
    </div>
  );
}
