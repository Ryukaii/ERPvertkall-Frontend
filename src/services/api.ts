import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  User,
  UserPermission,
  UpdateUserPermissionsRequest,
  FinancialTransaction,
  FinancialCategory,
  PaymentMethod,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreatePaymentMethodRequest,
  UpdatePaymentMethodRequest,
  TransactionFilters,
  CategoryFilters,
  // DashboardData, // Removed as dashboard is now calculated locally
  PaginatedResponse,
  Bank,
  BankTransaction,
  CreateBankRequest,
  UpdateBankRequest,
  CreateBankTransactionRequest,
  UpdateBankTransactionRequest,
  BankTransactionFilters,
  BankTransactionSummary,
  BankBalance,
  DocumentType,
  OfxImport,
  OfxImportStatus,
  OfxImportResponse,
  RecurringPayment,
  CreateRecurringPaymentRequest,
  Unidade,
  PendingCategorizationTransaction,
  AiCategorizationResponse,
  BatchCategorizationRequest,
  BatchCategorizationResponse,
  AiCategorizationSuggestionResponse,
  // Novos tipos para OFX pendentes
  OfxPendingTransaction,
  OfxPendingTransactionSummary,
  UpdateOfxTransactionCategoryRequest,
  BatchUpdateOfxCategoriesRequest,
  ApproveOfxImportResponse
} from '../types';

class ApiService {
  private api!: AxiosInstance;

  constructor() {
    this.initializeApi();
  }

  private initializeApi() {
    try {
      // Get API URL from environment variable, fallback to localhost for development
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      
      console.log('Initializing API with URL:', apiUrl);
      
      this.api = axios.create({
        baseURL: apiUrl,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Interceptor para adicionar token de autenticação
      this.api.interceptors.request.use((config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('Adding token to request:', config.url);
        } else {
          console.log('No token found for request:', config.url);
        }
        return config;
      });

      // Interceptor para tratamento de erros
      this.api.interceptors.response.use(
        (response) => {
          console.log('API Response received:', response.config.url, response.status);
          return response;
        },
        (error) => {
          console.error('API Error:', error.config?.url, error.response?.status, error.response?.data);
          // Não redirecionar automaticamente para login em caso de erro 401
          // Deixar que o componente trate o erro adequadamente
          if (error.response?.status === 401) {
            // Apenas limpar o token se não estivermos na página de login
            if (!window.location.pathname.includes('/login')) {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }
          }
          return Promise.reject(error);
        }
      );
    } catch (error) {
      console.error('Failed to initialize API service:', error);
      throw error;
    }
  }

  private ensureApiInitialized() {
    if (!this.api) {
      console.warn('API instance was null, reinitializing...');
      this.initializeApi();
    }
  }

  // Autenticação
  login = async (data: LoginRequest): Promise<AuthResponse> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/login', data);
    return response.data;
  }

