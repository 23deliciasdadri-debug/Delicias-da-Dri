import React from 'react';
import { Button } from '../ui/button';
import { LayoutDashboard, ClipboardList, FileText, Package, LogOut, Cake, Users2 } from 'lucide-react';

export type Page = 'login' | 'dashboard' | 'orders' | 'budgets' | 'create-budget' | 'products' | 'clients';

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
      className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-white to-rose-50/30 border-r border-border shadow-xl lg:shadow-none transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
    >
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/30">
            <Cake className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-xl text-foreground">Delícias da Dri</h2>
            <p className="text-sm text-muted-foreground font-medium">Admin Panel</p>
          </div>
        </div>
      </div>
      <nav className="p-4 space-y-2">
        <Button
          variant={currentPage === 'dashboard' ? 'secondary' : 'ghost'}
          className={`w-full justify-start h-12 text-base font-medium ${currentPage === 'dashboard' ? 'bg-gradient-to-r from-rose-100 to-orange-100 text-rose-700 shadow-sm' : 'hover:bg-rose-50'}`}
          onClick={() => handleNavigation('dashboard')}
        >
          <LayoutDashboard className="w-5 h-5 mr-3" />
          Dashboard
        </Button>
        <Button
          variant={currentPage === 'orders' ? 'secondary' : 'ghost'}
          className={`w-full justify-start h-12 text-base font-medium ${currentPage === 'orders' ? 'bg-gradient-to-r from-rose-100 to-orange-100 text-rose-700 shadow-sm' : 'hover:bg-rose-50'}`}
          onClick={() => handleNavigation('orders')}
        >
          <ClipboardList className="w-5 h-5 mr-3" />
          Pedidos
        </Button>
        <Button
          variant={
            currentPage === 'budgets' || currentPage === 'create-budget' ? 'secondary' : 'ghost'
          }
          className={`w-full justify-start h-12 text-base font-medium ${currentPage === 'budgets' || currentPage === 'create-budget' ? 'bg-gradient-to-r from-rose-100 to-orange-100 text-rose-700 shadow-sm' : 'hover:bg-rose-50'}`}
          onClick={() => handleNavigation('budgets')}
        >
          <FileText className="w-5 h-5 mr-3" />
          Orçamentos
        </Button>
        <Button
          variant={currentPage === 'products' ? 'secondary' : 'ghost'}
          className={`w-full justify-start h-12 text-base font-medium ${currentPage === 'products' ? 'bg-gradient-to-r from-rose-100 to-orange-100 text-rose-700 shadow-sm' : 'hover:bg-rose-50'}`}
          onClick={() => handleNavigation('products')}
        >
          <Package className="w-5 h-5 mr-3" />
          Produtos
        </Button>
        <Button
          variant={currentPage === 'clients' ? 'secondary' : 'ghost'}
          className={`w-full justify-start h-12 text-base font-medium ${currentPage === 'clients' ? 'bg-gradient-to-r from-rose-100 to-orange-100 text-rose-700 shadow-sm' : 'hover:bg-rose-50'}`}
          onClick={() => handleNavigation('clients')}
        >
          <Users2 className="w-5 h-5 mr-3" />
          Clientes
        </Button>
      </nav>
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50 bg-white/50 backdrop-blur-sm">
        <Button
          variant="ghost"
          className="w-full justify-start h-12 text-muted-foreground hover:text-rose-600 hover:bg-rose-50"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sair
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
