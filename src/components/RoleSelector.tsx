import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { Calendar, User, Shield } from 'lucide-react';

export function RoleSelector() {
  const { setUserRole } = useAuth();

  const roles = [
    {
      id: 'Administrador',
      name: 'Administrador',
      description: 'Acceso completo al sistema',
      icon: Shield,
      color: 'bg-red-500 hover:bg-red-600',
      permissions: ['Acceso completo', 'Gestión de usuarios', 'Configuración del sistema', 'Logs de actividad']
    },
    {
      id: 'Ejecutivo',
      name: 'Ejecutivo',
      description: 'Gestión de eventos y facturación',
      icon: User,
      color: 'bg-green-500 hover:bg-green-600',
      permissions: ['Gestionar eventos', 'Crear facturas', 'Editar datos', 'Ver dashboard']
    },
    {
      id: 'Visualizador',
      name: 'Visualizador',
      description: 'Solo lectura - Ver dashboard y reportes',
      icon: User,
      color: 'bg-blue-500 hover:bg-blue-600',
      permissions: ['Ver dashboard', 'Ver reportes', 'Consultar datos']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center space-x-3 mb-8">
          <Calendar className="h-12 w-12 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">MADE</h1>
            <p className="text-sm text-gray-600">Event Manager Pro</p>
          </div>
        </div>
        <h2 className="text-center text-3xl font-bold text-gray-900 mb-2">
          Seleccionar Rol de Usuario
        </h2>
        <p className="text-center text-sm text-gray-600 mb-8">
          Seleccione su rol para acceder al sistema
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
          {roles.map((role) => (
            <div
              key={role.id}
              onClick={() => setUserRole(role.id as 'Administrador' | 'Editor' | 'Visualizador')}
              className="bg-white rounded-lg shadow-xl p-6 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-2xl border-2 border-transparent hover:border-blue-200"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`p-4 rounded-full ${role.color} text-white`}>
                  <role.icon className="h-8 w-8" />
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {role.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {role.description}
                  </p>
                </div>

                <div className="w-full">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Permisos incluidos:
                  </h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {role.permissions.map((permission, index) => (
                      <li key={index} className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                        {permission}
                      </li>
                    ))}
                  </ul>
                </div>

                <button className={`w-full py-3 px-4 rounded-md text-white font-medium transition-colors ${role.color}`}>
                  Acceso Demo - {role.name}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mx-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Modo Demo - Sin Restricciones de Seguridad
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Sistema configurado para demostración sin restricciones de seguridad. 
                    Todos los roles tienen acceso completo a todas las funciones para propósitos de demo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}