import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';

interface MenuItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

interface MobileNavBarProps {
  items: MenuItem[];
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({ items }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 px-6 py-3 backdrop-blur lg:hidden"
      aria-label="Navegação principal mobile"
    >
      <ul className="flex justify-between items-center">
        {items.map((item) => {
          const active = isActive(item.path);
          return (
            <li key={item.path}>
              <Link
                to={item.path}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center justify-center rounded-xl p-2 transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                )}
                title={item.label}
              >
                <item.icon className="h-6 w-6" aria-hidden />
                <span className="sr-only">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
