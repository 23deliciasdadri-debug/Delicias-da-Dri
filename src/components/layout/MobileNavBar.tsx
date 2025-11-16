import React from 'react';
import { PRIMARY_NAV_ITEMS } from './navigation';
import type { Page } from './navigation';
import { cn } from '../../lib/utils';

interface MobileNavBarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({ currentPage, onNavigate }) => (
  <nav
    className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-card/95 px-2 py-2 backdrop-blur transition-colors dark:bg-card/60 lg:hidden"
    aria-label="Navegação principal mobile"
  >
    <ul className="grid grid-cols-5 gap-1">
      {PRIMARY_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = currentPage === item.page;
        return (
          <li key={item.page}>
            <button
              type="button"
              onClick={() => onNavigate(item.page)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex w-full flex-col items-center rounded-xl px-2 py-2 text-xs font-medium',
                isActive
                  ? 'bg-gradient-to-r from-rose-100 to-orange-100 text-rose-700 shadow-sm'
                  : 'text-muted-foreground hover:bg-muted',
              )}
            >
              <Icon className="mb-1 h-4 w-4" aria-hidden />
              <span>{item.shortLabel}</span>
            </button>
          </li>
        );
      })}
    </ul>
  </nav>
);
