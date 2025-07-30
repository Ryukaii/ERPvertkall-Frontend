# Relatórios Financeiros - ERP Vertkall

## 📊 Visão Geral

O sistema de relatórios financeiros do ERP Vertkall oferece uma visão completa e detalhada das finanças da empresa, com gráficos interativos, análises de tendências e insights valiosos para tomada de decisões.

## 🎯 Funcionalidades Principais

### 1. Dashboard Principal
- **Cards de Estatísticas**: Receitas, despesas, pagamentos, pendências e vencimentos
- **Gráficos Interativos**: Linha, área e barras com dados mensais
- **Gráfico de Pizza**: Distribuição financeira por status
- **Transações Recentes**: Lista das últimas movimentações
- **Alertas Financeiros**: Notificações de transações vencidas e pendentes

### 2. Relatórios Avançados
- **Visão Geral**: KPIs principais e análise de performance
- **Tendências**: Análise de crescimento e evolução temporal
- **Por Categoria**: Distribuição e detalhamento por categorias
- **Performance**: Métricas de eficiência e margem de lucro

## 📈 Tipos de Relatórios

### Dashboard Financeiro (`/financeiro/dashboard`)

#### Cards de Estatísticas
```typescript
interface DashboardData {
  totalReceivable: number;    // Total de receitas
  totalPayable: number;       // Total de despesas
  totalPaid: number;          // Total pago
  totalPending: number;       // Total pendente
  totalOverdue: number;       // Total vencido
  monthlyData: MonthlyData[]; // Dados mensais
  recentTransactions: FinancialTransaction[]; // Transações recentes
}
```

#### Gráficos Disponíveis
1. **Fluxo de Caixa**: Receitas vs Despesas ao longo do tempo
   - Tipo: Linha, Área ou Barras
   - Dados: Mensais com saldo calculado
   - Cores: Verde (receitas), Vermelho (despesas), Azul (saldo)

2. **Distribuição Financeira**: Gráfico de pizza
   - Receitas, Despesas, Pago, Pendente, Vencido
   - Percentuais calculados automaticamente
   - Cores diferenciadas por categoria

#### Alertas Financeiros
- **Transações Vencidas**: Lista com valores e quantidades
- **Transações Pendentes**: Alertas de pagamentos em aberto
- **Status Positivo**: Confirmação quando tudo está em dia
- **Transações Recentes**: Últimas 7 dias de movimentações

### Relatórios Avançados (`/financeiro/relatorios`)

#### 1. Visão Geral
**KPIs Principais:**
- Crescimento Total (%)
- Margem de Lucro (%)
- Taxa de Pagamento (%)
- Transações Vencidas (quantidade)

**Gráfico de Performance:**
- Barras: Receitas e Despesas
- Linha: Performance financeira
- Scatter: Crescimento mensal

#### 2. Tendências
**Análise Temporal:**
- Tendência de Receitas (gráfico de área)
- Tendência de Despesas (gráfico de área)
- Análise de Crescimento (gráfico de linha)

**Métricas Calculadas:**
```typescript
const trendAnalysis = {
  totalGrowth: number;      // Crescimento total
  expenseGrowth: number;    // Crescimento de despesas
  profitMargin: number;     // Margem de lucro
};
```

#### 3. Por Categoria
**Distribuição:**
- Gráfico de pizza por categoria
- Gráfico de barras empilhadas por status
- Tabela detalhada com valores

**Dados por Categoria:**
```typescript
interface CategoryData {
  name: string;
  total: number;
  paid: number;
  pending: number;
  overdue: number;
  count: number;
  type: 'RECEIVABLE' | 'PAYABLE';
}
```

#### 4. Performance
**Métricas de Eficiência:**
- Eficiência Operacional (%)
- Taxa de Crescimento (%)
- Margem de Lucro (%)

**Análise de Performance:**
- Gráfico composto com barras e linha
- Receitas e despesas como barras
- Performance como linha de tendência

## 🔧 Configuração e Uso

### Filtros Disponíveis
- **Período**: 7 dias, 30 dias, 90 dias, 1 ano
- **Tipo de Relatório**: Visão Geral, Tendências, Categorias, Performance
- **Datas Personalizadas**: Data inicial e final customizadas

