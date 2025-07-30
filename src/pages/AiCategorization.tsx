import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Zap
} from 'lucide-react';
import apiService from '../services/api';
import { 
  PendingCategorizationTransaction, 
  AiCategorizationSuggestion,
  FinancialCategory,
  AiCategorizationSuggestionResponse
} from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';

const AiCategorization: React.FC = () => {
  const [pendingTransactions, setPendingTransactions] = useState<PendingCategorizationTransaction[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [suggesting, setSuggesting] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<PendingCategorizationTransaction | null>(null);
  const [currentSuggestion, setCurrentSuggestion] = useState<AiCategorizationSuggestion | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [confidence, setConfidence] = useState(80);
  const [reasoning, setReasoning] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadPendingTransactions();
    loadCategories();
  }, []);

  const loadPendingTransactions = async () => {
    try {
      setLoading(true);
      const data = await apiService.getPendingCategorizationTransactions();
      setPendingTransactions(data);
    } catch (error) {
      console.error('Erro ao carregar transações pendentes:', error);
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

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleGetSuggestion = async (transactionId: string) => {
    try {
      setSuggesting(transactionId);
      const response: AiCategorizationSuggestionResponse = await apiService.getAiCategorizationSuggestion(transactionId);
      
      // A resposta da API tem campo 'suggestion'
      if (response.suggestion) {
        setCurrentSuggestion(response.suggestion);
        setSelectedCategory(response.suggestion.categoryId);
        setConfidence(response.suggestion.confidence);
        setReasoning(response.suggestion.reasoning);
        
        const transaction = pendingTransactions.find(t => t.id === transactionId);
        if (transaction) {
          setSelectedTransaction(transaction);
          setShowSuggestionModal(true);
        }
      } else {
        showNotification('Não foi possível gerar uma sugestão para esta transação', 'error');
      }
    } catch (error) {
      console.error('Erro ao obter sugestão:', error);
      showNotification('Erro ao obter sugestão de categorização', 'error');
    } finally {
      setSuggesting(null);
    }
  };

  const handleApplyCategorization = async () => {
    if (!selectedTransaction || !selectedCategory) {
      showNotification('Por favor, selecione uma categoria', 'error');
      return;
    }

    try {
      setApplying(selectedTransaction.id);

      const response = await apiService.applyAiCategorization(selectedTransaction.id, selectedCategory, selectedTransaction.bankId);
      
      // A resposta da API não tem campo 'success', mas sim 'autoApplied'
      if (response.autoApplied || response.message) {
        setShowSuggestionModal(false);
        setSelectedTransaction(null);
        setCurrentSuggestion(null);
        setSelectedCategory('');
        setConfidence(80);
        setReasoning('');
        
        // Recarregar transações pendentes
        await loadPendingTransactions();
        
        showNotification(response.message || 'Categorização aplicada com sucesso!', 'success');
      } else {
        showNotification('Erro ao aplicar categorização', 'error');
      }
    } catch (error) {
      console.error('Erro ao aplicar categorização:', error);
      showNotification('Erro ao aplicar categorização', 'error');
    } finally {
      setApplying(null);
    }
  };

  const handleBatchSuggestions = async () => {
    const selectedTransactions = pendingTransactions
      .filter(t => 
        (filterType === 'all' || t.type === filterType.toUpperCase()) &&
        (searchTerm === '' || t.title.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .slice(0, 10); // Limitar a 10 transações por vez

    if (selectedTransactions.length === 0) {
      showNotification('Nenhuma transação selecionada para processamento em lote', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.getBatchAiCategorizationSuggestions({
        transactionIds: selectedTransactions.map(t => t.id)
      });

      // Aplicar sugestões automaticamente se confiança >= 70%
      let appliedCount = 0;
      for (const suggestion of response.suggestions) {
        if (suggestion.suggestion.confidence >= 70) {
          try {
            // Encontrar a transação para obter o tipo correto
            const transaction = selectedTransactions.find(t => t.id === suggestion.transactionId);
            if (transaction) {
              const categorizationResponse = await apiService.applyAiCategorization(suggestion.transactionId, suggestion.suggestion.categoryId, transaction.bankId);
              
              // Verificar se a categorização foi aplicada com sucesso
              if (categorizationResponse.autoApplied || categorizationResponse.message) {
                appliedCount++;
              }
            }
          } catch (error) {
            console.error(`Erro ao aplicar categorização para ${suggestion.transactionId}:`, error);
          }
        }
      }

      await loadPendingTransactions();
      showNotification(`Processamento em lote concluído! ${appliedCount} categorizações aplicadas automaticamente.`, 'success');
    } catch (error) {
      console.error('Erro no processamento em lote:', error);
      showNotification('Erro no processamento em lote', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (type: 'CREDIT' | 'DEBIT') => {
    return type === 'CREDIT' 
      ? <CheckCircle className="h-5 w-5 text-green-500" />
      : <XCircle className="h-5 w-5 text-red-500" />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const filteredTransactions = pendingTransactions.filter(transaction => {
    const matchesType = filterType === 'all' || transaction.type === filterType.toUpperCase();
    const matchesSearch = searchTerm === '' || 
      transaction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.description && transaction.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Notificação */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorização Automática</h1>
          <p className="text-gray-600">Gerencie a categorização automática de transações com IA</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleBatchSuggestions}
            disabled={loading || filteredTransactions.length === 0}
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            Processar em Lote
          </Button>
          <Button
            onClick={loadPendingTransactions}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Transação
            </label>
            <Select
              value={filterType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterType(e.target.value as any)}
              options={[
                { value: 'all', label: 'Todas' },
                { value: 'credit', label: 'Crédito' },
                { value: 'debit', label: 'Débito' }
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <Input
              type="text"
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              placeholder="Buscar por título ou descrição..."
            />
          </div>
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              {filteredTransactions.length} transação{filteredTransactions.length !== 1 ? 'ões' : ''} encontrada{filteredTransactions.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Transações Pendentes */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Transações Pendentes de Categorização</h2>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Nenhuma transação pendente de categorização</p>
            <p className="text-sm">Todas as transações já foram categorizadas automaticamente</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Banco
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
                      <div className="flex items-center">
                        {getStatusIcon(transaction.type)}
                        <span className="ml-2 text-sm text-gray-900">
                          {transaction.type === 'CREDIT' ? 'Crédito' : 'Débito'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.transactionDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.bank?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        onClick={() => handleGetSuggestion(transaction.id)}
                        variant="outline"
                        size="sm"
                        disabled={suggesting === transaction.id}
                        className="flex items-center gap-1"
                      >
                        {suggesting === transaction.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                            Analisando...
                          </>
                        ) : (
                          <>
                            <Brain className="h-3 w-3" />
                            Sugerir
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Sugestão */}
      <Modal
        isOpen={showSuggestionModal}
        onClose={() => setShowSuggestionModal(false)}
        title="Sugestão de Categorização"
        size="lg"
      >
        {selectedTransaction && (
          <div className="space-y-6">
            {/* Informações da Transação */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Transação</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Título:</span>
                  <p className="text-gray-900 break-words">{selectedTransaction.title}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Valor:</span>
                  <p className="text-gray-900">{formatCurrency(selectedTransaction.amount)}</p>
                </div>
                {selectedTransaction.description && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">Descrição:</span>
                    <p className="text-gray-900 break-words">{selectedTransaction.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sugestão da IA */}
            {currentSuggestion && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <Brain className="h-5 w-5 text-blue-500 mr-2" />
                  <h3 className="text-lg font-medium text-blue-900">Sugestão da IA</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-blue-700">Categoria:</span>
                    <p className="text-blue-900">{currentSuggestion.categoryName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-700">Confiança:</span>
                    <p className="text-blue-900">{currentSuggestion.confidence}%</p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-700">Raciocínio:</span>
                    <p className="text-blue-900 break-words">{currentSuggestion.reasoning}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Formulário de Categorização */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <Select
                  value={selectedCategory}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCategory(e.target.value)}
                  required
                  options={[
                    { value: '', label: 'Selecione uma categoria' },
                    ...categories
                      .filter(cat => {
                        // Mapear tipos de transação para tipos de categoria
                        const categoryType = selectedTransaction.type === 'CREDIT' ? 'RECEIVABLE' : 'PAYABLE';
                        return cat.type === categoryType;
                      })
                      .map((category) => ({
                        value: category.id,
                        label: category.name
                      }))
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confiança (%)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={confidence}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfidence(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raciocínio
                </label>
                <textarea
                  value={reasoning}
                  onChange={(e) => setReasoning(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  placeholder="Explique o motivo da categorização..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowSuggestionModal(false)}
                disabled={applying === selectedTransaction.id}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleApplyCategorization}
                disabled={!selectedCategory || applying === selectedTransaction.id}
                className="flex items-center gap-2"
              >
                {applying === selectedTransaction.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Aplicando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Aplicar Categorização
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AiCategorization; 