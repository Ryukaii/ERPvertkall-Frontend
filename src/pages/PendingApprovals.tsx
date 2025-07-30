import React, { useState, useEffect } from 'react';
import { Check, X, Clock, AlertCircle } from 'lucide-react';
import { PendingApprovalUser } from '../types';
import { apiService } from '../services/api';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const PendingApprovals: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingApprovalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<PendingApprovalUser | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [approving, setApproving] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [error, setError] = useState('');

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      setLoading(true);
      const data = await apiService.getPendingApprovals();
      setPendingUsers(data);
    } catch (error) {
      console.error('Erro ao carregar usuários pendentes:', error);
      setError('Erro ao carregar usuários pendentes de aprovação');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (user: PendingApprovalUser) => {
    setSelectedUser(user);
    setAction('approve');
    setShowConfirmModal(true);
  };

  const handleRejectClick = (user: PendingApprovalUser) => {
    setSelectedUser(user);
    setAction('reject');
    setShowConfirmModal(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedUser) return;

    try {
      setApproving(true);
      setError('');

      if (action === 'approve') {
        await apiService.approveUser(selectedUser.id, { isApproved: true });
      } else {
        await apiService.rejectUser(selectedUser.id);
      }

      // Remover o usuário da lista local
      setPendingUsers(prev => prev.filter(user => user.id !== selectedUser.id));
      
      setShowConfirmModal(false);
      setSelectedUser(null);
    } catch (error: any) {
      console.error(`Erro ao ${action === 'approve' ? 'aprovar' : 'rejeitar'} usuário:`, error);
      setError(error.response?.data?.message || `Erro ao ${action === 'approve' ? 'aprovar' : 'rejeitar'} usuário`);
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center space-x-2">
          <Clock className="animate-spin h-5 w-5 text-blue-500" />
          <span className="text-lg">Carregando usuários pendentes...</span>
        </div>
      </div>
    );
  }

  if (pendingUsers.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Aprovações Pendentes</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Check className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhuma aprovação pendente
          </h2>
          <p className="text-gray-600">
            Todos os usuários cadastrados já foram aprovados ou rejeitados.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Aprovações Pendentes</h1>
          <p className="text-gray-600 mt-2">
            {pendingUsers.length} usuário{pendingUsers.length !== 1 ? 's' : ''} aguardando aprovação
          </p>
        </div>
        <Button
          onClick={loadPendingUsers}
          variant="secondary"
          disabled={loading}
        >
          Atualizar Lista
        </Button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data de Cadastro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        {user.isAdmin && (
                          <div className="text-xs text-blue-600 font-medium">Administrador</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <Clock className="w-3 h-3 mr-1" />
                      Pendente
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleApproveClick(user)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button
                        onClick={() => handleRejectClick(user)}
                        size="sm"
                        variant="secondary"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Confirmação */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={`Confirmar ${action === 'approve' ? 'Aprovação' : 'Rejeição'}`}
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            {action === 'approve' ? (
              <Check className="h-6 w-6 text-green-500 mt-1" />
            ) : (
              <X className="h-6 w-6 text-red-500 mt-1" />
            )}
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {action === 'approve' ? 'Aprovar usuário' : 'Rejeitar usuário'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Você está prestes a {action === 'approve' ? 'aprovar' : 'rejeitar'} o usuário:{' '}
                <span className="font-medium">{selectedUser?.name}</span> ({selectedUser?.email})
              </p>
              {action === 'approve' && (
                <p className="text-sm text-gray-600 mt-2">
                  ✓ O usuário poderá fazer login no sistema<br />
                  ✓ Permissões padrão serão criadas automaticamente<br />
                  ✓ O usuário será notificado sobre a aprovação
                </p>
              )}
              {action === 'reject' && (
                <p className="text-sm text-red-600 mt-2">
                  ⚠️ O usuário não poderá acessar o sistema<br />
                  ⚠️ Esta ação pode ser revertida posteriormente
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              onClick={() => setShowConfirmModal(false)}
              variant="secondary"
              disabled={approving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmAction}
              loading={approving}
              className={action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {action === 'approve' ? 'Aprovar Usuário' : 'Rejeitar Usuário'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PendingApprovals;