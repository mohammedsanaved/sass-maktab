import React from 'react';
import { Menu, Globe, Sun, Moon, Bell, User } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';

interface HeaderProps {
  toggleSidebar: () => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
  isUrdu: boolean;
}

export const Header: React.FC<HeaderProps> = ({ toggleSidebar, toggleTheme, isDarkMode, isUrdu }) => {
  const t = useTranslations('Header');
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value;
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-800 shadow-sm flex items-center justify-between px-6 z-20 no-print">
      <button onClick={toggleSidebar} className="text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-md focus:outline-none transition-colors">
        <Menu className="w-6 h-6" />
      </button>
      
      <div className="flex items-center space-x-4 rtl:space-x-reverse ml-auto rtl:mr-auto rtl:ml-0">
        <div className="hidden md:flex items-center text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
          <Globe className="w-4 h-4 me-2 rtl:ml-2 rtl:mr-0" />
          <select 
            className={`bg-transparent border-none outline-none text-xs cursor-pointer focus:ring-0 ${isUrdu ? 'font-urdu pt-1' : ''}`}
            value={locale}
            onChange={handleLanguageChange}
          >
            <option value="en">English</option>
            <option value="ur">اردو (Urdu)</option>
          </select>
        </div>
        
        <button onClick={toggleTheme} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        
        <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 rtl:left-1 rtl:right-auto w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        <div className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded-lg transition-colors">
          <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-200">{t('admin')}</span>
        </div>
      </div>
    </header>
  );
};
