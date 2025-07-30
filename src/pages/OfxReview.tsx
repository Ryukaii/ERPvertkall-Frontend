import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Brain, 

  Eye,
  Save,
  Target,
  TrendingUp,
  Calendar,
  DollarSign
} from 'lucide-react';
import apiService from '../services/api';
import { 
  OfxPendingTransaction, 
  OfxPendingTransactionSummary,
  FinancialCategory,
  ApproveOfxImportResponse
} from '../types';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';

const OfxReview: React.FC = () => {
  const { importId } = useParams<{ importId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [approving, setApproving] = useState(false);
  const [pendingTransactions, setPendingTransactions] = useState<OfxPendingTransaction[]>([]);
  const [summary, setSummary] = useState<OfxPendingTransactionSummary | null>(null);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);

  const [filter, setFilter] = useState<'all' | 'high' | 'low' | 'uncategorized'>('all');

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
      
      const [transactions, summaryData, categoriesData] = await Promise.all([
        apiService.getOfxPendingTransactionsByImport(importId!),
        apiService.getOfxPendingTransactionsSummary(importId!),
        apiService.getCategories()
      ]);
      
      setPendingTransactions(transactions);
      setSummary(summaryData);
      setCategories(categoriesData);
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

  const handleSuggestCategory = async (transactionId: string) => {
    try {
      setSaving(prev => new Set(prev).add(transactionId));
      
      const response = await apiService.suggestOfxTransactionCategory(transactionId);
      
      if (response.suggestion) {
        // Atualizar automaticamente com a nova sugestão
        await handleCategoryChange(transactionId, response.suggestion.categoryId);
      }
    } catch (error) {
      console.error('Erro ao obter sugestão:', error);
      alert('Erro ao obter nova sugestão');
    } finally {
      setSaving(prev => {
        const newSet = new Set(prev);
        newSet.delete(transactionId);
        return newSet;
      });
    }
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
    switch (filter) {
      case 'high':
        return pendingTransactions.filter(t => t.confidence >= 70);
      case 'low':
        return pendingTransactions.filter(t => t.confidence < 70);
      case 'uncategorized':
        return pendingTransactions.filter(t => !t.suggestedCategoryId);
      default:
        return pendingTransactions;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount / 100);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return 'bg-green-500';
    if (confidence >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 70) return 'Alta';
    if (confidence >= 40) return 'Média';
    return 'Baixa';
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

  const filteredTransactions = getFilteredTransactions();

  return (
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Target className="h-5 w-5 text-blue-500 mr-2" />
            <span className="text-sm font-medium text-blue-900">Total</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{summary.totalTransactions}</p>
          <p className="text-xs text-blue-700">transações</p>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-sm font-medium text-green-900">Alta Confiança</span>
          </div>
          <p className="text-2xl font-bold text-green-900">{summary.highConfidenceCount}</p>
          <p className="text-xs text-green-700">≥ 70%</p>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <Eye className="h-5 w-5 text-yellow-500 mr-2" />
            <span className="text-sm font-medium text-yellow-900">Baixa Confiança</span>
          </div>
          <p className="text-2xl font-bold text-yellow-900">{summary.lowConfidenceCount}</p>
          <p className="text-xs text-yellow-700">&lt; 70%</p>
        </div>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-900">Sem Categoria</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{summary.uncategorizedCount}</p>
          <p className="text-xs text-gray-700">sem categoria</p>
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
                Todas ({summary.totalTransactions})
              </Button>
              <Button
                onClick={() => setFilter('high')}
                variant={filter === 'high' ? 'primary' : 'outline'}
                size="sm"
              >
                Alta Confiança ({summary.highConfidenceCount})
              </Button>
              <Button
                onClick={() => setFilter('low')}
                variant={filter === 'low' ? 'primary' : 'outline'}
                size="sm"
              >
                Baixa Confiança ({summary.lowConfidenceCount})
              </Button>
              <Button
                onClick={() => setFilter('uncategorized')}
                variant={filter === 'uncategorized' ? 'primary' : 'outline'}
                size="sm"
              >
                Sem Categoria ({summary.uncategorizedCount})
              </Button>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Mostrando {filteredTransactions.length} de {summary.totalTransactions} transações
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
                    Confiança
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
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
                            ...categories.map((category) => ({
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
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getConfidenceColor(transaction.confidence)}`}
                            style={{ width: `${transaction.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600 min-w-0 w-12">
                          {transaction.confidence}%
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          transaction.confidence >= 70 ? 'bg-green-100 text-green-800' :
                          transaction.confidence >= 40 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {getConfidenceText(transaction.confidence)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        onClick={() => handleSuggestCategory(transaction.id)}
                        disabled={saving.has(transaction.id)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        {saving.has(transaction.id) ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                        ) : (
                          <Brain className="h-3 w-3" />
                        )}
                        Nova IA
                      </Button>
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
    </div>
  );
};

export default OfxReview; 