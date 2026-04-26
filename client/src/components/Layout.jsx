import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Receipt, Settings, LogOut, Package, Menu, X, Users, UserSquare2, BarChart3 } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { useAuth } from '../context/AuthContext';

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${active
      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
      : 'hover:bg-slate-800 text-slate-400 hover:text-slate-100'
      }`}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const Layout = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Mapeo de rutas a pestañas para resaltado y títulos
  const pathMatch = {
    '/': 'dashboard',
    '/finanzas': 'finance',
    '/productos': 'products',
    '/usuarios': 'users',
    '/clientes': 'clients',
    '/ajustes': 'settings'
  };

  const activeTab = pathMatch[location.pathname] || 'dashboard';

  const handleTabChange = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100 font-sans relative">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-950/95 lg:bg-slate-950/50 backdrop-blur-xl border-r border-slate-800 p-6 flex flex-col z-50 transition-transform duration-300 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between mb-10 px-2 lg:justify-start">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl">T</div>
            <h1 className="text-xl font-bold tracking-tight">The Lux Foster</h1>
          </div>
          <button 
            className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-8 overflow-y-auto custom-scrollbar pr-2">
          {/* SECCIÓN PRINCIPAL */}
          <div>
            <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Principal</p>
            <div className="space-y-1">
              <SidebarItem
                icon={LayoutDashboard}
                label="Resumen"
                active={activeTab === 'dashboard'}
                onClick={() => handleTabChange('/')}
              />
            </div>
          </div>

          {/* SECCIÓN FINANZAS */}
          <div>
            <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Operaciones</p>
            <div className="space-y-1">
              <SidebarItem
                icon={Receipt}
                label="Movimientos"
                active={activeTab === 'finance'}
                onClick={() => handleTabChange('/finanzas')}
              />
            </div>
          </div>

          {/* SECCIÓN GESTIÓN */}
          <div>
            <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Administración</p>
            <div className="space-y-1">
              <SidebarItem
                icon={Package}
                label="Productos"
                active={activeTab === 'products'}
                onClick={() => handleTabChange('/productos')}
              />
              <SidebarItem
                icon={UserSquare2}
                label="Clientes"
                active={activeTab === 'clients'}
                onClick={() => handleTabChange('/clientes')}
              />
            </div>
          </div>

          {/* SECCIÓN SISTEMA */}
          <div>
            <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Sistema</p>
            <div className="space-y-1">
              <SidebarItem
                icon={Users}
                label="Usuarios"
                active={activeTab === 'users'}
                onClick={() => handleTabChange('/usuarios')}
              />
              <SidebarItem
                icon={Settings}
                label="Configuración"
                active={activeTab === 'settings'}
                onClick={() => handleTabChange('/ajustes')}
              />
            </div>
          </div>
        </nav>

        <div className="pt-6 border-t border-slate-800 space-y-2 mt-auto">
          <button 
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Salir</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 lg:ml-64 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 transition-all duration-300">
        {/* Mobile Header Topbar */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-base">T</div>
            <h1 className="text-lg font-bold tracking-tight">The Lux Foster</h1>
          </div>
          <button 
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
        </div>

        <div className="flex-1 p-4 md:p-8">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-10 gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-1 capitalize">
                {activeTab === 'dashboard' ? 'Resumen General' :
                  activeTab === 'finance' ? 'Gestión de Finanzas' :
                    activeTab === 'products' ? 'Gestión de Productos' : 
                      activeTab === 'users' ? 'Gestión de Usuarios' : 
                        activeTab === 'clients' ? 'Gestión de Clientes' : 'Configuración del Sistema'}
              </h2>
              <p className="text-slate-400 text-sm md:text-base">Bienvenido de nuevo al panel de control profesional.</p>
            </div>
            <div className="flex items-center space-x-4 self-end md:self-auto hidden sm:flex">
              <NotificationBell onNavToProducts={() => handleTabChange('/productos')} />
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.nombre || 'Usuario'}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.rol || 'Staff'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 font-bold shadow-inner uppercase">
                {user?.nombre ? user.nombre.charAt(0) : 'U'}
              </div>
            </div>
          </header>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
