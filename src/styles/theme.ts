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
    primary: 'var(--gradient-primary)',
    primarySoft: 'var(--gradient-primary-soft)',
    accent: 'var(--gradient-accent)',
    success: 'var(--gradient-success)',
    info: 'var(--gradient-info)',
    warning: 'var(--gradient-warning)',
  },
  shadows: {
    glowRose: '0 0 20px rgba(244, 63, 94, 0.3)',
    glowOrange: '0 0 20px rgba(251, 146, 60, 0.3)',
  },
} as const;

export type Theme = typeof theme;
export type ThemeColor = keyof typeof theme.colors;
