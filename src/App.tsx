import React, { useState } from 'react';
import { Page } from './components/layout/Sidebar';
import LoginPage from './features/LoginPage';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './features/DashboardPage';
import OrdersPage from './features/OrdersPage';
import BudgetsPage from './features/BudgetsPage';
import CreateBudgetPage from './features/CreateBudgetPage';
import ProductsPage from './features/ProductsPage';
import ClientsPage from './features/ClientsPage';
import { useAuth } from './providers/AuthProvider';

const App: React.FC = () => {
  const { session, isLoading, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    void signOut();
  };

  // Renders the component for the current active page.
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'orders':
        return <OrdersPage />;
      case 'budgets':
        return <BudgetsPage setCurrentPage={setCurrentPage} />;
      case 'create-budget':
        return <CreateBudgetPage setCurrentPage={setCurrentPage} />;
      case 'products':
        return <ProductsPage />;
      case 'clients':
        return <ClientsPage />;
      default:
        // Fallback to dashboard for any unknown page state.
        return <DashboardPage />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50">
        <div className="text-center space-y-2">
          <p className="text-xl font-semibold text-rose-600">Carregando...</p>
          <p className="text-sm text-muted-foreground">Conectando ao Supabase</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  // If authenticated, render the main application layout with the current page.
  return (
    <AppLayout
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      isSidebarOpen={isSidebarOpen}
      setIsSidebarOpen={setIsSidebarOpen}
      handleLogout={handleLogout}
    >
      {renderCurrentPage()}
    </AppLayout>
  );
};

export default App;
