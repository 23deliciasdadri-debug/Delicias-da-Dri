import React from 'react';
import { Moon, SunMedium } from 'lucide-react';
import { Button } from '../ui/button';
import { useTheme } from '../../providers/ThemeProvider';
import { cn } from '../../lib/utils';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={`Alternar para modo ${theme === 'light' ? 'escuro' : 'claro'}`}
      aria-pressed={theme === 'dark'}
      onClick={toggleTheme}
      className={cn(
        'relative h-10 w-10 rounded-full border border-border/70 bg-card/80 text-foreground shadow-xs transition-colors hover:bg-card data-[state=dark]:border-primary data-[state=dark]:text-primary-foreground',
        className,
      )}
      data-state={theme}
    >
      <SunMedium className="size-5 rotate-0 scale-100 transition-all duration-200 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute size-5 rotate-90 scale-0 transition-all duration-200 dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Alternar tema</span>
    </Button>
  );
};
