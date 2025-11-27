import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import AdminLayout from './components/layout/AdminLayout';
import LoginPage from './features/LoginPage';
import DashboardPage from './features/DashboardPage';
import OrdersPage from './features/OrdersPage';
import BudgetsPage from './features/BudgetsPage';
import CreateBudgetPage from './features/CreateBudgetPage';
import ProductsPage from './features/ProductsPage';
import ClientsPage from './features/ClientsPage';
import InventoryPage from './features/InventoryPage';
import PublicProposalPage from './features/PublicProposalPage';
import { useAuth } from './providers/AuthProvider';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  return <AdminLayout>{children}</AdminLayout>;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/public/proposal/:id" element={<PublicProposalPage />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/budgets" element={<ProtectedRoute><BudgetsPage /></ProtectedRoute>} />
        <Route path="/budgets/new" element={<ProtectedRoute><CreateBudgetPage /></ProtectedRoute>} />
        <Route path="/budgets/:id" element={<ProtectedRoute><CreateBudgetPage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><ClientsPage /></ProtectedRoute>} />

        {/* Redirect root to dashboard if authenticated, or login if not (handled by ProtectedRoute logic mostly, but explicit redirect helps) */}
        {/* Actually, since root is login, we might want a redirect if already logged in. 
            For now, let's keep it simple. If user goes to /, they see login. 
            Ideally LoginPage should redirect if already logged in. */}
      </Routes>
      <Toaster position="top-right" richColors />
    </Router>
  );
};

export default App;
