import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import apiService from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import { FinancialCategory, CategoryFilters } from '../types';

const Categories: React.FC = () => {
  const [filters, setFilters] = useState<CategoryFilters>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<FinancialCategory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery(
    ['categories', filters],
    () => apiService.getCategories(filters)
  );

  const createMutation = useMutation(apiService.createCategory, {
    onSuccess: () => {
      queryClient.invalidateQueries('categories');
      setIsCreateModalOpen(false);
    },
  });

  const updateMutation = useMutation(
    (data: { id: string; data: any }) => apiService.updateCategory(data.id, data.data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('categories');
        setIsEditModalOpen(false);
        setSelectedCategory(null);
      },
    }
  );

  const deleteMutation = useMutation(apiService.deleteCategory, {
    onSuccess: () => {
      queryClient.invalidateQueries('categories');
    },
  });

  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm,
    }));
  };

  const handleFilterChange = (key: keyof CategoryFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleCreateCategory = (data: any) => {
    console.log('handleCreateCategory called with:', data);
    console.log('About to call createMutation.mutate');
    createMutation.mutate(data);
    console.log('createMutation.mutate called');
  };

  const handleEditCategory = (category: FinancialCategory) => {
    setSelectedCategory(category);
    setIsEditModalOpen(true);
  };

  const handleUpdateCategory = (data: any) => {
    if (selectedCategory) {
      updateMutation.mutate({ id: selectedCategory.id, data });
    }
  };

  const handleDeleteCategory = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
          <p className="text-gray-600">Gerencie suas categorias financeiras</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar categorias..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Select
            placeholder="Tipo"
            options={[
              { value: '', label: 'Todos os tipos' },
              { value: 'RECEIVABLE', label: 'Receita' },
              { value: 'PAYABLE', label: 'Despesa' },
            ]}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('type', e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={handleSearch} variant="secondary">
              Buscar
            </Button>
            <Button 
              onClick={() => {
                setFilters({});
                setSearchTerm('');
              }} 
              variant="secondary"
            >
              Limpar
            </Button>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="space-y-6">
        {deleteMutation.isLoading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-blue-800">Excluindo categoria...</span>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : !categories || categories.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center h-64 text-gray-500">
              <div className="text-6xl mb-4">📂</div>
              <p className="text-lg font-medium">Nenhuma categoria encontrada</p>
              <p className="text-sm">Crie sua primeira categoria para começar</p>
            </div>
          ) : (
            categories.map((category) => (
              <div key={category.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-3">
                      <div className={`w-4 h-4 rounded-full ${
                        category.type === 'RECEIVABLE' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
                      {category.description && (
                        <p className="text-sm text-gray-500">{category.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="text-red-600 hover:text-red-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Excluir"
                      disabled={deleteMutation.isLoading}
                    >
                      {deleteMutation.isLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    category.type === 'RECEIVABLE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {category.type === 'RECEIVABLE' ? 'Receita' : 'Despesa'}
                  </span>
                  {category._count && (
                    <span className="ml-2 text-sm text-gray-500">
                      {category._count.transactions} transação(ões)
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Category Modal */}
      <CategoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateCategory}
        isLoading={createMutation.isLoading}
      />

      {/* Edit Category Modal */}
      {selectedCategory && (
        <CategoryModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedCategory(null);
          }}
          onSubmit={handleUpdateCategory}
          category={selectedCategory}
          isLoading={updateMutation.isLoading}
        />
      )}
    </div>
  );
};

// Category Modal Component
interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  category?: FinancialCategory;
  isLoading: boolean;
}

const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  category,
  isLoading,
}) => {
  const formRef = React.useRef<HTMLFormElement>(null);

  // Reset form when modal opens/closes or category changes
  React.useEffect(() => {
    if (isOpen) {
      if (category) {
        // Edit mode - set values from category
        const form = formRef.current;
        if (form) {
          const nameInput = form.querySelector('input[name="name"]') as HTMLInputElement;
          const descriptionInput = form.querySelector('input[name="description"]') as HTMLInputElement;
          const typeSelect = form.querySelector('select[name="type"]') as HTMLSelectElement;
          
          if (nameInput) nameInput.value = category.name;
          if (descriptionInput) descriptionInput.value = category.description || '';
          if (typeSelect) typeSelect.value = category.type;
        }
      } else {
        // Create mode - reset to defaults
        const form = formRef.current;
        if (form) {
          form.reset();
        }
      }
    }
  }, [isOpen, category]);

  const handleFormSubmitDirect = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submit event triggered');
    
    const form = formRef.current;
    if (!form) {
      console.log('Form ref not found');
      return;
    }

    const nameInput = form.querySelector('input[name="name"]') as HTMLInputElement;
    const descriptionInput = form.querySelector('input[name="description"]') as HTMLInputElement;
    const typeSelect = form.querySelector('select[name="type"]') as HTMLSelectElement;

    if (!nameInput || !typeSelect) {
      console.log('Required form elements not found');
      return;
    }

    const data = {
      name: nameInput.value,
      description: descriptionInput?.value || '',
      type: typeSelect.value,
    };
    
    console.log('Direct form submission:', data);
    
    if (!data.name || !data.type) {
      console.log('Missing required fields in direct submission');
      return;
    }
    
    console.log('Calling onSubmit with data:', data);
    onSubmit(data);
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={category ? 'Editar Categoria' : 'Nova Categoria'}
    >
      <form ref={formRef} onSubmit={handleFormSubmitDirect} className="space-y-4">
        <Input
          label="Nome"
          placeholder="Nome da categoria"
          name="name"
        />

        <Input
          label="Descrição"
          placeholder="Descrição da categoria (opcional)"
          name="description"
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Tipo
          </label>
          <select
            name="type"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Selecione um tipo</option>
            <option value="RECEIVABLE">Receita</option>
            <option value="PAYABLE">Despesa</option>
          </select>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            loading={isLoading}
          >
            {category ? 'Atualizar' : 'Criar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default Categories; 