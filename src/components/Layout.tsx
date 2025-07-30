import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  DollarSign,
  Menu, 
  X, 
  LogOut, 
  User,
  Users,
  Shield,
  LayoutDashboard,
  CreditCard,
  Building2,
  Upload,
  Tag,
  Wallet,
  Calendar,
  Settings,
  BarChart3,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const financeiroSubmenu = [
    { name: 'Dashboard', href: '/financeiro/dashboard', icon: LayoutDashboard },
    { name: 'Transações', href: '/financeiro/transactions', icon: CreditCard },
    { name: 'Pagamentos Recorrentes', href: '/financeiro/recurring-payments', icon: Calendar },
    { name: 'Bancos', href: '/financeiro/banks', icon: Building2 },
    { name: 'Importação OFX', href: '/financeiro/ofx-import', icon: Upload },

    { name: 'Categorias', href: '/financeiro/categories', icon: Tag },
    { name: 'Tags', href: '/financeiro/tags', icon: Tag },
    { name: 'Métodos de Pagamento', href: '/financeiro/payment-methods', icon: Wallet },
    { name: 'Relatórios', href: '/financeiro/relatorios', icon: BarChart3 },
  ];
  const ajustesSubmenu = [
    { name: 'Unidades', href: '/ajustes/unidades', icon: Building2 },
  ];
  const navigation = [
    { name: 'Financeiro', href: '/financeiro', icon: DollarSign, submenu: financeiroSubmenu },
    { name: 'Ajustes', href: '/ajustes', icon: Settings, submenu: ajustesSubmenu },
  ];

  // Adicionar links administrativos se o usuário for admin
  const adminNavigation = user?.isAdmin ? [
    { name: 'Usuários', href: '/users', icon: Users },
  ] : [];

  // Adicionar link de permissões para todos os usuários
  const userNavigation = [
    { name: 'Minhas Permissões', href: '/my-permissions', icon: Shield },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <span className="ml-2 text-lg font-semibold text-gray-900">ERP Vertkall</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>
          {/* Sidebar navigation */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              if (item.submenu) {
                return (
                  <div
                    key={item.name}
                    className="relative group"
                    onMouseEnter={() => setSubmenuOpen(item.name)}
                    onMouseLeave={() => setSubmenuOpen(null)}
                  >
                    {/* Botão para mobile */}
                    <button
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left lg:hidden ${
                        isActive('/financeiro') || isActive('/ajustes')
                          ? 'bg-primary-100 text-primary-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      onClick={() => setSubmenuOpen(submenuOpen === item.name ? null : item.name)}
                      aria-haspopup="true"
                      aria-expanded={submenuOpen === item.name}
                      type="button"
                    >
                      <item.icon className="mr-3 h-5 w-5 text-primary-500" />
                      {item.name}
                      <svg className="ml-auto h-4 w-4 text-gray-400 group-hover:text-gray-500" fill="none" viewBox="0 0 20 20"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    {/* Botão para desktop */}
                    <div
                      className={`hidden lg:flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left cursor-pointer ${
                        isActive('/financeiro') || isActive('/ajustes')
                          ? 'bg-primary-100 text-primary-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className="mr-3 h-5 w-5 text-primary-500" />
                      {item.name}
                      <svg className="ml-auto h-4 w-4 text-gray-400 group-hover:text-gray-500" fill="none" viewBox="0 0 20 20"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    {/* Submenu - mobile */}
                    <div
                      className={`lg:hidden absolute left-0 w-full z-20 bg-white border border-gray-200 rounded-md shadow-lg py-1 transition-all duration-150 ${submenuOpen === item.name ? 'block' : 'hidden'}`}
                      style={{ top: '100%' }}
                    >
                      {item.submenu.map((sub) => {
                        const SubIcon = sub.icon;
                        return (
                          <Link
                            key={sub.name}
                            to={sub.href}
                            className={`flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-900 ${isActive(sub.href) ? 'font-semibold text-primary-600' : ''}`}
                            onClick={() => {
                              setSidebarOpen(false);
                              setSubmenuOpen(null);
                            }}
                          >
                            <SubIcon className="mr-2 h-4 w-4 text-primary-500" />
                            {sub.name}
                          </Link>
                        );
                      })}
                    </div>
                    {/* Submenu - desktop */}
                    <div
                      className={`hidden lg:block absolute left-0 w-full z-20 bg-white border border-gray-200 rounded-md shadow-lg py-1 transition-all duration-150 ${submenuOpen === item.name ? 'block' : 'hidden'}`}
                      style={{ top: '100%' }}
                    >
                      {item.submenu.map((sub) => {
                        const SubIcon = sub.icon;
                        return (
                          <Link
                            key={sub.name}
                            to={sub.href}
                            className={`flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-900 ${isActive(sub.href) ? 'font-semibold text-primary-600' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                          >
                            <SubIcon className="mr-2 h-4 w-4 text-primary-500" />
                            {sub.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              }
              // Menu normal
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive(item.href)
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5 text-primary-500" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}`}>
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4 justify-between">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              {!sidebarCollapsed && (
                <span className="ml-2 text-lg font-semibold text-gray-900">ERP Vertkall</span>
              )}
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              title={sidebarCollapsed ? "Expandir menu" : "Minimizar menu"}
            >
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
          {/* Sidebar navigation - UNIFICADO */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            {/* navigation (com submenu) */}
            {navigation.map((item) => {
              if (item.submenu) {
                return (
                  <div
                    key={item.name}
                    className="relative group"
                    onMouseEnter={() => !sidebarCollapsed && setSubmenuOpen(item.name)}
                    onMouseLeave={() => setSubmenuOpen(null)}
                  >
                    {/* Botão para desktop */}
                    <div
                      className={`flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left cursor-pointer ${
                        isActive('/financeiro') || isActive('/ajustes')
                          ? 'bg-primary-100 text-primary-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon className={`h-5 w-5 text-primary-500 ${sidebarCollapsed ? 'mx-auto' : 'mr-3'}`} />
                      {!sidebarCollapsed && (
                        <>
                          {item.name}
                          <svg className="ml-auto h-4 w-4 text-gray-400 group-hover:text-gray-500" fill="none" viewBox="0 0 20 20"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </>
                      )}
                    </div>
                    {/* Submenu - desktop */}
                    {!sidebarCollapsed && (
                      <div
                        className={`absolute left-0 w-full z-20 bg-white border border-gray-200 rounded-md shadow-lg py-1 transition-all duration-150 ${submenuOpen === item.name ? 'block' : 'hidden'}`}
                        style={{ top: '100%' }}
                      >
                        {item.submenu.map((sub) => {
                          const SubIcon = sub.icon;
                          return (
                            <Link
                              key={sub.name}
                              to={sub.href}
                              className={`flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-900 ${isActive(sub.href) ? 'font-semibold text-primary-600' : ''}`}
                              onClick={() => setSidebarOpen(false)}
                            >
                              <SubIcon className="mr-2 h-4 w-4 text-primary-500" />
                              {sub.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }
              // Menu normal
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive(item.href)
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <Icon className={`h-5 w-5 text-primary-500 ${sidebarCollapsed ? 'mx-auto' : 'mr-3'}`} />
                  {!sidebarCollapsed && item.name}
                </Link>
              );
            })}
            {/* adminNavigation */}
            {adminNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive(item.href)
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <Icon className={`h-5 w-5 text-primary-500 ${sidebarCollapsed ? 'mx-auto' : 'mr-3'}`} />
                  {!sidebarCollapsed && item.name}
                </Link>
              );
            })}
            {/* userNavigation */}
            {userNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive(item.href)
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <Icon className={`h-5 w-5 text-primary-500 ${sidebarCollapsed ? 'mx-auto' : 'mr-3'}`} />
                  {!sidebarCollapsed && item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          
          <button
            type="button"
            className="hidden lg:flex -m-2.5 p-2.5 text-gray-700 hover:text-gray-900"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expandir menu" : "Minimizar menu"}
          >
            {sidebarCollapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="flex items-center gap-x-2">
                <User size={20} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-900">{user?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-x-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <LogOut size={20} />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout; 