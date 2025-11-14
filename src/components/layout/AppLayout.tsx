import React from 'react';
import Sidebar, { Page } from './Sidebar';
import { Button } from '../ui/button';
import { Menu } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  handleLogout: () => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  currentPage,
  setCurrentPage,
  isSidebarOpen,
  setIsSidebarOpen,
  handleLogout,
}) => {
  const closeSidebar = () => setIsSidebarOpen(false);
  const handleOverlayKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      closeSidebar();
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-rose-50/30">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        handleLogout={handleLogout}
      />
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={closeSidebar}
          onKeyDown={handleOverlayKeyDown}
          role="button"
          tabIndex={0}
          aria-label="Fechar menu lateral"
        />
      )}
      <main className="flex-1 p-6 lg:p-10 overflow-auto">
        <Button
          variant="outline"
          size="sm"
          className="lg:hidden mb-6 border-2 hover:border-rose-500 hover:bg-rose-50 bg-transparent"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </Button>
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
