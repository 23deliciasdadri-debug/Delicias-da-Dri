import React from 'react';
import Sidebar, { Page } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNavBar } from './MobileNavBar';
import { PAGE_META } from './navigation';
import { useAuth } from '../../providers/AuthProvider';

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
  const { profile } = useAuth();
  const pageTitle = PAGE_META[currentPage]?.label ?? 'Painel';

  const navigateToPage = React.useCallback(
    (page: Page) => {
      setCurrentPage(page);
      setIsSidebarOpen(false);
    },
    [setCurrentPage, setIsSidebarOpen],
  );

  const closeSidebar = () => setIsSidebarOpen(false);
  const openSidebar = () => setIsSidebarOpen(true);

  const userName = profile?.full_name || profile?.email || 'Usuário';
  const userRole = profile?.role;
  const avatarUrl = profile?.avatar_url;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-rose-50/30">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={navigateToPage}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        handleLogout={handleLogout}
      />
      {isSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={closeSidebar}
          aria-label="Fechar menu lateral"
        />
      )}
      <div className="flex flex-1 flex-col">
        <TopBar
          title={pageTitle}
          onOpenSidebar={openSidebar}
          userName={userName}
          userRole={userRole}
          avatarUrl={avatarUrl}
        />
        <main className="flex-1 overflow-y-auto px-4 pb-28 pt-4 lg:px-10 lg:pb-10 lg:pt-6">
          {children}
        </main>
        <MobileNavBar currentPage={currentPage} onNavigate={navigateToPage} />
      </div>
    </div>
  );
};

export default AppLayout;
