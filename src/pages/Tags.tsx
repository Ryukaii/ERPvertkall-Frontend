import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Tag,
  Eye,
  EyeOff,
  TrendingUp
} from 'lucide-react';
import apiService from '../services/api';
import { Tag as TagType } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Select from '../components/ui/Select';

const Tags: React.FC = () => {
  const [tags, setTags] = useState<TagType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<TagType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
    description: '',
    isActive: true
  });

  const colors = [
    { value: '#3B82F6', label: 'Azul' },
    { value: '#EF4444', label: 'Vermelho' },
    { value: '#10B981', label: 'Verde' },
    { value: '#F59E0B', label: 'Amarelo' },
    { value: '#8B5CF6', label: 'Roxo' },
    { value: '#EC4899', label: 'Rosa' },
    { value: '#F97316', label: 'Laranja' },
    { value: '#06B6D4', label: 'Ciano' },
    { value: '#84CC16', label: 'Lima' },
    { value: '#6366F1', label: 'Índigo' }
  ];

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTags();
      setTags(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar tags:', error);
      alert('Erro ao carregar tags');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Nome da tag é obrigatório');
      return;
    }

    try {
      if (editingTag) {
        await apiService.updateTag(editingTag.id, formData);
        alert('Tag atualizada com sucesso!');
      } else {
        await apiService.createTag(formData);
        alert('Tag criada com sucesso!');
      }
      
      setShowModal(false);
      setEditingTag(null);
      resetForm();
      loadTags();
    } catch (error) {
      console.error('Erro ao salvar tag:', error);
      alert('Erro ao salvar tag');
    }
  };

  const handleEdit = (tag: TagType) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color || '#3B82F6',
      description: tag.description || '',
      isActive: tag.isActive
    });
    setShowModal(true);
  };

  const handleToggleActive = async (tag: TagType) => {
    try {
      await apiService.toggleTagActive(tag.id);
      loadTags();
    } catch (error) {
      console.error('Erro ao alterar status da tag:', error);
      alert('Erro ao alterar status da tag');
    }
  };

  const handleDelete = async (tag: TagType) => {
    if (!confirm(`Tem certeza que deseja excluir a tag "${tag.name}"?`)) {
      return;
    }

    try {
      await apiService.deleteTag(tag.id);
      alert('Tag excluída com sucesso!');
      loadTags();
    } catch (error) {
      console.error('Erro ao excluir tag:', error);
      alert('Erro ao excluir tag. Verifique se ela não está sendo usada.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      color: '#3B82F6',
      description: '',
      isActive: true
    });
  };

  const openCreateModal = () => {
    setEditingTag(null);
    resetForm();
    setShowModal(true);
  };

  const getFilteredTags = () => {
    let filtered = tags;

    // Filtrar por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(tag =>
        tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tag.description && tag.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtrar por status
    switch (filterActive) {
      case 'active':
        filtered = filtered.filter(tag => tag.isActive);
        break;
      case 'inactive':
        filtered = filtered.filter(tag => !tag.isActive);
        break;
      default:
        break;
    }

    return filtered;
  };

  const filteredTags = getFilteredTags();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando tags...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Tags</h1>
          <p className="text-gray-600">Organize suas transações com tags personalizadas</p>
        </div>
        <Button onClick={openCreateModal} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Tag
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value as any)}
              options={[
                { value: 'all', label: 'Todas' },
                { value: 'active', label: 'Ativas' },
                { value: 'inactive', label: 'Inativas' }
              ]}
              className="w-32"
            />
          </div>
        </div>
      </div>

      {/* Lista de Tags */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Tags ({filteredTags.length})
          </h2>
        </div>
        
        {filteredTags.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Tag className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Nenhuma tag encontrada</p>
            {searchTerm || filterActive !== 'all' ? (
              <p className="text-sm mt-2">Tente ajustar os filtros</p>
            ) : (
              <Button onClick={openCreateModal} className="mt-4">
                Criar Primeira Tag
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tag
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTags.map((tag) => (
                  <tr key={tag.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: tag.color }}
                        ></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {tag.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            Criada em {new Date(tag.createdAt).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs">
                        {tag.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tag.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {tag.isActive ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <TrendingUp className="h-4 w-4" />
                        <span>{tag._count?.financialTransactions || 0} + {tag._count?.ofxPendingTransactions || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleEdit(tag)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Editar
                        </Button>
                        <Button
                          onClick={() => handleToggleActive(tag)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          {tag.isActive ? (
                            <>
                              <EyeOff className="h-3 w-3" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3" />
                              Ativar
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleDelete(tag)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Criação/Edição */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingTag(null);
          resetForm();
        }}
        title={editingTag ? 'Editar Tag' : 'Nova Tag'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Alimentação, Transporte, Lazer..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cor
            </label>
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-full border border-gray-300"
                style={{ backgroundColor: formData.color }}
              ></div>
              <Select
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                options={colors}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição opcional da tag..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Tag ativa
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowModal(false);
                setEditingTag(null);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingTag ? 'Atualizar' : 'Criar'} Tag
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Tags; 