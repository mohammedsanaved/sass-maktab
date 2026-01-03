'use client';

import { useTheme } from '@/context/ThemeProvider';
import { Button } from '@/components/ui';
import { Sun, Moon } from 'lucide-react';

export const ThemeSwitcher = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant='text'
      // color='secondary'
      onClick={toggleTheme}
      aria-label='Toggle theme'
      className='text-primary-50'
    >
      {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
    </Button>
  );
};
