import React from 'react';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  FileText, 
  Activity,
  LogOut,
  Menu,
  Settings,
  Shield,
  Database
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ConnectionIndicator } from './ui/ConnectionIndicator';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
  mockUser: any;
}

export function Layout({ children, currentPage, onPageChange }: LayoutProps) {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const navigation = [
    { name: 'Dashboard', id: 'dashboard', icon: Activity, roles: ['Administrador', 'Ejecutivo'] },
    { name: 'Generar Datos', id: 'test-data', icon: Settings, roles: ['Administrador'] },
    { name: 'Diagnóstico DB', id: 'diagnostics', icon: Database, roles: ['Administrador'] },
    { name: 'Diagnóstico DB', id: 'diagnostics', icon: Database, roles: ['Administrador'] },
    { name: 'Master de Facturación', id: 'billing-master', icon: FileText, roles: ['Administrador', 'Ejecutivo'] },
    { name: 'Clientes', id: 'clients', icon: Users, roles: ['Administrador'] },
    { name: 'Catálogos', id: 'catalogs', icon: DollarSign, roles: ['Administrador'] },
    { name: 'Usuarios', id: 'users', icon: Shield, roles: ['Administrador'] },
    { name: 'Log de Actividad', id: 'activity-log', icon: Calendar, roles: ['Administrador'] },
  ];

  const filteredNavigation = navigation.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  const handleSignOut = async () => {
    try {
      signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </div>
      )}

      <div className="flex flex-1">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <h1 className="text-xl font-bold text-gray-900">MADE</h1>
                <p className="text-sm text-gray-500">Event Manager Pro</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
              {filteredNavigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onPageChange(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    currentPage === item.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </button>
              ))}
            </nav>

            {/* User info and logout */}
            <div className="px-4 py-4 border-t border-gray-200 sticky bottom-0 bg-white">
              <div className="mb-3">
                <ConnectionIndicator showDetails={true} className="justify-center" />
              </div>
              <div className="mb-3">
                <ConnectionIndicator showDetails={true} className="justify-center" />
              </div>
              <div className="flex items-center mb-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                  <p className="text-xs text-gray-500">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <LogOut className="mr-3 h-4 w-4" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Top bar - Sticky */}
          <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden sticky top-0 z-30">
            <div className="flex items-center justify-between px-4 py-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-gray-500 hover:text-gray-900"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h2 className="text-lg font-semibold text-gray-900">MADE Event Manager Pro</h2>
              <ConnectionIndicator showDetails={true} />
              <ConnectionIndicator showDetails={true} />
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}