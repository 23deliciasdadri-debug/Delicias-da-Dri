import React from 'react';
import { Button } from '../ui/button';
import { Cake, LogOut } from 'lucide-react';
import type { Page } from './navigation';
import { PRIMARY_NAV_ITEMS } from './navigation';
import { cn } from '../../lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  handleLogout: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  setCurrentPage,
  isSidebarOpen,
  setIsSidebarOpen,
  handleLogout,
  isCollapsed,
  onToggleCollapse,
}) => {
  const isDesktopCollapsed = isCollapsed && !isSidebarOpen;
  const collapsedWidth = '4.5rem';
  const expandedWidth = '18rem';
  const width = isSidebarOpen ? expandedWidth : isDesktopCollapsed ? collapsedWidth : expandedWidth;

  const handleNavigation = (page: Page) => {
    setCurrentPage(page);
    setIsSidebarOpen(false);
  };

  const sidebarLabel = 'Delícias da Dri';
  const collapsed = isDesktopCollapsed;

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={`fixed inset-y-0 left-0 z-50 border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl transition-[width,transform] duration-300 lg:shadow-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        aria-label="Menu lateral"
        data-collapsed={isDesktopCollapsed}
        style={{ width, minWidth: width }}
      >
        <div className="grid h-full grid-rows-[auto,1fr,auto] overflow-hidden">
          <div
            className={cn(
              'flex items-center justify-between gap-2 border-b border-sidebar-border/60 px-4 py-5',
              collapsed && 'px-3',
            )}
          >
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expandir menu lateral' : 'Colapsar menu lateral'}
              aria-pressed={isCollapsed}
              className={cn(
                'flex items-center gap-3 rounded-xl border border-transparent px-2 py-2 text-left transition-colors hover:border-sidebar-border/60 hover:bg-sidebar-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                collapsed && 'justify-center px-0',
              )}
            >
              <div className="gradient-primary flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg shadow-primary/20">
                <Cake className="h-7 w-7 text-primary-foreground" aria-hidden />
              </div>
              {!collapsed ? (
                <div className="transition-opacity duration-200">
                  <h2 className="text-xl font-serif font-bold text-foreground">{sidebarLabel}</h2>
                  <p className="text-sm font-medium text-muted-foreground">Admin Panel</p>
                </div>
              ) : null}
            </button>
          </div>

          <nav
            className={cn(
              'overflow-y-auto px-3 py-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40',
              collapsed && 'flex flex-col items-center gap-3 px-2',
            )}
            aria-label="Navegação principal"
            data-collapsed={isCollapsed}
          >
            <div className={cn(collapsed ? 'flex flex-col items-center gap-3' : 'space-y-2')}>
              {PRIMARY_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive =
                  currentPage === item.page ||
                  (item.page === 'budgets' && currentPage === 'create-budget');

                const ButtonContent = (
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'group block h-12 rounded-xl text-base font-medium transition-colors flex items-center gap-3',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                        : 'hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground',
                      collapsed ? 'w-12 justify-center p-0' : 'w-full justify-start px-3',
                    )}
                    onClick={() => handleNavigation(item.page)}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={item.label}
                  >
                    <div className="flex w-12 items-center justify-center shrink-0">
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    {!collapsed ? item.label : null}
                  </Button>
                );

                if (collapsed) {
                  return (
                    <React.Fragment key={item.page}>
                      <Tooltip>
                        <TooltipTrigger asChild>{ButtonContent}</TooltipTrigger>
                        <TooltipContent side="right" className="flex items-center gap-4">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    </React.Fragment>
                  );
                }

                return <React.Fragment key={item.page}>{ButtonContent}</React.Fragment>;
              })}
            </div>
          </nav>

          <div className="border-t border-sidebar-border/60 bg-card/90 p-4 backdrop-blur-sm dark:bg-card/60">
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      'h-12 text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground flex items-center gap-3',
                      collapsed ? 'w-12 justify-center p-0' : 'w-full justify-start px-3',
                    )}
                    onClick={handleLogout}
                  >
                    <div className="flex w-12 items-center justify-center shrink-0">
                      <LogOut className="h-5 w-5" aria-hidden />
                    </div>
                    <span className="sr-only">Sair</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Sair</TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant="ghost"
                className={cn(
                  'h-12 text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground flex items-center gap-3',
                  collapsed ? 'w-12 justify-center p-0' : 'w-full justify-start px-3',
                )}
                onClick={handleLogout}
              >
                <div className="flex w-12 items-center justify-center shrink-0">
                  <LogOut className="h-5 w-5" aria-hidden />
                </div>
                Sair
              </Button>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
};

export type { Page } from './navigation';

export default Sidebar;
