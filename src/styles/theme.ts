/**
 * Catálogo de tokens globais disponíveis no CSS (src/styles/index.css).
 * Centralizar esses valores em TypeScript facilita o consumo çõerente
 * em componentes complexos e oferece autocompletar/segurança de tipos.
 */
export const theme = {
  colors: {
    background: 'var(--background)',
    foreground: 'var(--foreground)',
    card: 'var(--card)',
    cardForeground: 'var(--card-foreground)',
    popover: 'var(--popover)',
    popoverForeground: 'var(--popover-foreground)',
    primary: 'var(--primary)',
    primaryForeground: 'var(--primary-foreground)',
    secondary: 'var(--secondary)',
    secondaryForeground: 'var(--secondary-foreground)',
    muted: 'var(--muted)',
    mutedForeground: 'var(--muted-foreground)',
    accent: 'var(--accent)',
    accentForeground: 'var(--accent-foreground)',
    destructive: 'var(--destructive)',
    destructiveForeground: 'var(--destructive-foreground)',
    border: 'var(--border)',
    input: 'var(--input)',
    ring: 'var(--ring)',
  },
  charts: {
    chart1: 'var(--chart-1)',
    chart2: 'var(--chart-2)',
    chart3: 'var(--chart-3)',
    chart4: 'var(--chart-4)',
    chart5: 'var(--chart-5)',
  },
  sidebar: {
    background: 'var(--sidebar)',
    foreground: 'var(--sidebar-foreground)',
    primary: 'var(--sidebar-primary)',
    primaryForeground: 'var(--sidebar-primary-foreground)',
    accent: 'var(--sidebar-accent)',
    accentForeground: 'var(--sidebar-accent-foreground)',
    border: 'var(--sidebar-border)',
    ring: 'var(--sidebar-ring)',
  },
  radius: {
    base: 'var(--radius)',
  },
  gradients: {
    primary: 'linear-gradient(135deg, rgb(244 63 94) 0%, rgb(236 72 153) 50%, rgb(251 146 60) 100%)',
    primarySoft:
      'linear-gradient(135deg, rgba(244, 63, 94, 0.1) 0%, rgba(251, 146, 60, 0.1) 100%)',
    accent: 'linear-gradient(135deg, rgb(251 146 60) 0%, rgb(245 158 11) 100%)',
    success: 'linear-gradient(135deg, rgb(34 197 94) 0%, rgb(22 163 74) 100%)',
    info: 'linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)',
    warning: 'linear-gradient(135deg, rgb(245 158 11) 0%, rgb(234 88 12) 100%)',
  },
  shadows: {
    glowRose: '0 0 20px rgba(244, 63, 94, 0.3)',
    glowOrange: '0 0 20px rgba(251, 146, 60, 0.3)',
  },
} as const;

export type Theme = typeof theme;
export type ThemeColor = keyof typeof theme.colors;
