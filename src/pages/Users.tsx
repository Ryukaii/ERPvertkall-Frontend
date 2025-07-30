import React, { useState, useEffect } from 'react';
import { User, UserPermission } from '../types';
import { apiService } from '../services/api';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [updatingPermissions, setUpdatingPermissions] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await apiService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (userId: string) => {
    try {
      const updatedUser = await apiService.toggleAdminStatus(userId);
      setUsers(users.map(user => 
        user.id === userId ? updatedUser : user
      ));
    } catch (error) {
      console.error('Erro ao alterar status de admin:', error);
    }
  };

  const handleOpenPermissions = async (user: User) => {
    setSelectedUser(user);
    try {
      const userPermissions = await apiService.getUserPermissions(user.id);
      setPermissions(userPermissions);
      setShowPermissionsModal(true);
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
    }
  };

  const handleUpdatePermissions = async () => {
    if (!selectedUser) return;

    try {
      setUpdatingPermissions(true);
      
      // Agrupar permissões por módulo
      const permissionsByModule = permissions.reduce((acc, permission) => {
        if (!acc[permission.moduleId]) {
          acc[permission.moduleId] = [];
        }
        acc[permission.moduleId].push({
          resource: permission.resource,
          action: permission.action,
          isActive: permission.isActive,
        });
        return acc;
      }, {} as Record<string, { resource: string; action: string; isActive: boolean }[]>);

      // Atualizar permissões para cada módulo
      for (const [moduleId, modulePermissions] of Object.entries(permissionsByModule)) {
        await apiService.updateUserPermissions(selectedUser.id, {
          moduleId,
          permissions: modulePermissions,
        });
      }

      setShowPermissionsModal(false);
      setSelectedUser(null);
      setPermissions([]);
    } catch (error) {
      console.error('Erro ao atualizar permissões:', error);
    } finally {
      setUpdatingPermissions(false);
    }
  };

  const togglePermission = (permissionId: string) => {
    setPermissions(permissions.map(permission =>
      permission.id === permissionId
        ? { ...permission, isActive: !permission.isActive }
        : permission
    ));
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Carregando usuários...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data de Criação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isAdmin
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.isAdmin ? 'Sim' : 'Não'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleOpenPermissions(user)}
                        size="sm"
                        variant="secondary"
                      >
                        Permissões
                      </Button>
                      <Button
                        onClick={() => handleToggleAdmin(user.id)}
                        size="sm"
                        variant="secondary"
                      >
                        {user.isAdmin ? 'Remover Admin' : 'Tornar Admin'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Permissões */}
      <Modal
        isOpen={showPermissionsModal}
        onClose={() => setShowPermissionsModal(false)}
        title={`Permissões - ${selectedUser?.name}`}
      >
        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Gerencie as permissões deste usuário para cada recurso do sistema.
          </div>

          <div className="space-y-4">
            {permissions.map((permission) => (
              <div key={permission.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {getResourceDisplayName(permission.resource)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {getActionDisplayName(permission.action)}
                  </div>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={permission.isActive}
                    onChange={() => togglePermission(permission.id)}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Ativo</span>
                </label>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              onClick={() => setShowPermissionsModal(false)}
              variant="secondary"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdatePermissions}
              loading={updatingPermissions}
              variant="secondary"
            >
              Atualizar Permissões
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Users; 