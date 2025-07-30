# Botão para Minimizar Menu - Frontend

## Visão Geral

A funcionalidade de minimizar o menu lateral foi implementada para permitir que os usuários economizem espaço na tela, especialmente em monitores menores ou quando precisam de mais espaço para o conteúdo principal.

## Funcionalidades Implementadas

### 1. Estado de Controle

Adicionado novo estado para controlar se o menu está minimizado:

```typescript
const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
```

### 2. Botões de Controle

#### 2.1 Botão no Sidebar (Desktop)

Localizado no cabeçalho do sidebar, permite alternar entre menu expandido e minimizado:

```typescript
<button
  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
  className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
  title={sidebarCollapsed ? "Expandir menu" : "Minimizar menu"}
>
  {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
</button>
```

#### 2.2 Botão na Top Bar (Desktop)

Localizado na barra superior, também permite alternar o estado do menu:

```typescript
<button
  type="button"
  className="hidden lg:flex -m-2.5 p-2.5 text-gray-700 hover:text-gray-900"
  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
  title={sidebarCollapsed ? "Expandir menu" : "Minimizar menu"}
>
  {sidebarCollapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
</button>
```

### 3. Layout Responsivo

#### 3.1 Sidebar Desktop

O sidebar se ajusta dinamicamente baseado no estado:

```typescript
<div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}`}>
```

#### 3.2 Conteúdo Principal

O conteúdo principal se ajusta automaticamente:

```typescript
<div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
```

### 4. Navegação Adaptativa

#### 4.1 Itens de Menu

Os itens de menu se adaptam ao estado minimizado:

```typescript
<Icon className={`h-5 w-5 text-primary-500 ${sidebarCollapsed ? 'mx-auto' : 'mr-3'}`} />
{!sidebarCollapsed && item.name}
```

#### 4.2 Tooltips

Quando minimizado, os itens mostram tooltips com o nome:

```typescript
title={sidebarCollapsed ? item.name : undefined}
```

#### 4.3 Submenus

Os submenus são ocultados quando o menu está minimizado:

```typescript
{!sidebarCollapsed && (
  <div className={`absolute left-0 w-full z-20 bg-white border border-gray-200 rounded-md shadow-lg py-1 transition-all duration-150 ${submenuOpen === item.name ? 'block' : 'hidden'}`}>
    {/* Submenu items */}
  </div>
)}
```

### 5. Animações Suaves

Todas as transições são suavizadas com CSS:

```css
transition-all duration-300
```

## Estados do Menu

### 5.1 Menu Expandido (Padrão)

- **Largura**: 256px (lg:w-64)
- **Conteúdo**: Ícones + texto
- **Submenus**: Visíveis no hover
- **Tooltips**: Desabilitados

### 5.2 Menu Minimizado

- **Largura**: 64px (lg:w-16)
- **Conteúdo**: Apenas ícones centralizados
- **Submenus**: Ocultos
- **Tooltips**: Habilitados para mostrar nomes

## Comportamento por Dispositivo

### 6.1 Desktop (lg:)

- **Menu lateral**: Fixo à esquerda
- **Botões de controle**: Disponíveis no sidebar e top bar
- **Animações**: Suaves e responsivas
- **Submenus**: Funcionais no hover

### 6.2 Mobile/Tablet

- **Menu lateral**: Overlay modal
- **Botões de controle**: Apenas menu hambúrguer
- **Animações**: Slide in/out
- **Submenus**: Dropdown no click

## Ícones Utilizados

### 6.1 ChevronLeft

- **Uso**: Botão para minimizar menu
- **Localização**: Sidebar header e top bar
- **Estado**: Menu expandido

### 6.2 ChevronRight

- **Uso**: Botão para expandir menu
- **Localização**: Sidebar header e top bar
- **Estado**: Menu minimizado

## Benefícios da Implementação

### 7.1 Experiência do Usuário

- **Flexibilidade**: Usuários podem escolher o layout preferido
- **Eficiência**: Mais espaço para conteúdo em telas menores
- **Consistência**: Comportamento previsível em todas as páginas

### 7.2 Performance

- **Transições suaves**: Animações CSS otimizadas
- **Renderização eficiente**: Estados bem definidos
- **Responsividade**: Adaptação automática ao dispositivo

### 7.3 Acessibilidade

- **Tooltips**: Informações contextuais quando necessário
- **Navegação por teclado**: Botões acessíveis
- **Estados visuais**: Feedback claro das ações

## Fluxo de Uso

1. **Menu Padrão**: Expandido com texto e ícones
2. **Minimização**: Clique no botão para minimizar
3. **Navegação**: Ícones com tooltips quando minimizado
4. **Expansão**: Clique no botão para expandir novamente
5. **Persistência**: Estado mantido durante a sessão

## Próximos Passos

1. **Persistência**: Salvar preferência do usuário no localStorage
2. **Atalhos de teclado**: Ctrl+M para alternar menu
3. **Animações avançadas**: Efeitos mais elaborados
4. **Temas**: Diferentes estilos para menu minimizado

## Arquivos Modificados

- `src/components/Layout.tsx` - Implementação completa da funcionalidade

## Testes

Para testar a funcionalidade:

1. Acesse qualquer página do sistema
2. Clique no botão de minimizar no sidebar (desktop)
3. Verifique se o menu se contrai suavemente
4. Teste a navegação com ícones apenas
5. Clique no botão de expandir para restaurar
6. Teste o botão na top bar também 