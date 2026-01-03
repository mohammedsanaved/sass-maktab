// "use client";

// import React, { ReactNode, useState, useEffect } from 'react';
// import { Sidebar } from './Sidebar';
// import { Header } from './Header';
// import { useLocale } from 'next-intl';

// interface AppLayoutProps {
//   children: ReactNode;
// }

// export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
//   const [isSidebarOpen, setSidebarOpen] = useState(true);
//   const [isDarkMode, setDarkMode] = useState(false);
//   const [mounted, setMounted] = useState(false);
//   const locale = useLocale();
//   const isUrdu = locale === 'ur';

//   useEffect(() => {
//     setMounted(true);
//     // Check screen size on mount
//     const handleResize = () => {
//       if (window.innerWidth < 768) {
//         setSidebarOpen(false);
//       } else {
//         setSidebarOpen(true);
//       }
//     };

//     // Set initial state
//     handleResize();

//     // Load persisted theme preference
//     const savedTheme = localStorage.getItem('theme');
//     const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
//     const initialTheme = savedTheme || (systemTheme ? 'dark' : 'light');
//     const isDark = initialTheme === 'dark' || document.documentElement.classList.contains('dark');

//     setDarkMode(isDark);
//     // if (savedTheme === 'dark' || (!savedTheme && systemTheme)) {
//     //   setDarkMode(true);
//     //   document.documentElement.classList.add('dark');
//     // } else {
//     //   setDarkMode(false);
//     //   document.documentElement.classList.remove('dark');
//     // }

//      // Listen for system theme changes
//      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
//      const handleSystemThemeChange = (e: MediaQueryListEvent) => {
//        if (!localStorage.getItem('theme')) {
//          if (e.matches) {
//            setDarkMode(true);
//            document.documentElement.classList.add('dark');
//          } else {
//            setDarkMode(false);
//            document.documentElement.classList.remove('dark');
//          }
//        }
//      };

//      mediaQuery.addEventListener('change', handleSystemThemeChange);

//      // Window resize listener
//      window.addEventListener('resize', handleResize);

//      return () => {
//        window.removeEventListener('resize', handleResize);
//        mediaQuery.removeEventListener('change', handleSystemThemeChange);
//      };
//   }, []);

//   const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

//   const toggleTheme = () => {
//     const newMode = !isDarkMode;
//     setDarkMode(newMode);
//     if (newMode) {
//       document.documentElement.classList.add('dark');
//       localStorage.setItem('theme', 'dark');
//     } else {
//       document.documentElement.classList.remove('dark');
//       localStorage.setItem('theme', 'light');
//     }
//   };

//   if (!mounted) {
//     return null; // or return a loading state
//   }

//   return (
//     <div className={`flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden ${isUrdu ? 'font-urdu' : ''}`}>
//       <Sidebar isSidebarOpen={isSidebarOpen} />

//       <div className="flex-1 flex flex-col overflow-hidden w-full">
//         <Header
//           toggleSidebar={toggleSidebar}
//           toggleTheme={toggleTheme}
//           isDarkMode={isDarkMode}
//           isUrdu={isUrdu}
//         />

//         <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 p-6">
//           {children}
//         </main>
//       </div>

//       {/* Mobile Overlay for Sidebar */}
//       {isSidebarOpen && (
//         <div
//           className="fixed inset-0 bg-black/50 z-20 md:hidden"
//           onClick={() => setSidebarOpen(false)}
//         />
//       )}
//     </div>
//   );
// };
'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useLocale } from 'next-intl';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const locale = useLocale();
  const isUrdu = locale === 'ur';

  useEffect(() => {
    setMounted(true);
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);

  if (!mounted) {
    return null;
  }

  return (
    <div
      className={`flex h-screen bg-background overflow-hidden ${
        isUrdu ? 'font-urdu' : ''
      }`}
    >
      <Sidebar isSidebarOpen={isSidebarOpen} />

      <div className='flex-1 flex flex-col overflow-hidden w-full'>
        <Header toggleSidebar={toggleSidebar} isUrdu={isUrdu} />

        <main className='flex-1 overflow-x-hidden overflow-y-auto bg-background p-6'>
          {children}
        </main>
      </div>

      {isSidebarOpen && (
        <div
          className='fixed inset-0 bg-black/50 z-20 md:hidden'
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
