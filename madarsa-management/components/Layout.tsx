import React, { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  CreditCard, 
  LogOut, 
  Menu, 
  Bell, 
  Moon, 
  Sun,
  Globe,
  User,
  Settings,
  X
} from 'lucide-react';

interface LayoutProps {
  children?: ReactNode;
}

const translations = {
  en: {
    dashboard: "Dashboard",
    students: "Students",
    teachers: "Teachers",
    payments: "Payments",
    settings: "Settings",
    logout: "Logout",
    admin: "Admin",
    search: "Search",
  },
  ur: {
    dashboard: "ڈیش بورڈ",
    students: "طلباء",
    teachers: "اساتذہ",
    payments: "ادائیگی",
    settings: "ترتیبات",
    logout: "لاگ آؤٹ",
    admin: "ایڈمن",
    search: "تلاش کریں",
  }
};

type Language = 'en' | 'ur';

const SidebarItem = ({ to, icon: Icon, label, active, collapsed }: { to: string, icon: any, label: string, active: boolean, collapsed: boolean }) => (
  <Link 
    to={to} 
    title={collapsed ? label : ''}
    className={`flex items-center py-3 transition-colors duration-200 ${
      collapsed ? 'justify-center px-2' : 'px-6'
    } ${
      active 
        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-r-4 border-primary-600 rtl:border-r-0 rtl:border-l-4' 
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`}
  >
    <Icon className={`w-5 h-5 ${collapsed ? '' : 'me-3 rtl:ml-3 rtl:mr-0'}`} />
    {!collapsed && <span className="font-medium whitespace-nowrap overflow-hidden transition-all duration-300 opacity-100">{label}</span>}
  </Link>
);

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  // Initialize based on screen width
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setDarkMode] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const location = useLocation();

  useEffect(() => {
    // Check screen size on mount
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // Set initial state
    handleResize();

    // Load persisted language preference
    const savedLang = (localStorage.getItem('salah-saas-lang') as Language) || 'en';
    setCurrentLanguage(savedLang);
    document.documentElement.lang = savedLang;
    document.documentElement.dir = savedLang === 'ur' ? 'rtl' : 'ltr';
    
    // Optional: Add event listener for resize if dynamic closing is desired
    // window.addEventListener('resize', handleResize);
    // return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  
  const toggleTheme = () => {
    setDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value as Language;
    setCurrentLanguage(lang);
    localStorage.setItem('salah-saas-lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
  };

  const t = translations[currentLanguage];
  const isUrdu = currentLanguage === 'ur';

  // Desktop: Open = w-64, Closed = w-20 (Mini)
  // Mobile: Open = w-64 (Visible), Closed = w-0 (Hidden)
  // We use CSS classes to handle the distinction between mobile hidden and desktop mini
  
  return (
    <div className={`flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden ${isUrdu ? 'font-urdu' : ''}`}>
      {/* Sidebar */}
      <aside 
        className={`
          ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-20 md:translate-x-0'} 
          fixed z-30 inset-y-0 start-0 bg-white dark:bg-gray-800 shadow-lg 
          transform transition-all duration-300 ease-in-out
          md:relative flex flex-col no-print border-e dark:border-gray-700
        `}
      >
        <div className={`flex items-center h-16 border-b border-gray-100 dark:border-gray-700 transition-all duration-300 ${isSidebarOpen ? 'justify-center px-4' : 'justify-center px-2'}`}>
          {isSidebarOpen ? (
            <h1 className="text-2xl font-bold text-primary-500 tracking-tighter whitespace-nowrap overflow-hidden">
              SalahSaaS
            </h1>
          ) : (
             <h1 className="text-2xl font-bold text-primary-500 tracking-tighter">
              SS
            </h1>
          )}
        </div>
        
        <nav className="flex-1 mt-6 overflow-y-auto overflow-x-hidden">
          <SidebarItem collapsed={!isSidebarOpen} to="/" icon={LayoutDashboard} label={t.dashboard} active={location.pathname === '/'} />
          <SidebarItem collapsed={!isSidebarOpen} to="/students" icon={GraduationCap} label={t.students} active={location.pathname === '/students'} />
          <SidebarItem collapsed={!isSidebarOpen} to="/teachers" icon={Users} label={t.teachers} active={location.pathname === '/teachers'} />
          <SidebarItem collapsed={!isSidebarOpen} to="/payments" icon={CreditCard} label={t.payments} active={location.pathname === '/payments'} />
          <SidebarItem collapsed={!isSidebarOpen} to="/settings" icon={Settings} label={t.settings} active={location.pathname.startsWith('/settings')} />
        </nav>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <Link 
            to="/login" 
            className={`flex items-center transition-colors rounded-md text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 
              ${isSidebarOpen ? 'px-4 py-2 w-full' : 'justify-center p-2 w-full'}
            `}
            title={!isSidebarOpen ? t.logout : ''}
          >
            <LogOut className={`w-4 h-4 ${isSidebarOpen ? 'me-2 rtl:ml-2 rtl:mr-0' : ''}`} />
            {isSidebarOpen && <span className="text-sm font-medium">{t.logout}</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-gray-800 shadow-sm flex items-center justify-between px-6 z-20 no-print">
          <button onClick={toggleSidebar} className="text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-md focus:outline-none transition-colors">
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center space-x-4 rtl:space-x-reverse ml-auto rtl:mr-auto rtl:ml-0">
            <div className="hidden md:flex items-center text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
              <Globe className="w-4 h-4 me-2 rtl:ml-2 rtl:mr-0" />
              <select 
                className={`bg-transparent border-none outline-none text-xs cursor-pointer focus:ring-0 ${isUrdu ? 'font-urdu pt-1' : ''}`}
                value={currentLanguage}
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
              <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-200">{t.admin}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
          {children}
        </main>
      </div>
      
      {/* Mobile Overlay for Sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};