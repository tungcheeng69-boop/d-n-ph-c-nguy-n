'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="rounded-2xl border-border hover:bg-accent hover:text-accent-foreground transition-all duration-300 w-10 h-10 flex items-center justify-center cursor-pointer"
    >
      {theme === 'dark' ? (
        <Sun className="h-[1.2rem] w-[1.2rem] text-yellow-400 rotate-0 scale-100 transition-all duration-300" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem] text-slate-700 rotate-0 scale-100 transition-all duration-300" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
