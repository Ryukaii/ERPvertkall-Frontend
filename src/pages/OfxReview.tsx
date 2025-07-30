import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Save,
  Target,
  DollarSign,
  Tag,
  Plus,
  X,
  ArrowRightLeft,
  Edit,
  Trash2
} from 'lucide-react';
import apiService from '../services/api';
import { 
  OfxPendingTransaction, 
  OfxPendingTransactionSummary,
  FinancialCategory,
  ApproveOfxImportResponse,
  Tag as TagType,
  PaymentMethod,
  CreateTransferRequest,
  Bank
} from '../types';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import Input from '../components/ui/Input';

const OfxReview: React.FC = () => {
  const { importId } = useParams<{ importId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [approving, setApproving] = useState(false);
  const [pendingTransactions, setPendingTransactions] = useState<OfxPendingTransaction[]>([]);
  const [summary, setSummary] = useState<OfxPendingTransactionSummary | null>(null);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);

  const [filter, setFilter] = useState<'all' | 'uncategorized' | 'no-payment-method'>('all');
  const [tags, setTags] = useState<TagType[]>([]);
  const [selectedTags, setSelectedTags] = useState<Map<string, string[]>>(new Map());
  const [showTagModal, setShowTagModal] = useState(false);
  const [currentTransactionId, setCurrentTransactionId] = useState<string>('');
  const [showCreateTagModal, setShowCreateTagModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showEditTransferModal, setShowEditTransferModal] = useState(false);
  const [showDeleteTransferModal, setShowDeleteTransferModal] = useState(false);
  const [selectedTransactionForTransfer, setSelectedTransactionForTransfer] = useState<OfxPendingTransaction | null>(null);
  const [selectedTransferForEdit, setSelectedTransferForEdit] = useState<OfxPendingTransaction | null>(null);
  const [selectedTransferForDelete, setSelectedTransferForDelete] = useState<OfxPendingTransaction | null>(null);
  const [createTagForm, setCreateTagForm] = useState({
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
    if (importId) {
      loadData();
    } else {
      navigate('/ofx-import');
    }
  }, [importId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [transactions, summaryData, categoriesData, tagsData, paymentMethodsData, banksData] = await Promise.all([
        apiService.getOfxPendingTransactionsByImport(importId!),
        apiService.getOfxPendingTransactionsSummary(importId!),
        apiService.getCategories(),
        apiService.getTags({ isActive: true }),
        apiService.getPaymentMethods(),
        apiService.getBanks()
      ]);
      
      // Debug logging
      console.log('Transactions received:', transactions);
      console.log('Transactions type:', typeof transactions);
      console.log('Transactions constructor:', transactions?.constructor?.name);
      console.log('Is Array?', Array.isArray(transactions));
      console.log('Summary received:', summaryData);
      console.log('Categories received:', categoriesData);
      console.log('Tags received:', tagsData);
      console.log('Payment Methods received:', paymentMethodsData);
      console.log('Banks received:', banksData);
      
      // Ensure transactions is an array
      if (!Array.isArray(transactions)) {
        console.error('Transactions is not an array:', transactions);
        console.error('Transactions structure:', JSON.stringify(transactions, null, 2));
        setPendingTransactions([]);
      } else {
        setPendingTransactions(transactions);
      }
      
      // Initialize tags for each transaction
      const initialTags = new Map<string, string[]>();
      transactions.forEach(transaction => {
        initialTags.set(transaction.id, transaction.tags?.map(tag => tag.id) || []);
      });
      setSelectedTags(initialTags);
      
      // Combine summary data
      const combinedSummary = {
        ...summaryData,
        totalTransactions: transactions.length,
        uncategorizedCount: transactions.filter(t => !t.suggestedCategoryId).length,
        categorizedCount: transactions.filter(t => t.suggestedCategoryId).length,
      };
      
      setSummary(combinedSummary);
      setCategories(categoriesData);
      setTags(tagsData.data || []);
      setPaymentMethods(paymentMethodsData);
      setBanks(banksData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = async (transactionId: string, categoryId: string) => {
    if (!categoryId) return;
    
    try {
      setSaving(prev => new Set(prev).add(transactionId));
      
      await apiService.updateOfxTransactionCategory(transactionId, { categoryId });
      
      setPendingTransactions(prev =>
        prev.map(transaction =>
          transaction.id === transactionId
            ? {
                ...transaction,
                suggestedCategoryId: categoryId,
                suggestedCategory: categories.find(cat => cat.id === categoryId)
              }
            : transaction
        )
      );
      
      // Remove from saving state after a delay to show the save indicator
      setTimeout(() => {
        setSaving(prev => {
          const newSet = new Set(prev);
          newSet.delete(transactionId);
          return newSet;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Erro ao atualizar categoria');
    }
  };

  const handlePaymentMethodChange = async (transactionId: string, paymentMethodId: string) => {
    if (!paymentMethodId) return;
    
    try {
      setSaving(prev => new Set(prev).add(transactionId));
      
      await apiService.updateOfxTransactionPaymentMethod(transactionId, { paymentMethodId });
      
      setPendingTransactions(prev =>
        prev.map(transaction =>
          transaction.id === transactionId
            ? {
                ...transaction,
                finalPaymentMethodId: paymentMethodId,
                suggestedPaymentMethod: paymentMethods.find(pm => pm.id === paymentMethodId)
              }
            : transaction
        )
      );
      
      // Remove from saving state after a delay to show the save indicator
      setTimeout(() => {
        setSaving(prev => {
          const newSet = new Set(prev);
          newSet.delete(transactionId);
          return newSet;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error updating payment method:', error);
      alert('Erro ao atualizar método de pagamento');
    }
  };

  const handleOpenTagModal = (transactionId: string) => {
    setCurrentTransactionId(transactionId);
    setShowTagModal(true);
  };

  const handleUpdateTags = async (transactionId: string, tagIds: string[]) => {
    try {
      setSaving(prev => new Set(prev).add(transactionId));
      
      await apiService.updateOfxTransactionTags(transactionId, { tagIds });
      
      setPendingTransactions(prev =>
        prev.map(transaction =>
          transaction.id === transactionId
            ? {
                ...transaction,
                tags: tags.filter(tag => tagIds.includes(tag.id))
              }
            : transaction
        )
      );
      
      setSelectedTags(prev => new Map(prev).set(transactionId, tagIds));
      
      setTimeout(() => {
        setSaving(prev => {
          const newSet = new Set(prev);
          newSet.delete(transactionId);
          return newSet;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error updating tags:', error);
      alert('Erro ao atualizar tags');
    }
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createTagForm.name.trim()) {
      alert('Nome da tag é obrigatório');
      return;
    }
    
    try {
      const newTag = await apiService.createTag(createTagForm);
      setTags(prev => [...prev, newTag]);
      setShowCreateTagModal(false);
      setCreateTagForm({ name: '', color: '#3B82F6', description: '', isActive: true });
      alert('Tag criada com sucesso!');
    } catch (error) {
      console.error('Error creating tag:', error);
      alert('Erro ao criar tag');
    }
  };

  const getTransactionTags = (transactionId: string) => {
    return selectedTags.get(transactionId) || [];
  };

  const handleApproveImport = async () => {
    if (!importId) return;
    
    try {
      setApproving(true);
      const response: ApproveOfxImportResponse = await apiService.approveOfxImport(importId);
      
      if (response.success) {
        alert(`Importação aprovada com sucesso! ${response.createdTransactionsCount} transações foram criadas.`);
        navigate('/ofx-import');
      } else {
        alert(`Erro na importação: ${response.message}`);
      }
    } catch (error) {
      console.error('Error approving import:', error);
      alert('Erro ao aprovar importação');
    } finally {
      setApproving(false);
    }
  };

  const handleCreateTransfer = async (data: CreateTransferRequest) => {
    if (!selectedTransactionForTransfer) return;
    
    try {
      setSaving(prev => new Set(prev).add(selectedTransactionForTransfer.id));
      
      // Criar a transferência
      await apiService.createTransfer(data);
      
      // Remover a transação pendente da lista
      setPendingTransactions(prev =>
        prev.filter(transaction => transaction.id !== selectedTransactionForTransfer.id)
      );
      
      setShowTransferModal(false);
      setSelectedTransactionForTransfer(null);
      
      alert('Transferência criada com sucesso!');
      
      setTimeout(() => {
        setSaving(prev => {
          const newSet = new Set(prev);
          newSet.delete(selectedTransactionForTransfer.id);
          return newSet;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error creating transfer:', error);
      alert('Erro ao criar transferência');
    }
  };

  const handleOpenTransferModal = (transaction: OfxPendingTransaction) => {
    setSelectedTransactionForTransfer(transaction);
    setShowTransferModal(true);
  };

  const handleEditTransfer = (transaction: OfxPendingTransaction) => {
    setSelectedTransferForEdit(transaction);
    setShowEditTransferModal(true);
  };

  const handleUpdateTransfer = (data: any) => {
    if (selectedTransferForEdit) {
      // Implementar atualização de transferência
      console.log('Atualizando transferência:', data);
      setShowEditTransferModal(false);
      setSelectedTransferForEdit(null);
    }
  };

  const handleDeleteTransfer = (transaction: OfxPendingTransaction) => {
    setSelectedTransferForDelete(transaction);
    setShowDeleteTransferModal(true);
  };

  const handleConfirmDeleteTransfer = () => {
    if (selectedTransferForDelete) {
      // Implementar exclusão de transferência
      console.log('Excluindo transferência:', selectedTransferForDelete.id);
      setShowDeleteTransferModal(false);
      setSelectedTransferForDelete(null);
    }
  };

  const getFilteredTransactions = () => {
    let filtered = pendingTransactions;
    
    switch (filter) {
      case 'uncategorized':
        filtered = filtered.filter(t => !t.suggestedCategoryId);
        break;
      case 'no-payment-method':
        filtered = filtered.filter(t => !t.suggestedPaymentMethodId && !t.finalPaymentMethodId);
        break;
      default:
        break;
    }
    
    return filtered;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount / 100);
  };

  const getFilteredCategories = (transactionType: 'CREDIT' | 'DEBIT') => {
    // Mapear tipos de transação para tipos de categoria
    const categoryType = transactionType === 'CREDIT' ? 'RECEIVABLE' : 'PAYABLE';
    return categories.filter(cat => cat.type === categoryType);
  };

  const transactions = getFilteredTransactions();

  function formatDateSafe(dateString?: string) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '' : date.toLocaleDateString('pt-BR');
  }

  // Função para obter bancos de destino válidos (exclui o banco do OFX)
  function getValidDestinationBanks() {
    // Baseado no console.log, a estrutura é { import: {...}, summary: {...}, transactions: [...] }
    // O banco está em summary.import.bank
    const currentBankId = (summary as any)?.import?.bank?.id;
    if (!currentBankId) return banks;
    return banks.filter(bank => bank.id !== currentBankId);
  }

  // Função para obter a data de importação correta
  function getImportDate() {
    return (summary as any)?.import?.importDate || summary?.importDate;
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (!summary) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">Erro ao carregar dados da revisão</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate('/ofx-import')}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Revisão de Importação OFX</h1>
              <p className="text-gray-600">
                {summary.fileName}
                {formatDateSafe(getImportDate()) && ` - ${formatDateSafe(getImportDate())}`}
              </p>
            </div>
          </div>
          <Button
            onClick={handleApproveImport}
            loading={approving}
            disabled={transactions.length === 0}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Aprovar Importação
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Target className="h-5 w-5 text-blue-500 mr-2" />
              <span className="text-sm font-medium text-blue-900">Total de Transações</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{summary.totalTransactions}</p>
            <p className="text-xs text-blue-700">para revisão</p>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
              <span className="text-sm font-medium text-yellow-900">Sem Categoria</span>
            </div>
            <p className="text-2xl font-bold text-yellow-900">{summary.uncategorizedCount}</p>
            <p className="text-xs text-yellow-700">precisam de categoria</p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm font-medium text-green-900">Métodos Sugeridos</span>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {pendingTransactions.filter(t => t.suggestedPaymentMethodId).length}
            </p>
            <p className="text-xs text-green-700">com sugestão</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex space-x-2">
          <Button
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'primary' : 'outline'}
            size="sm"
          >
            Todas ({pendingTransactions.length})
          </Button>
          <Button
            onClick={() => setFilter('uncategorized')}
            variant={filter === 'uncategorized' ? 'primary' : 'outline'}
            size="sm"
          >
            Sem Categoria ({pendingTransactions.filter(t => !t.suggestedCategoryId).length})
          </Button>
          <Button
            onClick={() => setFilter('no-payment-method')}
            variant={filter === 'no-payment-method' ? 'primary' : 'outline'}
            size="sm"
          >
            Sem Método ({pendingTransactions.filter(t => !t.finalPaymentMethodId && !t.suggestedPaymentMethodId).length})
          </Button>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Método de Pagamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
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
                      <span className={`text-sm font-medium ${
                        transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'CREDIT' ? '+' : '-'} {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(transaction.transactionDate)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Select
                                                     value={transaction.suggestedCategoryId || ''}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                            handleCategoryChange(transaction.id, e.target.value);
                          }}
                          options={[
                            { value: '', label: 'Selecionar categoria...' },
                            ...getFilteredCategories(transaction.type).map((category) => ({
                              value: category.id,
                              label: category.name
                            }))
                          ]}
                          className="min-w-0 w-48"
                        />
                        {saving.has(transaction.id) && (
                          <div className="flex items-center text-blue-600">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-1"></div>
                            <Save className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Select
                          value={transaction.finalPaymentMethodId || transaction.suggestedPaymentMethodId || ''}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                            handlePaymentMethodChange(transaction.id, e.target.value);
                          }}
                          options={[
                            { value: '', label: 'Selecionar método...' },
                            ...paymentMethods.map((paymentMethod) => ({
                              value: paymentMethod.id,
                              label: paymentMethod.name
                            }))
                          ]}
                          className="min-w-0 w-48"
                        />
                        {saving.has(transaction.id) && (
                          <div className="flex items-center text-blue-600">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-1"></div>
                            <Save className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleOpenTagModal(transaction.id)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Tag className="h-3 w-3" />
                          Tags ({getTransactionTags(transaction.id).length})
                        </Button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          onClick={() => handleOpenTransferModal(transaction)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                          title="Transformar em Transferência"
                        >
                          <ArrowRightLeft className="h-3 w-3" />
                          Transferir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tag Selection Modal */}
        {showTagModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowTagModal(false)}></div>
              
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Selecionar Tags</h3>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setShowCreateTagModal(true)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Criar Tag
                      </Button>
                      <button
                        onClick={() => setShowTagModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {tags.map((tag) => (
                      <label key={tag.id} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={getTransactionTags(currentTransactionId).includes(tag.id)}
                          onChange={(e) => {
                            const currentTags = getTransactionTags(currentTransactionId);
                            const newTags = e.target.checked
                              ? [...currentTags, tag.id]
                              : currentTags.filter(id => id !== tag.id);
                            handleUpdateTags(currentTransactionId, newTags);
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tag.color || '#3B82F6' }}
                          ></div>
                          <span className="text-sm text-gray-900">{tag.name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Tag Modal */}
        {showCreateTagModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCreateTagModal(false)}></div>
              
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Criar Nova Tag</h3>
                    <button
                      onClick={() => setShowCreateTagModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <form onSubmit={handleCreateTag} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome da Tag
                      </label>
                      <Input
                        value={createTagForm.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateTagForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nome da tag"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cor
                      </label>
                      <Select
                        value={createTagForm.color}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCreateTagForm(prev => ({ ...prev, color: e.target.value }))}
                        options={colors}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descrição (opcional)
                      </label>
                      <textarea
                        value={createTagForm.description}
                        onChange={(e) => setCreateTagForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Descrição da tag..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={createTagForm.isActive}
                        onChange={(e) => setCreateTagForm(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                        Tag ativa
                      </label>
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4">
                      <Button type="button" variant="secondary" onClick={() => setShowCreateTagModal(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">
                        Criar Tag
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Transferência */}
        {showTransferModal && selectedTransactionForTransfer && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowTransferModal(false)}></div>
              
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Transferir Transação</h3>
                    <button
                      onClick={() => setShowTransferModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transação a Transferir:
                      </label>
                      <div className="bg-gray-100 p-3 rounded-md text-sm text-gray-900">
                        {selectedTransactionForTransfer.title}
                        <br />
                        {selectedTransactionForTransfer.description}
                        <br />
                        {formatCurrency(selectedTransactionForTransfer.amount)}
                        <br />
                        {formatDate(selectedTransactionForTransfer.transactionDate)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Para Conta:
                      </label>
                      <Select
                        value={''} // This will be atualizado pelo usuário
                        onChange={() => {}} // Placeholder
                        options={getValidDestinationBanks().map(bank => ({ value: bank.id, label: bank.name }))}
                        className="min-w-0 w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor da Transferência:
                      </label>
                      <Input
                        type="number"
                        value={selectedTransactionForTransfer.amount / 100} // Display as currency
                        onChange={() => {}} // Placeholder
                        placeholder="Valor da transferência"
                        disabled
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data da Transferência:
                      </label>
                      <Input
                        type="date"
                        value={selectedTransactionForTransfer.transactionDate.split('T')[0]}
                        onChange={() => {}} // Placeholder
                        placeholder="Data da transferência"
                        disabled
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descrição da Transferência:
                      </label>
                      <textarea
                        value={`Transferência de ${selectedTransactionForTransfer.title} para conta`}
                        onChange={() => {}} // Placeholder
                        placeholder="Descrição opcional da transferência..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={true} // Transferências são sempre ativas
                        onChange={() => {}} // Placeholder
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                        Transferência ativa
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <Button
                    onClick={() => {
                      const transferData: CreateTransferRequest = {
                        title: `Transferência de ${selectedTransactionForTransfer.title}`,
                        description: `Transferência de ${selectedTransactionForTransfer.title} para conta`,
                        amount: selectedTransactionForTransfer.amount,
                        fromBankId: '', // Será determinado pelo backend
                        toBankId: '', // Será determinado pelo backend
                        transactionDate: selectedTransactionForTransfer.transactionDate
                      };
                      handleCreateTransfer(transferData);
                    }}
                    className="w-full sm:w-auto sm:ml-3"
                  >
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Criar Transferência
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowTransferModal(false)}
                    className="w-full sm:w-auto mt-3 sm:mt-0"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Edição de Transferência */}
        {showEditTransferModal && selectedTransferForEdit && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowEditTransferModal(false)}></div>
              
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Editar Transferência</h3>
                    <button
                      onClick={() => setShowEditTransferModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transferência:
                      </label>
                      <div className="bg-gray-100 p-3 rounded-md text-sm text-gray-900">
                        {selectedTransferForEdit.title}
                        <br />
                        {selectedTransferForEdit.description}
                        <br />
                        {formatCurrency(selectedTransferForEdit.amount)}
                        <br />
                        {formatDate(selectedTransferForEdit.transactionDate)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Título:
                      </label>
                      <Input
                        value={selectedTransferForEdit.title}
                        onChange={() => {}} // Placeholder
                        placeholder="Título da transferência"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descrição:
                      </label>
                      <textarea
                        value={selectedTransferForEdit.description || ''}
                        onChange={() => {}} // Placeholder
                        placeholder="Descrição da transferência..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor:
                      </label>
                      <Input
                        type="number"
                        value={selectedTransferForEdit.amount / 100}
                        onChange={() => {}} // Placeholder
                        placeholder="Valor da transferência"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data:
                      </label>
                      <Input
                        type="date"
                        value={selectedTransferForEdit.transactionDate.split('T')[0]}
                        onChange={() => {}} // Placeholder
                        placeholder="Data da transferência"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <Button
                    onClick={() => {
                      // Implementar atualização
                      setShowEditTransferModal(false);
                    }}
                    className="w-full sm:w-auto sm:ml-3"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Atualizar Transferência
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowEditTransferModal(false)}
                    className="w-full sm:w-auto mt-3 sm:mt-0"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Exclusão de Transferência */}
        {showDeleteTransferModal && selectedTransferForDelete && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowDeleteTransferModal(false)}></div>
              
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Confirmar Exclusão</h3>
                    <button
                      onClick={() => setShowDeleteTransferModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <Trash2 className="h-5 w-5 text-red-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Excluir Transferência
                        </h3>
                        <p className="text-gray-700 mb-4">
                          Tem certeza que deseja excluir a transferência "{selectedTransferForDelete.title}"?
                        </p>
                        
                        {/* Informações da transferência */}
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Título:</span>
                              <span className="text-sm font-medium">{selectedTransferForDelete.title}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Valor:</span>
                              <span className="text-sm font-medium">
                                {formatCurrency(selectedTransferForDelete.amount)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Data:</span>
                              <span className="text-sm font-medium">{formatDate(selectedTransferForDelete.transactionDate)}</span>
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600">
                          Esta ação não pode ser desfeita. A transferência será permanentemente removida.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <Button
                    onClick={() => {
                      handleConfirmDeleteTransfer();
                    }}
                    variant="danger"
                    className="w-full sm:w-auto sm:ml-3"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Transferência
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteTransferModal(false)}
                    className="w-full sm:w-auto mt-3 sm:mt-0"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default OfxReview; 