import { Moon, Sun, Laptop } from 'lucide-react';
import { useTheme } from './ThemeProvider';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto">
        <div className="flex items-center space-x-1 p-1">
          <Button
            variant={theme === 'light' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTheme('light')}
            className="flex items-center gap-2 text-xs"
          >
            <Sun className="h-4 w-4" />
            <span>Light</span>
          </Button>
          <Button
            variant={theme === 'system' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTheme('system')}
            className="flex items-center gap-2 text-xs"
          >
            <Laptop className="h-4 w-4" />
            <span>System</span>
          </Button>
          <Button
            variant={theme === 'dark' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTheme('dark')}
            className="flex items-center gap-2 text-xs"
          >
            <Moon className="h-4 w-4" />
            <span>Dark</span>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
