import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

// Admin Layout & Pages
import AdminLayout from './components/layout/AdminLayout';
import DashboardPage from './features/DashboardPage';
import OrdersPage from './features/OrdersPage';
import BudgetsPage from './features/BudgetsPage';
import CreateBudgetPage from './features/CreateBudgetPage';
import ProductsPage from './features/ProductsPage';
import ClientsPage from './features/ClientsPage';
import InventoryPage from './features/InventoryPage';
import OrderPrintPage from './features/orders/OrderPrintPage';
import SettingsPage from './features/SettingsPage';
import CashflowPage from './features/CashflowPage';

// Auth Pages
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import AuthCallback from './features/auth/AuthCallback';

// Public Pages (Vitrine)
import StorefrontLayout from './components/storefront/StorefrontLayout';
import LandingPage from './features/storefront/LandingPage';
import CatalogPage from './features/storefront/CatalogPage';
import ProductPage from './features/storefront/ProductPage';
import CartPage from './features/storefront/CartPage';
import CakeBuilderPage from './features/storefront/CakeBuilderPage';
import CustomerProfilePage from './features/storefront/CustomerProfilePage';
import CustomerOrdersPage from './features/storefront/CustomerOrdersPage';
import PublicProposalPage from './features/PublicProposalPage';

// Providers
import { useAuth } from './providers/AuthProvider';
import { CartProvider } from './providers/CartProvider';

/**
 * Rota protegida para área administrativa.
 * Requer autenticação e role de admin/employee.
 */
const AdminRoute = ({ children, layout = true }: { children: React.ReactNode; layout?: boolean }) => {
  const { session, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Verificar se é admin ou funcionário
  const isStaff = profile?.role === 'admin' || profile?.role === 'employee';
  if (!isStaff) {
    return <Navigate to="/" replace />;
  }

  if (!layout) {
    return <>{children}</>;
  }

  return <AdminLayout>{children}</AdminLayout>;
};

const App: React.FC = () => {
  return (
    <CartProvider>
      <Router>
        <Routes>
          {/* ========== VITRINE (Rotas Públicas) ========== */}
          <Route path="/" element={<StorefrontLayout><LandingPage /></StorefrontLayout>} />
          <Route path="/public/proposal/:id" element={<PublicProposalPage />} />

          {/* ========== AUTENTICAÇÃO ========== */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* ========== ROTAS DE CLIENTE (Públicas e Protegidas) ========== */}
          <Route path="/catalogo" element={<StorefrontLayout><CatalogPage /></StorefrontLayout>} />
          <Route path="/produto/:id" element={<StorefrontLayout><ProductPage /></StorefrontLayout>} />
          <Route path="/carrinho" element={<StorefrontLayout><CartPage /></StorefrontLayout>} />
          <Route path="/faca-seu-bolo" element={<StorefrontLayout><CakeBuilderPage /></StorefrontLayout>} />
          <Route path="/meus-pedidos" element={<StorefrontLayout><CustomerOrdersPage /></StorefrontLayout>} />
          <Route path="/perfil" element={<StorefrontLayout><CustomerProfilePage /></StorefrontLayout>} />

          {/* ========== ADMIN (Rotas Protegidas) ========== */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminRoute><DashboardPage /></AdminRoute>} />
          <Route path="/admin/budgets" element={<AdminRoute><BudgetsPage /></AdminRoute>} />
          <Route path="/admin/budgets/new" element={<AdminRoute><CreateBudgetPage /></AdminRoute>} />
          <Route path="/admin/budgets/:id" element={<AdminRoute><CreateBudgetPage /></AdminRoute>} />
          <Route path="/admin/orders" element={<AdminRoute><OrdersPage /></AdminRoute>} />
          <Route path="/admin/products" element={<AdminRoute><ProductsPage /></AdminRoute>} />
          <Route path="/admin/inventory" element={<AdminRoute><InventoryPage /></AdminRoute>} />
          <Route path="/admin/customers" element={<AdminRoute><ClientsPage /></AdminRoute>} />
          <Route path="/admin/cashflow" element={<AdminRoute><CashflowPage /></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
          <Route path="/admin/print/order/:id" element={<AdminRoute layout={false}><OrderPrintPage /></AdminRoute>} />

          {/* Fallback - Rotas antigas redirecionam para /admin/* */}
          <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/budgets/*" element={<Navigate to="/admin/budgets" replace />} />
          <Route path="/orders" element={<Navigate to="/admin/orders" replace />} />
          <Route path="/products" element={<Navigate to="/admin/products" replace />} />
          <Route path="/inventory" element={<Navigate to="/admin/inventory" replace />} />
          <Route path="/customers" element={<Navigate to="/admin/customers" replace />} />
          <Route path="/cashflow" element={<Navigate to="/admin/cashflow" replace />} />
          <Route path="/settings" element={<Navigate to="/admin/settings" replace />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </Router>
    </CartProvider>
  );
};

export default App;
