import React from 'react';
import { 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  CheckCircle
} from 'lucide-react';
import { FinancialTransaction, BankTransaction } from '../types';
import { formatCurrency, formatDate, parseBackendDate } from '../utils/format';

interface FinancialAlertsProps {
  transactions: (FinancialTransaction | BankTransaction)[];
  totalOverdue: number;
  totalPending: number;
}

const FinancialAlerts: React.FC<FinancialAlertsProps> = ({ 
  transactions, 
  totalOverdue, 
  totalPending 
}) => {
  // Helper function to check if transaction is a FinancialTransaction
  const isFinancialTransaction = (transaction: FinancialTransaction | BankTransaction): transaction is FinancialTransaction => {
    return 'dueDate' in transaction;
  };

  // Helper function to get transaction status
  const getTransactionStatus = (transaction: FinancialTransaction | BankTransaction) => {
    if (isFinancialTransaction(transaction)) {
      return transaction.status;
    } else {
      // Map BankTransaction status to FinancialTransaction status
      switch (transaction.status) {
        case 'CONFIRMED':
          return 'PAID';
        case 'PENDING':
          return 'PENDING';
        case 'CANCELLED':
          return 'OVERDUE';
        default:
          return 'PENDING';
      }
    }
  };

  // Helper function to get transaction type
  const getTransactionType = (transaction: FinancialTransaction | BankTransaction) => {
    if (isFinancialTransaction(transaction)) {
      return transaction.type;
    } else {
      // Map BankTransaction type to FinancialTransaction type
      return transaction.type === 'CREDIT' ? 'RECEIVABLE' : 'PAYABLE';
    }
  };

  // Helper function to get transaction date
  const getTransactionDate = (transaction: FinancialTransaction | BankTransaction) => {
    if (isFinancialTransaction(transaction)) {
      return transaction.dueDate;
    } else {
      return transaction.transactionDate;
    }
  };

  const overdueTransactions = transactions.filter(t => getTransactionStatus(t) === 'OVERDUE');
  const pendingTransactions = transactions.filter(t => getTransactionStatus(t) === 'PENDING');
  const recentTransactions = transactions
    .filter(t => parseBackendDate(getTransactionDate(t)) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    .slice(0, 5);

  const getAlertIcon = (type: 'overdue' | 'pending' | 'recent' | 'positive') => {
    switch (type) {
      case 'overdue':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'recent':
        return <DollarSign className="h-5 w-5 text-blue-500" />;
      case 'positive':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAlertColor = (type: 'overdue' | 'pending' | 'recent' | 'positive') => {
    switch (type) {
      case 'overdue':
        return 'border-red-200 bg-red-50';
      case 'pending':
        return 'border-yellow-200 bg-yellow-50';
      case 'recent':
        return 'border-blue-200 bg-blue-50';
      case 'positive':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getAlertTextColor = (type: 'overdue' | 'pending' | 'recent' | 'positive') => {
    switch (type) {
      case 'overdue':
        return 'text-red-800';
      case 'pending':
        return 'text-yellow-800';
      case 'recent':
        return 'text-blue-800';
      case 'positive':
        return 'text-green-800';
      default:
        return 'text-gray-800';
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <CheckCircle className="h-6 w-6 text-green-500 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Status Financeiro</h3>
            <p className="text-gray-600">Nenhuma transação encontrada. Seu sistema está limpo!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alertas Críticos */}
      {totalOverdue > 0 && (
        <div className={`border rounded-lg p-4 ${getAlertColor('overdue')}`}>
          <div className="flex items-start">
            {getAlertIcon('overdue')}
            <div className="ml-3 flex-1">
              <h3 className={`text-sm font-medium ${getAlertTextColor('overdue')}`}>
                Transações Vencidas
              </h3>
              <div className="mt-2 text-sm">
                <p className={`${getAlertTextColor('overdue')}`}>
                  Você tem <strong>{overdueTransactions.length}</strong> transação(ões) vencida(s) 
                  totalizando <strong>{formatCurrency(totalOverdue)}</strong>
                </p>
                <div className="mt-2 space-y-1">
                  {overdueTransactions.slice(0, 3).map((transaction) => (
                    <div key={transaction.id} className="flex justify-between items-center">
                      <span className="text-sm">{transaction.title}</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(Number(transaction.amount))}
                      </span>
                    </div>
                  ))}
                  {overdueTransactions.length > 3 && (
                    <p className="text-sm italic">
                      +{overdueTransactions.length - 3} mais transações vencidas
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alertas de Pendências */}
      {totalPending > 0 && (
        <div className={`border rounded-lg p-4 ${getAlertColor('pending')}`}>
          <div className="flex items-start">
            {getAlertIcon('pending')}
            <div className="ml-3 flex-1">
              <h3 className={`text-sm font-medium ${getAlertTextColor('pending')}`}>
                Transações Pendentes
              </h3>
              <div className="mt-2 text-sm">
                <p className={`${getAlertTextColor('pending')}`}>
                  Você tem <strong>{pendingTransactions.length}</strong> transação(ões) pendente(s) 
                  totalizando <strong>{formatCurrency(totalPending)}</strong>
                </p>
                <div className="mt-2 space-y-1">
                  {pendingTransactions.slice(0, 3).map((transaction) => (
                    <div key={transaction.id} className="flex justify-between items-center">
                      <span className="text-sm">{transaction.title}</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(Number(transaction.amount))}
                      </span>
                    </div>
                  ))}
                  {pendingTransactions.length > 3 && (
                    <p className="text-sm italic">
                      +{pendingTransactions.length - 3} mais transações pendentes
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resumo Positivo */}
      {totalOverdue === 0 && totalPending === 0 && (
        <div className={`border rounded-lg p-4 ${getAlertColor('positive')}`}>
          <div className="flex items-start">
            {getAlertIcon('positive')}
            <div className="ml-3 flex-1">
              <h3 className={`text-sm font-medium ${getAlertTextColor('positive')}`}>
                Status Financeiro Saudável
              </h3>
              <div className="mt-2 text-sm">
                <p className={`${getAlertTextColor('positive')}`}>
                  Parabéns! Todas as suas transações estão em dia. 
                  Continue mantendo esse controle financeiro!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transações Recentes */}
      {recentTransactions.length > 0 && (
        <div className={`border rounded-lg p-4 ${getAlertColor('recent')}`}>
          <div className="flex items-start">
            {getAlertIcon('recent')}
            <div className="ml-3 flex-1">
              <h3 className={`text-sm font-medium ${getAlertTextColor('recent')}`}>
                Transações Recentes (Últimos 7 dias)
              </h3>
              <div className="mt-2 text-sm">
                <div className="space-y-1">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{transaction.title}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          getTransactionStatus(transaction) === 'PAID' 
                            ? 'bg-green-100 text-green-800'
                            : getTransactionStatus(transaction) === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {getTransactionStatus(transaction) === 'PAID' ? 'Pago' : 
                           getTransactionStatus(transaction) === 'PENDING' ? 'Pendente' : 'Vencido'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${
                          getTransactionType(transaction) === 'RECEIVABLE' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {getTransactionType(transaction) === 'RECEIVABLE' ? '+' : '-'}
                          {formatCurrency(Number(transaction.amount))}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(getTransactionDate(transaction))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estatísticas Rápidas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Resumo Rápido</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {transactions.filter(t => getTransactionStatus(t) === 'PAID').length}
            </div>
            <div className="text-xs text-gray-500">Transações Pagas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {transactions.filter(t => getTransactionType(t) === 'RECEIVABLE').length}
            </div>
            <div className="text-xs text-gray-500">Receitas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {transactions.filter(t => getTransactionType(t) === 'PAYABLE').length}
            </div>
            <div className="text-xs text-gray-500">Despesas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {transactions.filter(t => isFinancialTransaction(t) && t.isRecurring).length}
            </div>
            <div className="text-xs text-gray-500">Recorrentes</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialAlerts; 