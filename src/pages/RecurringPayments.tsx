import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Calendar, Building2, Edit, Trash2, Eye } from 'lucide-react';
import apiService from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import { CreateRecurringPaymentRequest, PaymentMethod, RecurringPayment, Unidade } from '../types';

const recurrenceOptions = [
  { value: 'DAILY', label: 'Diário' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'MONTHLY', label: 'Mensal' },
  { value: 'ANNUAL', label: 'Anual' },
];

const weekdayOptions = [
  { value: '0', label: 'Domingo' },
  { value: '1', label: 'Segunda-feira' },
  { value: '2', label: 'Terça-feira' },
  { value: '3', label: 'Quarta-feira' },
  { value: '4', label: 'Quinta-feira' },
  { value: '5', label: 'Sexta-feira' },
  { value: '6', label: 'Sábado' },
];
const monthOptions = [
  { value: '1', label: 'Janeiro' },
  { value: '2', label: 'Fevereiro' },
  { value: '3', label: 'Março' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Maio' },
  { value: '6', label: 'Junho' },
  { value: '7', label: 'Julho' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
];

const RecurringPayments: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<RecurringPayment | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ANNUAL'>('ALL');
  const queryClient = useQueryClient();

  const { data: recurringPayments, isLoading } = useQuery(['recurringPayments'], () => apiService.getRecurringPayments());
  const { data: paymentMethods = [] } = useQuery(['paymentMethods'], () => apiService.getPaymentMethods());
  const { data: unidades = [] } = useQuery(['unidades'], () => apiService.getUnidades());

  // Filtrar e ordenar pagamentos por aba
  const filteredPayments = useMemo(() => {
    if (!recurringPayments) return [];
    
    let filtered = recurringPayments;
    
    // Filtrar por tipo de recorrência
    if (activeTab !== 'ALL') {
      filtered = filtered.filter(payment => payment.recurrenceType === activeTab);
    }
    
    // Ordenar por critério específico de cada tipo
    return filtered.sort((a, b) => {
      switch (activeTab) {
        case 'DAILY':
          // Para diário, ordenar por título
          return a.title.localeCompare(b.title);
        case 'WEEKLY':
          // Para semanal, ordenar por dia da semana (0-6)
          return (a.weekday || 0) - (b.weekday || 0);
        case 'MONTHLY':
          // Para mensal, ordenar por dia do mês (1-31)
          return (a.day || 0) - (b.day || 0);
        case 'ANNUAL':
          // Para anual, ordenar por mês primeiro, depois por dia
          if ((a.month || 0) !== (b.month || 0)) {
            return (a.month || 0) - (b.month || 0);
          }
          return (a.day || 0) - (b.day || 0);
        default:
          // Para "Todas", ordenar por tipo de recorrência primeiro, depois por critério específico
          const typeOrder = { 'DAILY': 1, 'WEEKLY': 2, 'MONTHLY': 3, 'ANNUAL': 4 };
          const aTypeOrder = typeOrder[a.recurrenceType as keyof typeof typeOrder] || 0;
          const bTypeOrder = typeOrder[b.recurrenceType as keyof typeof typeOrder] || 0;
          
          if (aTypeOrder !== bTypeOrder) {
            return aTypeOrder - bTypeOrder;
          }
          
          // Se mesmo tipo, aplicar ordenação específica
          switch (a.recurrenceType) {
            case 'WEEKLY':
              return (a.weekday || 0) - (b.weekday || 0);
            case 'MONTHLY':
              return (a.day || 0) - (b.day || 0);
            case 'ANNUAL':
              if ((a.month || 0) !== (b.month || 0)) {
                return (a.month || 0) - (b.month || 0);
              }
              return (a.day || 0) - (b.day || 0);
            default:
              return a.title.localeCompare(b.title);
          }
      }
    });
  }, [recurringPayments, activeTab]);

  const createMutation = useMutation(apiService.createRecurringPayment, {
    onSuccess: () => {
      queryClient.invalidateQueries('recurringPayments');
      setIsCreateModalOpen(false);
    },
  });

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: Partial<CreateRecurringPaymentRequest> }) => 
      apiService.updateRecurringPayment(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('recurringPayments');
        setIsEditModalOpen(false);
        setSelectedPayment(null);
      },
    }
  );

  const deleteMutation = useMutation(apiService.deleteRecurringPayment, {
    onSuccess: () => {
      queryClient.invalidateQueries('recurringPayments');
      setIsDeleteModalOpen(false);
      setSelectedPayment(null);
    },
  });

  const handleCreateRecurringPayment = (data: CreateRecurringPaymentRequest | Partial<CreateRecurringPaymentRequest>) => {
    createMutation.mutate(data as CreateRecurringPaymentRequest);
  };

  const handleEditRecurringPayment = (data: Partial<CreateRecurringPaymentRequest>) => {
    if (selectedPayment) {
      updateMutation.mutate({ id: selectedPayment.id, data });
    }
  };

  const handleDeleteRecurringPayment = () => {
    if (selectedPayment) {
      deleteMutation.mutate(selectedPayment.id);
    }
  };

  const openEditModal = (payment: RecurringPayment) => {
    setSelectedPayment(payment);
    setIsEditModalOpen(true);
  };

  const openViewModal = (payment: RecurringPayment) => {
    setSelectedPayment(payment);
    setIsViewModalOpen(true);
  };

  const openDeleteModal = (payment: RecurringPayment) => {
    setSelectedPayment(payment);
    setIsDeleteModalOpen(true);
  };

  const renderRecurrence = (item: RecurringPayment) => {
    switch (item.recurrenceType) {
      case 'DAILY':
        return 'Diário';
      case 'WEEKLY':
        return `Semanal (toda ${weekdayOptions.find(w => Number(w.value) === item.weekday)?.label ?? ''})`;
      case 'MONTHLY':
        return `Mensal (todo dia ${item.day})`;
      case 'ANNUAL':
        return `Anual (todo dia ${item.day} de ${monthOptions.find(m => Number(m.value) === item.month)?.label ?? ''})`;
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary-600" /> Pagamentos Recorrentes
          </h1>
          <p className="text-gray-600">Gerencie lembretes de contas fixas, assinaturas, anuidades, etc.</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Novo Pagamento Recorrente
        </Button>
      </div>

      {/* Abas de navegação */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'ALL', label: 'Todas', count: recurringPayments?.length || 0 },
            { key: 'DAILY', label: 'Diariamente', count: recurringPayments?.filter(p => p.recurrenceType === 'DAILY').length || 0 },
            { key: 'WEEKLY', label: 'Semanal', count: recurringPayments?.filter(p => p.recurrenceType === 'WEEKLY').length || 0 },
            { key: 'MONTHLY', label: 'Mensal', count: recurringPayments?.filter(p => p.recurrenceType === 'MONTHLY').length || 0 },
            { key: 'ANNUAL', label: 'Anual', count: recurringPayments?.filter(p => p.recurrenceType === 'ANNUAL').length || 0 },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${activeTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
              <span className={`
                ml-2 px-2 py-0.5 text-xs rounded-full
                ${activeTab === tab.key
                  ? 'bg-primary-100 text-primary-600'
                  : 'bg-gray-100 text-gray-500'
                }
              `}>
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Cabeçalho informativo da aba */}
      {!isLoading && filteredPayments.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Ordenação:</strong> {
              activeTab === 'ALL' ? 'Por tipo de recorrência e critério específico' :
              activeTab === 'DAILY' ? 'Por título (ordem alfabética)' :
              activeTab === 'WEEKLY' ? 'Por dia da semana (Domingo → Sábado)' :
              activeTab === 'MONTHLY' ? 'Por dia do mês (1 → 31)' :
              'Por mês e dia (Janeiro → Dezembro)'
            }
          </p>
        </div>
      )}

      {/* Listagem */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Desktop: Cabeçalho da tabela */}
          <div className="hidden md:block bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
              <div className="col-span-3">Título</div>
              <div className="col-span-2">Recorrência</div>
              <div className="col-span-2">Método de Pagamento</div>
              <div className="col-span-2">Unidade</div>
              <div className="col-span-2">Criado em</div>
              <div className="col-span-1 text-center">Ações</div>
            </div>
          </div>

          {/* Lista de itens */}
          <div className="divide-y divide-gray-200">
            {filteredPayments.map((item) => (
              <div key={item.id} className="px-4 md:px-6 py-4 hover:bg-gray-50 transition-colors">
                {/* Desktop Layout */}
                <div className="hidden md:grid md:grid-cols-12 md:gap-4 md:items-center">
                  {/* Título */}
                  <div className="col-span-3">
                    <div className="flex items-center">
                      <div className="p-2 bg-primary-100 rounded-lg mr-3">
                        <Calendar className="h-4 w-4 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{item.title}</h3>
                        {/* Indicador de ordenação */}
                        {activeTab === 'WEEKLY' && item.weekday !== undefined && (
                          <p className="text-xs text-primary-600 font-medium">
                            {weekdayOptions.find(w => Number(w.value) === item.weekday)?.label}
                          </p>
                        )}
                        {activeTab === 'MONTHLY' && item.day !== undefined && (
                          <p className="text-xs text-primary-600 font-medium">
                            Dia {item.day} do mês
                          </p>
                        )}
                        {activeTab === 'ANNUAL' && item.day !== undefined && item.month !== undefined && (
                          <p className="text-xs text-primary-600 font-medium">
                            {monthOptions.find(m => Number(m.value) === item.month)?.label} - Dia {item.day}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Recorrência */}
                  <div className="col-span-2">
                    <span className="text-sm text-gray-600">{renderRecurrence(item)}</span>
                  </div>

                  {/* Método de Pagamento */}
                  <div className="col-span-2">
                    <span className="text-sm text-gray-600">
                      {item.paymentMethod ? item.paymentMethod.name : '-'}
                    </span>
                  </div>

                  {/* Unidade */}
                  <div className="col-span-2">
                    {item.unidade ? (
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 text-primary-600 mr-2" />
                        <div className="text-sm text-gray-600">
                          <div className="font-medium">{item.unidade.nome}</div>
                          <div className="text-xs text-gray-500">{item.unidade.local}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </div>

                  {/* Data de Criação */}
                  <div className="col-span-2">
                    <span className="text-sm text-gray-600">
                      {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  {/* Ações */}
                  <div className="col-span-1">
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => openViewModal(item)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(item)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mobile Layout */}
                <div className="md:hidden">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1">
                      <div className="p-2 bg-primary-100 rounded-lg mr-3 mt-1">
                        <Calendar className="h-4 w-4 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-sm">{item.title}</h3>
                        <p className="text-xs text-gray-600 mt-1">{renderRecurrence(item)}</p>
                        
                        {/* Indicador de ordenação mobile */}
                        {activeTab === 'WEEKLY' && item.weekday !== undefined && (
                          <p className="text-xs text-primary-600 font-medium mt-1">
                            {weekdayOptions.find(w => Number(w.value) === item.weekday)?.label}
                          </p>
                        )}
                        {activeTab === 'MONTHLY' && item.day !== undefined && (
                          <p className="text-xs text-primary-600 font-medium mt-1">
                            Dia {item.day} do mês
                          </p>
                        )}
                        {activeTab === 'ANNUAL' && item.day !== undefined && item.month !== undefined && (
                          <p className="text-xs text-primary-600 font-medium mt-1">
                            {monthOptions.find(m => Number(m.value) === item.month)?.label} - Dia {item.day}
                          </p>
                        )}

                        {/* Informações adicionais mobile */}
                        <div className="mt-2 space-y-1">
                          {item.paymentMethod && (
                            <p className="text-xs text-gray-500">
                              <span className="font-medium">Método:</span> {item.paymentMethod.name}
                            </p>
                          )}
                          {item.unidade && (
                            <div className="flex items-center">
                              <Building2 className="h-3 w-3 text-primary-600 mr-1" />
                              <p className="text-xs text-gray-500">
                                <span className="font-medium">{item.unidade.nome}</span> • {item.unidade.local}
                              </p>
                            </div>
                          )}
                          <p className="text-xs text-gray-400">
                            Criado em {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Ações mobile */}
                    <div className="flex items-center space-x-1 ml-2">
                      <button
                        onClick={() => openViewModal(item)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(item)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredPayments.length === 0 && !isLoading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'ALL' 
                ? 'Nenhum pagamento recorrente encontrado'
                : `Nenhum pagamento ${activeTab === 'DAILY' ? 'diário' : activeTab === 'WEEKLY' ? 'semanal' : activeTab === 'MONTHLY' ? 'mensal' : 'anual'} encontrado`
              }
            </h3>
            <p className="text-gray-500 mb-4">
              {activeTab === 'ALL'
                ? 'Comece criando seu primeiro pagamento recorrente para organizar suas contas fixas.'
                : `Não há pagamentos ${activeTab === 'DAILY' ? 'diários' : activeTab === 'WEEKLY' ? 'semanais' : activeTab === 'MONTHLY' ? 'mensais' : 'anuais'} cadastrados.`
              }
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {activeTab === 'ALL' ? 'Criar Primeiro Pagamento Recorrente' : 'Criar Novo Pagamento Recorrente'}
            </Button>
          </div>
        </div>
      )}

      {/* Modal de cadastro */}
      <RecurringPaymentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateRecurringPayment}
        paymentMethods={paymentMethods}
        unidades={unidades}
        isLoading={createMutation.isLoading}
      />

      {/* Modal de edição */}
      {selectedPayment && (
        <RecurringPaymentModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedPayment(null);
          }}
          onSubmit={handleEditRecurringPayment}
          paymentMethods={paymentMethods}
          unidades={unidades}
          isLoading={updateMutation.isLoading}
          initialData={selectedPayment}
          isEdit={true}
        />
      )}

      {/* Modal de visualização */}
      {selectedPayment && (
        <ViewRecurringPaymentModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedPayment(null);
          }}
          payment={selectedPayment}
        />
      )}

      {/* Modal de confirmação de exclusão */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => {
        setIsDeleteModalOpen(false);
        setSelectedPayment(null);
      }} title="Confirmar Exclusão">
        <div className="space-y-4">
          <p className="text-gray-600">
            Tem certeza que deseja excluir o pagamento recorrente <strong>"{selectedPayment?.title}"</strong>?
          </p>
          <p className="text-sm text-gray-500">
            Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedPayment(null);
              }}
            >
              Cancelar
            </Button>
            <Button 
              type="button" 
              variant="danger" 
              onClick={handleDeleteRecurringPayment}
              loading={deleteMutation.isLoading}
            >
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

