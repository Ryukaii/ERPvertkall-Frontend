import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Edit, Trash2, Building2, MapPin, Calendar } from 'lucide-react';
import apiService from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';

interface Unidade {
  id: string;
  nome: string;
  local: string;
  createdAt: string;
  updatedAt: string;
}

interface UnidadeForm {
  nome: string;
  local: string;
}

const AjustesUnidades: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedUnidade, setSelectedUnidade] = useState<Unidade | null>(null);
  const [form, setForm] = useState<UnidadeForm>({ nome: '', local: '' });
  const queryClient = useQueryClient();

  const { data: unidades = [], isLoading } = useQuery(['unidades'], () => apiService.getUnidades());

  const createMutation = useMutation(apiService.createUnidade, {
    onSuccess: () => {
      queryClient.invalidateQueries('unidades');
      setIsModalOpen(false);
      setForm({ nome: '', local: '' });
    },
  });

  const updateMutation = useMutation(({ id, data }: { id: string; data: UnidadeForm }) => apiService.updateUnidade(id, data), {
    onSuccess: () => {
      queryClient.invalidateQueries('unidades');
      setIsModalOpen(false);
      setIsEdit(false);
      setSelectedUnidade(null);
      setForm({ nome: '', local: '' });
    },
  });

  const deleteMutation = useMutation((id: string) => apiService.deleteUnidade(id), {
    onSuccess: () => {
      queryClient.invalidateQueries('unidades');
    },
  });

  const handleOpenCreate = () => {
    setIsEdit(false);
    setSelectedUnidade(null);
    setForm({ nome: '', local: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (unidade: Unidade) => {
    setIsEdit(true);
    setSelectedUnidade(unidade);
    setForm({ nome: unidade.nome, local: unidade.local });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja remover esta unidade?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit && selectedUnidade) {
      updateMutation.mutate({ id: selectedUnidade.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary-600" />
            Unidades
          </h1>
          <p className="text-gray-600 mt-1">Gerencie as unidades da empresa</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Unidade
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {unidades.map((unidade) => (
            <div key={unidade.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Building2 className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900">{unidade.nome}</h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      {unidade.local}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(unidade)}
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(unidade.id)}
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Criado em:
                  </span>
                  <span className="font-medium">{formatDate(unidade.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Atualizado em:</span>
                  <span className="font-medium">{formatDate(unidade.updatedAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {unidades.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma unidade encontrada</h3>
          <p className="text-gray-500 mb-4">Comece criando sua primeira unidade para organizar sua empresa.</p>
          <Button onClick={handleOpenCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeira Unidade
          </Button>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEdit ? 'Editar Unidade' : 'Nova Unidade'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome"
            name="nome"
            placeholder="Nome da unidade"
            value={form.nome}
            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
            required
          />
          <Input
            label="Local"
            name="local"
            placeholder="Endereço ou localidade"
            value={form.local}
            onChange={e => setForm(f => ({ ...f, local: e.target.value }))}
            required
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={createMutation.isLoading || updateMutation.isLoading}>
              {isEdit ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AjustesUnidades; 