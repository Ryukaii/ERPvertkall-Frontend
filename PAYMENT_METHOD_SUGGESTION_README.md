# Sugestão de Método de Pagamento - Frontend

## Visão Geral

A funcionalidade de sugestão de método de pagamento foi implementada no frontend para permitir que os usuários visualizem e editem as sugestões automáticas de métodos de pagamento para transações OFX importadas.

## Funcionalidades Implementadas

### 1. Novos Campos na Interface OfxPendingTransaction

Adicionados os seguintes campos à interface `OfxPendingTransaction` em `src/types/index.ts`:

```typescript
export interface OfxPendingTransaction {
  // ... campos existentes ...
  
  // Novos campos para método de pagamento sugerido
  suggestedPaymentMethodId?: string;
  suggestedPaymentMethod?: PaymentMethod;
  paymentMethodConfidence?: number;
  finalPaymentMethodId?: string;
}
```

### 2. Novos Métodos de API

Adicionados os seguintes métodos em `src/services/api.ts`:

```typescript
updateOfxTransactionPaymentMethod = async (id: string, data: { paymentMethodId: string }): Promise<OfxPendingTransaction> => {
  this.ensureApiInitialized();
  const response: AxiosResponse<OfxPendingTransaction> = await this.api.put(`/ofx-pending-transactions/${id}/payment-method`, data);
  return response.data;
}
```

### 3. Interface de Usuário Atualizada

#### 3.1 Resumo Expandido

O resumo da página de review agora inclui três cards:

- **Total**: Número total de transações
- **Sem Categoria**: Transações sem categoria sugerida
- **Métodos Sugeridos**: Transações com método de pagamento sugerido

```typescript
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {/* Card Total */}
  {/* Card Sem Categoria */}
  {/* Card Métodos Sugeridos */}
</div>
```

#### 3.2 Filtros Adicionais

Adicionado novo filtro para transações sem método de pagamento:

```typescript
const [filter, setFilter] = useState<'all' | 'uncategorized' | 'no-payment-method'>('all');
```

#### 3.3 Nova Coluna na Tabela

Adicionada coluna "Método de Pagamento" na tabela de transações com:

- **Select dropdown**: Para selecionar método de pagamento
- **Ícone Wallet**: Indicador visual
- **Indicador de confiança**: Mostra a porcentagem de confiança da sugestão
- **Indicador de salvamento**: Feedback visual durante o salvamento

### 4. Funcionalidades de Interação

#### 4.1 Atualização de Método de Pagamento

```typescript
const handlePaymentMethodChange = async (transactionId: string, paymentMethodId: string) => {
  if (!paymentMethodId) return;

  try {
    setSaving(prev => new Set(prev).add(transactionId));
    
    await apiService.updateOfxTransactionPaymentMethod(transactionId, { paymentMethodId });
    
    // Atualizar a transação na lista local
    setPendingTransactions(prev => 
      prev.map(transaction => 
        transaction.id === transactionId 
          ? { 
              ...transaction, 
              finalPaymentMethodId: paymentMethodId,
              suggestedPaymentMethod: paymentMethods.find(pm => pm.id === paymentMethodId)
            }
          : transaction
      )
    );
    
    // Feedback visual
    setTimeout(() => {
      setSaving(prev => {
        const newSet = new Set(prev);
        newSet.delete(transactionId);
        return newSet;
      });
    }, 1000);
    
  } catch (error) {
    console.error('Erro ao atualizar método de pagamento:', error);
    alert('Erro ao atualizar método de pagamento');
  }
};
```

#### 4.2 Lógica de Exibição de Método de Pagamento

```typescript
const getPaymentMethodWithConfidence = (transaction: OfxPendingTransaction) => {
  // Se há um método de pagamento final (manual), usar ele
  if (transaction.finalPaymentMethodId) {
    const finalMethod = paymentMethods.find(pm => pm.id === transaction.finalPaymentMethodId);
    return { method: finalMethod, confidence: 100, isSuggested: false };
  }
  
  // Se há um método sugerido, usar ele
  if (transaction.suggestedPaymentMethodId) {
    const suggestedMethod = paymentMethods.find(pm => pm.id === transaction.suggestedPaymentMethodId);
    return { 
      method: suggestedMethod, 
      confidence: transaction.paymentMethodConfidence || 0, 
      isSuggested: true 
    };
  }
  
  return { method: null, confidence: 0, isSuggested: false };
};
```

### 5. Carregamento de Dados

A função `loadData` foi atualizada para carregar os métodos de pagamento:

```typescript
const [transactions, summaryData, categoriesData, tagsData, paymentMethodsData] = await Promise.all([
  apiService.getOfxPendingTransactionsByImport(importId!),
  apiService.getOfxPendingTransactionsSummary(importId!),
  apiService.getCategories(),
  apiService.getTags({ isActive: true }),
  apiService.getPaymentMethods() // Novo
]);
```

## Interface Visual

### 5.1 Indicadores Visuais

- **Ícone Wallet**: Indica coluna de método de pagamento
- **Target + Porcentagem**: Indica sugestão automática com confiança
- **Spinner**: Indica salvamento em andamento
- **Cores**: Verde para sugestões, azul para salvamento

### 5.2 Estados da Interface

1. **Sem método**: Select vazio
2. **Com sugestão**: Select preenchido + indicador de confiança
3. **Manual**: Select preenchido sem indicador de confiança
4. **Salvando**: Spinner de loading

## Integração com Backend

### 6.1 Endpoints Utilizados

- `GET /payment-methods` - Listar métodos de pagamento
- `PUT /ofx-pending-transactions/:id/payment-method` - Atualizar método de pagamento

### 6.2 Estrutura de Dados

```typescript
// Request
{
  paymentMethodId: string
}

// Response
{
  id: string;
  suggestedPaymentMethodId?: string;
  suggestedPaymentMethod?: PaymentMethod;
  paymentMethodConfidence?: number;
  finalPaymentMethodId?: string;
  // ... outros campos
}
```

## Fluxo de Uso

1. **Importação OFX**: Backend sugere métodos de pagamento automaticamente
2. **Review**: Usuário vê sugestões na interface
3. **Edição**: Usuário pode alterar método de pagamento manualmente
4. **Salvamento**: Alterações são salvas em tempo real
5. **Aprovação**: Transações são criadas com método de pagamento final

## Próximos Passos

1. **Aprovação em Lote**: Permitir aprovar múltiplos métodos de pagamento
2. **Regras Customizáveis**: Interface para criar regras de sugestão
3. **Histórico**: Mostrar histórico de alterações de método de pagamento
4. **Estatísticas**: Dashboard com estatísticas de sugestões

## Arquivos Modificados

- `src/types/index.ts` - Interface OfxPendingTransaction atualizada
- `src/services/api.ts` - Novo método updateOfxTransactionPaymentMethod
- `src/pages/OfxReview.tsx` - Interface completa de métodos de pagamento

## Testes

Para testar a funcionalidade:

1. Importe um arquivo OFX
2. Acesse a página de review
3. Verifique se há sugestões de métodos de pagamento
4. Teste a alteração manual de métodos
5. Verifique se as alterações são salvas corretamente 