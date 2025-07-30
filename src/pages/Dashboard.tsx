import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  AlertTriangle,
  Eye,
  Download,
  HelpCircle,
  ChevronDown,
  Star,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  Line, 
  Bar, 
  ComposedChart,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import apiService from '../services/api';
import { BankTransaction, PaginatedResponse, Bank } from '../types';

import { formatCurrency, formatDate, parseBackendDate } from '../utils/format';
import Button from '../components/ui/Button';

const Dashboard: React.FC = () => {
  const [selectedBank, setSelectedBank] = useState<string>('all');
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fechar dropdown quando clicar fora
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.bank-dropdown')) {
        setIsBankDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: transactionsResponse, isLoading, error } = useQuery<PaginatedResponse<BankTransaction>>(
    ['bankTransactions'],
    () => apiService.getAllBankTransactions(),
    {
      refetchInterval: 300000, // Refetch a cada 5 minutos
    }
  );

  const { data: banksResponse } = useQuery<Bank[]>(
    ['banks'],
    () => apiService.getBanks(),
    {
      refetchInterval: 300000, // Refetch a cada 5 minutos
    }
  );

  const transactions = transactionsResponse?.data || [];
  const banks = banksResponse || [];

  // Calcular saldo real de cada banco baseado nas transações
  const banksWithRealBalance = React.useMemo(() => {
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

  // Calcular dados do dashboard localmente
  const dashboardData = React.useMemo(() => {
    // Filtrar transações por banco selecionado
    const filteredTransactions = selectedBank === 'all' 
      ? transactions 
      : transactions.filter(t => t.bankId === selectedBank);

    if (!filteredTransactions.length) {
      return {
        totalReceivable: 0,
        totalPayable: 0,
        totalPaid: 0,
        totalPending: 0,
        totalOverdue: 0,
        monthlyData: [],
        recentTransactions: [],
        // Dados do comparativo
        currentMonthReceivable: 0,
        currentMonthPayable: 0,
        previousMonthReceivable: 0,
        previousMonthPayable: 0,
        receivableVariation: 0,
        payableVariation: 0,
        topCategories: [],
        todayTransactions: [],
        overdueTransactions: []
      };
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filtrar transações do mês atual
    const currentMonthStart = new Date(currentYear, currentMonth, 1);
    const currentMonthEnd = new Date(currentYear, currentMonth + 1, 0);
    
    const periodFilteredTransactions = filteredTransactions.filter(t => {
      const transactionDate = parseBackendDate(t.transactionDate);
      return transactionDate >= currentMonthStart && transactionDate <= currentMonthEnd;
    });

    // Calcular dados do mês anterior para o comparativo
    const previousMonthStart = new Date(currentYear, currentMonth - 1, 1);
    const previousMonthEnd = new Date(currentYear, currentMonth, 0);

    // Transações do mês atual (usando periodFilteredTransactions)
    const currentMonthTransactions = periodFilteredTransactions;

    // Transações do mês anterior
    const previousMonthTransactions = filteredTransactions.filter(t => {
      const transactionDate = parseBackendDate(t.transactionDate);
      return transactionDate >= previousMonthStart && transactionDate <= previousMonthEnd;
    });

    // Calcular receitas e despesas do mês atual
    const currentMonthReceivable = currentMonthTransactions
      .filter(t => t.type === 'CREDIT')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const currentMonthPayable = currentMonthTransactions
      .filter(t => t.type === 'DEBIT')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Calcular receitas e despesas do mês anterior
    const previousMonthReceivable = previousMonthTransactions
      .filter(t => t.type === 'CREDIT')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const previousMonthPayable = previousMonthTransactions
      .filter(t => t.type === 'DEBIT')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Calcular variações percentuais
    const receivableVariation = previousMonthReceivable > 0 
      ? ((currentMonthReceivable - previousMonthReceivable) / previousMonthReceivable) * 100
      : currentMonthReceivable > 0 ? 100 : 0;

    const payableVariation = previousMonthPayable > 0 
      ? ((currentMonthPayable - previousMonthPayable) / previousMonthPayable) * 100
      : currentMonthPayable > 0 ? 100 : 0;

    // Calcular totais baseado no tipo de transação bancária
    const totalReceivable = periodFilteredTransactions
      .filter(t => t.type === 'CREDIT')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalPayable = periodFilteredTransactions
      .filter(t => t.type === 'DEBIT')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalPaid = periodFilteredTransactions
      .filter(t => t.status === 'CONFIRMED')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalPending = periodFilteredTransactions
      .filter(t => t.status === 'PENDING')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalOverdue = 0; // Transações bancárias não têm status OVERDUE

    // Calcular dados mensais - sempre mostrar 3 meses para o gráfico de fluxo
    const monthlyData = [];
    const monthsToShow = 3; // Sempre 3 meses: atual, passado e retrasado
    
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const month = new Date(currentYear, currentMonth - i, 1);
      const monthName = month.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      
      const monthTransactions = periodFilteredTransactions.filter(t => {
        const transactionDate = parseBackendDate(t.transactionDate);
        return transactionDate.getMonth() === month.getMonth() && 
               transactionDate.getFullYear() === month.getFullYear();
      });

      const receivable = monthTransactions
        .filter(t => t.type === 'CREDIT')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const payable = monthTransactions
        .filter(t => t.type === 'DEBIT')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      monthlyData.push({
        month: monthName,
        receivable,
        payable
      });
    }

    // Transações recentes (últimas 5)
    const recentTransactions = periodFilteredTransactions
      .sort((a, b) => parseBackendDate(b.transactionDate).getTime() - parseBackendDate(a.transactionDate).getTime())
      .slice(0, 5);

    // Transações de hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayTransactions = filteredTransactions.filter(t => {
      const transactionDate = parseBackendDate(t.transactionDate);
      return transactionDate >= today && transactionDate <= todayEnd && t.status === 'PENDING';
    });

    // Transações atrasadas
    const overdueTransactions = filteredTransactions.filter(t => {
      const transactionDate = parseBackendDate(t.transactionDate);
      return transactionDate < today && t.status === 'PENDING';
    });

    // Calcular dados para o card "Previsto / Realizado"
    const recebidoConfirmado = periodFilteredTransactions
      .filter(t => t.type === 'CREDIT' && t.status === 'CONFIRMED')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const recebidoPendente = periodFilteredTransactions
      .filter(t => t.type === 'CREDIT' && t.status === 'PENDING')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const pagoConfirmado = periodFilteredTransactions
      .filter(t => t.type === 'DEBIT' && t.status === 'CONFIRMED')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const pagoPendente = periodFilteredTransactions
      .filter(t => t.type === 'DEBIT' && t.status === 'PENDING')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalPrevistoRecebido = recebidoConfirmado + recebidoPendente;
    const totalPrevistoPago = pagoConfirmado + pagoPendente;

    // Calcular dados das categorias para o comparativo
    const categoriesCurrentMonth = new Map<string, number>();
    const categoriesPreviousMonth = new Map<string, number>();

    // Agrupar despesas por categoria no mês atual
    currentMonthTransactions.forEach(t => {
      if (t.type === 'DEBIT' && t.category) {
        const categoryName = t.category.name;
        const current = categoriesCurrentMonth.get(categoryName) || 0;
        categoriesCurrentMonth.set(categoryName, current + Number(t.amount));
      }
    });

    // Agrupar despesas por categoria no mês anterior
    previousMonthTransactions.forEach(t => {
      if (t.type === 'DEBIT' && t.category) {
        const categoryName = t.category.name;
        const current = categoriesPreviousMonth.get(categoryName) || 0;
        categoriesPreviousMonth.set(categoryName, current + Number(t.amount));
      }
    });

    // Criar array com dados das categorias e suas variações
    const categoryData: Array<{
      name: string;
      currentValue: number;
      previousValue: number;
      variation: number;
      difference: number;
    }> = [];
    const allCategories = new Set([...categoriesCurrentMonth.keys(), ...categoriesPreviousMonth.keys()]);

    allCategories.forEach(categoryName => {
      const currentValue = categoriesCurrentMonth.get(categoryName) || 0;
      const previousValue = categoriesPreviousMonth.get(categoryName) || 0;
      const variation = previousValue > 0 
        ? ((currentValue - previousValue) / previousValue) * 100
        : currentValue > 0 ? 100 : 0;

      if (currentValue > 0 || previousValue > 0) {
        categoryData.push({
          name: categoryName,
          currentValue,
          previousValue,
          variation,
          difference: currentValue - previousValue
        });
      }
    });

    // Ordenar categorias por valor atual (maior para menor)
    const topCategories = categoryData
      .sort((a, b) => b.currentValue - a.currentValue)
      .slice(0, 4); // Top 4 categorias

    return {
      totalReceivable,
      totalPayable,
      totalPaid,
      totalPending,
      totalOverdue,
      monthlyData,
      recentTransactions,
      recebidoConfirmado,
      recebidoPendente,
      pagoConfirmado,
      pagoPendente,
      totalPrevistoRecebido,
      totalPrevistoPago,
      // Dados do comparativo
      currentMonthReceivable,
      currentMonthPayable,
      previousMonthReceivable,
      previousMonthPayable,
      receivableVariation,
      payableVariation,
      topCategories,
      todayTransactions,
      overdueTransactions
    };
  }, [transactions, selectedBank]);

  // Função para gerar o calendário
  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentCalendarDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const dayTransactions = transactions.filter(t => {
        const transactionDate = parseBackendDate(t.transactionDate);
        return transactionDate.getFullYear() === currentCalendarDate.getFullYear() &&
               transactionDate.getMonth() === currentCalendarDate.getMonth() &&
               transactionDate.getDate() === currentCalendarDate.getDate();
      });
      
      const hasReceivables = dayTransactions.some(t => t.type === 'CREDIT');
      const hasPayables = dayTransactions.some(t => t.type === 'DEBIT');
      
      days.push({
        date: new Date(currentCalendarDate),
        isCurrentMonth: currentCalendarDate.getMonth() === month,
        isToday: currentCalendarDate.toDateString() === new Date().toDateString(),
        hasReceivables,
        hasPayables,
        transactions: dayTransactions
      });
      
      currentCalendarDate.setDate(currentCalendarDate.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = generateCalendar();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar dados</h2>
        <p className="text-gray-600">Não foi possível carregar os dados do dashboard.</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <TrendingUp className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Nenhum dado disponível</h2>
        <p className="text-gray-600">Adicione transações para ver os relatórios do dashboard.</p>
      </div>
    );
  }

  // Calcular porcentagens de realização
  const recebidoPercentage = (dashboardData.totalPrevistoRecebido || 0) > 0 ? Math.round(((dashboardData.recebidoConfirmado || 0) / (dashboardData.totalPrevistoRecebido || 1)) * 100) : 0;
  const pagoPercentage = (dashboardData.totalPrevistoPago || 0) > 0 ? Math.round(((dashboardData.pagoConfirmado || 0) / (dashboardData.totalPrevistoPago || 1)) * 100) : 0;

  // Preparar dados para gráficos com tratamento para valores zerados
  const chartData = dashboardData.monthlyData.map(item => {
    const receitas = item.receivable || 0;
    const despesas = item.payable || 0;
    const saldo = receitas - despesas;
    
    return {
      month: item.month,
      Receitas: receitas,
      Despesas: -despesas, // Negativo para aparecer abaixo do zero
      Saldo: saldo
    };
  });

  const exportData = () => {
    const dataStr = JSON.stringify(dashboardData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-financeiro-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 -mx-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Dashboard Financeiro</h1>
          <p className="text-gray-600 text-sm sm:text-base">Visão geral das suas finanças e relatórios</p>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
          <Button variant="secondary" size="sm" onClick={exportData}>
            <Download className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
        </div>
      </div>

      {/* Layout Principal - 3 Colunas */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-0">
        
        {/* Coluna Esquerda - Métricas e Gráficos (9 colunas) */}
        <div className="xl:col-span-9 space-y-6 xl:pr-3">
          
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <div className="flex-shrink-0 p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Total Créditos</p>
                  <p className="text-sm sm:text-base lg:text-lg xl:text-xl font-bold text-green-600 break-words">
                    {formatCurrency(dashboardData.totalReceivable)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <div className="flex-shrink-0 p-2 bg-red-100 rounded-lg">
                  <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Total Débitos</p>
                  <p className="text-sm sm:text-base lg:text-lg xl:text-xl font-bold text-red-600 break-words">
                    {formatCurrency(dashboardData.totalPayable)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <div className="flex-shrink-0 p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Pendente</p>
                  <p className="text-sm sm:text-base lg:text-lg xl:text-xl font-bold text-yellow-600 break-words">
                    {formatCurrency(dashboardData.totalPending)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <div className="flex-shrink-0 p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Vencido</p>
                  <p className="text-sm sm:text-base lg:text-lg xl:text-xl font-bold text-red-600 break-words">
                    {formatCurrency(dashboardData.totalOverdue)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Primeira Fileira: Previsto/Realizado e Fluxo de Caixa */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Card Previsto / Realizado no Mês */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Previsto / realizado no mês</h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>

              {/* Círculos de Progresso */}
              <div className="flex justify-center space-x-8 sm:space-x-12 mb-6 sm:mb-8">
                {/* Círculo Recebido */}
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-2">
                    <svg className="w-24 h-24 sm:w-32 sm:h-32 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="3"
                        strokeDasharray={`${recebidoPercentage}, 100`}
                        strokeDashoffset="0"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xs font-medium text-green-600">Recebido</span>
                      <span className="text-lg sm:text-xl font-bold text-gray-900">{recebidoPercentage}%</span>
                    </div>
                  </div>
                </div>

                {/* Círculo Pago */}
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 mb-2">
                    <svg className="w-24 h-24 sm:w-32 sm:h-32 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#EC4899"
                        strokeWidth="3"
                        strokeDasharray={`${pagoPercentage}, 100`}
                        strokeDashoffset="0"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xs font-medium text-pink-600">Pago</span>
                      <span className="text-lg sm:text-xl font-bold text-gray-900">{pagoPercentage}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalhamento */}
              <div className="grid grid-cols-2 gap-4">
                {/* Recebimentos */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Recebimentos</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-green-600">Recebido</span>
                      <span className="text-xs font-medium text-green-600">
                        {formatCurrency(dashboardData.recebidoConfirmado || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-red-600">Falta</span>
                      <span className="text-xs font-medium text-red-600">
                        {formatCurrency(dashboardData.recebidoPendente || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-700">Previsto</span>
                      <span className="text-xs font-medium text-gray-700">
                        {formatCurrency(dashboardData.totalPrevistoRecebido || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Despesas */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Despesas</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-pink-600">Pago</span>
                      <span className="text-xs font-medium text-pink-600">
                        {formatCurrency(dashboardData.pagoConfirmado || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-red-600">Falta</span>
                      <span className="text-xs font-medium text-red-600">
                        {formatCurrency(dashboardData.pagoPendente || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-700">Previsto</span>
                      <span className="text-xs font-medium text-gray-700">
                        {formatCurrency(dashboardData.totalPrevistoPago || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gráfico Fluxo de Caixa */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Fluxo de Caixa</h3>
                  <p className="text-sm text-gray-600">Receitas vs Despesas ao longo do tempo</p>
                </div>
                <HelpCircle className="h-5 w-5 text-gray-400" />
              </div>
              
              <div className="px-4">
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={chartData} barCategoryGap="20%" margin={{ left: 20, right: 20, top: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis 
                      tickFormatter={(value) => formatCurrency(value)} 
                      width={80}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        formatCurrency(Math.abs(Number(value))), 
                        name
                      ]}
                      labelFormatter={(label) => `Mês: ${label}`}
                    />
                    <Legend wrapperStyle={{ fontSize: '14px' }} />
                    <Bar dataKey="Receitas" fill="#10B981" />
                    <Bar dataKey="Despesas" fill="#EF4444" />
                    <Line 
                      type="monotone" 
                      dataKey="Saldo" 
                      stroke="#374151" 
                      strokeWidth={3} 
                      dot={{ fill: '#374151', strokeWidth: 2, r: 5 }}
                      connectNulls={true}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Comparativo */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Comparativo</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })} vs mês anterior
                </p>
              </div>
              <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>

            <div className="space-y-6">
              {/* Recebimentos */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Recebimentos</span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-bold ${
                      dashboardData.receivableVariation > 0 ? 'text-green-600' : 
                      dashboardData.receivableVariation < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {dashboardData.receivableVariation === 0 ? '--' : 
                       `${dashboardData.receivableVariation > 0 ? '+' : ''}${dashboardData.receivableVariation.toFixed(2)}`}%
                    </span>
                    <span className="text-sm text-gray-600">
                      ({formatCurrency(dashboardData.currentMonthReceivable - dashboardData.previousMonthReceivable)})
                    </span>
                    {dashboardData.receivableVariation > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : dashboardData.receivableVariation < 0 ? (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    ) : (
                      <div className="h-4 w-4 flex items-center justify-center">
                        <div className="w-3 h-0.5 bg-gray-400 rounded"></div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Barra visual para Recebimentos */}
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        dashboardData.receivableVariation > 0 ? 'bg-green-500' : 
                        dashboardData.receivableVariation < 0 ? 'bg-red-500' : 'bg-gray-400'
                      }`}
                      style={{ 
                        width: `${Math.min(Math.abs(dashboardData.receivableVariation), 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Despesas */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Despesas</span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-bold ${
                      dashboardData.payableVariation > 0 ? 'text-red-600' : 
                      dashboardData.payableVariation < 0 ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {dashboardData.payableVariation === 0 ? '--' : 
                       `${dashboardData.payableVariation > 0 ? '+' : ''}${dashboardData.payableVariation.toFixed(2)}`}%
                    </span>
                    <span className="text-sm text-gray-600">
                      ({formatCurrency(dashboardData.currentMonthPayable - dashboardData.previousMonthPayable)})
                    </span>
                    {dashboardData.payableVariation > 0 ? (
                      <TrendingUp className="h-4 w-4 text-red-600" />
                    ) : dashboardData.payableVariation < 0 ? (
                      <TrendingDown className="h-4 w-4 text-green-600" />
                    ) : (
                      <div className="h-4 w-4 flex items-center justify-center">
                        <div className="w-3 h-0.5 bg-gray-400 rounded"></div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Barra visual para Despesas */}
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        dashboardData.payableVariation > 0 ? 'bg-red-500' : 
                        dashboardData.payableVariation < 0 ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                      style={{ 
                        width: `${Math.min(Math.abs(dashboardData.payableVariation), 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Últimas Atualizações */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Últimas atualizações em transações</h3>
                  <p className="text-sm text-gray-600">Movimentações recentes</p>
                </div>
                <Button variant="secondary" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver mais
                </Button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {dashboardData.recentTransactions.slice(0, 3).map((transaction) => (
                <div key={transaction.id} className="flex items-center space-x-4 p-3 border border-gray-100 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'CREDIT' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'CREDIT' ? (
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {transaction.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {transaction.category?.name} • {formatDate(transaction.transactionDate)}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`text-sm font-semibold ${
                      transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'CREDIT' ? '+' : '-'}
                      {formatCurrency(Number(transaction.amount))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coluna Direita - Calendário e Compromissos (3 colunas) */}
        <div className="xl:col-span-3 space-y-6 xl:pl-2">
          
          {/* Saldo Atual - Contas */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Saldo atual</h3>
                <p className="text-sm text-gray-600">Previsão do mês</p>
              </div>
              <HelpCircle className="h-5 w-5 text-gray-400" />
            </div>
            
            {/* Dropdown para seleção de banco */}
            <div className="relative mb-4 bank-dropdown">
              <button
                type="button"
                onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <span className="text-gray-900">
                  {selectedBank === 'all' 
                    ? 'Todos os bancos' 
                    : banksWithRealBalance.find(b => b.id === selectedBank)?.name || 'Selecione um banco'
                  }
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
              
              {isBankDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                  <button
                    onClick={() => {
                      setSelectedBank('all');
                      setIsBankDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                      selectedBank === 'all' ? 'bg-primary-50 text-primary-600' : 'text-gray-900'
                    }`}
                  >
                    Todos os bancos
                  </button>
                  {banksWithRealBalance.map((bank) => (
                    <button
                      key={bank.id}
                      onClick={() => {
                        setSelectedBank(bank.id);
                        setIsBankDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${
                        selectedBank === bank.id ? 'bg-primary-50 text-primary-600' : 'text-gray-900'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {bank.name === 'Inter' && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                        <span>{bank.name}</span>
                      </div>
                      <span className={`text-sm font-medium ${bank.balance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(bank.balance)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Exibição do saldo */}
            <div className="mb-4">
              <div className={`text-2xl font-bold ${
                (() => {
                  const totalBalance = selectedBank === 'all' 
                    ? banksWithRealBalance.reduce((total, bank) => total + bank.balance, 0)
                    : banksWithRealBalance.find(b => b.id === selectedBank)?.balance || 0;
                  return totalBalance < 0 ? 'text-red-600' : 'text-green-600';
                })()
              }`}>
                {selectedBank === 'all' 
                  ? formatCurrency(banksWithRealBalance.reduce((total, bank) => total + bank.balance, 0))
                  : formatCurrency(banksWithRealBalance.find(b => b.id === selectedBank)?.balance || 0)
                }
              </div>
              <div className="text-sm text-gray-500">
                Previsto do mês: <span className="font-medium">{formatCurrency((dashboardData.totalPrevistoRecebido || 0) - (dashboardData.totalPrevistoPago || 0))}</span>
              </div>
            </div>




          </div>

          {/* Calendário */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Dias da Semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                <div key={day} className="text-xs font-medium text-gray-500 text-center py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Dias do Calendário */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  className={`relative p-2 text-xs text-center rounded ${
                    !day.isCurrentMonth
                      ? 'text-gray-300'
                      : day.isToday
                      ? 'bg-purple-100 text-purple-900 font-semibold'
                      : 'text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div>{day.date.getDate()}</div>
                  {day.isCurrentMonth && (day.hasReceivables || day.hasPayables) && (
                    <div className="flex justify-center space-x-1 mt-1">
                      {day.hasReceivables && <div className="w-1 h-1 bg-green-500 rounded-full"></div>}
                      {day.hasPayables && <div className="w-1 h-1 bg-red-500 rounded-full"></div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Recebimentos</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Despesas</span>
              </div>
            </div>
          </div>

          {/* Compromissos para Hoje */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Compromissos para hoje</h3>
              <span className="text-sm text-gray-500">
                Você possui {dashboardData.todayTransactions.length} compromisso(s) para hoje
              </span>
            </div>
            
            {dashboardData.todayTransactions.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.todayTransactions.slice(0, 3).map((transaction) => (
                  <div key={transaction.id} className="flex items-center space-x-3 p-3 border border-gray-100 rounded-lg">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      transaction.type === 'CREDIT' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'CREDIT' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {transaction.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {transaction.category?.name}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold ${
                      transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(Number(transaction.amount))}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Nenhum compromisso previsto para hoje</p>
              </div>
            )}
          </div>

          {/* Compromissos Atrasados */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Compromissos atrasados</h3>
              <span className="text-sm text-gray-500">
                Você possui {dashboardData.overdueTransactions.length} compromisso(s) em atraso
              </span>
            </div>
            
            {dashboardData.overdueTransactions.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.overdueTransactions.slice(0, 3).map((transaction) => (
                  <div key={transaction.id} className="flex items-center space-x-3 p-3 border border-red-200 bg-red-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {transaction.title}
                      </p>
                      <p className="text-xs text-red-600">
                        Venceu em {formatDate(transaction.transactionDate)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-red-600">
                      {formatCurrency(Number(transaction.amount))}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm">Não há compromissos em atraso</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 