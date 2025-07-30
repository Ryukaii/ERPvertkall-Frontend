# Criação de Tags na Revisão OFX - Frontend

## Visão Geral

A funcionalidade de criar tags diretamente na página de review OFX foi implementada para permitir que os usuários criem novas tags durante o processo de revisão, sem precisar sair da página e ir para a seção de gerenciamento de tags.

## Funcionalidades Implementadas

### 1. Botão "Criar Tag" no Modal de Seleção

Adicionado um botão "Criar Tag" no cabeçalho do modal de seleção de tags:

```typescript
<Button
  onClick={() => setShowCreateTagModal(true)}
  variant="outline"
  size="sm"
  className="flex items-center gap-1"
>
  <Plus className="h-3 w-3" />
  Criar Tag
</Button>
```

### 2. Modal de Criação de Tags

Implementado um modal completo para criar novas tags com os seguintes campos:

#### 2.1 Campos do Formulário

- **Nome**: Campo obrigatório para o nome da tag
- **Cor**: Seletor de cores com 10 opções predefinidas
- **Descrição**: Campo opcional para descrição da tag
- **Status**: Checkbox para definir se a tag está ativa

#### 2.2 Cores Disponíveis

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

### 3. Estados de Controle

Adicionados novos estados para gerenciar a criação de tags:

```typescript
const [showCreateTagModal, setShowCreateTagModal] = useState(false);
const [createTagForm, setCreateTagForm] = useState({
  name: '',
  color: '#3B82F6',
  description: '',
  isActive: true
});
```

### 4. Função de Criação

Implementada função para criar tags e atualizar a lista local:

```typescript
const handleCreateTag = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!createTagForm.name.trim()) {
    alert('Nome da tag é obrigatório');
    return;
  }

  try {
    const newTag = await apiService.createTag(createTagForm);
    
    // Adicionar a nova tag à lista local
    setTags(prev => [...prev, newTag]);
    
    // Fechar modal e resetar formulário
    setShowCreateTagModal(false);
    setCreateTagForm({
      name: '',
      color: '#3B82F6',
      description: '',
      isActive: true
    });
    
    alert('Tag criada com sucesso!');
  } catch (error) {
    console.error('Erro ao criar tag:', error);
    alert('Erro ao criar tag');
  }
};
```

## Interface do Usuário

### 5.1 Modal de Seleção de Tags Atualizado

```
┌─────────────────────────────────────────────────────────────┐
│ Selecionar Tags                    [Criar Tag] [✕]        │
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

### 5.2 Modal de Criação de Tags

```
┌─────────────────────────────────────────────────────────────┐
│ Criar Nova Tag                                [✕]         │
├─────────────────────────────────────────────────────────────┤
│ Nome *                                                      │
│ [Alimentação]                                               │
│                                                             │
│ Cor                                                         │
│ ● [Azul ▼]                                                  │
│                                                             │
│ Descrição                                                   │
│ [Despesas com alimentação...]                              │
│                                                             │
│ ☑ Tag ativa                                                 │
│                                                             │
│                    [Cancelar] [Criar Tag]                  │
└─────────────────────────────────────────────────────────────┘
```

## Fluxo de Uso

### 6.1 Criar Tag Durante Revisão

1. **Acessar revisão OFX**: Navegar para `/ofx-review/:importId`
2. **Abrir modal de tags**: Clicar no botão "Tags" de uma transação
3. **Criar nova tag**: Clicar em "Criar Tag" no modal
4. **Preencher formulário**: 
   - Nome da tag (obrigatório)
   - Selecionar cor
   - Adicionar descrição (opcional)
   - Definir status ativo/inativo
5. **Salvar tag**: Clicar em "Criar Tag"
6. **Usar nova tag**: A tag aparece automaticamente na lista de seleção

### 6.2 Validações

- **Nome obrigatório**: Não permite criar tag sem nome
- **Feedback visual**: Alerta de sucesso ou erro
- **Reset automático**: Formulário é limpo após criação
- **Atualização imediata**: Nova tag aparece na lista de seleção

## Benefícios da Implementação

### 7.1 Experiência do Usuário

- **Fluxo contínuo**: Não precisa sair da página de revisão
- **Criação rápida**: Modal dedicado para criar tags
- **Feedback imediato**: Tag criada aparece instantaneamente
- **Interface intuitiva**: Formulário simples e claro

### 7.2 Produtividade

- **Menos cliques**: Criação direta na página de revisão
- **Contexto preservado**: Mantém o foco na revisão OFX
- **Reutilização**: Tags criadas ficam disponíveis para outras transações
- **Eficiência**: Não precisa navegar entre páginas

### 7.3 Flexibilidade

- **Cores personalizadas**: 10 opções de cores predefinidas
- **Descrição opcional**: Permite adicionar contexto à tag
- **Status configurável**: Pode criar tags inativas se necessário
- **Validação robusta**: Previne criação de tags inválidas

## Integração com Sistema Existente

### 8.1 API Utilizada

```typescript
// Função utilizada do apiService
createTag(data: CreateTagRequest): Promise<Tag>
```

### 8.2 Tipos Reutilizados

```typescript
// Tipos já existentes no sistema
interface CreateTagRequest {
  name: string;
  color?: string;
  description?: string;
  isActive?: boolean;
}

interface Tag {
  id: string;
  name: string;
  color?: string;
  description?: string;
  isActive: boolean;
  // ... outros campos
}
```

### 8.3 Componentes Reutilizados

- **Modal**: Estrutura base do modal existente
- **Input**: Componente de input reutilizado
- **Select**: Componente de select reutilizado
- **Button**: Componente de botão reutilizado

## Estados e Gerenciamento

### 9.1 Estados Locais

```typescript
// Estados para criação de tags
const [showCreateTagModal, setShowCreateTagModal] = useState(false);
const [createTagForm, setCreateTagForm] = useState({
  name: '',
  color: '#3B82F6',
  description: '',
  isActive: true
});
```

### 9.2 Atualização de Lista

```typescript
// Atualização imediata da lista de tags
setTags(prev => [...prev, newTag]);
```

### 9.3 Reset de Formulário

```typescript
// Reset automático após criação
setCreateTagForm({
  name: '',
  color: '#3B82F6',
  description: '',
  isActive: true
});
```

## Próximos Passos

1. **Validação de nome único**: Verificar se já existe tag com mesmo nome
2. **Sugestões de cores**: Baseadas nas tags mais usadas
3. **Atalhos de teclado**: Ctrl+Enter para criar tag
4. **Preview da tag**: Mostrar como a tag ficará visualmente
5. **Templates de tags**: Sugestões de tags comuns

## Arquivos Modificados

- `src/pages/OfxReview.tsx` - Implementação completa da funcionalidade

## Testes

Para testar a funcionalidade:

1. Acesse uma revisão OFX (`/ofx-review/:importId`)
2. Clique no botão "Tags" de uma transação
3. Clique em "Criar Tag" no modal
4. Preencha o formulário com nome, cor e descrição
5. Clique em "Criar Tag"
6. Verifique se a nova tag aparece na lista de seleção
7. Teste selecionar a nova tag para a transação 