interface RecurringPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRecurringPaymentRequest | Partial<CreateRecurringPaymentRequest>) => void;
  paymentMethods: PaymentMethod[];
  unidades: Unidade[];
  isLoading: boolean;
  initialData?: RecurringPayment;
  isEdit?: boolean;
}

interface ViewRecurringPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: RecurringPayment;
}

const RecurringPaymentModal: React.FC<RecurringPaymentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  paymentMethods,
  unidades,
  isLoading,
  initialData,
  isEdit = false,
}) => {
  const [form, setForm] = useState<CreateRecurringPaymentRequest>({
    title: '',
    recurrenceType: 'MONTHLY',
    weekday: undefined,
    day: undefined,
    month: undefined,
    paymentMethodId: '',
    unidadeId: '',
  });

  // Preencher formulário com dados iniciais quando editar
  React.useEffect(() => {
    if (initialData && isEdit) {
      setForm({
        title: initialData.title,
        recurrenceType: initialData.recurrenceType,
        weekday: initialData.weekday,
        day: initialData.day,
        month: initialData.month,
        paymentMethodId: initialData.paymentMethod?.id || '',
        unidadeId: initialData.unidade?.id || '',
      });
    } else if (!isEdit) {
      // Reset form for create
      setForm({
        title: '',
        recurrenceType: 'MONTHLY',
        weekday: undefined,
        day: undefined,
        month: undefined,
        paymentMethodId: '',
        unidadeId: '',
      });
    }
  }, [initialData, isEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: (name === 'weekday' || name === 'day' || name === 'month') ? (value ? Number(value) : undefined) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.paymentMethodId) delete payload.paymentMethodId;
    if (!payload.unidadeId) delete payload.unidadeId;
    onSubmit(payload);
    setForm({ 
      title: '', 
      recurrenceType: 'MONTHLY', 
      weekday: undefined, 
      day: undefined, 
      month: undefined, 
      paymentMethodId: '',
      unidadeId: '',
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "Editar Pagamento Recorrente" : "Novo Pagamento Recorrente"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Título"
          name="title"
          placeholder="Ex: Aluguel, Netflix, Seguro"
          value={form.title}
          onChange={handleChange}
          required
        />
        <Select
          label="Recorrência"
          name="recurrenceType"
          value={form.recurrenceType}
          onChange={handleChange}
          options={recurrenceOptions}
          required
        />
        {form.recurrenceType === 'WEEKLY' && (
          <Select
            label="Dia da Semana"
            name="weekday"
            value={form.weekday !== undefined ? String(form.weekday) : ''}
            onChange={handleChange}
            options={weekdayOptions}
            required
          />
        )}
        {form.recurrenceType === 'MONTHLY' && (
          <Input
            label="Dia do Mês"
            name="day"
            type="number"
            min={1}
            max={31}
            value={form.day ?? ''}
            onChange={handleChange}
            required
          />
        )}
        {form.recurrenceType === 'ANNUAL' && (
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Dia do Mês"
              name="day"
              type="number"
              min={1}
              max={31}
              value={form.day ?? ''}
              onChange={handleChange}
              required
            />
            <Select
              label="Mês"
              name="month"
              value={form.month !== undefined ? String(form.month) : ''}
              onChange={handleChange}
              options={monthOptions}
              required
            />
          </div>
        )}
        <Select
          label="Método de Pagamento"
          name="paymentMethodId"
          value={form.paymentMethodId || ''}
          onChange={handleChange}
          options={[
            { value: '', label: 'Nenhum' },
            ...paymentMethods.map(pm => ({ value: pm.id, label: pm.name })),
          ]}
        />
        <Select
          label="Unidade (Opcional)"
          name="unidadeId"
          value={form.unidadeId || ''}
          onChange={handleChange}
          options={[
            { value: '', label: 'Nenhuma unidade' },
            ...unidades.map(unidade => ({ value: unidade.id, label: `${unidade.nome} - ${unidade.local}` })),
          ]}
        />
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={isLoading}>
            {isEdit ? 'Salvar' : 'Criar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const ViewRecurringPaymentModal: React.FC<ViewRecurringPaymentModalProps> = ({
  isOpen,
  onClose,
  payment,
}) => {
  const renderRecurrence = (item: RecurringPayment) => {
    switch (item.recurrenceType) {
      case 'DAILY':
        return 'Diário';
      case 'WEEKLY':
        return `Semanal (toda ${weekdayOptions.find(w => Number(w.value) === item.weekday)?.label ?? ''})`;
      case 'MONTHLY':
        return `Mensal (todo dia ${item.day})`;
      case 'ANNUAL':
        return `Anual (todo dia ${item.day} de ${monthOptions.find(m => Number(m.value) === item.month)?.label ?? ''})`;
      default:
        return '';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalhes do Pagamento Recorrente">
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{payment.title}</h3>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-primary-600 mr-2" />
              <span className="text-sm text-gray-600">
                <strong>Recorrência:</strong> {renderRecurrence(payment)}
              </span>
            </div>

            {payment.paymentMethod && (
              <div className="flex items-center">
                <span className="text-sm text-gray-600">
                  <strong>Método de Pagamento:</strong> {payment.paymentMethod.name}
                </span>
              </div>
            )}

            {payment.unidade && (
              <div className="flex items-center">
                <Building2 className="h-4 w-4 text-primary-600 mr-2" />
                <span className="text-sm text-gray-600">
                  <strong>Unidade:</strong> {payment.unidade.nome} - {payment.unidade.local}
                </span>
              </div>
            )}

            <div className="text-sm text-gray-500">
              <strong>Criado em:</strong> {new Date(payment.createdAt).toLocaleDateString('pt-BR')}
            </div>

            {payment.updatedAt && payment.updatedAt !== payment.createdAt && (
              <div className="text-sm text-gray-500">
                <strong>Atualizado em:</strong> {new Date(payment.updatedAt).toLocaleDateString('pt-BR')}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RecurringPayments; 