# Sistema de Permissões - Frontend

## Visão Geral

O frontend implementa um sistema de controle de acesso baseado em permissões que se integra com o backend. Administradores podem gerenciar usuários e permissões, enquanto usuários normais podem visualizar suas próprias permissões.

## Componentes Implementados

### 1. Páginas de Administração

#### Users.tsx
- **Rota**: `/users`
- **Acesso**: Apenas administradores
- **Funcionalidades**:
  - Lista todos os usuários
  - Altera status de admin
  - Gerencia permissões por usuário
  - Interface intuitiva com checkboxes

#### MyPermissions.tsx
- **Rota**: `/my-permissions`
- **Acesso**: Todos os usuários autenticados
- **Funcionalidades**:
  - Visualiza permissões próprias
  - Agrupamento por módulo
  - Status ativo/inativo

### 2. Componentes de Proteção

#### AdminRoute.tsx
- Protege rotas administrativas
- Redireciona usuários não-admin para dashboard
- Mostra loading durante verificação

#### AccessDenied.tsx
- Componente reutilizável para mensagens de acesso negado
- Design consistente com o sistema
- Mensagens informativas

### 3. Hook de Permissões

#### usePermissions.ts
```typescript
const { canRead, canWrite, hasPermission } = usePermissions();

// Verificar permissões
if (canRead('financeiro', 'transactions')) {
  // Mostrar lista de transações
}

if (canWrite('financeiro', 'categories')) {
  // Mostrar botão de criar categoria
}
```

## Como Usar

### 1. Proteção de Rotas Administrativas

```typescript
import AdminRoute from './components/AdminRoute';

<Route
  path="/users"
  element={
    <ProtectedRoute>
      <AdminRoute>
        <Users />
      </AdminRoute>
    </ProtectedRoute>
  }
/>
```

### 2. Verificação de Permissões em Componentes

```typescript
import { usePermissions } from '../hooks/usePermissions';

const MyComponent = () => {
  const { canRead, canWrite } = usePermissions();

  return (
    <div>
      {canRead('financeiro', 'transactions') && (
        <div>Lista de transações</div>
      )}
      
      {canWrite('financeiro', 'transactions') && (
        <button>Criar transação</button>
      )}
    </div>
  );
};
```

### 3. Mostrar Mensagem de Acesso Negado

```typescript
import AccessDenied from '../components/AccessDenied';

const ProtectedComponent = () => {
  const { canRead } = usePermissions();

  if (!canRead('financeiro', 'transactions')) {
    return <AccessDenied />;
  }

  return <div>Conteúdo protegido</div>;
};
```

## Navegação

### Links Administrativos
- **Usuários**: `/users` (apenas admin)
- **Minhas Permissões**: `/my-permissions` (todos os usuários)

### Menu Lateral
- Links administrativos aparecem apenas para admins
- Link "Minhas Permissões" aparece para todos os usuários
- Navegação dinâmica baseada no status do usuário

## Tipos de Permissão

### Recursos Disponíveis
- `categories` - Categorias financeiras
- `transactions` - Transações financeiras
- `payment_methods` - Métodos de pagamento
- `recurring_transactions` - Transações recorrentes

### Ações Disponíveis
- `read` - Permissão de leitura
- `write` - Permissão de escrita (criar, editar, excluir)

### Módulos Disponíveis
- `financeiro` - Módulo financeiro

## Exemplos de Uso

### 1. Proteger Botão de Criação

```typescript
const CategoriesPage = () => {
  const { canWrite } = usePermissions();

  return (
    <div>
      <h1>Categorias</h1>
      
      {canWrite('financeiro', 'categories') && (
        <Button onClick={handleCreate}>
          Nova Categoria
        </Button>
      )}
      
      {/* Lista de categorias sempre visível se tem permissão de leitura */}
    </div>
  );
};
```

### 2. Proteger Página Inteira

```typescript
const AdminPage = () => {
  const { user } = useAuth();

  if (!user?.isAdmin) {
    return <AccessDenied 
      title="Acesso Administrativo"
      message="Apenas administradores podem acessar esta página."
    />;
  }

  return <div>Conteúdo administrativo</div>;
};
```

### 3. Verificar Permissões Específicas

```typescript
const TransactionActions = ({ transaction }) => {
  const { canWrite } = usePermissions();

  return (
    <div>
      {canWrite('financeiro', 'transactions') && (
        <>
          <Button onClick={() => handleEdit(transaction)}>
            Editar
          </Button>
          <Button onClick={() => handleDelete(transaction)}>
            Excluir
          </Button>
        </>
      )}
    </div>
  );
};
```

## Integração com Backend

### API Calls
- `GET /users` - Lista usuários (admin)
- `POST /users/:id/toggle-admin` - Altera status admin
- `PUT /users/:id/permissions` - Atualiza permissões
- `GET /users/me/permissions` - Minhas permissões

### Tratamento de Erros
- Erro 403: Acesso negado
- Erro 401: Token inválido
- Redirecionamento automático para login

## Segurança

### Frontend
- Verificação de permissões em tempo real
- Proteção de rotas administrativas
- Interface condicional baseada em permissões

### Backend
- Validação de permissões no servidor
- Guards para proteção de endpoints
- Verificação de status de admin

## Melhorias Futuras

1. **Cache de Permissões**: Implementar cache para melhor performance
2. **Permissões Granulares**: Adicionar mais recursos e ações
3. **Auditoria**: Log de alterações de permissões
4. **Notificações**: Alertas quando permissões são alteradas
5. **Interface Avançada**: Drag & drop para gerenciar permissões 