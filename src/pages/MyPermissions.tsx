import React, { useState, useEffect } from 'react';
import { UserPermission } from '../types';
import { apiService } from '../services/api';

const MyPermissions: React.FC = () => {
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyPermissions();
  }, []);

  const loadMyPermissions = async () => {
    try {
      setLoading(true);
      const data = await apiService.getMyPermissions();
      setPermissions(data);
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
    } finally {
      setLoading(false);
    }
  };

  const getResourceDisplayName = (resource: string) => {
    const resourceNames: Record<string, string> = {
      categories: 'Categorias',
      transactions: 'Transações',
      payment_methods: 'Métodos de Pagamento',
      recurring_transactions: 'Transações Recorrentes',
    };
    return resourceNames[resource] || resource;
  };

  const getActionDisplayName = (action: string) => {
    const actionNames: Record<string, string> = {
      read: 'Leitura',
      write: 'Escrita',
    };
    return actionNames[action] || action;
  };

  const getModuleDisplayName = (moduleName: string) => {
    const moduleNames: Record<string, string> = {
      financeiro: 'Módulo Financeiro',
    };
    return moduleNames[moduleName] || moduleName;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Carregando permissões...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Minhas Permissões</h1>
        <p className="text-gray-600 mt-2">
          Visualize suas permissões de acesso aos recursos do sistema.
        </p>
      </div>

      {permissions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <div className="text-gray-500 text-lg mb-2">
              Nenhuma permissão encontrada
            </div>
            <div className="text-gray-400 text-sm">
              Entre em contato com um administrador para solicitar permissões.
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Agrupar permissões por módulo */}
          {Object.entries(
            permissions.reduce((acc, permission) => {
              const moduleName = permission.module.name;
              if (!acc[moduleName]) {
                acc[moduleName] = [];
              }
              acc[moduleName].push(permission);
              return acc;
            }, {} as Record<string, UserPermission[]>)
          ).map(([moduleName, modulePermissions]) => (
            <div key={moduleName} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h2 className="text-lg font-semibold text-gray-900">
                  {getModuleDisplayName(moduleName)}
                </h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {modulePermissions.map((permission) => (
                  <div key={permission.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {getResourceDisplayName(permission.resource)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getActionDisplayName(permission.action)}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          permission.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {permission.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Sobre as Permissões
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Leitura:</strong> Permite visualizar dados do recurso</li>
                <li><strong>Escrita:</strong> Permite criar, editar e excluir dados do recurso</li>
                <li><strong>Ativo:</strong> A permissão está habilitada</li>
                <li><strong>Inativo:</strong> A permissão está desabilitada</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyPermissions; 