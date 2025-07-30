import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Save,
  Target,
  Calendar,
  DollarSign,
  Tag,
  Plus,
  X
} from 'lucide-react';
import apiService from '../services/api';
import { 
  OfxPendingTransaction, 
  OfxPendingTransactionSummary,
  FinancialCategory,
  ApproveOfxImportResponse,
  Tag as TagType,
  PaymentMethod
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

  const [filter, setFilter] = useState<'all' | 'uncategorized' | 'no-payment-method'>('all');
  const [tags, setTags] = useState<TagType[]>([]);
  const [selectedTags, setSelectedTags] = useState<Map<string, string[]>>(new Map());
  const [showTagModal, setShowTagModal] = useState(false);
  const [currentTransactionId, setCurrentTransactionId] = useState<string>('');
  const [showCreateTagModal, setShowCreateTagModal] = useState(false);
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
      
      const [transactions, summaryData, categoriesData, tagsData, paymentMethodsData] = await Promise.all([
        apiService.getOfxPendingTransactionsByImport(importId!),
        apiService.getOfxPendingTransactionsSummary(importId!),
        apiService.getCategories(),
        apiService.getTags({ isActive: true }),
        apiService.getPaymentMethods()
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
      
      // Ensure transactions is an array
      if (!Array.isArray(transactions)) {
        console.error('Transactions is not an array:', transactions);
        console.error('Transactions structure:', JSON.stringify(transactions, null, 2));
        setPendingTransactions([]);
      } else {
        setPendingTransactions(transactions);
        
        // Inicializar tags selecionadas para cada transação
        const initialTags = new Map();
        transactions.forEach(transaction => {
          if (transaction.tags && transaction.tags.length > 0) {
            initialTags.set(transaction.id, transaction.tags.map(tag => tag.id));
          }
        });
        setSelectedTags(initialTags);
      }
      
      // A API retorna um objeto com {import, summary, transactions}
      // Precisamos extrair o summary corretamente
      const actualSummary = (summaryData as any).summary || summaryData;
      const importData = (summaryData as any).import;
      console.log('Summary for footer:', actualSummary);
      console.log('Import data:', importData);
      console.log('Full summaryData:', summaryData);
      
      // Combinar dados do summary com dados do import
      const combinedSummary = {
        ...actualSummary,
        importDate: importData?.importDate || actualSummary?.importDate,
        bank: importData?.bank || actualSummary?.bank,
        fileName: importData?.fileName || actualSummary?.fileName
      };
      
      setSummary(combinedSummary);
      setCategories(categoriesData);
      setTags(tagsData.data || []);
      setPaymentMethods(paymentMethodsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados da revisão');
      navigate('/ofx-import');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = async (transactionId: string, categoryId: string) => {
    if (!categoryId) return;

    try {
      setSaving(prev => new Set(prev).add(transactionId));
      
      await apiService.updateOfxTransactionCategory(transactionId, { categoryId });
      
      // Atualizar a transação na lista local
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
      
      // Mostrar feedback visual rápido
      setTimeout(() => {
        setSaving(prev => {
          const newSet = new Set(prev);
          newSet.delete(transactionId);
          return newSet;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      alert('Erro ao atualizar categoria');
      setSaving(prev => {
        const newSet = new Set(prev);
        newSet.delete(transactionId);
        return newSet;
      });
    }
  };

  const handlePaymentMethodChange = async (transactionId: string, paymentMethodId: string) => {
    if (!paymentMethodId) return;

    try {
      setSaving(prev => new Set(prev).add(transactionId));
      
      await apiService.updateOfxTransactionPaymentMethod(transactionId, { paymentMethodId });
      
      // Atualizar a transação na lista local
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
      
      // Mostrar feedback visual rápido
      setTimeout(() => {
        setSaving(prev => {
          const newSet = new Set(prev);
          newSet.delete(transactionId);
          return newSet;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao atualizar método de pagamento:', error);
      alert('Erro ao atualizar método de pagamento');
      setSaving(prev => {
        const newSet = new Set(prev);
        newSet.delete(transactionId);
        return newSet;
      });
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
      
      // Atualizar tags selecionadas localmente
      setSelectedTags(prev => {
        const newMap = new Map(prev);
        newMap.set(transactionId, tagIds);
        return newMap;
      });
      
      // Atualizar a transação na lista local
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
      
      setShowTagModal(false);
      
      // Mostrar feedback visual rápido
      setTimeout(() => {
        setSaving(prev => {
          const newSet = new Set(prev);
          newSet.delete(transactionId);
          return newSet;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao atualizar tags:', error);
      alert('Erro ao atualizar tags');
      setSaving(prev => {
        const newSet = new Set(prev);
        newSet.delete(transactionId);
        return newSet;
      });
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
      
      // Adicionar a nova tag à lista local
      setTags(prev => [...prev, newTag]);
      
      // Fechar modal e resetar formulário
      setShowCreateTagModal(false);
      setCreateTagForm({
        name: '',
        color: '#3B82F6',
        description: '',
        isActive: true
      });
      
      alert('Tag criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar tag:', error);
      alert('Erro ao criar tag');
    }
  };

  const getTransactionTags = (transactionId: string) => {
    const selectedTagIds = selectedTags.get(transactionId) || [];
    return tags.filter(tag => selectedTagIds.includes(tag.id));
  };

  const handleApproveImport = async () => {
    if (!summary) return;

    const uncategorizedCount = pendingTransactions.filter(t => !t.suggestedCategoryId).length;
    
    let confirmMessage = 'Tem certeza que deseja finalizar esta importação?\n\n';
    confirmMessage += `✅ ${pendingTransactions.length} transações serão criadas\n`;
    
    if (uncategorizedCount > 0) {
      confirmMessage += `⚠️ ${uncategorizedCount} transações sem categoria\n\n`;
      confirmMessage += 'Transações sem categoria poderão ser categorizadas posteriormente.';
    }

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setApproving(true);
      
      const response: ApproveOfxImportResponse = await apiService.approveOfxImport(importId!);
      
      if (response.success) {
        alert(`✅ Importação finalizada com sucesso!\n\n${response.createdTransactionsCount} transações criadas no banco.`);
        navigate('/ofx-import');
      } else {
        alert(`❌ Erro na finalização: ${response.message}`);
      }
    } catch (error) {
      console.error('Erro ao aprovar importação:', error);
      alert('Erro ao finalizar importação');
    } finally {
      setApproving(false);
    }
  };

  const getFilteredTransactions = () => {
    // Ensure pendingTransactions is an array and not null/undefined
    if (!pendingTransactions || !Array.isArray(pendingTransactions)) {
      console.warn('pendingTransactions is not a valid array:', pendingTransactions);
      return [];
    }
    
    let filteredTransactions;
    switch (filter) {
      case 'uncategorized':
        filteredTransactions = pendingTransactions.filter(t => !t.suggestedCategoryId);
        break;
      case 'no-payment-method':
        filteredTransactions = pendingTransactions.filter(t => !t.finalPaymentMethodId && !t.suggestedPaymentMethodId);
        break;
      default:
        filteredTransactions = pendingTransactions;
    }
    
    // Ordenar por data, do primeiro ao último dia do mês
    return filteredTransactions.sort((a, b) => {
      const dateA = new Date(a.transactionDate);
      const dateB = new Date(b.transactionDate);
      return dateA.getTime() - dateB.getTime();
    });
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
    return categories.filter(category => {
      // Se a transação é CREDIT, mostrar apenas categorias RECEIVABLE
      if (transactionType === 'CREDIT') {
        return category.type === 'RECEIVABLE';
      }
      // Se a transação é DEBIT, mostrar apenas categorias PAYABLE
      if (transactionType === 'DEBIT') {
        return category.type === 'PAYABLE';
      }
      // Se não conseguir determinar, mostrar todas
      return true;
    });
  };



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando revisão OFX...</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Importação não encontrada</h2>
          <p className="text-gray-600 mb-4">A importação solicitada não foi encontrada ou não está disponível para revisão.</p>
          <Button onClick={() => navigate('/ofx-import')}>
            Voltar para Importações
          </Button>
        </div>
      </div>
    );
  }

  // Ensure we have valid data before rendering
  if (!Array.isArray(pendingTransactions)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar dados</h2>
          <p className="text-gray-600 mb-4">Não foi possível carregar as transações da importação.</p>
          <Button onClick={() => navigate('/ofx-import')}>
            Voltar para Importações
          </Button>
        </div>
      </div>
    );
  }

  const filteredTransactions = getFilteredTransactions();

  return (
    <Layout>
      <div className="py-6">
        <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate('/ofx-import')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Revisão OFX</h1>
            <p className="text-gray-600">{summary.fileName}</p>
          </div>
        </div>
        <Button
          onClick={handleApproveImport}
          disabled={approving}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
        >
          {approving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Finalizando...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Finalizar Importação
            </>
          )}
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Target className="h-5 w-5 text-blue-500 mr-2" />
            <span className="text-sm font-medium text-blue-900">Total</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{summary?.totalTransactions || 0}</p>
          <p className="text-xs text-blue-700">transações</p>
        </div>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-900">Sem Categoria</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{(summary as any).uncategorized}</p>
          <p className="text-xs text-gray-700">sem categoria</p>
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

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Filtrar por:</span>
            <div className="flex gap-2">
              <Button
                onClick={() => setFilter('all')}
                variant={filter === 'all' ? 'primary' : 'outline'}
                size="sm"
              >
                Todas ({summary?.totalTransactions || 0})
              </Button>
              <Button
                onClick={() => setFilter('uncategorized')}
                variant={filter === 'uncategorized' ? 'primary' : 'outline'}
                size="sm"
              >
                Sem Categoria ({(summary as any).uncategorized || 0})
              </Button>
              <Button
                onClick={() => setFilter('no-payment-method')}
                variant={filter === 'no-payment-method' ? 'primary' : 'outline'}
                size="sm"
              >
                Sem Método ({pendingTransactions.filter(t => !t.finalPaymentMethodId && !t.suggestedPaymentMethodId).length})
              </Button>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Mostrando {filteredTransactions.length} de {summary?.totalTransactions || 0} transações
          </div>
        </div>
      </div>

      {/* Lista de Transações */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Transações para Revisão</h2>
        </div>
        
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Nenhuma transação encontrada com o filtro selecionado</p>
          </div>
        ) : (
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

                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(filteredTransactions) && filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium break-words max-w-xs">
                        {transaction.title}
                      </div>
                      {transaction.description && (
                        <div className="text-xs text-gray-500 break-words max-w-xs mt-1">
                          {transaction.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                        <span className={`text-sm font-semibold ${
                          transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'CREDIT' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                        {formatDate(transaction.transactionDate)}
                      </div>
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
                        <div className="flex flex-wrap gap-1">
                          {getTransactionTags(transaction.id).map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                              style={{ 
                                backgroundColor: `${tag.color}20`, 
                                color: tag.color,
                                border: `1px solid ${tag.color}40`
                              }}
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                        <Button
                          onClick={() => handleOpenTagModal(transaction.id)}
                          disabled={saving.has(transaction.id)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          {saving.has(transaction.id) ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                          Tags
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

      {/* Rodapé Fixo */}
      <div className="bg-white shadow-lg border border-gray-200 rounded-lg p-4 sticky bottom-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <span>📁 {summary.bank?.name}</span>
            <span>📅 {formatDate(summary.importDate)}</span>
            <span>📊 {summary.totalTransactions} transações</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate('/ofx-import')}
              variant="outline"
            >
              Salvar e Voltar
            </Button>
            <Button
              onClick={handleApproveImport}
              disabled={approving}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              {approving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Finalizando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Finalizar Importação
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de Seleção de Tags */}
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
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {tags.map((tag) => {
                      const isSelected = selectedTags.get(currentTransactionId)?.includes(tag.id) || false;
                      return (
                        <button
                          key={tag.id}
                          onClick={() => {
                            const currentSelected = selectedTags.get(currentTransactionId) || [];
                            const newSelected = isSelected
                              ? currentSelected.filter(id => id !== tag.id)
                              : [...currentSelected, tag.id];
                            
                            setSelectedTags(prev => {
                              const newMap = new Map(prev);
                              newMap.set(currentTransactionId, newSelected);
                              return newMap;
                            });
                          }}
                          className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                            isSelected
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: tag.color }}
                          ></div>
                          <span className="text-sm font-medium">{tag.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  
                  {tags.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <Tag className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>Nenhuma tag disponível</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  onClick={() => {
                    const selectedTagIds = selectedTags.get(currentTransactionId) || [];
                    handleUpdateTags(currentTransactionId, selectedTagIds);
                  }}
                  className="w-full sm:w-auto sm:ml-3"
                >
                  Salvar Tags
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowTagModal(false)}
                  className="w-full sm:w-auto mt-3 sm:mt-0"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criação de Tags */}
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
                      Nome *
                    </label>
                    <Input
                      type="text"
                      value={createTagForm.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCreateTagForm({ ...createTagForm, name: e.target.value })}
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
                        style={{ backgroundColor: createTagForm.color }}
                      ></div>
                      <Select
                        value={createTagForm.color}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCreateTagForm({ ...createTagForm, color: e.target.value })}
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
                      value={createTagForm.description}
                      onChange={(e) => setCreateTagForm({ ...createTagForm, description: e.target.value })}
                      placeholder="Descrição opcional da tag..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={createTagForm.isActive}
                      onChange={(e) => setCreateTagForm({ ...createTagForm, isActive: e.target.checked })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                      Tag ativa
                    </label>
                  </div>
                </form>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  onClick={handleCreateTag}
                  className="w-full sm:w-auto sm:ml-3"
                >
                  Criar Tag
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateTagModal(false)}
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
      </div>
    </Layout>
  );
};

export default OfxReview; 