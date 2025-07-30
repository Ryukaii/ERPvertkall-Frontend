# Importação de Arquivos OFX - Frontend

Este módulo implementa a funcionalidade de importação de arquivos OFX (Open Financial Exchange) no frontend do sistema ERP Vertkall.

## Funcionalidades Implementadas

### ✅ Upload de Arquivos OFX
- Interface intuitiva para seleção de arquivos .ofx
- Validação de formato de arquivo
- Upload com progresso visual

### ✅ Listagem de Importações
- Tabela com todas as importações realizadas
- Status em tempo real (PROCESSING, COMPLETED, FAILED, CANCELLED)
- Informações detalhadas de cada importação

### ✅ Monitoramento de Status
- Polling automático para importações em processamento
- Indicadores visuais de progresso
- Atualização em tempo real

### ✅ Visualização de Detalhes
- Modal com informações completas da importação
- Lista de transações importadas
- Formatação de valores monetários

### ✅ Gerenciamento de Importações
- Exclusão de importações com confirmação
- Exclusão em cascata (remove transações relacionadas)
- Atualização automática da lista

## Estrutura de Arquivos

### Tipos TypeScript (`src/types/index.ts`)
```typescript
export interface OfxImport {
  id: string;
  fileName: string;
  importDate: string;
  bankId: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  totalTransactions: number;
  processedTransactions: number;
  errorMessage?: string;
  description?: string;
  bank?: Bank;
  transactions?: BankTransaction[];
}

export interface OfxImportStatus {
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
}

export interface OfxImportResponse {
  message: string;
  importId: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  totalTransactions: number;
  processedTransactions: number;
}
```

### Serviços da API (`src/services/api.ts`)
```typescript
// Upload de arquivo OFX
uploadOfxFile = async (file: File, bankId: string, description?: string): Promise<OfxImportResponse>

// Listar importações
getOfxImports = async (): Promise<OfxImport[]>

// Obter detalhes de uma importação
getOfxImport = async (id: string): Promise<OfxImport>

// Verificar status de processamento
getOfxImportStatus = async (id: string): Promise<OfxImportStatus>

// Excluir importação
deleteOfxImport = async (id: string): Promise<void>
```

### Página Principal (`src/pages/OfxImport.tsx`)
- Interface completa para gerenciamento de importações
- Modais para upload e visualização de detalhes
- Polling automático para status de processamento

## Componentes Utilizados

### UI Components
- **Button**: Botões com variantes (primary, outline, danger)
- **Input**: Campo de texto para descrição
- **Select**: Seleção de banco
- **Modal**: Modais para upload e detalhes

### Ícones (Lucide React)
- `Upload`: Upload de arquivos
- `FileText`: Arquivos
- `AlertCircle`: Alertas
- `CheckCircle`: Sucesso
- `XCircle`: Erro
- `Clock`: Processando
- `Trash2`: Excluir
- `Eye`: Visualizar
- `RefreshCw`: Atualizar

## Fluxo de Funcionamento

### 1. Upload de Arquivo
1. Usuário clica em "Nova Importação"
2. Seleciona arquivo .ofx
3. Escolhe banco relacionado
4. Opcionalmente adiciona descrição
5. Confirma upload

### 2. Processamento
1. Arquivo é enviado para o backend
2. Frontend inicia polling de status
3. Interface mostra progresso em tempo real
4. Lista é atualizada automaticamente

### 3. Visualização
1. Tabela mostra todas as importações
2. Status visual com ícones
3. Modal de detalhes com transações
4. Opções de exclusão

## Estados da Interface

### Status de Importação
- **PROCESSING**: ⏳ Processando (com spinner)
- **COMPLETED**: ✅ Concluído
- **FAILED**: ❌ Falhou (com mensagem de erro)
- **CANCELLED**: ⏹️ Cancelado

### Estados de Loading
- Loading inicial da lista
- Upload em progresso
- Polling de status
- Exclusão em progresso

## Tratamento de Erros

### Validações Frontend
- Formato de arquivo (.ofx)
- Seleção obrigatória de banco
- Tamanho máximo de arquivo

### Tratamento de Erros da API
- Mensagens de erro amigáveis
- Fallback para erros genéricos
- Retry automático em falhas de rede

## Integração com Backend

### Endpoints Utilizados
- `POST /ofx-import/upload`: Upload de arquivo
- `GET /ofx-import`: Listar importações
- `GET /ofx-import/:id`: Detalhes da importação
- `GET /ofx-import/:id/status`: Status de processamento
- `DELETE /ofx-import/:id`: Excluir importação

### Headers Necessários
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data` (upload)

## Navegação

### Menu Principal
- Adicionado item "Importação OFX" no menu lateral
- Ícone: Upload
- Rota: `/ofx-import`

### Rotas Protegidas
- Requer autenticação
- Acessível a todos os usuários autenticados

## Responsividade

### Mobile
- Sidebar colapsável
- Tabela com scroll horizontal
- Modais responsivos

### Desktop
- Layout completo
- Tabela com todas as colunas
- Modais grandes para detalhes

## Performance

### Otimizações
- Polling inteligente (para apenas importações em processamento)
- Debounce em atualizações
- Lazy loading de detalhes
- Cache de dados de bancos

### Monitoramento
- Console logs para debugging
- Tratamento de erros robusto
- Feedback visual para todas as ações

## Testes

### Funcionalidades Testadas
- ✅ Upload de arquivos válidos
- ✅ Validação de formato
- ✅ Seleção de banco
- ✅ Polling de status
- ✅ Visualização de detalhes
- ✅ Exclusão de importações
- ✅ Responsividade

### Cenários de Erro
- ✅ Arquivo inválido
- ✅ Falha de rede
- ✅ Banco não selecionado
- ✅ Erro de processamento no backend

## Próximas Melhorias

### Funcionalidades Futuras
- [ ] Drag & drop para upload
- [ ] Preview do arquivo antes do upload
- [ ] Filtros na lista de importações
- [ ] Exportação de relatórios
- [ ] Histórico de importações por banco
- [ ] Notificações push para conclusão

### Melhorias de UX
- [ ] Progress bar mais detalhada
- [ ] Animações de transição
- [ ] Temas escuro/claro
- [ ] Atalhos de teclado

## Dependências

### Principais
- `react`: 18.2.0
- `react-router-dom`: 6.8.1
- `axios`: 1.3.4
- `lucide-react`: 0.263.1

### UI
- `tailwindcss`: 3.2.7
- `clsx`: 1.2.1

## Configuração

### Variáveis de Ambiente
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### Build
```bash
npm run build
```

### Desenvolvimento
```bash
npm run dev
```

## Contribuição

### Padrões de Código
- TypeScript strict mode
- ESLint configurado
- Prettier para formatação
- Componentes funcionais com hooks

### Estrutura de Commits
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação
- `refactor`: Refatoração
- `test`: Testes

---

**Desenvolvido para o ERP Vertkall**  
**Versão**: 1.0.0  
**Data**: Julho 2025 