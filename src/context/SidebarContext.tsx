'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    // 1. Check LocalStorage for user preference
    const savedState = localStorage.getItem('sidebarOpen');
    
    if (savedState !== null) {
      setSidebarOpen(savedState === 'true');
    } else {
      // 2. Default behavior based on screen size if no preference saved
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    }

    const handleResize = () => {
      // Auto-close on mobile if resizing from desktop, but only if no user preference
      // Actually, standard behavior is to respect explicit toggles, 
      // but we should probably handle mobile small screens.
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(prev => {
      const newState = !prev;
      localStorage.setItem('sidebarOpen', String(newState));
      return newState;
    });
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    localStorage.setItem('sidebarOpen', 'false');
  };

  const openSidebar = () => {
    setSidebarOpen(true);
    localStorage.setItem('sidebarOpen', 'true');
  };

  return (
    <SidebarContext.Provider value={{ isSidebarOpen, toggleSidebar, closeSidebar, openSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};