  register = async (data: RegisterRequest): Promise<AuthResponse> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<AuthResponse> = await this.api.post('/auth/register', data);
    return response.data;
  }

  getProfile = async (): Promise<User> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<User> = await this.api.get('/auth/profile');
    return response.data;
  }

  // Transações Financeiras
  getTransactions = async (filters?: TransactionFilters): Promise<PaginatedResponse<FinancialTransaction>> => {
    this.ensureApiInitialized();
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    console.log('Fetching transactions with URL:', `/financeiro/transactions?${params.toString()}`);
    
    const response: AxiosResponse<FinancialTransaction[]> = await this.api.get(
      `/financeiro/transactions?${params.toString()}`
    );
    
    console.log('API Response:', response.data);
    
    // If the API returns an array directly, wrap it in a paginated response
    if (Array.isArray(response.data)) {
      const paginatedResponse = {
        data: response.data,
        total: response.data.length,
        page: 1,
        limit: response.data.length,
        totalPages: 1
      };
      console.log('Wrapped response:', paginatedResponse);
      return paginatedResponse;
    }
    
    return response.data;
  }

  getTransaction = async (id: string): Promise<FinancialTransaction> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<FinancialTransaction> = await this.api.get(`/financeiro/transactions/${id}`);
    return response.data;
  }

  createTransaction = async (data: CreateTransactionRequest): Promise<FinancialTransaction> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<FinancialTransaction> = await this.api.post('/financeiro/transactions', data);
    return response.data;
  }

  updateTransaction = async (id: string, data: UpdateTransactionRequest): Promise<FinancialTransaction> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<FinancialTransaction> = await this.api.patch(`/financeiro/transactions/${id}`, data);
    return response.data;
  }

  deleteTransaction = async (id: string, deleteAllRecurring?: boolean): Promise<any> => {
    this.ensureApiInitialized();
    const params = deleteAllRecurring ? `?deleteAllRecurring=true` : '';
    const response = await this.api.delete(`/financeiro/transactions/${id}${params}`);
    return response.data;
  }

  makeRecurring = async (id: string, data: { frequency: string; interval: number; endDate?: string }): Promise<any> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<any> = await this.api.post(`/financeiro/transactions/${id}/make-recurring`, data);
    return response.data;
  }

  markAsPaid = async (id: string, paidAt?: string): Promise<FinancialTransaction> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<FinancialTransaction> = await this.api.put(
      `/financeiro/transactions/${id}/mark-as-paid`,
      { paidAt }
    );
    return response.data;
  }

  markAsUnpaid = async (id: string): Promise<FinancialTransaction> => {
    this.ensureApiInitialized();
    // Determina o status apropriado baseado na data de vencimento
    const transaction = await this.getTransaction(id);
    const dueDate = new Date(transaction.dueDate);
    const today = new Date();
    
    const newStatus = dueDate < today ? 'OVERDUE' : 'PENDING';
    
    const response: AxiosResponse<FinancialTransaction> = await this.api.patch(
      `/financeiro/transactions/${id}`,
      { 
        status: newStatus,
        paidDate: null 
      }
    );
    return response.data;
  }

  markOverdue = async (): Promise<void> => {
    this.ensureApiInitialized();
    await this.api.put('/financeiro/transactions/mark-overdue');
  }

  // Dashboard data is now calculated locally from transactions
  // getDashboard = async (): Promise<DashboardData> => {
  //   this.ensureApiInitialized();
  //   const response: AxiosResponse<DashboardData> = await this.api.get('/financeiro/transactions/dashboard');
  //   return response.data;
  // }

  // Categorias Financeiras
  getCategories = async (filters?: CategoryFilters): Promise<FinancialCategory[]> => {
    this.ensureApiInitialized();
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response: AxiosResponse<FinancialCategory[]> = await this.api.get(
      `/financeiro/categories?${params.toString()}`
    );
    return response.data;
  }

  getCategory = async (id: string): Promise<FinancialCategory> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<FinancialCategory> = await this.api.get(`/financeiro/categories/${id}`);
    return response.data;
  }

  createCategory = async (data: CreateCategoryRequest): Promise<FinancialCategory> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<FinancialCategory> = await this.api.post('/financeiro/categories', data);
    return response.data;
  }

  updateCategory = async (id: string, data: UpdateCategoryRequest): Promise<FinancialCategory> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<FinancialCategory> = await this.api.patch(`/financeiro/categories/${id}`, data);
    return response.data;
  }

  deleteCategory = async (id: string): Promise<void> => {
    this.ensureApiInitialized();
    await this.api.delete(`/financeiro/categories/${id}`);
  }

  // Métodos de Pagamento
  getPaymentMethods = async (): Promise<PaymentMethod[]> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<PaymentMethod[]> = await this.api.get('/financeiro/payment-methods');
    return response.data;
  }

  getPaymentMethod = async (id: string): Promise<PaymentMethod> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<PaymentMethod> = await this.api.get(`/financeiro/payment-methods/${id}`);
    return response.data;
  }

  createPaymentMethod = async (data: CreatePaymentMethodRequest): Promise<PaymentMethod> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<PaymentMethod> = await this.api.post('/financeiro/payment-methods', data);
    return response.data;
  }

  updatePaymentMethod = async (id: string, data: UpdatePaymentMethodRequest): Promise<PaymentMethod> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<PaymentMethod> = await this.api.patch(`/financeiro/payment-methods/${id}`, data);
    return response.data;
  }

  deletePaymentMethod = async (id: string): Promise<void> => {
    this.ensureApiInitialized();
    await this.api.delete(`/financeiro/payment-methods/${id}`);
  }

  // Pagamentos Recorrentes
  getRecurringPayments = async (): Promise<RecurringPayment[]> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<RecurringPayment[]> = await this.api.get('/financeiro/recurring-payments');
    return response.data;
  }

  getRecurringPayment = async (id: string): Promise<RecurringPayment> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<RecurringPayment> = await this.api.get(`/financeiro/recurring-payments/${id}`);
    return response.data;
  }

  createRecurringPayment = async (data: CreateRecurringPaymentRequest): Promise<RecurringPayment> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<RecurringPayment> = await this.api.post('/financeiro/recurring-payments', data);
    return response.data;
  }

  updateRecurringPayment = async (id: string, data: Partial<CreateRecurringPaymentRequest>): Promise<RecurringPayment> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<RecurringPayment> = await this.api.patch(`/financeiro/recurring-payments/${id}`, data);
    return response.data;
  }

  deleteRecurringPayment = async (id: string): Promise<void> => {
    this.ensureApiInitialized();
    await this.api.delete(`/financeiro/recurring-payments/${id}`);
  }

  // Administração de Usuários
  getUsers = async (): Promise<User[]> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<User[]> = await this.api.get('/users');
    return response.data;
  }

  getUser = async (id: string): Promise<User> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<User> = await this.api.get(`/users/${id}`);
    return response.data;
  }

  toggleAdminStatus = async (id: string): Promise<User> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<User> = await this.api.post(`/users/${id}/toggle-admin`);
    return response.data;
  }

  updateUserPermissions = async (id: string, data: UpdateUserPermissionsRequest): Promise<UserPermission[]> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<UserPermission[]> = await this.api.put(`/users/${id}/permissions`, data);
    return response.data;
  }

  getUserPermissions = async (id: string): Promise<UserPermission[]> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<UserPermission[]> = await this.api.get(`/users/${id}/permissions`);
    return response.data;
  }

  getMyPermissions = async (): Promise<UserPermission[]> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<UserPermission[]> = await this.api.get('/users/me/permissions');
    return response.data;
  }

  // Bancos
  getBanks = async (): Promise<Bank[]> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<Bank[]> = await this.api.get('/bancos');
    return response.data;
  }

  getBank = async (id: string): Promise<Bank> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<Bank> = await this.api.get(`/bancos/${id}`);
    return response.data;
  }

  createBank = async (data: CreateBankRequest): Promise<Bank> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<Bank> = await this.api.post('/bancos', data);
    return response.data;
  }

  updateBank = async (id: string, data: UpdateBankRequest): Promise<Bank> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<Bank> = await this.api.patch(`/bancos/${id}`, data);
    return response.data;
  }

  deleteBank = async (id: string): Promise<void> => {
    this.ensureApiInitialized();
    await this.api.delete(`/bancos/${id}`);
  }

  getBankBalance = async (id: string): Promise<BankBalance> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<BankBalance> = await this.api.get(`/bancos/${id}/balance`);
    return response.data;
  }

  getAccountTypes = async (): Promise<any[]> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<any[]> = await this.api.get('/bancos/account-types');
    return response.data;
  };

  getDocumentTypes = async (): Promise<DocumentType[]> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<DocumentType[]> = await this.api.get('/bancos/document-types');
    return response.data;
  }

  // Transações Bancárias
  getAllBankTransactions = async (filters?: BankTransactionFilters): Promise<PaginatedResponse<BankTransaction>> => {
    this.ensureApiInitialized();
    const params = new URLSearchParams();
    
    // Adicionar parâmetro 'all=true' para buscar todas as transações
    params.append('all', 'true');
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response: AxiosResponse<BankTransaction[]> = await this.api.get(
      `/bancos/transactions?${params.toString()}`
    );
    
    // If the API returns an array directly, wrap it in a paginated response
    if (Array.isArray(response.data)) {
      return {
        data: response.data,
        total: response.data.length,
        page: 1,
        limit: response.data.length,
        totalPages: 1
      };
    }
    
    return response.data;
  };

  getBankTransactions = async (bankId: string, filters?: BankTransactionFilters): Promise<PaginatedResponse<BankTransaction>> => {
    this.ensureApiInitialized();
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response: AxiosResponse<BankTransaction[]> = await this.api.get(
      `/bancos/${bankId}/transactions?${params.toString()}`
    );
    
    // If the API returns an array directly, wrap it in a paginated response
    if (Array.isArray(response.data)) {
      return {
        data: response.data,
        total: response.data.length,
        page: 1,
        limit: response.data.length,
        totalPages: 1
      };
    }
    
    return response.data;
  }

  getBankTransaction = async (bankId: string, transactionId: string): Promise<BankTransaction> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<BankTransaction> = await this.api.get(`/bancos/${bankId}/transactions/${transactionId}`);
    return response.data;
  }

  createBankTransaction = async (bankId: string, data: CreateBankTransactionRequest): Promise<BankTransaction> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<BankTransaction> = await this.api.post(`/bancos/${bankId}/transactions`, data);
    return response.data;
  }

  updateBankTransaction = async (bankId: string, transactionId: string, data: UpdateBankTransactionRequest): Promise<BankTransaction> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<BankTransaction> = await this.api.patch(`/bancos/${bankId}/transactions/${transactionId}`, data);
    return response.data;
  }

  updateBankTransactionStatus = async (bankId: string, transactionId: string, status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'): Promise<BankTransaction> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<BankTransaction> = await this.api.patch(`/bancos/${bankId}/transactions/${transactionId}/status`, { status });
    return response.data;
  }

  deleteBankTransaction = async (bankId: string, transactionId: string): Promise<void> => {
    this.ensureApiInitialized();
    await this.api.delete(`/bancos/${bankId}/transactions/${transactionId}`);
  }

  getBankTransactionSummary = async (bankId: string, startDate?: string, endDate?: string): Promise<BankTransactionSummary> => {
    this.ensureApiInitialized();
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response: AxiosResponse<BankTransactionSummary> = await this.api.get(
      `/bancos/${bankId}/transactions/summary?${params.toString()}`
    );
    return response.data;
  }

  // Importação OFX
  uploadOfxFile = async (file: File, bankId: string, description?: string): Promise<OfxImportResponse> => {
    this.ensureApiInitialized();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', file.name);
    formData.append('bankId', bankId);
    if (description) {
      formData.append('description', description);
    }

    const response: AxiosResponse<OfxImportResponse> = await this.api.post('/ofx-import/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  getOfxImports = async (): Promise<OfxImport[]> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<OfxImport[]> = await this.api.get('/ofx-import');
    return response.data;
  }

  getOfxImport = async (id: string): Promise<OfxImport> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<OfxImport> = await this.api.get(`/ofx-import/${id}`);
    return response.data;
  }

  getOfxImportStatus = async (id: string): Promise<OfxImportStatus> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<OfxImportStatus> = await this.api.get(`/ofx-import/${id}/status`);
    return response.data;
  }

  deleteOfxImport = async (id: string): Promise<void> => {
    this.ensureApiInitialized();
    await this.api.delete(`/ofx-import/${id}`);
  }

  // Unidades
  getUnidades = async (): Promise<Unidade[]> => {
    this.ensureApiInitialized();
    const response = await this.api.get('/unidades');
    return response.data;
  }

  createUnidade = async (data: { nome: string; local: string }): Promise<Unidade> => {
    this.ensureApiInitialized();
    const response = await this.api.post('/unidades', data);
    return response.data;
  }

  updateUnidade = async (id: string, data: { nome?: string; local?: string }): Promise<Unidade> => {
    this.ensureApiInitialized();
    const response = await this.api.patch(`/unidades/${id}`, data);
    return response.data;
  }

  deleteUnidade = async (id: string): Promise<any> => {
    this.ensureApiInitialized();
    const response = await this.api.delete(`/unidades/${id}`);
    return response.data;
  }

  // Categorização Automática com IA
  getPendingCategorizationTransactions = async (): Promise<PendingCategorizationTransaction[]> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<PendingCategorizationTransaction[]> = await this.api.get('/ai-categorization/pending');
    return response.data;
  }

  getAiCategorizationSuggestion = async (transactionId: string): Promise<AiCategorizationSuggestionResponse> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<AiCategorizationSuggestionResponse> = await this.api.post(`/ai-categorization/suggest/${transactionId}`);
    return response.data;
  }

  applyAiCategorization = async (transactionId: string, categoryId: string, bankId: string): Promise<AiCategorizationResponse> => {
    this.ensureApiInitialized();
    
    try {
      const response: AxiosResponse<BankTransaction> = await this.api.patch(`/bancos/${bankId}/transactions/${transactionId}`, {
        categoryId
      });
      
      // Converter a resposta para o formato esperado
      return {
        transactionId,
        transaction: {
          id: response.data.id,
          title: response.data.title,
          description: response.data.description,
          amount: response.data.amount,
          type: response.data.type,
          transactionDate: response.data.transactionDate
        },
        autoApplied: true,
        message: 'Categorização aplicada com sucesso'
      };
    } catch (error) {
      console.error('Erro ao aplicar categorização:', error);
      throw error;
    }
  }

  getBatchAiCategorizationSuggestions = async (data: BatchCategorizationRequest): Promise<BatchCategorizationResponse> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<BatchCategorizationResponse> = await this.api.post('/ai-categorization/batch-suggest', data);
    return response.data;
  }

  // OFX Pendentes - Novas rotas da estratégia implementada
  getOfxPendingTransactionsByImport = async (importId: string): Promise<OfxPendingTransaction[]> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<OfxPendingTransaction[]> = await this.api.get(`/ofx-pending-transactions/import/${importId}`);
    return response.data;
  }

  getOfxPendingTransactionsSummary = async (importId: string): Promise<OfxPendingTransactionSummary> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<OfxPendingTransactionSummary> = await this.api.get(`/ofx-pending-transactions/import/${importId}/summary`);
    return response.data;
  }

  updateOfxTransactionCategory = async (id: string, data: UpdateOfxTransactionCategoryRequest): Promise<OfxPendingTransaction> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<OfxPendingTransaction> = await this.api.put(`/ofx-pending-transactions/${id}/category`, data);
    return response.data;
  }

  suggestOfxTransactionCategory = async (id: string): Promise<AiCategorizationSuggestionResponse> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<AiCategorizationSuggestionResponse> = await this.api.post(`/ofx-pending-transactions/${id}/suggest-category`);
    return response.data;
  }

  batchUpdateOfxCategories = async (data: BatchUpdateOfxCategoriesRequest): Promise<OfxPendingTransaction[]> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<OfxPendingTransaction[]> = await this.api.put('/ofx-pending-transactions/batch-update-categories', data);
    return response.data;
  }

  approveOfxImport = async (importId: string): Promise<ApproveOfxImportResponse> => {
    this.ensureApiInitialized();
    const response: AxiosResponse<ApproveOfxImportResponse> = await this.api.post(`/ofx-pending-transactions/import/${importId}/approve`);
    return response.data;
  }

}

export const apiService = new ApiService();
export default apiService; 