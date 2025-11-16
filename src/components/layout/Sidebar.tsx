import React from 'react';
import { Button } from '../ui/button';
import { Cake, LogOut } from 'lucide-react';
import type { Page } from './navigation';
import { PRIMARY_NAV_ITEMS } from './navigation';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  handleLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  setCurrentPage,
  isSidebarOpen,
  setIsSidebarOpen,
  handleLogout,
}) => {
  const handleNavigation = (page: Page) => {
    setCurrentPage(page);
    setIsSidebarOpen(false);
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-border bg-gradient-to-b from-white to-rose-50/30 shadow-xl transition-transform duration-300 lg:static lg:shadow-none ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
      aria-label="Menu lateral"
    >
      <div className="border-border/50 border-b p-6">
        <div className="flex items-center gap-4">
          <div className="gradient-primary flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg shadow-rose-500/30">
            <Cake className="h-7 w-7 text-white" aria-hidden />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-foreground">Delícias da Dri</h2>
            <p className="text-sm font-medium text-muted-foreground">Admin Panel</p>
          </div>
        </div>
      </div>
      <nav className="space-y-2 p-4" aria-label="Navegação principal">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentPage === item.page ||
            (item.page === 'budgets' && currentPage === 'create-budget');
          return (
            <Button
              key={item.page}
              variant={isActive ? 'secondary' : 'ghost'}
              className={`h-12 w-full justify-start text-base font-medium ${
                isActive
                  ? 'bg-gradient-to-r from-rose-100 to-orange-100 text-rose-700 shadow-sm'
                  : 'hover:bg-rose-50'
              }`}
              onClick={() => handleNavigation(item.page)}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="mr-3 h-5 w-5" aria-hidden />
              {item.label}
            </Button>
          );
        })}
      </nav>
      <div className="absolute bottom-0 left-0 right-0 border-t border-border/50 bg-white/70 p-4 backdrop-blur-sm">
        <Button
          variant="ghost"
          className="h-12 w-full justify-start text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5" aria-hidden />
          Sair
        </Button>
      </div>
    </aside>
  );
};

export type { Page } from './navigation';

export default Sidebar;
