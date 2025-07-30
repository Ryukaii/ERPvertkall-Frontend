# ERP Vertkall - Frontend

Frontend do sistema ERP Vertkall desenvolvido em React com TypeScript, Vite e Tailwind CSS.

## 🚀 Tecnologias Utilizadas

- **React 18** - Biblioteca para construção de interfaces
- **TypeScript** - Tipagem estática para JavaScript
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS utilitário
- **React Router DOM** - Roteamento
- **React Query** - Gerenciamento de estado e cache
- **React Hook Form** - Formulários
- **Axios** - Cliente HTTP
- **Recharts** - Gráficos
- **Lucide React** - Ícones
- **Date-fns** - Manipulação de datas

## 📋 Funcionalidades

### 🔐 Autenticação
- Login e registro de usuários
- Proteção de rotas
- Gerenciamento de tokens JWT
- Contexto de autenticação

### 💰 Módulo Financeiro
- **Dashboard** com gráficos e estatísticas
- **Transações** com CRUD completo
- **Categorias** financeiras
- **Métodos de Pagamento**

### 🏦 Módulo Bancário
- **Bancos** com CRUD completo
- **Transações Bancárias** com filtros avançados
- **Filtros por período** (data inicial e final)
- **Visão geral** de todas as contas bancárias
- **Resumo financeiro** por período
- **Presets de data** (Este mês, Esta semana, Últimos 30 dias)

### 🎨 Interface
- Design responsivo e moderno
- Componentes reutilizáveis
- Modais para formulários
- Loading states e feedback visual
- Filtros avançados
- **Filtros de período** para transações bancárias
- **Presets de data** para facilitar a filtragem
- **Resumo financeiro** em tempo real
- **Visão consolidada** de múltiplas contas bancárias

## 🛠️ Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd erp-vertkall-frontend
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o backend**
Certifique-se de que o backend está rodando em `http://localhost:3000`

4. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

O frontend estará disponível em `http://localhost:5173`

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── ui/           # Componentes de UI reutilizáveis
│   └── Layout.tsx    # Layout principal com sidebar
├── contexts/
│   └── AuthContext.tsx # Contexto de autenticação
├── pages/
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── Transactions.tsx
│   ├── Categories.tsx
│   └── PaymentMethods.tsx
├── services/
│   └── api.ts        # Serviço de API
├── types/
│   └── index.ts      # Tipos TypeScript
├── utils/
│   └── format.ts     # Utilitários de formatação
├── App.tsx
└── main.tsx
```

## 🔧 Configuração

### Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
VITE_API_URL=http://localhost:3000/api
```

### Backend
O frontend espera que o backend esteja rodando com as seguintes configurações:

- **URL Base**: `http://localhost:3000/api`
- **CORS**: Configurado para `http://localhost:5173`
- **Autenticação**: JWT Bearer Token

## 📊 Funcionalidades Detalhadas

### Dashboard
- Gráficos de receitas vs despesas
- Cards com estatísticas financeiras
- Lista de transações recentes
- Alertas para transações vencidas

### Transações
- Listagem com filtros avançados
- Criação e edição de transações
- Marcação como pago
- Exclusão de transações
- Suporte a transações recorrentes

### Categorias
- CRUD completo de categorias
- Cores personalizadas
- Tipos: Receita, Despesa, Ambos

### Métodos de Pagamento
- CRUD completo de métodos
- Ícones personalizáveis
- Descrições opcionais

## 🎨 Componentes UI

### Button
```tsx
<Button variant="primary" size="md" loading={false}>
  Texto do Botão
</Button>
```

### Input
```tsx
<Input 
  label="Nome"
  placeholder="Digite seu nome"
  error={errors.name?.message}
/>
```

### Select
```tsx
<Select
  label="Categoria"
  options={[
    { value: '1', label: 'Categoria 1' },
    { value: '2', label: 'Categoria 2' }
  ]}
  onChange={(value) => console.log(value)}
/>
```

### Modal
```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Título do Modal"
  size="md"
>
  Conteúdo do modal
</Modal>
```

## 🔌 API Integration

O frontend se comunica com o backend através do serviço `apiService`:

```typescript
// Exemplo de uso
const { data, isLoading } = useQuery('transactions', apiService.getTransactions);
const createMutation = useMutation(apiService.createTransaction);
```

### Endpoints Principais

- **Autenticação**: `/auth/login`, `/auth/register`, `/auth/profile`
- **Transações**: `/financeiro/transactions`
- **Categorias**: `/financeiro/categories`
- **Métodos de Pagamento**: `/financeiro/payment-methods`
- **Bancos**: `/bancos`
- **Transações Bancárias**: `/bancos/{id}/transactions`
- **Todas as Transações**: `/bancos/transactions`

### Filtros de Período

O sistema suporta filtros por período para transações bancárias:

```bash
# Filtrar transações de um período específico
GET /bancos/123/transactions?startDate=2024-01-01&endDate=2024-01-31

# Filtrar apenas por data inicial
GET /bancos/123/transactions?startDate=2024-01-01

# Filtrar apenas por data final
GET /bancos/123/transactions?endDate=2024-01-31

# Filtrar todas as transações de um período específico
GET /bancos/transactions?startDate=2024-01-01&endDate=2024-01-31
```

## 🚀 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Linting
npm run lint
```

## 📱 Responsividade

O frontend é totalmente responsivo e funciona em:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (< 768px)

## 🔒 Segurança

- Autenticação JWT obrigatória
- Proteção de rotas
- Interceptadores de requisição
- Validação de formulários
- Sanitização de dados

## 🎯 Próximos Passos

- [ ] Testes unitários com Jest
- [ ] Testes E2E com Cypress
- [ ] PWA (Progressive Web App)
- [ ] Tema escuro
- [ ] Notificações push
- [ ] Exportação de relatórios
- [ ] Módulo de usuários
- [ ] Configurações do sistema

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte, envie um email para suporte@vertkall.com ou abra uma issue no repositório. 