import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Trash2,
  Eye,
  RefreshCw,
  Brain,
  Zap
} from 'lucide-react';
import apiService from '../services/api';
import { 
  OfxImport as OfxImportType, 
  Bank
} from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';

const OfxImport: React.FC = () => {
  const navigate = useNavigate();
  
  const [imports, setImports] = useState<OfxImportType[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBank, setSelectedBank] = useState('');
  const [description, setDescription] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedImport, setSelectedImport] = useState<OfxImportType | null>(null);
  const [processingImports, setProcessingImports] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadImports();
    loadBanks();
  }, []);

  const loadImports = async () => {
    try {
      setLoading(true);
      const data = await apiService.getOfxImports();
      setImports(data);
    } catch (error) {
      console.error('Erro ao carregar importações:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBanks = async () => {
    try {
      const data = await apiService.getBanks();
      setBanks(data);
    } catch (error) {
      console.error('Erro ao carregar bancos:', error);
    }
  };



  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.toLowerCase().endsWith('.ofx')) {
      setSelectedFile(file);
    } else {
      alert('Por favor, selecione um arquivo .ofx válido');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedBank) {
      alert('Por favor, selecione um arquivo e um banco');
      return;
    }

    try {
      setUploading(true);
      const response = await apiService.uploadOfxFile(selectedFile, selectedBank, description);
      
      // Adicionar à lista de processamento
      setProcessingImports(prev => new Set(prev).add(response.importId));
      
      // Limpar formulário
      setSelectedFile(null);
      setSelectedBank('');
      setDescription('');
      setShowUploadModal(false);
      
      // Recarregar importações
      await loadImports();
      
      // Se ainda está processando, iniciar polling
      if (response.status === 'PROCESSING') {
        pollImportStatus(response.importId);
      }
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      alert(error.response?.data?.message || 'Erro ao fazer upload do arquivo');
    } finally {
      setUploading(false);
    }
  };

  const pollImportStatus = async (importId: string) => {
    const poll = async () => {
      try {
        const status = await apiService.getOfxImportStatus(importId);
        
        if (status.status === 'PROCESSING') {
          // Continuar polling
          setTimeout(poll, 2000);
        } else {
          // Parar polling e recarregar
          setProcessingImports(prev => {
            const newSet = new Set(prev);
            newSet.delete(importId);
            return newSet;
          });
          await loadImports();
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
        setProcessingImports(prev => {
          const newSet = new Set(prev);
          newSet.delete(importId);
          return newSet;
        });
      }
    };
    
    poll();
  };

  const handleDelete = async (importId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta importação? Todas as transações relacionadas serão removidas.')) {
      return;
    }

    try {
      await apiService.deleteOfxImport(importId);
      await loadImports();
    } catch (error) {
      console.error('Erro ao excluir importação:', error);
      alert('Erro ao excluir importação');
    }
  };

  const handleViewDetails = async (importId: string) => {
    try {
      const importData = await apiService.getOfxImport(importId);
      setSelectedImport(importData);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
    }
  };

  const handleReviewTransactions = (importId: string) => {
    navigate(`/ofx-review/${importId}`);
  };



  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'PENDING_REVIEW':
        return <Brain className="h-5 w-5 text-blue-500" />;
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'PROCESSING':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'CANCELLED':
        return <XCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Concluído';
      case 'PENDING_REVIEW':
        return 'Aguardando Revisão';
      case 'FAILED':
        return 'Falhou';
      case 'PROCESSING':
        return 'Processando';
      case 'CANCELLED':
        return 'Cancelado';
      default:
        return 'Desconhecido';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Importação OFX</h1>
          <p className="text-gray-600">Gerencie as importações de arquivos OFX com categorização automática por IA</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => window.location.href = '/ai-categorization'}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Brain className="h-4 w-4" />
            Categorização IA
          </Button>
          <Button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Nova Importação
          </Button>
        </div>
      </div>

      {/* Informações sobre o Novo Fluxo OFX */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Brain className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">Nova Estratégia OFX com Revisão</h3>
            <p className="text-sm text-blue-700 mt-1">
              As transações OFX são analisadas por IA e ficam em revisão pendente. 
              Você tem controle total para revisar, editar categorias e aprovar antes da criação final.
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-blue-600">
              <span className="flex items-center gap-1">
                <Brain className="h-3 w-3" />
                Análise por IA
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                Revisão obrigatória
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Aprovação manual
              </span>
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Edição em lote
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Importações */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Importações</h2>
            <Button
              onClick={loadImports}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : imports.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>Nenhuma importação encontrada</p>
            <p className="text-sm">Faça sua primeira importação OFX</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Arquivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Banco
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transações
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {imports.map((importItem) => (
                  <tr key={importItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 break-words">
                            {importItem.fileName}
                          </div>
                          {importItem.description && (
                            <div className="text-sm text-gray-500 break-words mt-1">
                              {importItem.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 break-words">
                        {importItem.bank?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500 break-words">
                        {importItem.bank?.accountNumber || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(importItem.status)}
                        <span className="ml-2 text-sm text-gray-900">
                          {getStatusText(importItem.status)}
                        </span>
                        {processingImports.has(importItem.id) && (
                          <div className="ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                        )}
                      </div>
                      {importItem.errorMessage && (
                        <div className="text-xs text-red-500 mt-1 break-words">
                          {importItem.errorMessage}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {importItem.processedTransactions} / {importItem.totalTransactions}
                      </div>
                      {importItem.status === 'PROCESSING' && (
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${(importItem.processedTransactions / importItem.totalTransactions) * 100}%` 
                            }}
                          ></div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(importItem.importDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {importItem.status === 'PENDING_REVIEW' && (
                          <Button
                            onClick={() => handleReviewTransactions(importItem.id)}
                            className="flex items-center gap-1"
                            size="sm"
                          >
                            <Brain className="h-3 w-3" />
                            Revisar
                          </Button>
                        )}
                        <Button
                          onClick={() => handleViewDetails(importItem.id)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          Detalhes
                        </Button>
                        <Button
                          onClick={() => handleDelete(importItem.id)}
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

      {/* Modal de Upload */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Nova Importação OFX"
      >
        <div className="space-y-4">
          {/* Informação sobre o Novo Fluxo */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center">
              <Brain className="h-4 w-4 text-blue-500 mr-2" />
              <span className="text-sm font-medium text-blue-900">Nova Estratégia OFX</span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              As transações serão analisadas por IA e ficarão em revisão pendente. 
              Você poderá revisar, editar categorias e aprovar antes da criação final.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Arquivo OFX
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".ofx"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600">
                  Clique para selecionar um arquivo .ofx
                </p>
                {selectedFile && (
                  <p className="text-sm text-primary-600 mt-2">
                    {selectedFile.name}
                  </p>
                )}
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Banco
            </label>
            <Select
              value={selectedBank}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedBank(e.target.value)}
              required
              options={[
                { value: '', label: 'Selecione um banco' },
                ...banks.map((bank) => ({
                  value: bank.id,
                  label: `${bank.name} - ${bank.accountNumber}`
                }))
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição (opcional)
            </label>
            <Input
              type="text"
              value={description}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
              placeholder="Ex: Extrato de janeiro"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowUploadModal(false)}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !selectedBank || uploading}
              className="flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Importar
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Detalhes */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Detalhes da Importação"
        size="lg"
      >
        {selectedImport && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Arquivo</label>
                <p className="text-sm text-gray-900">{selectedImport.fileName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <div className="flex items-center">
                  {getStatusIcon(selectedImport.status)}
                  <span className="ml-2 text-sm text-gray-900">
                    {getStatusText(selectedImport.status)}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Banco</label>
                <p className="text-sm text-gray-900">
                  {selectedImport.bank?.name} - {selectedImport.bank?.accountNumber}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Data de Importação</label>
                <p className="text-sm text-gray-900">{formatDate(selectedImport.importDate)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Transações Processadas</label>
                <p className="text-sm text-gray-900">
                  {selectedImport.processedTransactions} / {selectedImport.totalTransactions}
                </p>
              </div>
              {selectedImport.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Descrição</label>
                  <p className="text-sm text-gray-900 break-words">{selectedImport.description}</p>
                </div>
              )}
            </div>

            {selectedImport.errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Erro na Importação</h3>
                    <div className="mt-2 text-sm text-red-700 break-words">
                      {selectedImport.errorMessage}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedImport.transactions && selectedImport.transactions.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Transações Importadas</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Brain className="h-4 w-4" />
                    <span>Categorização automática aplicada</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Título
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Valor
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Data
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Tipo
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Categoria
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedImport.transactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            <div className="break-words">
                              {transaction.title}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {formatCurrency(transaction.amount)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {formatDate(transaction.transactionDate)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.type === 'CREDIT' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {transaction.type === 'CREDIT' ? 'Crédito' : 'Débito'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {transaction.category ? (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                {transaction.category.name}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                Pendente
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>


    </div>
  );
};

export default OfxImport; 