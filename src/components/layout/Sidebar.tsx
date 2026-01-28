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
import Image from 'next/image';
import { useSidebar } from '@/context/SidebarContext';

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
        ? 'bg-primary-500 text-primary-50 border-r-4 border-primary-500 rtl:border-r-0 rtl:border-l-4'
        : 'text-foreground hover:bg-primary-50'
    }`}
  >
    <Icon className={`w-5 h-5 ${collapsed ? '' : 'me-3 rtl:ml-3 rtl:mr-0'}`} />
    {!collapsed && (
      <span className='font-medium whitespace-nowrap overflow-hidden transition-all duration-300 opacity-100'>
        {label}
      </span>
    )}
  </Link>
);

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { isSidebarOpen } = useSidebar();
  // const t = useTranslations('Sidebar');

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    // Using window.location.href to ensure a full page reload and clear any state
    // window.location.href = `/${pathname.split('/')[1]}/login`;
    window.location.href = `/login`;
    // router.push('/login');
    // console.log(pathname.split('/'))
  };

  return (
    <aside
      className={`
        ${
          isSidebarOpen
            ? 'w-64 translate-x-0'
            : 'w-0 -translate-x-full md:w-20 md:translate-x-0'
        } 
        fixed z-30 inset-y-0 start-0 shadow-lg 
        transform transition-all duration-300 ease-in-out
        md:relative flex flex-col no-print dark:border-primary-700
      `}
    >
      <div
        className={`flex items-center h-16 border-primary-100 dark:border-primary-700 transition-all duration-300 ${
          isSidebarOpen ? 'justify-center px-4' : 'justify-center px-2'
        }`}
      >
        {isSidebarOpen ? (
          <h1 className='text-lg font-bold text-primary-600 tracking-tighter whitespace-nowrap overflow-hidden'>
            Maktab<span className='text-foreground'>{" "}Muhammadiya</span>
          </h1>
            // <Image src={"/name-en.png"} alt="Logo" width={50} height={50} className='w-auto h-[20px]' />
        ) : (
          // <h1 className='text-2xl font-bold text-primary-600 tracking-tighter'>
          //   S<span className='text-foreground'>S</span>
          // </h1>
          <Image src={"/logo.png"} alt="Logo" width={50} height={50} className='w-10 h-10' />
        )}
      </div>

      <nav className='flex-1 mt-6 overflow-y-auto overflow-x-hidden'>
        <SidebarItem
          collapsed={!isSidebarOpen}
          to='/dashboard'
          icon={LayoutDashboard}
          label={'Dashboard'}
          active={pathname === '/dashboard'}
        />
        <SidebarItem
          collapsed={!isSidebarOpen}
          to='/dashboard/students'
          icon={GraduationCap}
          label={'Students'}
          active={pathname.startsWith('/dashboard/students')}
        />
        <SidebarItem
          collapsed={!isSidebarOpen}
          to='/dashboard/teachers'
          icon={Users}
          label={'Teachers'}
          active={pathname.startsWith('/dashboard/teachers')}
        />
        <SidebarItem
          collapsed={!isSidebarOpen}
          to='/dashboard/payments'
          icon={CreditCard}
          label={'Payments'}
          active={pathname.startsWith('/dashboard/payments')}
        />
        <SidebarItem
          collapsed={!isSidebarOpen}
          to='/dashboard/settings'
          icon={Settings}
          label={'Settings'}
          active={pathname.startsWith('/dashboard/settings')}
        />
      </nav>

      <div className='p-4 border-t border-primary-100 dark:border-primary-700'>
        <button
          onClick={handleLogout}
          className={`flex items-center transition-colors rounded-md text-red-600 bg-red-50 hover:bg-red-100 cursor-pointer dark:bg-red-900/20 
            ${isSidebarOpen ? 'px-4 py-2 w-full' : 'justify-center p-2 w-full'}
          `}
          title={!isSidebarOpen ? 'Logout' : ''}
        >
          <LogOut
            className={`w-4 h-4 ${
              isSidebarOpen ? 'me-2 rtl:ml-2 rtl:mr-0' : ''
            }`}
          />
          {isSidebarOpen && (
            <span className='text-sm font-medium'>{'LOGOUT'}</span>
          )}
        </button>
      </div>
    </aside>
  );
};
