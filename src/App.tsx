import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Financeiro from './pages/Financeiro';
import Ajustes from './pages/Ajustes';
import BankTransactions from './pages/BankTransactions';
import Users from './pages/Users';
import PendingApprovals from './pages/PendingApprovals';
import MyPermissions from './pages/MyPermissions';
import AdminRoute from './components/AdminRoute';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Banks from './pages/Banks';
import Categories from './pages/Categories';
import PaymentMethods from './pages/PaymentMethods';
import OfxImport from './pages/OfxImport';
import OfxReview from './pages/OfxReview';
import RecurringPayments from './pages/RecurringPayments';
import AjustesUnidades from './pages/AjustesUnidades';
import FinanceiroRelatorios from './pages/FinanceiroRelatorios';

import Tags from './pages/Tags';

// Componente para rotas protegidas
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Rotas públicas */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/financeiro" replace /> : <Login />} 
      />
      <Route 
        path="/register" 
        element={isAuthenticated ? <Navigate to="/financeiro" replace /> : <Register />} 
      />

      {/* Rotas protegidas */}
      <Route
        path="/ajustes"
        element={
          <ProtectedRoute>
            <Ajustes />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/ajustes/unidades" replace />} />
        <Route path="unidades" element={<AjustesUnidades />} />
      </Route>

      <Route
        path="/financeiro"
        element={
          <ProtectedRoute>
            <Financeiro />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/financeiro/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="banks" element={<Banks />} />
        <Route path="ofx-import" element={<OfxImport />} />
        <Route path="categories" element={<Categories />} />
        <Route path="tags" element={<Tags />} />
        <Route path="payment-methods" element={<PaymentMethods />} />
        <Route path="recurring-payments" element={<RecurringPayments />} />
        <Route path="relatorios" element={<FinanceiroRelatorios />} />
      </Route>



      <Route
        path="/ofx-review/:importId"
        element={
          <ProtectedRoute>
            <OfxReview />
          </ProtectedRoute>
        }
      />

      <Route
        path="/financeiro/banks/:bankId/transactions"
        element={
          <ProtectedRoute>
            <BankTransactions />
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <Users />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/pending-approvals"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <PendingApprovals />
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-permissions"
        element={
          <ProtectedRoute>
            <MyPermissions />
          </ProtectedRoute>
        }
      />

      {/* Redirecionamento padrão */}
      <Route 
        path="/" 
        element={<Navigate to="/financeiro" replace />} 
      />
      <Route 
        path="*" 
        element={<Navigate to="/financeiro" replace />} 
      />
    </Routes>
  );
};

export default App; 