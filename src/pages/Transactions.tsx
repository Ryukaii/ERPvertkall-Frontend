import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle,
  XCircle,
  Building2,
  CreditCard,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  CheckSquare,
  Square
} from 'lucide-react';
import { format } from 'date-fns';
import apiService from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import { formatCurrency, formatDate, extractDateForForm, parseBackendDate } from '../utils/format';
import { BankTransaction, BankTransactionFilters } from '../types';
import { useForm } from 'react-hook-form';

const Transactions: React.FC = () => {
  const [filters, setFilters] = useState<BankTransactionFilters>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<BankTransaction | null>(null);
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    transaction: BankTransaction;
    message: string;
  } | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  
  // Multi-select state
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [bulkDeleteConfirmation, setBulkDeleteConfirmation] = useState<{
    transactions: BankTransaction[];
    message: string;
  } | null>(null);
  const [bulkEditModal, setBulkEditModal] = useState<{
    isOpen: boolean;
    transactions: BankTransaction[];
  } | null>(null);
  
  const queryClient = useQueryClient();

  // Queries
  const { data: banks } = useQuery(['banks'], () => apiService.getBanks());
  
  // Buscar todas as transações para cálculo de saldo
  const { data: allTransactionsData } = useQuery(
    ['allBankTransactions'],
    () => apiService.getAllBankTransactions(),
    {
      refetchInterval: 300000, // Refetch a cada 5 minutos
    }
  );
  
  const { data: transactionsData, isLoading, error } = useQuery(
    ['bankTransactions', selectedBank, filters],
    () => selectedBank === 'all' ? apiService.getAllBankTransactions(filters) : selectedBank ? apiService.getBankTransactions(selectedBank, filters) : null,
    {
      enabled: !!selectedBank,
      onSuccess: (data) => {
        console.log('Bank transactions data:', data);
      },
      onError: (error) => {
        console.error('Error fetching bank transactions:', error);
      }
    }
  );

  const { data: categories } = useQuery(['categories'], () => apiService.getCategories());
  const { data: paymentMethods } = useQuery(['paymentMethods'], () => apiService.getPaymentMethods());

  // Calcular saldo real de cada banco baseado nas transações
  const banksWithRealBalance = useMemo(() => {
    if (!banks || !allTransactionsData?.data) return banks || [];

    const allTransactions = allTransactionsData.data;

    return banks.map(bank => {
      const bankTransactions = allTransactions.filter(t => t.bankId === bank.id);
      
      // Debug: Log para o banco Sicoob Vertkall II
      if (bank.name === 'Sicoob Vertkall II') {
        console.log('Sicoob Vertkall II - Transações encontradas:', bankTransactions.length);
      }
      
      // Calcular saldo baseado nas transações
      const transactionBalance = bankTransactions.reduce((total, transaction) => {
        if (transaction.type === 'CREDIT') {
          return total + Number(transaction.amount);
        } else {
          return total - Number(transaction.amount);
        }
      }, 0);

      // Saldo real = saldo inicial + transações
      const realBalance = bank.balance + transactionBalance;

      // Debug: Log para o banco Sicoob Vertkall II
      if (bank.name === 'Sicoob Vertkall II') {
        console.log('Sicoob Vertkall II - Saldo calculado:', realBalance);
      }

      return {
        ...bank,
        balance: realBalance
      };
    });
  }, [banks, allTransactionsData]);

  // Mutations
  const createMutation = useMutation(
    (data: any) => {
      if (selectedBank === 'all') {
        throw new Error('Não é possível criar transações na visão "Todas as Contas". Selecione um banco específico.');
      }
      return apiService.createBankTransaction(selectedBank, data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['bankTransactions', selectedBank]);
        setIsCreateModalOpen(false);
      },
    }
  );

  const updateMutation = useMutation(
    (data: { id: string; data: any }) => {
      if (selectedBank === 'all') {
        throw new Error('Não é possível editar transações na visão "Todas as Contas". Selecione um banco específico.');
      }
      return apiService.updateBankTransaction(selectedBank, data.id, data.data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['bankTransactions', selectedBank]);
        setIsEditModalOpen(false);
        setSelectedTransaction(null);
      },
    }
  );

  const deleteMutation = useMutation(
    ({ id }: { id: string }) => {
      if (selectedBank === 'all') {
        throw new Error('Não é possível excluir transações na visão "Todas as Contas". Selecione um banco específico.');
      }
      return apiService.deleteBankTransaction(selectedBank, id);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['bankTransactions', selectedBank]);
        setDeleteConfirmation(null);
      },
    }
  );

  const updateStatusMutation = useMutation(
    ({ id, status }: { id: string; status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' }) => {
      if (selectedBank === 'all') {
        throw new Error('Não é possível alterar status na visão "Todas as Contas". Selecione um banco específico.');
      }
      return apiService.updateBankTransactionStatus(selectedBank, id, status);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['bankTransactions', selectedBank]);
      },
    }
  );

  const bulkDeleteMutation = useMutation(
    ({ ids }: { ids: string[] }) => {
      if (selectedBank === 'all') {
        throw new Error('Não é possível excluir transações na visão "Todas as Contas". Selecione um banco específico.');
      }
      // Delete transactions one by one (you might want to implement a bulk delete endpoint)
      return Promise.all(ids.map(id => apiService.deleteBankTransaction(selectedBank, id)));
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['bankTransactions', selectedBank]);
        setBulkDeleteConfirmation(null);
        setSelectedTransactions(new Set());
        setIsSelectMode(false);
      },
    }
  );

  const bulkUpdateMutation = useMutation(
    ({ ids, data }: { ids: string[]; data: any }) => {
      if (selectedBank === 'all') {
        throw new Error('Não é possível editar transações na visão "Todas as Contas". Selecione um banco específico.');
      }
      // Update transactions one by one (you might want to implement a bulk update endpoint)
      return Promise.all(ids.map(id => apiService.updateBankTransaction(selectedBank, id, data)));
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['bankTransactions', selectedBank]);
        setBulkEditModal(null);
        setSelectedTransactions(new Set());
        setIsSelectMode(false);
      },
    }
  );

  // Multi-select helper functions
  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    if (isSelectMode) {
      setSelectedTransactions(new Set());
    }
  };

  const toggleSelectAll = () => {
    if (selectedTransactions.size === transactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(transactions.map(t => t.id)));
    }
  };

  const toggleSelectTransaction = (transactionId: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId);
    } else {
      newSelected.add(transactionId);
    }
    setSelectedTransactions(newSelected);
  };

  const getSelectedTransactions = () => {
    return transactions.filter(t => selectedTransactions.has(t.id));
  };

  const handleBulkDelete = () => {
    const selected = getSelectedTransactions();
    setBulkDeleteConfirmation({
      transactions: selected,
      message: `Tem certeza que deseja excluir ${selected.length} transação${selected.length > 1 ? 'ões' : ''}?`,
    });
  };

  const handleBulkEdit = () => {
    const selected = getSelectedTransactions();
    setBulkEditModal({
      isOpen: true,
      transactions: selected,
    });
  };

  const handleConfirmBulkDelete = () => {
    if (bulkDeleteConfirmation) {
      bulkDeleteMutation.mutate({
        ids: bulkDeleteConfirmation.transactions.map(t => t.id),
      });
    }
  };

  const handleConfirmBulkEdit = (data: any) => {
    if (bulkEditModal) {
      bulkUpdateMutation.mutate({
        ids: bulkEditModal.transactions.map(t => t.id),
        data,
      });
    }
  };

  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm,
    }));
    // Clear selection when applying new filters
    setSelectedTransactions(new Set());
    setIsSelectMode(false);
  };

  const handleFilterChange = (key: keyof BankTransactionFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleBankChange = (bankId: string) => {
    setSelectedBank(bankId);
    setFilters({}); // Reset filters when changing bank
    setSelectedTransactions(new Set()); // Clear selection when changing bank
    setIsSelectMode(false); // Exit select mode when changing bank
  };

  const handleCreateTransaction = (data: any) => {
    createMutation.mutate(data);
  };

  const handleEditTransaction = (transaction: BankTransaction) => {
    setSelectedTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleUpdateTransaction = (data: any) => {
    if (selectedTransaction) {
      updateMutation.mutate({ id: selectedTransaction.id, data });
    }
  };

  const handleDeleteTransaction = (transaction: BankTransaction) => {
    setDeleteConfirmation({
      transaction: transaction,
      message: `Tem certeza que deseja excluir a transação "${transaction.title}"?`,
    });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmation) {
      deleteMutation.mutate({
        id: deleteConfirmation.transaction.id,
      });
    }
  };

  const handleStatusChange = (transactionId: string, newStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED') => {
    updateStatusMutation.mutate({ id: transactionId, status: newStatus });
  };

  // Função para ordenar as transações
  const sortTransactions = (transactions: BankTransaction[]) => {
    if (!sortConfig) return transactions;

    return [...transactions].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'transactionDate':
          aValue = parseBackendDate(a.transactionDate);
          bValue = parseBackendDate(b.transactionDate);
          break;
        case 'status':
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        case 'category':
          aValue = a.category?.name?.toLowerCase() || '';
          bValue = b.category?.name?.toLowerCase() || '';
          break;
        case 'bank':
          aValue = a.bank?.name?.toLowerCase() || '';
          bValue = b.bank?.name?.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Função para lidar com o clique no cabeçalho da coluna
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };

  // Função para obter o ícone de ordenação
  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronsUpDown className="h-4 w-4 text-gray-400" />;
    }
    
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-primary-600" />
      : <ChevronDown className="h-4 w-4 text-primary-600" />;
  };

  const transactions = sortTransactions(transactionsData?.data || []);

  const getAccountTypeIcon = (accountType: string) => {
    switch (accountType) {
      case 'CREDIT':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Building2 className="h-4 w-4" />;
    }
  };

  const getAccountTypeLabel = (accountType: string) => {
    switch (accountType) {
      case 'CHECKING':
        return 'Conta Corrente';
      case 'SAVINGS':
        return 'Conta Poupança';
      case 'INVESTMENT':
        return 'Conta de Investimento';
      case 'CREDIT':
        return 'Cartão de Crédito';
      default:
        return accountType;
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transações Bancárias</h1>
          <p className="text-gray-600">Gerencie suas transações bancárias</p>
        </div>
        <div className="flex items-center space-x-3">
          {selectedBank && selectedBank !== 'all' && (
            <Button 
              variant={isSelectMode ? "primary" : "secondary"}
              onClick={toggleSelectMode}
              className="flex items-center space-x-2"
            >
              {isSelectMode ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              <span>{isSelectMode ? 'Sair da Seleção' : 'Seleção Múltipla'}</span>
            </Button>
          )}
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            disabled={!selectedBank || selectedBank === 'all'}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Bank Selection */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Selecionar Conta Bancária</h3>
        
        {/* Option for All Banks */}
        <div className="mb-4">
          <div
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedBank === 'all'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleBankChange('all')}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4" />
                <span className="font-medium text-gray-900">Todas as Contas</span>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                Visão Geral
              </span>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <div>Visualizar transações de todos os bancos</div>
              <div>Filtros aplicados globalmente</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {banksWithRealBalance?.map((bank) => (
            <div
              key={bank.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedBank === bank.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleBankChange(bank.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getAccountTypeIcon(bank.accountType)}
                  <span className="font-medium text-gray-900">{bank.name}</span>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  bank.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {bank.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Conta: {bank.accountNumber}</div>
                <div>Tipo: {getAccountTypeLabel(bank.accountType)}</div>
                <div>Titular: {bank.holderName}</div>
                <div className="font-medium text-gray-900">
                  Saldo: {formatCurrency(bank.balance)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      {selectedBank && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <Input
              placeholder="Buscar transações..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearch()}
            />
            <Select
              placeholder="Tipo"
              options={[
                { value: '', label: 'Todos os tipos' },
                { value: 'CREDIT', label: 'Crédito' },
                { value: 'DEBIT', label: 'Débito' },
              ]}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('type', e.target.value)}
            />
            <Select
              placeholder="Status"
              options={[
                { value: '', label: 'Todos os status' },
                { value: 'PENDING', label: 'Pendente' },
                { value: 'CONFIRMED', label: 'Confirmado' },
                { value: 'CANCELLED', label: 'Cancelado' },
              ]}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('status', e.target.value)}
            />
            <Select
              placeholder="Categoria"
              options={[
                { value: '', label: 'Todas as categorias' },
                ...(categories?.map((cat: any) => ({ value: cat.id, label: cat.name })) || []),
              ]}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange('categoryId', e.target.value)}
            />
            <Input
              type="date"
              placeholder="Data inicial"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('startDate', e.target.value)}
            />
            <Input
              type="date"
              placeholder="Data final"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
          
          {/* Filter Actions */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {filters.startDate || filters.endDate ? (
                  <span>
                    Período: {filters.startDate ? `de ${formatDate(filters.startDate)}` : ''} 
                    {filters.endDate ? ` até ${formatDate(filters.endDate)}` : ''}
                  </span>
                ) : (
                  <span>Todos os períodos</span>
                )}
              </div>
              
              {/* Ordenação Ativa */}
              {sortConfig && (
                <div className="text-sm text-primary-600 flex items-center gap-2">
                  <span>
                    Ordenado por: {sortConfig.key === 'title' ? 'Transação' :
                                      sortConfig.key === 'amount' ? 'Valor' :
                                      sortConfig.key === 'transactionDate' ? 'Data' :
                                      sortConfig.key === 'status' ? 'Status' :
                                      sortConfig.key === 'category' ? 'Categoria' :
                                      sortConfig.key === 'bank' ? 'Banco' : sortConfig.key}
                    ({sortConfig.direction === 'asc' ? 'Crescente' : 'Decrescente'})
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSortConfig(null)}
                    className="text-xs"
                  >
                    Limpar
                  </Button>
                </div>
              )}
              
              {/* Quick Date Presets */}
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                    setFilters(prev => ({
                      ...prev,
                      startDate: format(startOfMonth, 'yyyy-MM-dd'),
                      endDate: format(today, 'yyyy-MM-dd')
                    }));
                  }}
                >
                  Este Mês
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    const startOfWeek = new Date(today);
                    startOfWeek.setDate(today.getDate() - today.getDay());
                    setFilters(prev => ({
                      ...prev,
                      startDate: format(startOfWeek, 'yyyy-MM-dd'),
                      endDate: format(today, 'yyyy-MM-dd')
                    }));
                  }}
                >
                  Esta Semana
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    const thirtyDaysAgo = new Date(today);
                    thirtyDaysAgo.setDate(today.getDate() - 30);
                    setFilters(prev => ({
                      ...prev,
                      startDate: format(thirtyDaysAgo, 'yyyy-MM-dd'),
                      endDate: format(today, 'yyyy-MM-dd')
                    }));
                  }}
                >
                  Últimos 30 dias
                </Button>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setFilters({});
                  setSearchTerm('');
                  setSelectedTransactions(new Set());
                  setIsSelectMode(false);
                }}
              >
                Limpar Filtros
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSearch}
              >
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {selectedBank && transactions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Transações</p>
                <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Créditos</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(transactions
                    .filter(t => t.type === 'CREDIT')
                    .reduce((sum, t) => sum + t.amount, 0)
                  )}
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Débitos</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(transactions
                    .filter(t => t.type === 'DEBIT')
                    .reduce((sum, t) => sum + t.amount, 0)
                  )}
                </p>
              </div>
              <div className="p-2 bg-red-100 rounded-full">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Saldo do Período</p>
                <p className={`text-2xl font-bold ${
                  (transactions
                    .filter(t => t.type === 'CREDIT')
                    .reduce((sum, t) => sum + t.amount, 0) -
                  transactions
                    .filter(t => t.type === 'DEBIT')
                    .reduce((sum, t) => sum + t.amount, 0)) >= 0 
                  ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(
                    transactions
                      .filter(t => t.type === 'CREDIT')
                      .reduce((sum, t) => sum + t.amount, 0) -
                    transactions
                      .filter(t => t.type === 'DEBIT')
                      .reduce((sum, t) => sum + t.amount, 0)
                  )}
                </p>
              </div>
              <div className="p-2 bg-gray-100 rounded-full">
                <CreditCard className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {isSelectMode && selectedTransactions.size > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <CheckSquare className="h-5 w-5 text-primary-600" />
                <span className="text-sm font-medium text-primary-900">
                  {selectedTransactions.size} transação{selectedTransactions.size > 1 ? 'ões' : ''} selecionada{selectedTransactions.size > 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="text-sm text-primary-700">
                Total selecionado: {formatCurrency(
                  getSelectedTransactions()
                    .reduce((sum, t) => sum + (t.type === 'CREDIT' ? t.amount : -t.amount), 0)
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedTransactions(new Set());
                }}
              >
                Desmarcar Todas
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleBulkEdit}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar Selecionadas ({selectedTransactions.size})
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Selecionadas ({selectedTransactions.size})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Transactions List */}
      {selectedBank ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-red-600">Erro ao carregar transações: {(error as any).message}</div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Nenhuma transação encontrada</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {isSelectMode && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <button
                            onClick={toggleSelectAll}
                            className="flex items-center justify-center w-4 h-4 text-primary-600 hover:text-primary-800"
                            title={selectedTransactions.size === transactions.length ? 'Desmarcar todas' : 'Marcar todas'}
                          >
                            {selectedTransactions.size === transactions.length ? (
                              <CheckSquare className="h-4 w-4" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </th>
                    )}
                    <th 
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${
                        sortConfig?.key === 'title' ? 'bg-primary-50 text-primary-700' : ''
                      }`}
                      onClick={() => handleSort('title')}
                      title="Clique para ordenar por Transação"
                    >
                      <div className="flex items-center gap-2">
                        Transação
                        {getSortIcon('title')}
                      </div>
                    </th>
                    <th 
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${
                        sortConfig?.key === 'amount' ? 'bg-primary-50 text-primary-700' : ''
                      }`}
                      onClick={() => handleSort('amount')}
                      title="Clique para ordenar por Valor"
                    >
                      <div className="flex items-center gap-2">
                        Valor
                        {getSortIcon('amount')}
                      </div>
                    </th>
                    <th 
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${
                        sortConfig?.key === 'transactionDate' ? 'bg-primary-50 text-primary-700' : ''
                      }`}
                      onClick={() => handleSort('transactionDate')}
                      title="Clique para ordenar por Data"
                    >
                      <div className="flex items-center gap-2">
                        Data
                        {getSortIcon('transactionDate')}
                      </div>
                    </th>
                    <th 
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${
                        sortConfig?.key === 'status' ? 'bg-primary-50 text-primary-700' : ''
                      }`}
                      onClick={() => handleSort('status')}
                      title="Clique para ordenar por Status"
                    >
                      <div className="flex items-center gap-2">
                        Status
                        {getSortIcon('status')}
                      </div>
                    </th>
                    <th 
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${
                        sortConfig?.key === 'category' ? 'bg-primary-50 text-primary-700' : ''
                      }`}
                      onClick={() => handleSort('category')}
                      title="Clique para ordenar por Categoria"
                    >
                      <div className="flex items-center gap-2">
                        Categoria
                        {getSortIcon('category')}
                      </div>
                    </th>
                    <th 
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${
                        sortConfig?.key === 'bank' ? 'bg-primary-50 text-primary-700' : ''
                      }`}
                      onClick={() => handleSort('bank')}
                      title="Clique para ordenar por Banco"
                    >
                      <div className="flex items-center gap-2">
                        Banco
                        {getSortIcon('bank')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className={`hover:bg-gray-50 ${selectedTransactions.has(transaction.id) ? 'bg-primary-50' : ''}`}>
                      {isSelectMode && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <button
                              onClick={() => toggleSelectTransaction(transaction.id)}
                              className="flex items-center justify-center w-4 h-4 text-primary-600 hover:text-primary-800"
                              title={selectedTransactions.has(transaction.id) ? 'Desmarcar' : 'Marcar'}
                            >
                              {selectedTransactions.has(transaction.id) ? (
                                <CheckSquare className="h-4 w-4" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 break-words">
                            {transaction.title}
                          </div>
                          {transaction.description && (
                            <div className="text-sm text-gray-500 break-words mt-1">
                              {transaction.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'CREDIT' ? '+' : '-'} {formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(transaction.transactionDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                          transaction.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {transaction.status === 'CONFIRMED' ? 'Confirmado' :
                           transaction.status === 'CANCELLED' ? 'Cancelado' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="break-words">
                          {transaction.category?.name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getAccountTypeIcon(transaction.bank?.accountType || 'CHECKING')}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {transaction.bank?.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {transaction.bank?.accountNumber}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {selectedBank !== 'all' && (
                            <>
                              {transaction.status === 'PENDING' && (
                                <button
                                  onClick={() => handleStatusChange(transaction.id, 'CONFIRMED')}
                                  className="text-green-600 hover:text-green-900"
                                  title="Confirmar transação"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                              )}
                              {transaction.status === 'CONFIRMED' && (
                                <button
                                  onClick={() => handleStatusChange(transaction.id, 'PENDING')}
                                  className="text-orange-600 hover:text-orange-900"
                                  title="Marcar como pendente"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleEditTransaction(transaction)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTransaction(transaction)}
                                className="text-red-600 hover:text-red-900"
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {selectedBank === 'all' && (
                            <span className="text-xs text-gray-500">
                              Selecione um banco para editar
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <div className="text-gray-500">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione uma conta bancária</h3>
            <p className="text-gray-600">Escolha "Todas as Contas" para uma visão geral ou uma conta específica para gerenciar transações</p>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {bulkEditModal && (
        <Modal
          isOpen={bulkEditModal.isOpen}
          onClose={() => setBulkEditModal(null)}
          title="Editar Transações em Lote"
          size="lg"
        >
          <BulkEditForm
            transactions={bulkEditModal.transactions}
            categories={categories || []}
            paymentMethods={paymentMethods || []}
            onSubmit={handleConfirmBulkEdit}
            onCancel={() => setBulkEditModal(null)}
            isLoading={bulkUpdateMutation.isLoading}
          />
        </Modal>
      )}

      {/* Create Transaction Modal */}
      {selectedBank && (
        <BankTransactionModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateTransaction}
          categories={categories || []}
          paymentMethods={paymentMethods || []}
          isLoading={createMutation.isLoading}
        />
      )}

      {/* Edit Transaction Modal */}
      {selectedTransaction && (
        <BankTransactionModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedTransaction(null);
          }}
          onSubmit={handleUpdateTransaction}
          transaction={selectedTransaction}
          categories={categories || []}
          paymentMethods={paymentMethods || []}
          isLoading={updateMutation.isLoading}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <Modal
          isOpen={!!deleteConfirmation}
          onClose={() => setDeleteConfirmation(null)}
          title="Confirmar Exclusão"
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Excluir Transação
                </h3>
                <p className="text-gray-700 mb-4">
                  {deleteConfirmation.message}
                </p>
                
                {/* Informações da transação */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Título:</span>
                      <span className="text-sm font-medium">{deleteConfirmation.transaction.title}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Valor:</span>
                      <span className={`text-sm font-medium ${
                        deleteConfirmation.transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {deleteConfirmation.transaction.type === 'CREDIT' ? '+' : '-'} {formatCurrency(deleteConfirmation.transaction.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Data:</span>
                      <span className="text-sm font-medium">{formatDate(deleteConfirmation.transaction.transactionDate)}</span>
                    </div>
                    {deleteConfirmation.transaction.category?.name && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Categoria:</span>
                        <span className="text-sm font-medium">{deleteConfirmation.transaction.category.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  Esta ação não pode ser desfeita. A transação será permanentemente removida.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setDeleteConfirmation(null)}
              >
                Cancelar
              </Button>
              <Button 
                type="button" 
                variant="danger"
                onClick={() => handleConfirmDelete()}
                loading={deleteMutation.isLoading}
              >
                Excluir Transação
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteConfirmation && (
        <Modal
          isOpen={!!bulkDeleteConfirmation}
          onClose={() => setBulkDeleteConfirmation(null)}
          title="Confirmar Exclusão em Lote"
          size="lg"
        >
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Excluir Transações em Lote
                </h3>
                <p className="text-gray-700 mb-4">
                  {bulkDeleteConfirmation.message}
                </p>
                
                {/* Lista das transações selecionadas */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4 max-h-60 overflow-y-auto">
                  <div className="space-y-2">
                    {bulkDeleteConfirmation.transactions.map((transaction) => (
                      <div key={transaction.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">{transaction.title}</div>
                          <div className="text-xs text-gray-500">{formatDate(transaction.transactionDate)}</div>
                        </div>
                        <div className="text-sm font-medium text-right">
                          <span className={`${
                            transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'CREDIT' ? '+' : '-'} {formatCurrency(transaction.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resumo financeiro */}
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Resumo Financeiro</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Total de Créditos:</span>
                      <span className="text-green-600 font-medium">
                        {formatCurrency(
                          bulkDeleteConfirmation.transactions
                            .filter(t => t.type === 'CREDIT')
                            .reduce((sum, t) => sum + t.amount, 0)
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Total de Débitos:</span>
                      <span className="text-red-600 font-medium">
                        {formatCurrency(
                          bulkDeleteConfirmation.transactions
                            .filter(t => t.type === 'DEBIT')
                            .reduce((sum, t) => sum + t.amount, 0)
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-blue-200 pt-1">
                      <span className="text-blue-900 font-medium">Saldo Total:</span>
                      <span className={`font-medium ${
                        (bulkDeleteConfirmation.transactions
                          .filter(t => t.type === 'CREDIT')
                          .reduce((sum, t) => sum + t.amount, 0) -
                        bulkDeleteConfirmation.transactions
                          .filter(t => t.type === 'DEBIT')
                          .reduce((sum, t) => sum + t.amount, 0)) >= 0 
                        ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(
                          bulkDeleteConfirmation.transactions
                            .filter(t => t.type === 'CREDIT')
                            .reduce((sum, t) => sum + t.amount, 0) -
                          bulkDeleteConfirmation.transactions
                            .filter(t => t.type === 'DEBIT')
                            .reduce((sum, t) => sum + t.amount, 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  Esta ação não pode ser desfeita. Todas as transações selecionadas serão permanentemente removidas.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setBulkDeleteConfirmation(null)}
              >
                Cancelar
              </Button>
              <Button 
                type="button" 
                variant="danger"
                onClick={() => handleConfirmBulkDelete()}
                loading={bulkDeleteMutation.isLoading}
              >
                Excluir {bulkDeleteConfirmation.transactions.length} Transação{bulkDeleteConfirmation.transactions.length > 1 ? 'ões' : ''}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

// Bank Transaction Modal Component
interface BankTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  transaction?: BankTransaction;
  categories: any[];
  paymentMethods: any[];
  isLoading: boolean;
}

const BankTransactionModal: React.FC<BankTransactionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  transaction,
  categories,
  paymentMethods,
  isLoading,
}) => {
  
  // Função para formatar valor em moeda brasileira
  const formatCurrencyInput = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Se não há números, retorna vazio
    if (numbers === '') return '';
    
    // Converte para centavos
    const cents = parseInt(numbers);
    
    // Formata como moeda brasileira
    const formatted = (cents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    
    return formatted;
  };

  // Função para formatar valor numérico para exibição (converte de centavos para reais)
  const formatNumericValue = (value: number): string => {
    // Converte de centavos para reais
    const reais = value / 100;
    return reais.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Função para converter valor formatado de volta para número (em centavos)
  const parseCurrencyValue = (value: string): number => {
    // Remove R$, espaços e pontos, mantém apenas vírgula como separador decimal
    const cleanValue = value.replace(/R\$\s?/g, '').replace(/\./g, '').replace(',', '.');
    const reais = parseFloat(cleanValue) || 0;
    // Converte para centavos
    return Math.round(reais * 100);
  };

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    defaultValues: transaction ? {
      title: transaction.title,
      description: transaction.description || '',
      amount: transaction.amount ? formatNumericValue(transaction.amount) : '',
      type: transaction.type,
      transactionDate: extractDateForForm(transaction.transactionDate),
      categoryId: transaction.categoryId || '',
      paymentMethodId: transaction.paymentMethodId || undefined,
    } : {
      type: 'DEBIT',
      transactionDate: format(new Date(), 'yyyy-MM-dd')
    }
  });

  // Formatar valor quando o modal abrir
  useEffect(() => {
    if (isOpen && transaction?.amount) {
      setValue('amount', formatNumericValue(transaction.amount));
    }
  }, [isOpen, transaction, setValue]);

  const handleFormSubmit = (data: any) => {
    // Converte o valor formatado de volta para número
    const submitData = {
      ...data,
      amount: parseCurrencyValue(data.amount)
    };

    // Remove campos vazios e campos que são apenas espaços em branco
    // EXCETO campos importantes que sempre devem ser enviados
    const importantFields = ['transactionDate', 'title', 'amount', 'type'];
    Object.keys(submitData).forEach(key => {
      // Não remove campos importantes
      if (importantFields.includes(key)) {
        return;
      }
      
      const value = submitData[key];
      if (value === '' || value === null || value === undefined) {
        delete submitData[key];
      } else if (typeof value === 'string' && value.trim() === '') {
        delete submitData[key];
      }
    });


    onSubmit(submitData);
    reset();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transaction ? 'Editar Transação Bancária' : 'Nova Transação Bancária'}
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Título"
            placeholder="Título da transação"
            error={errors.title?.message}
            {...register('title', { required: 'Título é obrigatório' })}
          />
          <Input
            label="Valor"
            type="text"
            placeholder="R$ 0,00"
            error={errors.amount?.message}
            onInput={(e) => {
              const target = e.target as HTMLInputElement;
              console.log('onInput - valor original:', target.value);
              const formattedValue = formatCurrencyInput(target.value);
              console.log('onInput - valor formatado:', formattedValue);
              setValue('amount', formattedValue);
            }}
            {...register('amount', { 
              required: 'Valor é obrigatório',
              validate: (value) => {
                if (!value || typeof value !== 'string') return 'Valor é obrigatório';
                const numericValue = parseCurrencyValue(value);
                if (numericValue <= 0) return 'Valor deve ser maior que zero';
                return true;
              }
            })}
          />
        </div>

        <Input
          label="Descrição"
          placeholder="Descrição da transação (opcional)"
          {...register('description')}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Tipo"
            options={[
              { value: 'CREDIT', label: 'Crédito (Entrada)' },
              { value: 'DEBIT', label: 'Débito (Saída)' },
            ]}
            error={errors.type?.message}
            {...register('type', { required: 'Tipo é obrigatório' })}
          />
          <Input
            label="Data da Transação"
            type="date"
            error={errors.transactionDate?.message}
            {...register('transactionDate', { required: 'Data da transação é obrigatória' })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Categoria"
            options={[
              { value: '', label: 'Selecione uma categoria' },
              ...categories.map(cat => ({ value: cat.id, label: cat.name })),
            ]}
            {...register('categoryId')}
          />
          <Select
            label="Método de Pagamento"
            options={[
              { value: '', label: 'Selecione um método' },
              ...paymentMethods.map(pm => ({ value: pm.id, label: pm.name })),
            ]}
            {...register('paymentMethodId')}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={isLoading}>
            {transaction ? 'Atualizar' : 'Criar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Bulk Edit Form Component
interface BulkEditFormProps {
  transactions: BankTransaction[];
  categories: any[];
  paymentMethods: any[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const BulkEditForm: React.FC<BulkEditFormProps> = ({
  transactions,
  categories,
  paymentMethods,
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      categoryId: '',
      paymentMethodId: '',
      status: '',
    }
  });

  const watchedFields = watch();

  const handleFormSubmit = (data: any) => {
    // Remove campos vazios
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (value === '' || value === null || value === undefined) {
        delete data[key];
      } else if (typeof value === 'string' && value.trim() === '') {
        delete data[key];
      }
    });

    // Só envia se há pelo menos um campo para atualizar
    if (Object.keys(data).length > 0) {
      onSubmit(data);
    }
  };

  // Verifica se há campos preenchidos
  const hasChanges = Object.values(watchedFields).some(value => value !== '');

  return (
    <div className="space-y-6">
      {/* Resumo das transações selecionadas */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          Transações Selecionadas ({transactions.length})
        </h4>
        <div className="text-sm text-blue-700 space-y-1">
          <div>• Apenas os campos preenchidos serão atualizados</div>
          <div>• Campos vazios manterão os valores originais</div>
          <div>• Todas as transações selecionadas receberão as mesmas alterações</div>
        </div>
      </div>

      {/* Lista das transações */}
      <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Transações que serão editadas:</h4>
        <div className="space-y-1">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex justify-between items-center py-1 text-sm">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{transaction.title}</div>
                <div className="text-gray-500">{formatDate(transaction.transactionDate)}</div>
              </div>
              <div className="text-right">
                <span className={`font-medium ${
                  transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'CREDIT' ? '+' : '-'} {formatCurrency(transaction.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Formulário de edição */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Categoria (opcional)"
            options={[
              { value: '', label: 'Manter categoria atual' },
              ...categories.map(cat => ({ value: cat.id, label: cat.name })),
            ]}
            {...register('categoryId')}
          />
          <Select
            label="Método de Pagamento (opcional)"
            options={[
              { value: '', label: 'Manter método atual' },
              ...paymentMethods.map(pm => ({ value: pm.id, label: pm.name })),
            ]}
            {...register('paymentMethodId')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Status (opcional)"
            options={[
              { value: '', label: 'Manter status atual' },
              { value: 'PENDING', label: 'Pendente' },
              { value: 'CONFIRMED', label: 'Confirmado' },
              { value: 'CANCELLED', label: 'Cancelado' },
            ]}
            {...register('status')}
          />
        </div>

        {/* Campos que podem ser editados em lote */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-900 mb-2">
            Campos que podem ser editados em lote:
          </h4>
          <div className="text-sm text-yellow-800 space-y-1">
            <div>• Categoria</div>
            <div>• Método de Pagamento</div>
            <div>• Status</div>
          </div>
          <div className="text-xs text-yellow-700 mt-2">
            <strong>Nota:</strong> Título, valor, data e tipo não podem ser alterados em lote por questões de segurança.
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            loading={isLoading}
            disabled={!hasChanges}
          >
            Atualizar {transactions.length} Transação{transactions.length > 1 ? 'ões' : ''}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Transactions; 