import React, { useState, useEffect } from 'react';
import { 
  User, 
  UserPermission, 
  UserFilters, 
  AvailablePermissionData, 
  PermissionOption,
  GroupedPermissions 
} from '../types';
import { apiService } from '../services/api';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Select from '../components/ui/Select';
import { Check, X, Clock, Users as UsersIcon, Filter } from 'lucide-react';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [updatingPermissions, setUpdatingPermissions] = useState(false);
  const [filters, setFilters] = useState<UserFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [, setAvailablePermissions] = useState<AvailablePermissionData[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<GroupedPermissions>({});
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [filters]);

  useEffect(() => {
    loadAvailablePermissions();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await apiService.getUsers(filters);
      setUsers(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailablePermissions = async () => {
    try {
      setLoadingPermissions(true);
      const data = await apiService.getAvailablePermissions();
      setAvailablePermissions(data);
      
      // Processar e agrupar permissões
      const grouped = processAvailablePermissions(data);
      setGroupedPermissions(grouped);
    } catch (error) {
      console.error('Erro ao carregar permissões disponíveis:', error);
    } finally {
      setLoadingPermissions(false);
    }
  };

  const processAvailablePermissions = (data: AvailablePermissionData[]): GroupedPermissions => {
    const grouped: GroupedPermissions = {};

    data.forEach(moduleData => {
      const permissions: PermissionOption[] = [];
      
      moduleData.resources.forEach(resource => {
        resource.actions.forEach(action => {
          permissions.push({
            value: `${moduleData.module.name}:${resource.resource}:${action}`,
            label: `${getResourceDisplayName(resource.resource)} (${getActionDisplayName(action)})`,
            module: moduleData.module.name,
            resource: resource.resource,
            action: action,
            moduleDisplayName: moduleData.module.displayName
          });
        });
      });

      grouped[moduleData.module.id] = {
        module: moduleData.module,
        permissions: permissions.sort((a, b) => a.label.localeCompare(b.label))
      };
    });

    return grouped;
  };

  const getUserPermissionKey = (permission: UserPermission): string => {
    return `${permission.module.name}:${permission.resource}:${permission.action}`;
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

  const toggleModulePermissions = (moduleId: string, enable: boolean) => {
    const modulePermissions = groupedPermissions[moduleId];
    if (!modulePermissions) return;

    setPermissions(prevPermissions => {
      return prevPermissions.map(permission => {
        const permissionKey = getUserPermissionKey(permission);
        const isModulePermission = modulePermissions.permissions.some(p => p.value === permissionKey);
        
        if (isModulePermission) {
          return { ...permission, isActive: enable };
        }
        return permission;
      });
    });
  };

  const getModulePermissionStatus = (moduleId: string) => {
    const modulePermissions = groupedPermissions[moduleId];
    if (!modulePermissions) return { active: 0, total: 0 };

    const activePermissions = permissions.filter(permission => {
      const permissionKey = getUserPermissionKey(permission);
      return modulePermissions.permissions.some(p => p.value === permissionKey) && permission.isActive;
    });

    return {
      active: activePermissions.length,
      total: modulePermissions.permissions.length
    };
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const updatedUser = await apiService.approveUser(userId, { isApproved: true });
      setUsers(users.map(user => 
        user.id === userId ? updatedUser : user
      ));
    } catch (error) {
      console.error('Erro ao aprovar usuário:', error);
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      const updatedUser = await apiService.rejectUser(userId);
      setUsers(users.map(user => 
        user.id === userId ? updatedUser : user
      ));
    } catch (error) {
      console.error('Erro ao rejeitar usuário:', error);
    }
  };

  const clearFilters = () => {
    setFilters({});
  };

  const getApprovalStatusDisplay = (user: User) => {
    if (user.isApproved) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Check className="w-3 h-3 mr-1" />
          Aprovado
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Pendente
        </span>
      );
    }
  };

  const getResourceDisplayName = (resource: string) => {
    const resourceNames: Record<string, string> = {
      categories: 'Categorias',
      transactions: 'Transações',
      payment_methods: 'Métodos de Pagamento',
      recurring_payments: 'Pagamentos Recorrentes',
      recurring_transactions: 'Transações Recorrentes',
      banks: 'Bancos',
      bank_transactions: 'Transações Bancárias',
      ai_categorization: 'Categorização IA',
      ofx_imports: 'Importação OFX',
      user_approval: 'Aprovação de Usuários',
      tags: 'Tags',
      unidades: 'Unidades',
    };
    return resourceNames[resource] || resource.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getActionDisplayName = (action: string) => {
    const actionNames: Record<string, string> = {
      read: 'Leitura',
      write: 'Escrita',
      delete: 'Exclusão',
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
          <p className="text-gray-600 mt-2">
            {users.length} usuário{users.length !== 1 ? 's' : ''} encontrado{users.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="secondary"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button
            onClick={loadUsers}
            variant="secondary"
            disabled={loading}
          >
            <UsersIcon className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Painel de Filtros */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filtros</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Status de Aprovação"
              value={filters.isApproved?.toString() || ''}
              onChange={(e) => setFilters({
                ...filters,
                isApproved: e.target.value === '' ? undefined : e.target.value === 'true'
              })}
              options={[
                { value: '', label: 'Todos' },
                { value: 'true', label: 'Aprovados' },
                { value: 'false', label: 'Pendentes' }
              ]}
            />

            <Select
              label="Tipo de Usuário"
              value={filters.isAdmin?.toString() || ''}
              onChange={(e) => setFilters({
                ...filters,
                isAdmin: e.target.value === '' ? undefined : e.target.value === 'true'
              })}
              options={[
                { value: '', label: 'Todos' },
                { value: 'true', label: 'Administradores' },
                { value: 'false', label: 'Usuários Comuns' }
              ]}
            />

            <div className="flex items-end">
              <Button
                onClick={clearFilters}
                variant="secondary"
                size="sm"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </div>
      )}

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
                  Status
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
                    {getApprovalStatusDisplay(user)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isAdmin
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.isAdmin ? 'Admin' : 'Usuário'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2 flex-wrap">
                      {!user.isApproved && (
                        <>
                          <Button
                            onClick={() => handleApproveUser(user.id)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            onClick={() => handleRejectUser(user.id)}
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Rejeitar
                          </Button>
                        </>
                      )}
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
        <div className="space-y-6">
          <div className="text-sm text-gray-600">
            Gerencie as permissões deste usuário organizadas por módulo do sistema.
          </div>

          {loadingPermissions ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-2">
                <Clock className="animate-spin h-5 w-5 text-blue-500" />
                <span>Carregando permissões disponíveis...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-h-96 overflow-y-auto">
              {Object.entries(groupedPermissions).map(([moduleId, moduleData]) => {
                const status = getModulePermissionStatus(moduleId);
                const allEnabled = status.active === status.total && status.total > 0;

                return (
                  <div key={moduleId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 flex items-center">
                          {moduleData.module.displayName}
                          <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {status.active}/{status.total}
                          </span>
                        </h4>
                        <p className="text-sm text-gray-500">{moduleData.module.description}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => toggleModulePermissions(moduleId, true)}
                          size="sm"
                          variant="secondary"
                          disabled={allEnabled}
                        >
                          Todas
                        </Button>
                        <Button
                          onClick={() => toggleModulePermissions(moduleId, false)}
                          size="sm"
                          variant="secondary"
                          disabled={status.active === 0}
                        >
                          Nenhuma
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {moduleData.permissions.map((permissionOption) => {
                        const userPermission = permissions.find(p => 
                          getUserPermissionKey(p) === permissionOption.value
                        );

                        return (
                          <label
                            key={permissionOption.value}
                            className="flex items-center p-2 rounded border hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={userPermission?.isActive || false}
                              onChange={() => {
                                if (userPermission) {
                                  togglePermission(userPermission.id);
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              {permissionOption.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              onClick={() => setShowPermissionsModal(false)}
              variant="secondary"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdatePermissions}
              loading={updatingPermissions}
              disabled={loadingPermissions}
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