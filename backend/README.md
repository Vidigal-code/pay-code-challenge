# PAYCODE Backend - API REST

Backend da aplicação PAYCODE, uma plataforma fintech para carteiras digitais construída com NestJS, seguindo arquitetura limpa (Clean Architecture) e Domain-Driven Design (DDD).

## 📋 Índice

- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Funcionalidades](#funcionalidades)
- [Endpoints da API](#endpoints-da-api)
- [Configuração](#configuração)
- [Instalação](#instalação)
- [Executando](#executando)
- [Testes](#testes)
- [Segurança](#segurança)
- [Workers](#workers)

## 🛠 Tecnologias

### Core

- **NestJS** 10.4.5 - Framework Node.js
- **TypeScript** 5.5.4 - Linguagem
- **Prisma** 5.22.0 - ORM
- **PostgreSQL** - Banco de dados

### Autenticação & Segurança

- **JWT** (JSON Web Tokens) - Autenticação
- **JWE** (JSON Web Encryption) - Criptografia de payload
- **JWKS** (JSON Web Key Set) - Rotação de chaves
- **bcryptjs** - Hash de senhas
- **Helmet** - Headers de segurança HTTP
- **express-rate-limit** - Rate limiting

### Mensageria & Cache

- **RabbitMQ** - Message broker
- **Redis** - Cache e idempotência
- **Socket.io** - WebSockets

### Observabilidade

- **Pino** - Logging estruturado
- **Prometheus** - Métricas
- **Swagger** - Documentação da API

## 🏗 Arquitetura

O projeto segue **Clean Architecture** e **DDD**, organizado em camadas:

```
backend/src/
├── domain/           # Camada de Domínio (regras de negócio puras)
├── application/      # Camada de Aplicação (use cases)
├── infrastructure/    # Camada de Infraestrutura (implementações)
├── interfaces/       # Camada de Interface (HTTP, WebSocket, Consumers)
├── common/           # Código compartilhado (guards, interceptors, etc.)
├── config/           # Configurações
└── modules/          # Módulos de negócio
```

### Princípios

- **Separação de Responsabilidades**: Cada camada tem uma responsabilidade específica
- **Inversão de Dependências**: Dependências apontam para abstrações (ports)
- **Domain-Driven Design**: Entidades e value objects no domínio
- **SOLID**: Princípios aplicados em toda a arquitetura

## 📁 Estrutura do Projeto

### Domain Layer (`domain/`)

**Entidades:**

- `entities/user.entity.ts` - Entidade de usuário
- `entities/wallet.entity.ts` - Entidade de carteira
- `entities/transaction.entity.ts` - Entidade de transação

**Value Objects:**

- `value-objects/email.vo.ts` - Value object para email

**Repositories (Interfaces):**

- `repositories/user.repository.ts` - Interface do repositório de usuários
- `repositories/wallet.repository.ts` - Interface do repositório de carteiras
- `repositories/transaction.repository.ts` - Interface do repositório de transações

**Services:**

- `services/domain-events.service.ts` - Serviço de eventos de domínio

### Application Layer (`application/`)

**Use Cases:**

- `use-cases/signup.usecase.ts` - Cadastro de usuário
- `use-cases/login.usecase.ts` - Autenticação
- `use-cases/create-wallet.usecase.ts` - Criação de carteira
- `use-cases/get-wallet.usecase.ts` - Consulta de carteira
- `use-cases/deposit.usecase.ts` - Depósito
- `use-cases/transfer.usecase.ts` - Transferência
- `use-cases/reverse-transaction.usecase.ts` - Reversão de transação
- `use-cases/list-transactions.usecase.ts` - Listagem de transações
- `use-cases/get-dashboard-kpis.usecase.ts` - KPIs do dashboard
- `use-cases/delete-account.usecase.ts` - Exclusão de conta

**DTOs:**

- `dto/signup.dto.ts` - DTO de cadastro
- `dto/login.dto.ts` - DTO de login
- `dto/deposit.dto.ts` - DTO de depósito
- `dto/transfer.dto.ts` - DTO de transferência
- `dto/reverse-transaction.dto.ts` - DTO de reversão
- `dto/update-profile.dto.ts` - DTO de atualização de perfil
- `dto/error.response.dto.ts` - DTO de erro

**Ports (Interfaces):**

- `ports/hashing.service.ts` - Interface de hash de senhas
- `ports/email-validation.service.ts` - Interface de validação de email
- `ports/invite-token.service.ts` - Interface de tokens de convite

**Errors:**

- `errors/application-error.ts` - Erro de aplicação
- `errors/error-code.ts` - Códigos de erro

**Success:**

- `success/success-code.ts` - Códigos de sucesso
- `success/success-message.ts` - Mensagens de sucesso

### Infrastructure Layer (`infrastructure/`)

**Prisma (Repositories):**

- `prisma/prisma.service.ts` - Serviço Prisma
- `prisma/user.prisma.repository.ts` - Implementação do repositório de usuários
- `prisma/wallet.prisma.repository.ts` - Implementação do repositório de carteiras
- `prisma/transaction.prisma.repository.ts` - Implementação do repositório de transações

**Auth:**

- `auth/jwt.strategy.ts` - Estratégia JWT do Passport
- `auth/jwe.service.ts` - Serviço JWE (criptografia)
- `auth/jwks.service.ts` - Serviço JWKS (rotação de chaves)
- `auth/kms.service.ts` - Serviço KMS (gerenciamento de chaves)
- `auth/bcrypt-hashing.service.ts` - Implementação de hash com bcrypt
- `auth/sensitive-data-jwe.service.ts` - JWE para dados sensíveis

**Messaging:**

- `messaging/rabbitmq.service.ts` - Serviço RabbitMQ
- `messaging/rabbitmq-publisher.service.ts` - Publicador de mensagens
- `messaging/base-consumer.ts` - Consumidor base
- `messaging/events.producer.ts` - Produtor de eventos
- `messaging/financial-events.producer.ts` - Produtor de eventos financeiros
- `messaging/domain-events.service.ts` - Serviço de eventos de domínio

**Redis:**

- `redis/idempotency.service.ts` - Serviço de idempotência

**Cache:**

- `cache/redis-email-validation.service.ts` - Validação de email com cache

### Interfaces Layer (`interfaces/`)

**HTTP Controllers:**

- `http/auth.controller.ts` - Controller de autenticação
- `http/wallet.controller.ts` - Controller de carteira
- `http/jwks.controller.ts` - Controller JWKS

**WebSocket:**

- `websocket/financial-events.gateway.ts` - Gateway de eventos financeiros

**Consumers:**

- `consumers/financial-events.consumer.ts` - Consumidor de eventos financeiros
- `consumers/base.resilient.consumer.ts` - Consumidor resiliente base

### Common (`common/`)

**Guards:**

- `guards/jwt.guard.ts` - Guard de autenticação JWT
- `guards/owasp-security.guard.ts` - Guard de segurança OWASP

**Interceptors:**

- `interceptors/bigint-serialization.interceptor.ts` - Serialização de BigInt
- `interceptors/exception.interceptor.ts` - Interceptor de exceções
- `interceptors/success-code.interceptor.ts` - Interceptor de códigos de sucesso

**Filters:**

- `filters/all-exceptions.filter.ts` - Filtro global de exceções

**Decorators:**

- `decorators/current-user.decorator.ts` - Decorator para usuário atual

**Utils:**

- `utils/password.util.ts` - Utilitários de senha

### Modules (`modules/`)

- `auth/auth.module.ts` - Módulo de autenticação
- `wallet/wallet.module.ts` - Módulo de carteira
- `websocket/websocket.module.ts` - Módulo WebSocket
- `observability/observability.module.ts` - Módulo de observabilidade

### Workers (`workers/`)

- `workers/main.ts` - Entry point dos workers
- `workers/workers.module.ts` - Módulo de workers
- `workers/financial-events.worker.ts` - Worker de eventos financeiros
- `workers/audit.worker.ts` - Worker de auditoria

## ✨ Funcionalidades

### Autenticação

- ✅ Cadastro de usuários com validação de email
- ✅ Login com JWT/JWE
- ✅ Atualização de perfil
- ✅ Exclusão de conta
- ✅ Rotação automática de chaves (JWKS)

### Carteira

- ✅ Criação automática de carteira no cadastro
- ✅ Consulta de saldo
- ✅ Depósito de dinheiro
- ✅ Transferência entre usuários
- ✅ Validação de saldo antes de transferir
- ✅ Depósito adiciona mesmo com saldo negativo

### Transações

- ✅ Listagem de transações com paginação
- ✅ Filtros por tipo e status
- ✅ Reversão de transações (depósitos e transferências)
- ✅ Rollback automático em caso de falha
- ✅ Rastreabilidade completa

### Dashboard

- ✅ KPIs financeiros
- ✅ Total de depósitos
- ✅ Total de transferências enviadas/recebidas
- ✅ Estatísticas de transações

## 🔌 Endpoints da API

### Autenticação (`/auth`)

| Método | Endpoint        | Descrição        | Autenticação |
| ------ | --------------- | ---------------- | ------------ |
| POST   | `/auth/signup`  | Criar conta      | ❌           |
| POST   | `/auth/login`   | Login            | ❌           |
| GET    | `/auth/profile` | Obter perfil     | ✅           |
| POST   | `/auth/profile` | Atualizar perfil | ✅           |
| POST   | `/auth/logout`  | Logout           | ✅           |
| DELETE | `/auth/account` | Excluir conta    | ✅           |

### Carteira (`/wallet`)

| Método | Endpoint                           | Descrição           | Autenticação |
| ------ | ---------------------------------- | ------------------- | ------------ |
| POST   | `/wallet`                          | Criar carteira      | ✅           |
| GET    | `/wallet`                          | Obter carteira      | ✅           |
| POST   | `/wallet/deposit`                  | Depositar dinheiro  | ✅           |
| POST   | `/wallet/transfer`                 | Transferir dinheiro | ✅           |
| POST   | `/wallet/transactions/:id/reverse` | Reverter transação  | ✅           |
| GET    | `/wallet/transactions`             | Listar transações   | ✅           |
| GET    | `/wallet/dashboard/kpis`           | Obter KPIs          | ✅           |

### Segurança (`/.well-known`)

| Método | Endpoint                 | Descrição     | Autenticação |
| ------ | ------------------------ | ------------- | ------------ |
| GET    | `/.well-known/jwks.json` | JWKS endpoint | ❌           |

### Observabilidade

| Método | Endpoint   | Descrição           | Autenticação |
| ------ | ---------- | ------------------- | ------------ |
| GET    | `/health`  | Health check        | ❌           |
| GET    | `/metrics` | Métricas Prometheus | ❌           |

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do backend:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@db:5432/paycode?schema=public"

# Server
PORT=4000
NODE_ENV=development

# JWT
APP_JWT_SECRET=your-secret-key-here
APP_JWT_EXPIRES_IN=7d
APP_JWT_COOKIE_NAME=paycode_session

# JWE
APP_JWE_ENABLED=true

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672

# Redis
REDIS_URL=redis://redis:6379

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=30
```

## 🚀 Instalação

```bash
# Instalar dependências
npm install

# Gerar Prisma Client
npx prisma generate

# Executar migrações
npx prisma migrate dev
```

## ▶️ Executando

### Desenvolvimento

```bash
# Modo watch (recompila automaticamente)
npm run dev

# Ou com Docker Compose
docker-compose up api
```

### Produção

```bash
# Build
npm run build

# Iniciar
npm start
```

### Workers

```bash
# Iniciar workers
npm run start:worker
```

## 🧪 Testes

### Testes Unitários

```bash
# Executar todos os testes unitários
npm test

# Testes com cobertura
npm test -- --coverage

# Testes em modo watch
npm test -- --watch
```

### Testes de Integração (E2E)

```bash
# Executar testes de integração
npm test -- --testPathPattern=integration

# Executar testes específicos
npm test -- wallet.integration.spec.ts
npm test -- auth.integration.spec.ts
```

**Testes de Integração Disponíveis:**

- `wallet.integration.spec.ts` - Testes E2E de operações de carteira (deposit, transfer, reverse, KPIs)
- `auth.integration.spec.ts` - Testes E2E de autenticação (signup, login, profile)

**Cobertura de Testes:**

- ✅ Testes unitários para Use Cases (deposit, transfer, reverse, signup)
- ✅ Testes de integração para fluxos completos (auth, wallet)
- ✅ Testes de componentes e serviços (base-consumer, idempotency)

## 🐰 RabbitMQ - Resolução de Problemas

### Problema: PRECONDITION-FAILED ao criar filas

Se você encontrar erros como:

```
PRECONDITION_FAILED - inequivalent arg 'x-dead-letter-exchange' for queue 'financial_events'
```

Isso significa que as filas já existem no RabbitMQ com configurações diferentes. Para resolver:

**Opção 1: Limpar filas via script (recomendado)**

```bash
# Via Node.js (requer amqplib instalado)
cd backend
node scripts/clean-rabbitmq-queues.js
```

**Opção 2: Via RabbitMQ Management UI**

1. Acesse http://localhost:15672 (guest/guest)
2. Vá em "Queues"
3. Delete as filas: `financial_events`, `financial_events.dlq`, `audit.logs`, `audit.logs.dlq`
4. Reinicie a aplicação

**Opção 3: O código agora detecta filas existentes**
O código foi atualizado para verificar se a fila existe antes de tentar criá-la com dead-letter. Se a fila existir sem dead-letter, ela será usada normalmente (apenas sem funcionalidade de DLQ).

### Verificar status das filas

```bash
docker compose exec rabbitmq rabbitmqctl list_queues name arguments
```

## 🔒 Segurança

### Implementações de Segurança

- ✅ **JWT + JWE**: Criptografia de payload além de assinatura
- ✅ **JWKS**: Rotação automática de chaves (24 horas)
- ✅ **KMS**: Gerenciamento seguro de chaves (pronto para AWS/GCP)
- ✅ **OWASP API Security**: Proteções contra vulnerabilidades
- ✅ **Rate Limiting**:
  - Geral: 30 req/min
  - Transações: 10 req/min
- ✅ **Helmet**: Headers de segurança HTTP
- ✅ **CORS**: Restrito a origens permitidas
- ✅ **Validação**: Class-validator em todos os DTOs
- ✅ **Cookies Seguros**: httpOnly, SameSite, Secure

## 👷 Workers

O sistema possui workers para processamento assíncrono:

- **FinancialEventsWorker**: Processa eventos financeiros
- **AuditWorker**: Processa logs de auditoria

Os workers consomem mensagens do RabbitMQ e processam de forma assíncrona.

## 📊 Banco de Dados

### Schema Prisma

- **User**: Usuários do sistema
- **Wallet**: Carteiras dos usuários
- **Transaction**: Transações financeiras

### Migrações

```bash
# Criar nova migração
npm run prisma:migrate

# Aplicar migrações em produção
npx prisma migrate deploy
```

## 📚 Documentação

A documentação Swagger está disponível em:

- **Desenvolvimento**: `http://localhost:4000/api`

## 🏛 Padrões Arquiteturais

- **Clean Architecture**: Separação clara de camadas
- **DDD**: Domain-Driven Design
- **CQRS**: Separação de leitura e escrita (parcial)
- **Event-Driven**: Eventos de domínio para comunicação assíncrona
- **Repository Pattern**: Abstração de acesso a dados
- **Dependency Injection**: Inversão de controle

## 🔄 Fluxo de Transação

1. **Request** → Controller
2. **Validation** → DTO + Class-validator
3. **Use Case** → Lógica de negócio
4. **Domain** → Entidades e regras
5. **Repository** → Persistência
6. **Events** → Publicação de eventos
7. **Response** → Serialização e retorno

## 📝 Logs

O sistema usa **Pino** para logging estruturado:

- Logs em JSON (produção)
- Logs formatados (desenvolvimento)
- Níveis: error, warn, log, debug

## 🎯 Próximos Passos

- [ ] Integração com AWS KMS/GCP KMS
- [ ] Notificações push
- [ ] Relatórios financeiros
- [ ] Exportação de transações
- [ ] Integração com gateways de pagamento
