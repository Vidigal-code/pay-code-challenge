# PAYCODE Frontend - Next.js Application

Frontend da aplicação PAYCODE, uma plataforma fintech para carteiras digitais construída com Next.js 14, React 18, TypeScript e Tailwind CSS.

## 📋 Índice

- [Tecnologias](#tecnologias)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Funcionalidades](#funcionalidades)
- [Páginas](#páginas)
- [Componentes](#componentes)
- [Configuração](#configuração)
- [Instalação](#instalação)
- [Executando](#executando)
- [Testes](#testes)
- [Estado Global](#estado-global)

## 🛠 Tecnologias

### Core
- **Next.js** 14.2.0 - Framework React
- **React** 18.2.0 - Biblioteca UI
- **TypeScript** 5.5.4 - Linguagem
- **Tailwind CSS** 3.4.10 - Framework CSS

### Gerenciamento de Estado
- **Redux Toolkit** 2.10.1 - Estado global
- **React Query (TanStack Query)** 5.90.7 - Cache e sincronização de dados

### HTTP & Comunicação
- **Axios** 1.7.7 - Cliente HTTP
- **Socket.io Client** 4.8.1 - WebSockets

### UI & Icons
- **React Icons** 5.2.1 - Biblioteca de ícones

### Testes
- **Jest** 29.7.0 - Framework de testes
- **React Testing Library** 14.1.2 - Testes de componentes

## 📁 Estrutura do Projeto

```
frontend/src/
├── app/                    # Next.js App Router
│   ├── api/                # API Routes
│   ├── dashboard/          # Página de dashboard
│   ├── login/              # Página de login
│   ├── signup/             # Página de cadastro
│   ├── profile/            # Página de perfil
│   ├── wallet/             # Página de carteira
│   ├── layout.tsx          # Layout principal
│   ├── page.tsx            # Página inicial
│   └── providers.tsx       # Providers (React Query, Redux)
│
├── components/             # Componentes reutilizáveis
│   ├── ui/                 # Componentes de UI
│   ├── Navbar.tsx          # Barra de navegação
│   ├── Modal.tsx           # Modal genérico
│   ├── ConfirmModal.tsx    # Modal de confirmação
│   └── Skeleton.tsx        # Loading skeleton
│
├── contexts/               # React Contexts
│   ├── AuthContext.tsx     # Context de autenticação
│   └── ToastContext.tsx    # Context de notificações
│
├── hooks/                  # Custom Hooks
│   ├── useAuth.tsx         # Hook de autenticação
│   └── useToast.ts         # Hook de toast
│
├── lib/                    # Utilitários e configurações
│   ├── api.ts              # Configuração de API
│   ├── config.ts           # Configurações
│   ├── http.ts             # Cliente HTTP
│   ├── error.ts            # Tratamento de erros
│   ├── messages.ts         # Mensagens de sucesso/erro
│   └── queryKeys.ts        # Chaves do React Query
│
├── services/               # Serviços
│   ├── api.ts              # Serviço de API
│   └── auth.service.ts     # Serviço de autenticação
│
├── store/                  # Redux Store
│   ├── index.ts            # Configuração do store
│   └── slices/             # Redux Slices
│       ├── authSlice.ts    # Slice de autenticação
│       └── theme.slice.ts  # Slice de tema
│
├── types/                  # TypeScript Types
│   └── global.d.ts         # Tipos globais
│
└── tests/                  # Testes
    ├── components/         # Testes de componentes
    ├── pages/              # Testes de páginas
    └── setup.ts            # Configuração de testes
```

## ✨ Funcionalidades

### Autenticação
- ✅ Página de cadastro (signup)
- ✅ Página de login
- ✅ Gerenciamento de sessão com cookies
- ✅ Proteção de rotas com middleware
- ✅ Logout

### Carteira
- ✅ Visualização de saldo
- ✅ Depósito de dinheiro
- ✅ Transferência entre usuários
- ✅ Listagem de transações
- ✅ Reversão de transações
- ✅ Dashboard com KPIs

### UI/UX
- ✅ Design moderno com Tailwind CSS
- ✅ Modo claro/escuro
- ✅ Responsivo (mobile-first)
- ✅ Loading states (skeletons)
- ✅ Notificações toast
- ✅ Modais de confirmação

## 📄 Páginas

### `/` - Página Inicial
- Landing page com informações sobre a plataforma
- Cards de funcionalidades
- CTAs para login/signup
- Redirecionamento automático se autenticado

### `/login` - Login
- Formulário de login (email + senha)
- Validação de campos
- Feedback visual de erros
- Redirecionamento após login bem-sucedido

### `/signup` - Cadastro
- Formulário de cadastro (nome, email, senha)
- Validação de campos
- Feedback visual de erros
- Criação automática de carteira

### `/dashboard` - Dashboard
- KPIs financeiros
- Gráficos e estatísticas
- Resumo de transações recentes

### `/wallet` - Carteira
- Visualização de saldo
- Botões de ação (Deposit, Transfer)
- Listagem de transações
- Botão de reversão em transações elegíveis
- Modais para depósito, transferência e reversão

### `/profile` - Perfil
- Visualização de dados do usuário
- Atualização de perfil
- Alteração de senha

## 🧩 Componentes

### Navbar
- Navegação principal
- Menu contextual (autenticado/não autenticado)
- Toggle de tema (claro/escuro)
- Logout

### Modal
- Modal genérico reutilizável
- Backdrop com overlay
- Fechamento por clique fora ou ESC

### ConfirmModal
- Modal de confirmação
- Botões de ação (Confirm/Cancel)

### Toast
- Notificações toast
- Tipos: success, error, warning, info
- Auto-dismiss configurável

### Skeleton
- Loading skeleton para estados de carregamento
- Animações suaves

## 🎨 Estilização

### Tailwind CSS
- Design system completo
- Modo claro/escuro
- Responsividade mobile-first
- Animações e transições

### Tema
- Gerenciado via Redux
- Persistido em localStorage
- Toggle global na navbar

## 🔄 Estado Global

### Redux Toolkit

**Auth Slice:**
- `isAuthenticated` - Estado de autenticação
- `setAuthenticated` - Action para definir autenticação
- `logoutState` - Action para logout

**Theme Slice:**
- `theme` - Tema atual (light/dark)
- `toggleTheme` - Action para alternar tema

### React Query

Cache e sincronização de dados:
- Queries para dados do servidor
- Mutations para operações de escrita
- Invalidação automática de cache
- Refetch em background

## 🔌 Integração com API

### Cliente HTTP (`lib/http.ts`)
- Configuração base do Axios
- Interceptors para autenticação
- Tratamento de erros global
- Base URL configurável

### Serviços

**Auth Service:**
- `login(email, password)`
- `signup(email, password, name)`
- `logout()`

**API Service:**
- Métodos genéricos para chamadas HTTP
- Tipagem TypeScript

## 🛡 Proteção de Rotas

### Middleware (`middleware.ts`)
- Verificação de autenticação
- Redirecionamento para login se não autenticado
- Proteção de rotas privadas

### Rotas Protegidas
- `/wallet`
- `/dashboard`
- `/profile`

### Rotas Públicas
- `/`
- `/login`
- `/signup`

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do frontend:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SESSION_COOKIE=paycode_session
```

### Configuração do Next.js

- **App Router**: Usando Next.js 14 App Router
- **TypeScript**: Configuração estrita
- **Tailwind**: Configurado com PostCSS
- **Jest**: Configurado para testes

## 🚀 Instalação

```bash
# Instalar dependências
npm install

# Ou com pnpm
pnpm install
```

## ▶️ Executando

### Desenvolvimento

```bash
# Modo desenvolvimento
npm run dev

# Ou com Docker Compose
docker-compose up web
```

Acesse: `http://localhost:3000`

### Produção

```bash
# Build
npm run build

# Iniciar servidor de produção
npm start
```

## 🧪 Testes

### Testes Unitários

```bash
# Executar todos os testes
npm test

# Modo watch
npm test -- --watch

# Com cobertura
npm test -- --coverage
```

### Testes de Integração

```bash
# Executar testes de integração
npm test -- --testPathPattern=integration

# Executar teste específico
npm test -- wallet.integration.test.tsx
```

**Testes Disponíveis:**
- ✅ Testes unitários de componentes (Navbar, HomePage)
- ✅ Testes de integração de fluxos (Wallet operations)
- ✅ Testes de middleware e rotas

**Cobertura:**
- Componentes React
- Fluxos de integração com API
- Validações de formulários
- Estados de loading e erro

## 📱 Responsividade

O frontend é totalmente responsivo:
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

Menu hambúrguer para mobile, layout adaptativo.

## 🎯 Funcionalidades por Página

### Wallet Page (`/wallet`)

**KPIs:**
- Total Balance
- Total Deposits
- Total Transfers
- Total Received
- Total Transactions
- Completed/Failed/Reversed counts

**Ações:**
- Deposit (modal)
- Transfer (modal)
- Reverse Transaction (modal)

**Listagem:**
- Transações recentes
- Status colorido
- Botão de reversão (quando elegível)
- Formatação de moeda (BRL)

## 🔄 Fluxo de Dados

1. **User Action** → Component
2. **Hook/Service** → API Call
3. **React Query** → Cache & Sync
4. **Redux** → Estado Global
5. **UI Update** → Re-render

## 🎨 Design System

### Cores
- **Primary**: Azul (#3B82F6)
- **Success**: Verde (#10B981)
- **Error**: Vermelho (#EF4444)
- **Warning**: Amarelo (#F59E0B)

### Componentes Reutilizáveis
- Botões com variantes
- Inputs estilizados
- Cards com shadow
- Modais com overlay

## 📝 Notas de Desenvolvimento

- **TypeScript**: Tipagem estrita em todo o código
- **Error Handling**: Tratamento centralizado de erros
- **Loading States**: Skeletons para melhor UX
- **Toast Notifications**: Feedback visual para todas as ações
- **Form Validation**: Validação client-side e server-side

## 🚀 Próximos Passos

- [ ] Testes E2E com Playwright
- [ ] PWA (Progressive Web App)
- [ ] Notificações push
- [ ] Gráficos avançados
- [ ] Exportação de relatórios
- [ ] Internacionalização (i18n)

