import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserPermission } from '../types';
import { apiService } from '../services/api';

export const usePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPermissions();
    }
  }, [user]);

  const loadPermissions = async () => {
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

  const hasPermission = (moduleName: string, resource: string, action: string): boolean => {
    // Se o usuário é admin, tem todas as permissões
    if (user?.isAdmin) {
      return true;
    }

    // Verificar permissão específica
    return permissions.some(
      (permission) =>
        permission.module.name === moduleName &&
        permission.resource === resource &&
        permission.action === action &&
        permission.isActive
    );
  };

  const canRead = (moduleName: string, resource: string): boolean => {
    return hasPermission(moduleName, resource, 'read');
  };

  const canWrite = (moduleName: string, resource: string): boolean => {
    return hasPermission(moduleName, resource, 'write');
  };

  return {
    permissions,
    loading,
    hasPermission,
    canRead,
    canWrite,
    refreshPermissions: loadPermissions,
  };
}; 