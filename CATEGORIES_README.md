# Gestão de Categorias Financeiras

## Funcionalidades Implementadas

### API Endpoints

A gestão de categorias financeiras está completamente implementada com os seguintes endpoints:

- **POST** `/api/financeiro/categories` - Criar nova categoria
- **GET** `/api/financeiro/categories` - Listar categorias (com filtros e paginação)
- **GET** `/api/financeiro/categories/:id` - Buscar categoria específica
- **PATCH** `/api/financeiro/categories/:id` - Atualizar categoria
- **DELETE** `/api/financeiro/categories/:id` - Excluir categoria

### Funcionalidades da Interface

#### 1. Listagem de Categorias
- Visualização em grid responsivo
- Exibição de cor, nome, descrição e tipo
- Estados de loading e vazio
- Paginação automática

#### 2. Filtros e Busca
- Busca por nome da categoria
- Filtro por tipo (Receita, Despesa, Ambos)
- Botões para buscar e limpar filtros
- Reset automático da paginação ao filtrar

#### 3. Criação de Categorias
- Modal com formulário completo
- Campos obrigatórios: Nome, Cor, Tipo
- Campo opcional: Descrição
- Validação de formulário
- Seletor de cor integrado

#### 4. Edição de Categorias
- Modal de edição pré-preenchido
- Mesma validação da criação
- Atualização em tempo real

#### 5. Exclusão de Categorias
- Confirmação antes da exclusão
- Atualização automática da lista

### Tipos de Categoria

- **Receita** (`RECEIVABLE`) - Para categorias de receitas
- **Despesa** (`PAYABLE`) - Para categorias de despesas  
- **Ambos** (`BOTH`) - Para categorias que se aplicam a ambos

### Estrutura de Dados

```typescript
interface FinancialCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  type: 'RECEIVABLE' | 'PAYABLE' | 'BOTH';
  createdAt: string;
  updatedAt: string;
}
```

### Filtros Disponíveis

```typescript
interface CategoryFilters {
  search?: string;        // Busca por nome
  type?: 'RECEIVABLE' | 'PAYABLE' | 'BOTH';  // Filtro por tipo
  page?: number;          // Página atual
  limit?: number;         // Itens por página
}
```

### Navegação

A página de categorias está acessível através do menu lateral:
- **Categorias** - `/categories`

### Integração

As categorias são utilizadas em:
- Criação e edição de transações
- Filtros de transações
- Relatórios e dashboards

### Tecnologias Utilizadas

- **React** com TypeScript
- **React Query** para gerenciamento de estado
- **React Hook Form** para formulários
- **Tailwind CSS** para estilização
- **Lucide React** para ícones
- **Axios** para requisições HTTP

### Componentes Reutilizáveis

- `Pagination` - Componente de paginação
- `Modal` - Modal reutilizável
- `Button` - Botões padronizados
- `Input` - Campos de entrada
- `Select` - Seletores dropdown

A implementação está completa e pronta para uso em produção! 