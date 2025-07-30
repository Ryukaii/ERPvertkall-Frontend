import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Building2,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Users
} from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import Select from '../components/ui/Select';
import apiService from '../services/api';
import { Bank, CreateBankRequest, DocumentType, BankTransaction } from '../types';
import { formatCurrency } from '../utils/format';

const Banks: React.FC = () => {
  const navigate = useNavigate();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [accountTypes, setAccountTypes] = useState<string[]>(['CHECKING', 'SAVINGS', 'INVESTMENT', 'CREDIT']);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([
    { value: 'CPF', label: 'CPF (Pessoa Física)' },
    { value: 'CNPJ', label: 'CNPJ (Pessoa Jurídica)' }
  ]);
  const [formData, setFormData] = useState<CreateBankRequest>({
    name: '',
    accountNumber: '',
    accountType: 'CHECKING',
    balance: 0,
    documentType: 'CPF',
    document: '',
    holderName: ''
  });

  const accountTypeLabels = {
    CHECKING: 'Conta Corrente',
    SAVINGS: 'Conta Poupança',
    INVESTMENT: 'Conta de Investimento',
    CREDIT: 'Cartão de Crédito'
  };

  const accountTypeIcons = {
    CHECKING: Building2,
    SAVINGS: PiggyBank,
    INVESTMENT: TrendingUp,
    CREDIT: CreditCard
  };

  useEffect(() => {
    loadBanks();
    loadTransactions();
    loadAccountTypes();
    loadDocumentTypes();
  }, []);

  const loadBanks = async () => {
    try {
      setLoading(true);
      const data = await apiService.getBanks();
      setBanks(data);
    } catch (error) {
      console.error('Erro ao carregar bancos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await apiService.getAllBankTransactions();
      setTransactions(response.data);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    }
  };

  const loadAccountTypes = async () => {
    try {
      const types = await apiService.getAccountTypes();
      // Se a API retorna objetos {value, label}, extrair apenas os valores
      const accountTypeValues = Array.isArray(types) && types.length > 0 && typeof types[0] === 'object' 
        ? types.map((type: any) => type.value)
        : types;
      setAccountTypes(accountTypeValues);
    } catch (error) {
      console.error('Erro ao carregar tipos de conta:', error);
      // Fallback para tipos padrão caso a API falhe
      setAccountTypes(['CHECKING', 'SAVINGS', 'INVESTMENT', 'CREDIT']);
    }
  };

  const loadDocumentTypes = async () => {
    try {
      const types = await apiService.getDocumentTypes();
      setDocumentTypes(types);
    } catch (error) {
      console.error('Erro ao carregar tipos de documento:', error);
      // Fallback para tipos padrão caso a API falhe
      setDocumentTypes([
        { value: 'CPF', label: 'CPF (Pessoa Física)' },
        { value: 'CNPJ', label: 'CNPJ (Pessoa Jurídica)' }
      ]);
    }
  };

  // Calcular saldo real de cada banco baseado nas transações
  const banksWithRealBalance = useMemo(() => {
    if (!banks.length || !transactions.length) return banks;

    return banks.map(bank => {
      const bankTransactions = transactions.filter(t => t.bankId === bank.id);
      
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

      return {
        ...bank,
        balance: realBalance
      };
    });
  }, [banks, transactions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBank) {
        await apiService.updateBank(editingBank.id, formData);
      } else {
        await apiService.createBank(formData);
      }
      setShowModal(false);
      setEditingBank(null);
      resetForm();
      loadBanks();
    } catch (error) {
      console.error('Erro ao salvar banco:', error);
    }
  };

  const handleEdit = (bank: Bank) => {
    setEditingBank(bank);
    setFormData({
      name: bank.name,
      accountNumber: bank.accountNumber,
      accountType: bank.accountType,
      balance: bank.balance,
      documentType: bank.documentType,
      document: bank.document,
      holderName: bank.holderName
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja desativar este banco? Esta ação afetará todos os usuários.')) {
      try {
        await apiService.deleteBank(id);
        loadBanks();
      } catch (error) {
        console.error('Erro ao desativar banco:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      accountNumber: '',
      accountType: 'CHECKING',
      balance: 0,
      documentType: 'CPF',
      document: '',
      holderName: ''
    });
  };

  const openCreateModal = () => {
    setEditingBank(null);
    resetForm();
    setShowModal(true);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bancos do Sistema</h1>
          <p className="text-gray-600">Gerencie as contas bancárias globais do sistema</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Banco
        </Button>
      </div>

      {/* Aviso sobre bancos globais */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <Users className="h-5 w-5 text-blue-600 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">Bancos Globais</h3>
            <p className="text-sm text-blue-700">
              Os bancos são globais do sistema. Todos os usuários podem criar transações nestes bancos.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banksWithRealBalance.map((bank) => {
          const Icon = accountTypeIcons[bank.accountType];
          return (
            <div key={bank.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <Icon className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900">{bank.name}</h3>
                    <p className="text-sm text-gray-500">{bank.accountNumber}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/financeiro/banks/${bank.id}/transactions`)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(bank)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(bank.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Tipo:</span>
                  <span className="text-sm font-medium">{accountTypeLabels[bank.accountType]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Titular:</span>
                  <span className="text-sm font-medium">{bank.holderName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Documento:</span>
                  <span className="text-sm font-medium">{bank.document}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Saldo Atual:</span>
                  <span className={`text-sm font-bold ${
                    bank.balance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(bank.balance)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Status:</span>
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    bank.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {bank.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {banks.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum banco encontrado</h3>
          <p className="text-gray-600 mb-4">Comece adicionando o primeiro banco do sistema</p>
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Banco
          </Button>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingBank ? 'Editar Banco' : 'Novo Banco'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Banco
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Nubank, Itaú, Bradesco"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número da Conta
            </label>
            <Input
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              placeholder="Ex: 12345678"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Conta
            </label>
            <Select
              value={formData.accountType}
              onChange={(e) => setFormData({ ...formData, accountType: e.target.value as any })}
              options={accountTypes.map((type) => ({
                value: type,
                label: accountTypeLabels[type as keyof typeof accountTypeLabels] || type
              }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Documento
            </label>
            <Select
              value={formData.documentType}
              onChange={(e) => setFormData({ ...formData, documentType: e.target.value as any })}
              options={documentTypes}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Documento
            </label>
            <Input
              value={formData.document}
              onChange={(e) => setFormData({ ...formData, document: e.target.value })}
              placeholder="Ex: 123.456.789-00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Titular
            </label>
            <Input
              value={formData.holderName}
              onChange={(e) => setFormData({ ...formData, holderName: e.target.value })}
              placeholder="Ex: João da Silva"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Saldo Inicial (em centavos)
            </label>
            <Input
              type="number"
              value={formData.balance}
              onChange={(e) => setFormData({ ...formData, balance: parseInt(e.target.value) || 0 })}
              placeholder="100000 (R$ 1.000,00)"
              required
            />
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
              {editingBank ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Banks; 