import type { Config } from 'tailwindcss';

const withOpacityValue =
  (variable: string) =>
  ({ opacityValue }: { opacityValue?: string }) => {
    if (opacityValue !== undefined) {
      const numericValue = Number(opacityValue);
      if (!Number.isNaN(numericValue)) {
        const percentage = Math.max(0, Math.min(1, numericValue)) * 100;
        return `color-mix(in oklch, var(${variable}) ${percentage}%, transparent)`;
      }
    }
    return `var(${variable})`;
  };

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: withOpacityValue('--border'),
        input: withOpacityValue('--input'),
        ring: withOpacityValue('--ring'),
        background: withOpacityValue('--background'),
        foreground: withOpacityValue('--foreground'),
        primary: withOpacityValue('--primary'),
        'primary-foreground': withOpacityValue('--primary-foreground'),
        secondary: withOpacityValue('--secondary'),
        'secondary-foreground': withOpacityValue('--secondary-foreground'),
        muted: withOpacityValue('--muted'),
        'muted-foreground': withOpacityValue('--muted-foreground'),
        accent: withOpacityValue('--accent'),
        'accent-foreground': withOpacityValue('--accent-foreground'),
        destructive: withOpacityValue('--destructive'),
        'destructive-foreground': withOpacityValue('--destructive-foreground'),
        card: withOpacityValue('--card'),
        'card-foreground': withOpacityValue('--card-foreground'),
        popover: withOpacityValue('--popover'),
        'popover-foreground': withOpacityValue('--popover-foreground'),
        sidebar: withOpacityValue('--sidebar'),
        'sidebar-foreground': withOpacityValue('--sidebar-foreground'),
        'sidebar-primary': withOpacityValue('--sidebar-primary'),
        'sidebar-primary-foreground': withOpacityValue('--sidebar-primary-foreground'),
        'sidebar-accent': withOpacityValue('--sidebar-accent'),
        'sidebar-accent-foreground': withOpacityValue('--sidebar-accent-foreground'),
        'sidebar-border': withOpacityValue('--sidebar-border'),
        'sidebar-ring': withOpacityValue('--sidebar-ring'),
        success: withOpacityValue('--success'),
        warning: withOpacityValue('--warning'),
        info: withOpacityValue('--info'),
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 6px)',
      },
      boxShadow: {
        xs: '0 1px 2px 0 color-mix(in oklch, var(--foreground) 8%, transparent)',
      },
    },
  },
  plugins: [],
};

export default config;
