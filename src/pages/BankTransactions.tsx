import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Filter,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  CreditCard,
  User
} from 'lucide-react';

import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Select from '../components/ui/Select';
import Pagination from '../components/ui/Pagination';
import apiService from '../services/api';
import { 
  Bank, 
  BankTransaction, 
  CreateBankTransactionRequest,
  BankTransactionFilters,
  BankTransactionSummary,
  FinancialCategory,
  PaymentMethod
} from '../types';
import { formatCurrency, formatDate, extractDateForForm } from '../utils/format';

const BankTransactions: React.FC = () => {
  const { bankId } = useParams<{ bankId: string }>();
  const navigate = useNavigate();
  const [bank, setBank] = useState<Bank | null>(null);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [summary, setSummary] = useState<BankTransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<BankTransaction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<BankTransactionFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const [formData, setFormData] = useState<CreateBankTransactionRequest>({
    title: '',
    description: '',
    amount: 0,
    type: 'CREDIT',
    transactionDate: new Date().toISOString().split('T')[0],
    categoryId: '',
    paymentMethodId: ''
  });

  const transactionTypeLabels = {
    CREDIT: 'Crédito',
    DEBIT: 'Débito',
    TRANSFER: 'Transferência'
  };

  const statusLabels = {
    PENDING: 'Pendente',
    CONFIRMED: 'Confirmado',
    CANCELLED: 'Cancelado'
  };

  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800'
  };

  useEffect(() => {
    if (bankId) {
      loadBank();
      loadTransactions();
      loadCategories();
      loadPaymentMethods();
      loadSummary();
    }
  }, [bankId, currentPage, filters]);

  const loadBank = async () => {
    try {
      const data = await apiService.getBank(bankId!);
      setBank(data);
    } catch (error) {
      console.error('Erro ao carregar banco:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await apiService.getBankTransactions(bankId!, filters);
      setTransactions(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await apiService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const data = await apiService.getPaymentMethods();
      setPaymentMethods(data);
    } catch (error) {
      console.error('Erro ao carregar métodos de pagamento:', error);
    }
  };

  const loadSummary = async () => {
    try {
      const data = await apiService.getBankTransactionSummary(bankId!);
      setSummary(data);
    } catch (error) {
      console.error('Erro ao carregar resumo:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTransaction) {
        await apiService.updateBankTransaction(bankId!, editingTransaction.id, formData);
      } else {
        // Garantir que o tipo seja válido antes de enviar
        const transactionData = {
          ...formData,
          type: formData.type as 'CREDIT' | 'DEBIT' // Não permitir TRANSFER na criação manual
        };
        await apiService.createBankTransaction(bankId!, transactionData);
      }
      setShowModal(false);
      setEditingTransaction(null);
      resetForm();
      loadTransactions();
      loadSummary();
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
    }
  };

  const handleEdit = (transaction: BankTransaction) => {
    setEditingTransaction(transaction);
    setFormData({
      title: transaction.title,
      description: transaction.description || '',
      amount: transaction.amount,
      type: transaction.type as 'CREDIT' | 'DEBIT',
      transactionDate: extractDateForForm(transaction.transactionDate),
      categoryId: transaction.categoryId || '',
      paymentMethodId: transaction.paymentMethodId || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      try {
        await apiService.deleteBankTransaction(bankId!, id);
        loadTransactions();
        loadSummary();
      } catch (error) {
        console.error('Erro ao excluir transação:', error);
      }
    }
  };

  const handleStatusChange = async (id: string, status: 'PENDING' | 'CONFIRMED' | 'CANCELLED') => {
    try {
      await apiService.updateBankTransactionStatus(bankId!, id, status);
      loadTransactions();
      loadSummary();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      amount: 0,
      type: 'CREDIT',
      transactionDate: new Date().toISOString().split('T')[0],
      categoryId: '',
      paymentMethodId: ''
    });
  };

  const openCreateModal = () => {
    setEditingTransaction(null);
    resetForm();
    setShowModal(true);
  };

  const applyFilters = (newFilters: Partial<BankTransactionFilters>) => {
    setFilters({ ...filters, ...newFilters });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/financeiro/banks')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Minhas Transações - {bank?.name}
              </h1>
              <p className="text-gray-600">
                Conta: {bank?.accountNumber} | Saldo: {formatCurrency(bank?.balance || 0)}
              </p>
            </div>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Transação
          </Button>
        </div>

        {/* Aviso sobre transações pessoais */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <User className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-green-900">Suas Transações</h3>
              <p className="text-sm text-green-700">
                Estas são suas transações pessoais neste banco. Outros usuários têm suas próprias transações.
              </p>
            </div>
          </div>
        </div>

        {/* Resumo */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Créditos</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(summary.totalCredits)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <TrendingDown className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Débitos</p>
                  <p className="text-lg font-bold text-red-600">
                    {formatCurrency(summary.totalDebits)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Saldo Líquido</p>
                  <p className={`text-lg font-bold ${
                    summary.netAmount >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(summary.netAmount)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Transações</p>
                  <p className="text-lg font-bold text-purple-600">
                    {summary.transactionCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
            <Button
              variant="ghost"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <Select
                  value={filters.type || ''}
                  onChange={(e) => applyFilters({ type: e.target.value as any })}
                  options={[
                    { value: '', label: 'Todos' },
                    { value: 'CREDIT', label: 'Crédito' },
                    { value: 'DEBIT', label: 'Débito' }
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Select
                  value={filters.status || ''}
                  onChange={(e) => applyFilters({ status: e.target.value as any })}
                  options={[
                    { value: '', label: 'Todos' },
                    { value: 'PENDING', label: 'Pendente' },
                    { value: 'CONFIRMED', label: 'Confirmado' },
                    { value: 'CANCELLED', label: 'Cancelado' }
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <Select
                  value={filters.categoryId || ''}
                  onChange={(e) => applyFilters({ categoryId: e.target.value })}
                  options={[
                    { value: '', label: 'Todas' },
                    ...categories.map((category) => ({
                      value: category.id,
                      label: category.name
                    }))
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Inicial
                </label>
                <Input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => applyFilters({ startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Final
                </label>
                <Input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => applyFilters({ endDate: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters}>
                  Limpar Filtros
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Lista de Transações */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Transações</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Método
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.title}
                        </div>
                        {transaction.description && (
                          <div className="text-sm text-gray-500">
                            {transaction.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-bold ${
                        transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'CREDIT' ? '+' : '-'} {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {transactionTypeLabels[transaction.type]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        statusColors[transaction.status]
                      }`}>
                        {statusLabels[transaction.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.transactionDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.category?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.paymentMethod?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Select
                          value={transaction.status}
                          onChange={(e) => handleStatusChange(transaction.id, e.target.value as any)}
                          options={[
                            { value: 'PENDING', label: 'Pendente' },
                            { value: 'CONFIRMED', label: 'Confirmado' },
                            { value: 'CANCELLED', label: 'Cancelado' }
                          ]}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(transaction)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(transaction.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}

        {transactions.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma transação encontrada</h3>
            <p className="text-gray-600 mb-4">Comece adicionando sua primeira transação bancária</p>
            <Button onClick={openCreateModal}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Transação
            </Button>
          </div>
        )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingTransaction ? 'Editar Transação' : 'Nova Transação'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Depósito, Pagamento, Transferência"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição (opcional)
            </label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição detalhada da transação"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor (em centavos)
              </label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
                placeholder="100000 (R$ 1.000,00)"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo
              </label>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                options={[
                  { value: 'CREDIT', label: 'Crédito' },
                  { value: 'DEBIT', label: 'Débito' }
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data da Transação
            </label>
            <Input
              type="date"
              value={formData.transactionDate}
              onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <Select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                options={[
                  { value: '', label: 'Selecione uma categoria' },
                  ...categories.map((category) => ({
                    value: category.id,
                    label: category.name
                  }))
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Método de Pagamento
              </label>
              <Select
                value={formData.paymentMethodId}
                onChange={(e) => setFormData({ ...formData, paymentMethodId: e.target.value })}
                options={[
                  { value: '', label: 'Selecione um método' },
                  ...paymentMethods.map((method) => ({
                    value: method.id,
                    label: method.name
                  }))
                ]}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingTransaction ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BankTransactions; 