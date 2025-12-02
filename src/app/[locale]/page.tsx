// src/app/[locale]/page.tsx
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing'; // Import Link from your routing config
import Image from 'next/image';
import LanguageSwitcher from '@/components/LanguageSwitcher'; // We'll create this below

export default function Home() {
  // Hook to get translations for the "Home" namespace
  const t = useTranslations('Home'); 

  return (
    <div className='font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20'>
      <main className='flex flex-col gap-[32px] row-start-2 items-center sm:items-start'>
        <Image
          className='dark:invert'
          src='/next.svg'
          alt='Next.js logo'
          width={180}
          height={38}
          priority
        />
        
        <ol className='font-mono list-inside list-decimal text-sm/6 text-center sm:text-left'>
          <li className='mb-2 tracking-[-.01em]'>
            {t('getStarted')}{' '}
            <code className='bg-black/[.05] dark:bg-white/[.06] font-mono font-semibold px-1 py-0.5 rounded'>
              src/app/page.tsx
            </code>
            .
          </li>
          <li className='tracking-[-.01em]'>
            {t('saveChanges')}
          </li>
        </ol>

        <p className='font-medium text-lg'>{t('welcome')}</p>
        <h1 className='text-xl font-bold mb-6'>{t('dashboard')}</h1>
        
        <nav className='space-y-4 w-full'>
          {/* Use Link from next-intl for automatic locale prefixing */}
          <Link href='/dashboard' className='block p-2 hover:bg-gray-100 rounded'>
            {t('dashboard')}
          </Link>
          <Link href='/students' className='block p-2 hover:bg-gray-100 rounded'>
            {t('students')}
          </Link>
        </nav>

        <div className='mt-10'>
          <p className='text-sm text-gray-500 mb-2'>{t('language')}</p>
          {/* We extract the button logic to a separate client component */}
          <LanguageSwitcher />
        </div>

        {/* ... Rest of your Vercel links using t('deploy'), t('readDocs') ... */}
      </main>
      
      {/* ... Footer code ... */}
    </div>
  );
}