### Exportação de Dados
- **Formato**: JSON
- **Conteúdo**: Dados completos do relatório selecionado
- **Nome do arquivo**: `relatorio-financeiro-{tipo}-{data}.json`

### Atualização Automática
- **Intervalo**: 5 minutos
- **Dados em tempo real**: Transações e estatísticas atualizadas
- **Cache inteligente**: React Query para performance

## 📊 Componentes Utilizados

### Gráficos (Recharts)
```typescript
import {
  LineChart, Line,
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  ComposedChart, Scatter,
  XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
```

### Componentes UI
- `Button`: Botões com variantes e loading states
- `Input`: Campos de entrada com validação
- `Select`: Dropdowns para filtros
- `FinancialAlerts`: Alertas e notificações

### Utilitários
- `formatCurrency`: Formatação de valores monetários
- `formatDate`: Formatação de datas
- `apiService`: Serviços de API para dados

## 🎨 Design e UX

### Cores e Temas
- **Verde**: Receitas e sucessos
- **Vermelho**: Despesas e alertas críticos
- **Azul**: Informações neutras
- **Amarelo**: Avisos e pendências
- **Roxo**: Dados especiais

### Responsividade
- **Desktop**: Layout completo com todos os gráficos
- **Tablet**: Gráficos redimensionados
- **Mobile**: Cards empilhados e gráficos otimizados

### Estados de Loading
- **Spinner**: Durante carregamento de dados
- **Skeleton**: Para melhor UX
- **Error States**: Mensagens de erro claras
- **Empty States**: Quando não há dados

## 📱 Navegação

### Menu Principal
```
Financeiro/
├── Dashboard (Visão geral)
├── Transações
├── Pagamentos Recorrentes
├── Bancos
├── Importação OFX
├── Categorias
├── Métodos de Pagamento
└── Relatórios (Análises avançadas)
```

### Rotas
- `/financeiro/dashboard` - Dashboard principal
- `/financeiro/relatorios` - Relatórios avançados

## 🔄 Integração com API

### Endpoints Utilizados
```typescript
// Dashboard
GET /financeiro/transactions/dashboard

// Transações
GET /financeiro/transactions

// Categorias
GET /financeiro/categories
```

### Estrutura de Dados
```typescript
interface DashboardData {
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
```

## 🚀 Próximas Funcionalidades

### Planejadas
- **Relatórios PDF**: Exportação em formato PDF
- **Gráficos 3D**: Visualizações tridimensionais
- **Alertas por Email**: Notificações automáticas
- **Comparação Anual**: Análise ano a ano
- **Previsões**: Machine Learning para projeções

### Melhorias
- **Filtros Avançados**: Mais opções de filtragem
- **Dashboards Customizáveis**: Layout personalizável
- **Métricas Personalizadas**: KPIs customizáveis
- **Integração com BI**: Conectores para ferramentas BI

## 📋 Exemplos de Uso

### Dashboard Principal
```typescript
// Acesso direto
navigate('/financeiro/dashboard');

// Dados carregados automaticamente
const { data: dashboardData } = useQuery(['dashboard'], apiService.getDashboard);
```

### Relatórios Avançados
```typescript
// Filtros
const [selectedPeriod, setSelectedPeriod] = useState('30d');
const [selectedReport, setSelectedReport] = useState('overview');

// Exportação
const exportReport = () => {
  // Lógica de exportação
};
```

## 🔒 Segurança e Performance

### Segurança
- **Autenticação**: JWT obrigatório
- **Autorização**: Verificação de permissões
- **Sanitização**: Dados validados antes da exibição

### Performance
- **Cache**: React Query para otimização
- **Lazy Loading**: Componentes carregados sob demanda
- **Debounce**: Filtros com debounce para melhor UX
- **Pagination**: Dados paginados quando necessário

## 📞 Suporte

Para dúvidas sobre os relatórios financeiros:
- **Documentação**: Este arquivo README
- **Código**: Componentes em `src/pages/` e `src/components/`
- **API**: Endpoints documentados em `src/services/api.ts`
- **Tipos**: Definições em `src/types/index.ts` 