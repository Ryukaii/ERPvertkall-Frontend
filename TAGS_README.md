# 🏷️ Sistema de Tags - Documentação Frontend

## 📋 Visão Geral

O sistema de tags permite categorizar e organizar transações financeiras e bancárias de forma flexível. As tags podem ser aplicadas tanto em transações normais quanto durante a revisão de importações OFX.

## 🚀 Funcionalidades Implementadas

### 1. Gerenciamento de Tags (`/financeiro/tags`)

#### **Página de Gerenciamento**
- ✅ Listagem de todas as tags com filtros
- ✅ Criação de novas tags com cores personalizadas
- ✅ Edição de tags existentes
- ✅ Ativação/desativação de tags
- ✅ Exclusão de tags (apenas se não estiverem em uso)
- ✅ Busca por nome e descrição
- ✅ Filtros por status (ativas/inativas)

#### **Características das Tags**
- **Nome único**: Não podem existir duas tags com o mesmo nome
- **Cores personalizadas**: Sistema de cores predefinidas
- **Descrição opcional**: Para melhor organização
- **Status ativo/inativo**: Soft delete para manter histórico
- **Contadores de uso**: Mostra quantas transações usam cada tag

### 2. Tags na Revisão OFX (`/ofx-review/:importId`)

#### **Funcionalidades Adicionadas**
- ✅ Nova coluna "Tags" na tabela de transações
- ✅ Modal de seleção de tags para cada transação
- ✅ Visualização das tags aplicadas com cores
- ✅ Seleção múltipla de tags por transação
- ✅ Salvamento automático das tags no backend
- ✅ Feedback visual durante o salvamento

#### **Interface de Usuário**
- **Tags visuais**: Cada tag é exibida com sua cor correspondente
- **Botão "Tags"**: Abre modal de seleção para cada transação
- **Grid de seleção**: Interface intuitiva para selecionar/desselecionar tags
- **Estado persistente**: Tags são mantidas durante a sessão

## 🎨 Interface do Usuário

### Página de Gerenciamento de Tags

```
┌─────────────────────────────────────────────────────────────┐
│ Gerenciar Tags                    [Nova Tag]              │
├─────────────────────────────────────────────────────────────┤
│ [🔍 Buscar tags...] [Filtro: Todas ▼]                    │
├─────────────────────────────────────────────────────────────┤
│ Tag          │ Descrição    │ Status │ Uso    │ Ações     │
├──────────────┼──────────────┼────────┼────────┼───────────┤
│ ● Alimentação│ Despesas...  │ Ativa  │ 15     │ [Editar]  │
│ ● Transporte │ Uber, 99...  │ Ativa  │ 8      │ [Editar]  │
│ ● Lazer      │ Cinema...    │ Ativa  │ 12     │ [Editar]  │
└─────────────────────────────────────────────────────────────┘
```

### Modal de Criação/Edição

```
┌─────────────────────────────────────────────────────────────┐
│ Nova Tag                                                    │
├─────────────────────────────────────────────────────────────┤
│ Nome *                                                      │
│ [Alimentação]                                               │
│                                                             │
│ Cor                                                         │
│ ● [Azul ▼]                                                 │
│                                                             │
│ Descrição                                                   │
│ [Despesas com alimentação...]                              │
│                                                             │
│ ☑ Tag ativa                                                │
│                                                             │
│                    [Cancelar] [Criar Tag]                  │
└─────────────────────────────────────────────────────────────┘
```

### Revisão OFX com Tags

```
┌─────────────────────────────────────────────────────────────┐
│ Revisão OFX - arquivo.ofx                                  │
├─────────────────────────────────────────────────────────────┤
│ Descrição    │ Valor │ Data │ Categoria │ Conf. │ Tags    │
├──────────────┼───────┼──────┼───────────┼───────┼─────────┤
│ Almoço       │ R$45  │ 30/01│ Alimentação│ 85%  │ 🏷️[Tags]│
│              │       │      │           │       │ ● ● ●   │
└─────────────────────────────────────────────────────────────┘
```

### Modal de Seleção de Tags

```
┌─────────────────────────────────────────────────────────────┐
│ Selecionar Tags                                [✕]        │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│ │ ● Alimentação│ │ ○ Transporte│ │ ○ Lazer     │          │
│ └─────────────┘ └─────────────┘ └─────────────┘          │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│ │ ○ Trabalho  │ │ ○ Casa      │ │ ○ Saúde     │          │
│ └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                             │
│                    [Cancelar] [Salvar Tags]                │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Implementação Técnica

### 1. Tipos TypeScript

```typescript
// Tipos principais
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

// Tipos para requisições
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

// Tipos para transações com tags
export interface OfxPendingTransaction {
  // ... outros campos
  tags?: Tag[];
}

