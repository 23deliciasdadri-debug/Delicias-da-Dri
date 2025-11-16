import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'delicias-da-dri.theme';
const LIGHT_ICON = '/favicon.svg';
const DARK_ICON = '/favicon-dark.svg';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const resolveInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'light';
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
};

const syncFavicon = (theme: ThemeMode) => {
  if (typeof document === 'undefined') {
    return;
  }
  const favicon = document.querySelector<HTMLLinkElement>('link#app-favicon');
  if (!favicon) {
    return;
  }
  const lightHref = favicon.dataset.lightIcon ?? LIGHT_ICON;
  const darkHref = favicon.dataset.darkIcon ?? DARK_ICON;
  favicon.href = theme === 'dark' ? darkHref : lightHref;
};

const syncThemeColorMeta = (theme: ThemeMode) => {
  if (typeof document === 'undefined') {
    return;
  }
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    return;
  }
  meta.setAttribute('content', theme === 'dark' ? '#0f172a' : '#fff7f5');
};

const applyDocumentTheme = (theme: ThemeMode) => {
  if (typeof document === 'undefined') {
    return;
  }
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  root.style.colorScheme = theme;
  syncFavicon(theme);
  syncThemeColorMeta(theme);
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => resolveInitialTheme());
  const initialExplicitPreference =
    typeof window !== 'undefined'
      ? ['light', 'dark'].includes(window.localStorage.getItem(STORAGE_KEY) ?? '')
      : false;
  const hasExplicitPreference = useRef<boolean>(initialExplicitPreference);

  useEffect(() => {
    applyDocumentTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (event: MediaQueryListEvent) => {
      if (hasExplicitPreference.current) {
        return;
      }
      setThemeState(event.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const persistTheme = useCallback((next: ThemeMode) => {
    hasExplicitPreference.current = true;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      hasExplicitPreference.current = true;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, next);
      }
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: persistTheme,
      toggleTheme,
    }),
    [theme, persistTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
