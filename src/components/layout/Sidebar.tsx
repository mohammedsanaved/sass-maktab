import React from 'react';
import { Link, usePathname } from '@/i18n/routing';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CreditCard,
  LogOut,
  Settings,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface SidebarProps {
  isSidebarOpen: boolean;
}

const SidebarItem = ({
  to,
  icon: Icon,
  label,
  active,
  collapsed,
}: {
  to: string;
  icon: any;
  label: string;
  active: boolean;
  collapsed: boolean;
}) => (
  <Link
    href={to}
    title={collapsed ? label : ''}
    className={`flex items-center py-3 transition-colors duration-200 ${
      collapsed ? 'justify-center px-2' : 'px-6'
    } ${
      active
        ? 'bg-primary-500 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-r-4 border-primary-600 rtl:border-r-0 rtl:border-l-4'
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`}
  >
    <Icon className={`w-5 h-5 ${collapsed ? '' : 'me-3 rtl:ml-3 rtl:mr-0'}`} />
    {!collapsed && (
      <span className='font-medium whitespace-nowrap overflow-hidden transition-all duration-300 opacity-100'>
        {label.split('.')[1].toLocaleUpperCase()}
      </span>
    )}
  </Link>
);

export const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen }) => {
  const pathname = usePathname();
  const t = useTranslations('Sidebar');

  return (
    <aside
      className={`
        ${
          isSidebarOpen
            ? 'w-64 translate-x-0'
            : 'w-0 -translate-x-full md:w-20 md:translate-x-0'
        } 
        fixed z-30 inset-y-0 start-0 bg-white dark:bg-gray-800 shadow-lg 
        transform transition-all duration-300 ease-in-out
        md:relative flex flex-col no-print border-e dark:border-gray-700
      `}
    >
      <div
        className={`flex items-center h-16 border-b border-gray-100 dark:border-gray-700 transition-all duration-300 ${
          isSidebarOpen ? 'justify-center px-4' : 'justify-center px-2'
        }`}
      >
        {isSidebarOpen ? (
          <h1 className='text-2xl font-bold text-primary-600 tracking-tighter whitespace-nowrap overflow-hidden'>
            Salah<span className='text-gray-600 dark:text-gray-300'>SaaS</span>
          </h1>
        ) : (
          <h1 className='text-2xl font-bold text-primary-600 tracking-tighter'>
            S<span className='text-gray-600 dark:text-gray-300'>S</span>
          </h1>
        )}
      </div>

      <nav className='flex-1 mt-6 overflow-y-auto overflow-x-hidden'>
        <SidebarItem
          collapsed={!isSidebarOpen}
          to='/dashboard'
          icon={LayoutDashboard}
          label={t('dashboard')}
          active={pathname === '/dashboard'}
        />
        <SidebarItem
          collapsed={!isSidebarOpen}
          to='/students'
          icon={GraduationCap}
          label={t('students')}
          active={pathname.startsWith('/students')}
        />
        <SidebarItem
          collapsed={!isSidebarOpen}
          to='/teachers'
          icon={Users}
          label={t('teachers')}
          active={pathname.startsWith('/teachers')}
        />
        <SidebarItem
          collapsed={!isSidebarOpen}
          to='/dashboard/payments'
          icon={CreditCard}
          label={t('payments')}
          active={pathname.startsWith('/dashboard/payments')}
        />
        <SidebarItem
          collapsed={!isSidebarOpen}
          to='/dashboard/settings'
          icon={Settings}
          label={t('settings')}
          active={pathname.startsWith('/dashboard/settings')}
        />
      </nav>

      <div className='p-4 border-t border-gray-100 dark:border-gray-700'>
        <Link
          href='/login'
          className={`flex items-center transition-colors rounded-md text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 
            ${isSidebarOpen ? 'px-4 py-2 w-full' : 'justify-center p-2 w-full'}
          `}
          title={!isSidebarOpen ? t('logout') : ''}
        >
          <LogOut
            className={`w-4 h-4 ${
              isSidebarOpen ? 'me-2 rtl:ml-2 rtl:mr-0' : ''
            }`}
          />
          {isSidebarOpen && (
            <span className='text-sm font-medium'>{'LOGOUT'}</span>
          )}
        </Link>
      </div>
    </aside>
  );
};
