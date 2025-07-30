export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  userModules?: UserModule[];
  userPermissions?: UserPermission[];
}

export interface UserModule {
  id: string;
  userId: string;
  moduleId: string;
  isActive: boolean;
  createdAt: string;
  module: Module;
}

export interface Module {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPermission {
  id: string;
  userId: string;
  moduleId: string;
  resource: string;
  action: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  module: Module;
}

export interface Permission {
  resource: string;
  action: string;
  isActive: boolean;
}

export interface UpdateUserPermissionsRequest {
  moduleId: string;
  permissions: Permission[];
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface FinancialTransaction {
  id: string;
  title: string;
  description?: string;
  amount: number | string;
  type: 'RECEIVABLE' | 'PAYABLE';
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  dueDate: string;
  paidDate?: string;
  paidAt?: string;
  categoryId?: string;
  paymentMethodId?: string;
  userId?: string;
  isRecurring: boolean;
  originalTransactionId?: string; // Referência para a transação original
  recurrenceFrequency?: 'DAILY' | 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'ANNUAL' | 'UNTIL_END_OF_YEAR';
  recurrenceInterval?: number; // Número de parcelas
  recurrenceEndDate?: string;
  createdAt: string;
  updatedAt: string;
  category?: FinancialCategory;
  paymentMethod?: PaymentMethod;
  originalTransaction?: FinancialTransaction; // Auto-relacionamento
  recurringTransactions?: FinancialTransaction[]; // Auto-relacionamento
}

export interface FinancialCategory {
  id: string;
  name: string;
  description?: string;
  type: 'RECEIVABLE' | 'PAYABLE';
  createdAt: string;
  updatedAt: string;
  _count?: {
    transactions: number;
  };
}

export interface PaymentMethod {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionRequest {
  title: string;
  description?: string;
  amount: number | string;
  type: 'RECEIVABLE' | 'PAYABLE';
  dueDate: string;
  categoryId?: string;
  paymentMethodId?: string;
  isRecurring?: boolean;
  recurringInterval?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'ANNUAL';
  recurringEndDate?: string;
}

export interface UpdateTransactionRequest {
  title?: string;
  description?: string;
  amount?: number | string;
  type?: 'RECEIVABLE' | 'PAYABLE';
  status?: 'PENDING' | 'PAID' | 'OVERDUE';
  dueDate?: string;
  paidDate?: string | null;
  categoryId?: string;
  paymentMethodId?: string;
  isRecurring?: boolean;
  recurringInterval?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'ANNUAL';
  recurringEndDate?: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  type: 'RECEIVABLE' | 'PAYABLE';
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  type?: 'RECEIVABLE' | 'PAYABLE';
}

export interface CreatePaymentMethodRequest {
  name: string;
  description?: string;
  icon: string;
}

export interface UpdatePaymentMethodRequest {
  name?: string;
  description?: string;
  icon?: string;
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  type?: 'RECEIVABLE' | 'PAYABLE';
  status?: 'PENDING' | 'PAID' | 'OVERDUE';
  categoryId?: string;
  paymentMethodId?: string;
  search?: string;
}

export interface CategoryFilters {
  search?: string;
  type?: 'RECEIVABLE' | 'PAYABLE';
}

export interface DashboardData {
  totalReceivable: number;
  totalPayable: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  monthlyData: {
    month: string;
    receivable: number;
    payable: number;
  }[];
  recentTransactions: FinancialTransaction[];
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Tipos para Bancos
export interface Bank {
  id: string;
  name: string;
  accountNumber: string;
  accountType: 'CHECKING' | 'SAVINGS' | 'INVESTMENT' | 'CREDIT';
  balance: number;
  documentType: 'CPF' | 'CNPJ';
  document: string;
  holderName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BankTransaction {
  id: string;
  title: string;
  description?: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  transactionDate: string;
  categoryId?: string;
  paymentMethodId?: string;
  bankId: string;
  createdAt: string;
  updatedAt: string;
  category?: FinancialCategory;
  paymentMethod?: PaymentMethod;
  bank?: Bank;
}

export interface CreateBankRequest {
  name: string;
  accountNumber: string;
  accountType: 'CHECKING' | 'SAVINGS' | 'INVESTMENT' | 'CREDIT';
  balance: number;
  documentType: 'CPF' | 'CNPJ';
  document: string;
  holderName: string;
}

export interface UpdateBankRequest {
  name?: string;
  accountNumber?: string;
  accountType?: 'CHECKING' | 'SAVINGS' | 'INVESTMENT' | 'CREDIT';
  balance?: number;
  documentType?: 'CPF' | 'CNPJ';
  document?: string;
  holderName?: string;
}

export interface CreateBankTransactionRequest {
  title: string;
  description?: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  transactionDate: string;
  categoryId?: string;
  paymentMethodId?: string;
}

export interface UpdateBankTransactionRequest {
  title?: string;
  description?: string;
  amount?: number;
  type?: 'CREDIT' | 'DEBIT';
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  transactionDate?: string;
  categoryId?: string;
  paymentMethodId?: string;
}

export interface BankTransactionFilters {
  type?: 'CREDIT' | 'DEBIT';
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  categoryId?: string;
  paymentMethodId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface BankTransactionSummary {
  totalCredits: number;
  totalDebits: number;
  netAmount: number;
  transactionCount: number;
}

export interface BankBalance {
  balance: number;
}

export interface DocumentType {
  value: string;
  label: string;
}

// Tipos para Importação OFX
export interface OfxImport {
  id: string;
  fileName: string;
  importDate: string;
  bankId: string;
  status: 'PROCESSING' | 'PENDING_REVIEW' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  totalTransactions: number;
  processedTransactions: number;
  errorMessage?: string;
  description?: string;
  bank?: Bank;
  transactions?: BankTransaction[];
}

export interface CreateOfxImportRequest {
  bankId: string;
  description?: string;
}

export interface OfxImportStatus {
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
}

export interface OfxImportResponse {
  message: string;
  importId: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  totalTransactions: number;
  processedTransactions: number;
}

// Tipos para Pagamentos Recorrentes
export type RecurrenceType = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ANNUAL';

export interface RecurringPayment {
  id: string;
  title: string;
  recurrenceType: RecurrenceType; // Tipo de recorrência
  weekday?: number; // 0=Domingo, 1=Segunda, ..., 6=Sábado (apenas para semanal)
  day?: number; // 1-31 (para mensal e anual)
  month?: number; // 1-12 (apenas para anual)
  paymentMethodId?: string;
  unidadeId?: string; // ID da unidade (opcional)
  createdAt: string;
  updatedAt: string;
  paymentMethod?: PaymentMethod;
  unidade?: Unidade; // Dados da unidade (se associada)
}

export interface CreateRecurringPaymentRequest {
  title: string;
  recurrenceType: RecurrenceType;
  weekday?: number;
  day?: number;
  month?: number;
  paymentMethodId?: string;
  unidadeId?: string; // ID da unidade (opcional)
}

export interface Unidade {
  id: string;
  nome: string;
  local: string;
  createdAt: string;
  updatedAt: string;
}

// Tipos para Categorização Automática com IA
export interface AiCategorizationSuggestion {
  categoryId: string;
  categoryName: string;
  confidence: number;
  reasoning: string;
}

export interface AiCategorizationSuggestionResponse {
  suggestion: AiCategorizationSuggestion;
  message?: string;
}

export interface AiCategorizationResponse {
  transactionId: string;
  suggestion?: AiCategorizationSuggestion;
  transaction: {
    id: string;
    title: string;
    description?: string;
    amount: number;
    type: 'CREDIT' | 'DEBIT';
    transactionDate: string;
  };
  autoApplied: boolean;
  message: string;
}

export interface PendingCategorizationTransaction {
  id: string;
  title: string;
  description?: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  transactionDate: string;
  bankId: string;
  bank?: Bank;
  categoryId?: string;
  category?: FinancialCategory;
}

export interface BatchCategorizationRequest {
  transactionIds: string[];
}

export interface BatchCategorizationResponse {
  suggestions: {
    transactionId: string;
    suggestion: AiCategorizationSuggestion;
  }[];
}

// Novos tipos para o fluxo OFX com transações pendentes
export interface OfxPendingTransaction {
  id: string;
  title: string;
  description?: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  transactionDate: string;
  originalId: string; // ID original da transação no arquivo OFX
  ofxImportId: string;
  suggestedCategoryId?: string;
  suggestedCategory?: FinancialCategory;
  confidence: number;
  // Novos campos para método de pagamento sugerido
  suggestedPaymentMethodId?: string;
  suggestedPaymentMethod?: PaymentMethod;
  paymentMethodConfidence?: number;
  finalPaymentMethodId?: string;
  createdAt: string;
  updatedAt: string;
  tags?: Tag[];
}

export interface OfxPendingTransactionSummary {
  importId: string;
  totalTransactions: number;
  highConfidenceCount: number; // confidence >= 70%
  lowConfidenceCount: number; // confidence < 70%
  categorizedCount: number; // transações com categoria sugerida
  uncategorizedCount: number; // transações sem categoria
  fileName: string;
  importDate: string;
  bank?: Bank;
}

export interface UpdateOfxTransactionCategoryRequest {
  categoryId: string;
}

export interface BatchUpdateOfxCategoriesRequest {
  updates: Array<{
    transactionId: string;
    categoryId: string;
  }>;
}

export interface ApproveOfxImportRequest {
  importId: string;
}

export interface ApproveOfxImportResponse {
  success: boolean;
  message: string;
  createdTransactionsCount: number;
  failedTransactionsCount: number;
  errors?: string[];
}

// Tipos para Sistema de Tags
export interface Tag {
  id: string;
  name: string;
  color?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    financialTransactions: number;
    ofxPendingTransactions: number;
  };
}

export interface CreateTagRequest {
  name: string;
  color?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateTagRequest {
  name?: string;
  color?: string;
  description?: string;
  isActive?: boolean;
}

export interface TagFilters {
  name?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface MostUsedTag {
  id: string;
  name: string;
  color?: string;
  isActive: boolean;
  totalUsages: number;
}

// Atualizar tipos existentes para incluir tags
export interface FinancialTransaction {
  id: string;
  title: string;
  description?: string;
  amount: number | string;
  type: 'RECEIVABLE' | 'PAYABLE';
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  dueDate: string;
  paidDate?: string;
  paidAt?: string;
  categoryId?: string;
  paymentMethodId?: string;
  userId?: string;
  isRecurring: boolean;
  originalTransactionId?: string;
  recurrenceFrequency?: 'DAILY' | 'WEEKLY' | 'FORTNIGHTLY' | 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'ANNUAL' | 'UNTIL_END_OF_YEAR';
  recurrenceInterval?: number;
  recurrenceEndDate?: string;
  createdAt: string;
  updatedAt: string;
  category?: FinancialCategory;
  paymentMethod?: PaymentMethod;
  originalTransaction?: FinancialTransaction;
  recurringTransactions?: FinancialTransaction[];
  tags?: Tag[];
}

export interface BankTransaction {
  id: string;
  title: string;
  description?: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  transactionDate: string;
  categoryId?: string;
  paymentMethodId?: string;
  bankId: string;
  createdAt: string;
  updatedAt: string;
  category?: FinancialCategory;
  paymentMethod?: PaymentMethod;
  bank?: Bank;
  tags?: Tag[];
}

export interface OfxPendingTransaction {
  id: string;
  title: string;
  description?: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  transactionDate: string;
  originalId: string;
  ofxImportId: string;
  suggestedCategoryId?: string;
  suggestedCategory?: FinancialCategory;
  confidence: number;
  // Novos campos para método de pagamento sugerido
  suggestedPaymentMethodId?: string;
  suggestedPaymentMethod?: PaymentMethod;
  paymentMethodConfidence?: number;
  finalPaymentMethodId?: string;
  createdAt: string;
  updatedAt: string;
  tags?: Tag[];
}

export interface UpdateOfxTransactionTagsRequest {
  tagIds: string[];
}

export interface CreateTransactionRequest {
  title: string;
  description?: string;
  amount: number | string;
  type: 'RECEIVABLE' | 'PAYABLE';
  dueDate: string;
  categoryId?: string;
  paymentMethodId?: string;
  isRecurring?: boolean;
  recurringInterval?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'ANNUAL';
  recurringEndDate?: string;
  tagIds?: string[];
}

export interface UpdateTransactionRequest {
  title?: string;
  description?: string;
  amount?: number | string;
  type?: 'RECEIVABLE' | 'PAYABLE';
  status?: 'PENDING' | 'PAID' | 'OVERDUE';
  dueDate?: string;
  paidDate?: string | null;
  categoryId?: string;
  paymentMethodId?: string;
  isRecurring?: boolean;
  recurringInterval?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'ANNUAL';
  recurringEndDate?: string;
  tagIds?: string[];
}

export interface CreateBankTransactionRequest {
  title: string;
  description?: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  transactionDate: string;
  categoryId?: string;
  paymentMethodId?: string;
  tagIds?: string[];
}

export interface UpdateBankTransactionRequest {
  title?: string;
  description?: string;
  amount?: number;
  type?: 'CREDIT' | 'DEBIT';
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  transactionDate?: string;
  categoryId?: string;
  paymentMethodId?: string;
  tagIds?: string[];
}

 