export interface UpdateOfxTransactionTagsRequest {
  tagIds: string[];
}
```

### 2. Serviços de API

```typescript
// Funções implementadas no apiService
getTags(filters?: TagFilters): Promise<PaginatedResponse<Tag>>
getTag(id: string): Promise<Tag>
createTag(data: CreateTagRequest): Promise<Tag>
updateTag(id: string, data: UpdateTagRequest): Promise<Tag>
toggleTagActive(id: string): Promise<Tag>
deleteTag(id: string): Promise<void>
getMostUsedTags(limit: number): Promise<MostUsedTag[]>
updateOfxTransactionTags(id: string, data: UpdateOfxTransactionTagsRequest): Promise<OfxPendingTransaction>
```

### 3. Estados do React

```typescript
// Estados para gerenciamento de tags
const [tags, setTags] = useState<TagType[]>([]);
const [selectedTags, setSelectedTags] = useState<Map<string, string[]>>(new Map());
const [showTagModal, setShowTagModal] = useState(false);
const [currentTransactionId, setCurrentTransactionId] = useState<string>('');
```

## 🎯 Casos de Uso

### 1. Criar Tags Comuns
1. Acessar `/financeiro/tags`
2. Clicar em "Nova Tag"
3. Preencher nome, cor e descrição
4. Salvar a tag

### 2. Aplicar Tags na Revisão OFX
1. Acessar uma revisão OFX (`/ofx-review/:importId`)
2. Localizar a transação desejada
3. Clicar no botão "Tags"
4. Selecionar as tags desejadas no modal
5. Salvar as tags

### 3. Filtrar e Buscar Tags
1. Na página de gerenciamento
2. Usar a busca por nome
3. Filtrar por status (ativas/inativas)
4. Visualizar contadores de uso

## 🎨 Sistema de Cores

### Cores Predefinidas
```typescript
const colors = [
  { value: '#3B82F6', label: 'Azul' },
  { value: '#EF4444', label: 'Vermelho' },
  { value: '#10B981', label: 'Verde' },
  { value: '#F59E0B', label: 'Amarelo' },
  { value: '#8B5CF6', label: 'Roxo' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#F97316', label: 'Laranja' },
  { value: '#06B6D4', label: 'Ciano' },
  { value: '#84CC16', label: 'Lima' },
  { value: '#6366F1', label: 'Índigo' }
];
```

### Aplicação de Cores
- **Background**: `backgroundColor: ${tag.color}20` (20% de opacidade)
- **Texto**: `color: ${tag.color}`
- **Borda**: `border: 1px solid ${tag.color}40` (40% de opacidade)

## 🔄 Fluxo de Dados

### 1. Carregamento de Tags
```
loadData() → Promise.all([
  getOfxPendingTransactionsByImport(),
  getOfxPendingTransactionsSummary(),
  getCategories(),
  getTags({ isActive: true })
]) → setTags() + setSelectedTags()
```

### 2. Atualização de Tags
```
handleUpdateTags() → apiService.updateOfxTransactionTags() → 
setSelectedTags() + setPendingTransactions() + feedback visual
```

### 3. Persistência
- Tags são salvas no backend via API
- Estado local é atualizado imediatamente
- Feedback visual durante o salvamento
- Tratamento de erros com alertas

## 🚀 Próximas Melhorias

### 1. Funcionalidades Planejadas
- [ ] Sugestão automática de tags por IA
- [ ] Tags hierárquicas (pai/filho)
- [ ] Importação em lote de tags
- [ ] Relatórios baseados em tags
- [ ] Filtros avançados por tags

### 2. Melhorias de UX
- [ ] Drag & drop para reordenar tags
- [ ] Atalhos de teclado
- [ ] Histórico de tags aplicadas
- [ ] Tags favoritas
- [ ] Autocompletar ao digitar

### 3. Performance
- [ ] Virtualização para listas grandes
- [ ] Cache de tags mais usadas
- [ ] Lazy loading de tags
- [ ] Debounce na busca

## 📝 Notas de Desenvolvimento

### Estrutura de Arquivos
```
src/
├── pages/
│   ├── Tags.tsx              # Página de gerenciamento
│   └── OfxReview.tsx         # Revisão OFX com tags
├── services/
│   └── api.ts               # Funções de API para tags
└── types/
    └── index.ts             # Tipos TypeScript
```

### Dependências
- **Lucide React**: Ícones (Tag, Plus, X, etc.)
- **React Router**: Navegação
- **Axios**: Requisições HTTP
- **Tailwind CSS**: Estilização

### Validações
- Nome único para tags
- Cores em formato hexadecimal
- Tags ativas apenas para seleção
- Validação de uso antes de exclusão

---

**Sistema de Tags** - Versão 1.0  
*Implementado com sucesso e pronto para uso em produção! 🎉* 