import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  enableSystem?: boolean;
  attribute?: 'class' | 'data-theme';
  transitionDuration?: number;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'dark' | 'light';
  systemTheme: 'dark' | 'light';
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
  resolvedTheme: 'light',
  systemTheme: 'light',
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({ 
  children, 
  defaultTheme = 'system', 
  storageKey = 'vite-ui-theme',
  enableSystem = true,
  attribute = 'class',
  transitionDuration = 300,
  ...props 
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );
  
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>(() => {
    const stored = localStorage.getItem(storageKey) as Theme;
    const currentTheme = stored || defaultTheme;
    
    if (currentTheme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return currentTheme;
  });

  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = (themeToApply: Theme, skipTransition = false) => {
      // Add transition class for smooth theme switching
      if (!skipTransition) {
        root.classList.add('theme-transition');
      }

      root.classList.remove('light', 'dark');

      let actualTheme: 'dark' | 'light';
      
      if (themeToApply === 'system') {
        actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        actualTheme = themeToApply;
      }

      if (attribute === 'class') {
        root.classList.add(actualTheme);
      } else {
        root.setAttribute('data-theme', actualTheme);
      }

      setResolvedTheme(actualTheme);

      // Remove transition class after animation completes
      if (!skipTransition) {
        setTimeout(() => {
          root.classList.remove('theme-transition');
        }, transitionDuration);
      }
    };

    // Apply theme on mount (skip transition on initial load)
    applyTheme(theme, true);

    // Listen for system theme changes
    if (enableSystem) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleSystemThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
        const newSystemTheme = e.matches ? 'dark' : 'light';
        setSystemTheme(newSystemTheme);
        
        // Only update if user has selected 'system' theme
        if (theme === 'system') {
          applyTheme('system');
        }
      };

      // Initial system theme detection
      handleSystemThemeChange(mediaQuery);

      // Listen for changes
      mediaQuery.addEventListener('change', handleSystemThemeChange);

      return () => {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      };
    }
  }, [theme, enableSystem, attribute, transitionDuration]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      localStorage.setItem(storageKey, newTheme);
      setTheme(newTheme);
    },
    resolvedTheme,
    systemTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
