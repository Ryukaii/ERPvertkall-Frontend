import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Edit, Trash2, Wallet } from 'lucide-react';
import { useForm } from 'react-hook-form';
import apiService from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { PaymentMethod } from '../types';

const PaymentMethods: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const queryClient = useQueryClient();

  const { data: paymentMethods, isLoading } = useQuery(['paymentMethods'], () => apiService.getPaymentMethods());

  const createMutation = useMutation(apiService.createPaymentMethod, {
    onSuccess: () => {
      queryClient.invalidateQueries('paymentMethods');
      setIsCreateModalOpen(false);
    },
  });

  const updateMutation = useMutation(
    (data: { id: string; data: any }) => apiService.updatePaymentMethod(data.id, data.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('paymentMethods');
        setIsEditModalOpen(false);
        setSelectedPaymentMethod(null);
      },
    }
  );

  const deleteMutation = useMutation(apiService.deletePaymentMethod, {
    onSuccess: () => {
      queryClient.invalidateQueries('paymentMethods');
    },
  });

  const handleCreatePaymentMethod = (data: any) => {
    createMutation.mutate(data);
  };

  const handleEditPaymentMethod = (paymentMethod: PaymentMethod) => {
    setSelectedPaymentMethod(paymentMethod);
    setIsEditModalOpen(true);
  };

  const handleUpdatePaymentMethod = (data: any) => {
    if (selectedPaymentMethod) {
      updateMutation.mutate({ id: selectedPaymentMethod.id, data });
    }
  };

  const handleDeletePaymentMethod = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este método de pagamento?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Métodos de Pagamento</h1>
          <p className="text-gray-600">Gerencie seus métodos de pagamento</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Método
        </Button>
      </div>

      {/* Payment Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          paymentMethods?.map((paymentMethod) => (
            <div key={paymentMethod.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                    <Wallet className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{paymentMethod.name}</h3>
                    {paymentMethod.description && (
                      <p className="text-sm text-gray-500">{paymentMethod.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditPaymentMethod(paymentMethod)}
                    className="text-blue-600 hover:text-blue-900"
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePaymentMethod(paymentMethod.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Payment Method Modal */}
      <PaymentMethodModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreatePaymentMethod}
        isLoading={createMutation.isLoading}
      />

      {/* Edit Payment Method Modal */}
      {selectedPaymentMethod && (
        <PaymentMethodModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedPaymentMethod(null);
          }}
          onSubmit={handleUpdatePaymentMethod}
          paymentMethod={selectedPaymentMethod}
          isLoading={updateMutation.isLoading}
        />
      )}
    </div>
  );
};

// Payment Method Modal Component
interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  paymentMethod?: PaymentMethod;
  isLoading: boolean;
}

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  paymentMethod,
  isLoading,
}) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: paymentMethod ? {
      name: paymentMethod.name,
      description: paymentMethod.description || '',
      icon: paymentMethod.icon,
    } : {
      icon: 'wallet',
    }
  });

  const handleFormSubmit = (data: any) => {
    onSubmit(data);
    reset();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={paymentMethod ? 'Editar Método de Pagamento' : 'Novo Método de Pagamento'}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <Input
          label="Nome"
          placeholder="Nome do método de pagamento"
          error={errors.name?.message}
          {...register('name', { required: 'Nome é obrigatório' })}
        />

        <Input
          label="Descrição"
          placeholder="Descrição do método de pagamento (opcional)"
          {...register('description')}
        />

        <Input
          label="Ícone"
          placeholder="Ícone (ex: wallet, credit-card, etc.)"
          error={errors.icon?.message}
          {...register('icon', { required: 'Ícone é obrigatório' })}
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={isLoading}>
            {paymentMethod ? 'Atualizar' : 'Criar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PaymentMethods; 