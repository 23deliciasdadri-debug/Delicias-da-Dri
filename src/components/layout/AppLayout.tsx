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

const SIDEBAR_COLLAPSE_KEY = 'delicias-da-dri.sidebar-collapsed';

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === '1';
  });
  const sidebarWidth = isSidebarCollapsed ? '4.5rem' : '18rem';
  const sidebarStyle = { '--sidebar-width': sidebarWidth } as React.CSSProperties;
  const scrollLockRef = React.useRef<{ body: string; html: string } | null>(null);

  const navigateToPage = React.useCallback(
    (page: Page) => {
      setCurrentPage(page);
      setIsSidebarOpen(false);
    },
    [setCurrentPage, setIsSidebarOpen],
  );

  const closeSidebar = () => setIsSidebarOpen(false);
  const openSidebar = () => setIsSidebarOpen(true);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SIDEBAR_COLLAPSE_KEY, isSidebarCollapsed ? '1' : '0');
  }, [isSidebarCollapsed]);

  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    const body = document.body;

    if (isSidebarOpen) {
      scrollLockRef.current = {
        body: body.style.overflow,
        html: html.style.overflow,
      };
      html.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
      return () => {
        if (scrollLockRef.current) {
          html.style.overflow = scrollLockRef.current.html;
          body.style.overflow = scrollLockRef.current.body;
          scrollLockRef.current = null;
        }
      };
    }

    if (scrollLockRef.current) {
      html.style.overflow = scrollLockRef.current.html;
      body.style.overflow = scrollLockRef.current.body;
      scrollLockRef.current = null;
    }

    return undefined;
  }, [isSidebarOpen]);

  const userName = profile?.full_name || profile?.email || 'Usuário';
  const userRole = profile?.role;
  const avatarUrl = profile?.avatar_url;

  return (
    <div
      className="flex min-h-screen min-w-0 overflow-x-hidden bg-gradient-to-br from-background via-background/95 to-muted/40 text-foreground transition-colors dark:from-background dark:via-slate-950 dark:to-slate-900"
      style={sidebarStyle}
    >
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={navigateToPage}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        handleLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />
      {isSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={closeSidebar}
          aria-label="Fechar menu lateral"
        />
      )}
      <div className="flex flex-1 min-h-0 min-w-0 flex-col overflow-x-hidden transition-[margin-left] duration-300 lg:ml-[var(--sidebar-width)]">
        <TopBar
          title={pageTitle}
          onOpenSidebar={openSidebar}
          userName={userName}
          userRole={userRole}
          avatarUrl={avatarUrl}
        />
        <main className="flex flex-1 min-h-0 min-w-0 flex-col overflow-y-auto overflow-x-hidden px-4 pb-28 pt-4 lg:px-10 lg:pb-10 lg:pt-6">
          {children}
        </main>
        <MobileNavBar currentPage={currentPage} onNavigate={navigateToPage} />
      </div>
    </div>
  );
};

export default AppLayout;
