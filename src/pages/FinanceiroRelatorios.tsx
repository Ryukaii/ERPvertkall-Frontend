import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { 
  TrendingUp, 
  DollarSign, 
  Activity,
  Download,
  Target,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart,
  Scatter
} from 'recharts';
import apiService from '../services/api';
import { BankTransaction, FinancialCategory, PaginatedResponse } from '../types';

import { formatCurrency } from '../utils/format';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';

const FinanceiroRelatorios: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedReport, setSelectedReport] = useState<'overview' | 'trends' | 'categories' | 'performance'>('overview');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: transactionsResponse, isLoading } = useQuery<PaginatedResponse<BankTransaction>>(
    ['bankTransactions'],
    () => apiService.getAllBankTransactions(),
    {
      refetchInterval: 300000,
    }
  );

  const transactions = transactionsResponse?.data || [];

  // Calcular dados do dashboard localmente
  const dashboardData = React.useMemo(() => {
    if (!transactions.length) {
      return {
        totalReceivable: 0,
        totalPayable: 0,
        totalPaid: 0,
        totalPending: 0,
        totalOverdue: 0,
        monthlyData: [],
        recentTransactions: []
      };
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filtrar transações por período selecionado
    const getFilteredTransactions = () => {
      const startDate = new Date();
      switch (selectedPeriod) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }
      
      return transactions.filter(t => new Date(t.createdAt) >= startDate);
    };

    const filteredTransactions = getFilteredTransactions();

    // Calcular totais baseado no tipo de transação bancária
    const totalReceivable = filteredTransactions
      .filter(t => t.type === 'CREDIT')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalPayable = filteredTransactions
      .filter(t => t.type === 'DEBIT')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalPaid = filteredTransactions
      .filter(t => t.status === 'CONFIRMED')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalPending = filteredTransactions
      .filter(t => t.status === 'PENDING')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalOverdue = 0; // Transações bancárias não têm status OVERDUE

    // Calcular dados mensais (últimos 6 meses)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date(currentYear, currentMonth - i, 1);
      const monthName = month.toLocaleDateString('pt-BR', { month: 'short' });
      
      const monthTransactions = filteredTransactions.filter(t => {
        const transactionDate = new Date(t.createdAt);
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
    const recentTransactions = filteredTransactions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return {
      totalReceivable,
      totalPayable,
      totalPaid,
      totalPending,
      totalOverdue,
      monthlyData,
      recentTransactions
    };
  }, [transactions, selectedPeriod]);

  // Extrair filteredTransactions do dashboardData para uso em outros lugares
  const filteredTransactions = React.useMemo(() => {
    if (!transactions.length) return [];
    
    const now = new Date();
    const startDate = new Date();
    switch (selectedPeriod) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }
    
    return transactions.filter(t => new Date(t.createdAt) >= startDate);
  }, [transactions, selectedPeriod]);

  const { data: categories = [] } = useQuery<FinancialCategory[]>(
    ['categories'],
    () => apiService.getCategories(),
    {
      refetchInterval: 300000,
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <DollarSign className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Nenhum dado disponível</h2>
        <p className="text-gray-600">Adicione transações para ver os relatórios.</p>
      </div>
    );
  }

  // Preparar dados para relatórios
  const chartData = dashboardData.monthlyData.map(item => ({
    month: item.month,
    Receitas: item.receivable,
    Despesas: item.payable,
    Saldo: item.receivable - item.payable,
    Lucro: item.receivable - item.payable
  }));

  // Dados por categoria
  const categoryData = React.useMemo(() => {
    if (!transactions.length || !categories.length) return [];

    return categories.map(category => {
      const categoryTransactions = transactions.filter(t => t.categoryId === category.id);
      const total = categoryTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const paid = categoryTransactions.filter(t => t.status === 'CONFIRMED').reduce((sum, t) => sum + Number(t.amount), 0);
      const pending = categoryTransactions.filter(t => t.status === 'PENDING').reduce((sum, t) => sum + Number(t.amount), 0);
      const overdue = 0; // Transações bancárias não têm status OVERDUE

      return {
        name: category.name,
        total,
        paid,
        pending,
        overdue,
        count: categoryTransactions.length,
        type: category.type
      };
    });
  }, [transactions, categories]);

  // Dados de performance
  const performanceData = chartData.map((item, index) => ({
    ...item,
    performance: ((item.Receitas - item.Despesas) / Math.max(item.Receitas, 1)) * 100,
    growth: index > 0 ? ((item.Receitas - chartData[index - 1].Receitas) / Math.max(chartData[index - 1].Receitas, 1)) * 100 : 0
  }));

  // Análise de tendências
  const trendAnalysis = {
    totalGrowth: chartData.length > 1 ? 
      ((chartData[chartData.length - 1].Receitas - chartData[0].Receitas) / Math.max(chartData[0].Receitas, 1)) * 100 : 0,
    expenseGrowth: chartData.length > 1 ? 
      ((chartData[chartData.length - 1].Despesas - chartData[0].Despesas) / Math.max(chartData[0].Despesas, 1)) * 100 : 0,
    profitMargin: chartData.length > 0 ? 
      ((chartData[chartData.length - 1].Receitas - chartData[chartData.length - 1].Despesas) / Math.max(chartData[chartData.length - 1].Receitas, 1)) * 100 : 0
  };

  const exportReport = () => {
    // Obter transações filtradas para o relatório
    const now = new Date();
    const startDate = new Date();
    switch (selectedPeriod) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }
    
    const filteredTransactionsForExport = transactions.filter(t => new Date(t.createdAt) >= startDate);

    const reportData = {
      period: selectedPeriod,
      report: selectedReport,
      dashboardData,
      transactions: filteredTransactionsForExport.slice(0, 100), // Limitar para não sobrecarregar
      categories: categoryData,
      trendAnalysis,
      generatedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-financeiro-${selectedReport}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderOverviewReport = () => (
    <div className="space-y-6">
      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Crescimento Total</p>
              <p className="text-2xl font-bold">
                {trendAnalysis.totalGrowth > 0 ? '+' : ''}{trendAnalysis.totalGrowth.toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Margem de Lucro</p>
              <p className="text-2xl font-bold">
                {trendAnalysis.profitMargin.toFixed(1)}%
              </p>
            </div>
            <Target className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Taxa de Pagamento</p>
              <p className="text-2xl font-bold">
                {dashboardData.totalReceivable + dashboardData.totalPayable > 0 
                  ? Math.round((dashboardData.totalPaid / (dashboardData.totalReceivable + dashboardData.totalPayable)) * 100)
                  : 0}%
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Transações Vencidas</p>
                              <p className="text-2xl font-bold">
                  {filteredTransactions.filter(t => t.status === 'CANCELLED').length}
                </p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Gráfico de Performance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Financeira</h3>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip formatter={(value, name) => [
              name === 'performance' || name === 'growth' ? `${Number(value).toFixed(1)}%` : formatCurrency(Number(value)),
              name === 'performance' ? 'Performance' : name === 'growth' ? 'Crescimento' : name
            ]} />
            <Legend />
            <Bar yAxisId="left" dataKey="Receitas" fill="#10B981" />
            <Bar yAxisId="left" dataKey="Despesas" fill="#EF4444" />
            <Line yAxisId="right" type="monotone" dataKey="performance" stroke="#3B82F6" strokeWidth={2} />
            <Scatter yAxisId="right" dataKey="growth" fill="#8B5CF6" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderTrendsReport = () => (
    <div className="space-y-6">
      {/* Análise de Tendências */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendência de Receitas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Area type="monotone" dataKey="Receitas" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendência de Despesas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Area type="monotone" dataKey="Despesas" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Análise de Crescimento */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Análise de Crescimento</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
            <Legend />
            <Line type="monotone" dataKey="growth" stroke="#8B5CF6" strokeWidth={2} name="Crescimento Mensal" />
            <Line type="monotone" dataKey="performance" stroke="#3B82F6" strokeWidth={2} name="Performance" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderCategoriesReport = () => (
    <div className="space-y-6">
      {/* Gráfico de Pizza por Categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição por Categoria</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={categoryData.filter(c => c.total > 0)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="total"
              >
                {categoryData.filter(c => c.total > 0).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.type === 'RECEIVABLE' ? '#10B981' : '#EF4444'} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Status por Categoria</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData.filter(c => c.total > 0)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Bar dataKey="paid" stackId="a" fill="#10B981" name="Pago" />
              <Bar dataKey="pending" stackId="a" fill="#F59E0B" name="Pendente" />
              <Bar dataKey="overdue" stackId="a" fill="#EF4444" name="Vencido" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela de Categorias */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Detalhamento por Categoria</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pago
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pendente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vencido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categoryData.filter(c => c.total > 0).map((category) => (
                <tr key={category.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{category.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      category.type === 'RECEIVABLE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {category.type === 'RECEIVABLE' ? 'Receita' : 'Despesa'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(category.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    {formatCurrency(category.paid)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                    {formatCurrency(category.pending)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    {formatCurrency(category.overdue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPerformanceReport = () => (
    <div className="space-y-6">
      {/* Métricas de Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Eficiência Operacional</p>
              <p className="text-2xl font-bold text-blue-600">
                {((dashboardData.totalPaid / Math.max(dashboardData.totalReceivable + dashboardData.totalPayable, 1)) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Taxa de Crescimento</p>
              <p className="text-2xl font-bold text-green-600">
                {trendAnalysis.totalGrowth > 0 ? '+' : ''}{trendAnalysis.totalGrowth.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Margem de Lucro</p>
              <p className="text-2xl font-bold text-purple-600">
                {trendAnalysis.profitMargin.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Performance */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Análise de Performance</h3>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip formatter={(value, name) => [
              name === 'performance' ? `${Number(value).toFixed(1)}%` : formatCurrency(Number(value)),
              name === 'performance' ? 'Performance' : name
            ]} />
            <Legend />
            <Bar yAxisId="left" dataKey="Receitas" fill="#10B981" />
            <Bar yAxisId="left" dataKey="Despesas" fill="#EF4444" />
            <Line yAxisId="right" type="monotone" dataKey="performance" stroke="#3B82F6" strokeWidth={3} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios Financeiros</h1>
          <p className="text-gray-600">Análises detalhadas e insights financeiros</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="secondary" size="sm" onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Relatório</label>
            <Select
              options={[
                { value: 'overview', label: 'Visão Geral' },
                { value: 'trends', label: 'Tendências' },
                { value: 'categories', label: 'Por Categoria' },
                { value: 'performance', label: 'Performance' }
              ]}
              value={selectedReport}
              onChange={(value) => setSelectedReport(value as any)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
            <Select
              options={[
                { value: '7d', label: '7 dias' },
                { value: '30d', label: '30 dias' },
                { value: '90d', label: '90 dias' },
                { value: '1y', label: '1 ano' }
              ]}
              value={selectedPeriod}
              onChange={(value) => setSelectedPeriod(value as any)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Inicial</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Final</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Conteúdo do Relatório */}
      {selectedReport === 'overview' && renderOverviewReport()}
      {selectedReport === 'trends' && renderTrendsReport()}
      {selectedReport === 'categories' && renderCategoriesReport()}
      {selectedReport === 'performance' && renderPerformanceReport()}
    </div>
  );
};

export default FinanceiroRelatorios; 