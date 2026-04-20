import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import FinanceDashboard from './components/FinanceDashboard';
import SettingsView from './components/SettingsView';
import ProductsView from './components/ProductsView';
import UsersView from './components/UsersView';
import DashboardView from './components/DashboardView';
import ClientsView from './components/ClientsView';
import LoginView from './components/LoginView';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Cargando...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginView />} />
          
          <Route path="/" element={<ProtectedRoute><DashboardView /></ProtectedRoute>} />
          <Route path="/finanzas" element={<ProtectedRoute><FinanceDashboard /></ProtectedRoute>} />
          <Route path="/productos" element={<ProtectedRoute><ProductsView /></ProtectedRoute>} />
          <Route path="/usuarios" element={<ProtectedRoute><UsersView /></ProtectedRoute>} />
          <Route path="/clientes" element={<ProtectedRoute><ClientsView /></ProtectedRoute>} />
          <Route path="/ajustes" element={<ProtectedRoute><SettingsView /></ProtectedRoute>} />
          
          {/* Redirección automática */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
