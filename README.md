# PAYCODE - Fintech Wallet Platform

<details>
<summary><strong>Resumo rápido</strong></summary>

- ✅ Sistema completo de carteira financeira (wallet)
- ✅ Cadastro e autenticação segura com JWT + JWE (JSON Web Encryption)
- ✅ JWKS (JSON Web Key Set) para rotação automática de chaves
- ✅ KMS (Key Management Service) simulado - pronto para AWS/GCP
- ✅ JWE para dados sensíveis (CPF, cartão, transferências)
- ✅ Proteções OWASP API Security Top 10 (2023)
- ✅ Depósito, transferência e reversão de transações
- ✅ Rollback automático de transações em caso de falha
- ✅ Validação de saldo antes de transferências
- ✅ Dashboard com KPIs financeiros em tempo real
- ✅ Rate limiting rigoroso (30 req/min geral, 10 req/min transações)
- ✅ Design fintech moderno com Tailwind CSS
- ✅ Modo claro/escuro com Redux
- ✅ Menu hambúrguer responsivo (100% mobile-friendly)
- ✅ Página inicial interativa com Login/Signup
- ✅ Arquitetura DDD + Hexagonal + CQRS + EDA
- ✅ Stack completa com Docker Compose
- ✅ RabbitMQ para processamento assíncrono com workers escaláveis
- ✅ Redis para idempotência e rate limiting
- ✅ Workers assíncronos para processamento de eventos financeiros
- ✅ Observabilidade com Prometheus e logs estruturados
- ✅ Health checks (/health, /health/readiness)
- ✅ Testes TDD (Jest) backend e frontend
- ✅ CI/CD configurado (GitHub Actions)
- ✅ Documentação completa com Swagger (inglês)

</details>

## Visão Geral

**PAYCODE** é uma plataforma fintech completa para carteiras digitais. Usuários podem cadastrar-se, autenticar-se, depositar dinheiro, transferir saldo entre usuários e reverter transações. Todas as operações financeiras possuem rollback automático em caso de falha.

## Requisitos Implementados

- ✅ **Cadastro**: `POST /auth/signup` cria usuário e wallet automática
- ✅ **Autenticação**: `POST /auth/login` com JWT + JWE
- ✅ **Depósito**: `POST /wallet/deposit` adiciona saldo (suporta saldo negativo)
- ✅ **Transferência**: `POST /wallet/transfer` valida saldo antes de transferir
- ✅ **Reversão**: `POST /wallet/transactions/:id/reverse` reverte transações
- ✅ **Validação de Saldo**: Verifica saldo suficiente antes de transferir
- ✅ **Rollback Automático**: Reverte operações em caso de falha

## Arquitetura

- **DDD + Hexagonal**: Separação Domain/Application/Infrastructure/Interfaces
- **CQRS**: Separação de leitura e escrita
- **EDA**: RabbitMQ para eventos financeiros assíncronos
- **Workers**: Processamento assíncrono escalável (2+ instâncias)
- **Idempotência**: Redis para garantir processamento único de eventos
- **Segurança**: JWT + JWE, JWKS, KMS, OWASP Top 10
- **Frontend**: Next.js App Router, Redux Toolkit, Tailwind CSS, React Query
- **Real-time**: WebSocket para notificações em tempo real

## Como Rodar

### Local (Docker Compose)

```bash
# Copiar arquivos .env (se não existirem)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Subir todos os serviços (API, Workers, Frontend, DB, Redis, RabbitMQ)
docker compose up -d --build

# Aplicar migrações
docker compose exec api npx prisma migrate deploy
docker compose exec api npx prisma generate

# Verificar logs
docker compose logs -f api worker
```

**Serviços disponíveis:**
- **API**: http://localhost:4000 (Swagger: `/doc`)
- **Frontend**: http://localhost:3000
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)
- **Health Check**: http://localhost:4000/health
- **Readiness Check**: http://localhost:4000/health/readiness

**Workers:**
- 2 instâncias de workers processando eventos financeiros
- Escalável via `docker compose up --scale worker=4`

### Testes

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test

# Via Docker
docker compose run --rm --profile test api-test
docker compose run --rm --profile test web-test
```

## Endpoints Principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/signup` | Criar conta |
| POST | `/auth/login` | Autenticar |
| GET | `/auth/profile` | Ver perfil |
| POST | `/auth/profile` | Atualizar perfil |
| DELETE | `/auth/account` | Deletar conta |
| POST | `/wallet/deposit` | Depositar |
| POST | `/wallet/transfer` | Transferir |
| POST | `/wallet/transactions/:id/reverse` | Reverter transação |
| GET | `/wallet/transactions` | Listar transações |
| GET | `/wallet/dashboard/kpis` | KPIs financeiros |

## Variáveis de Ambiente

### Backend (.env)
```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@db:5432/paycode
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWE_SECRET=your-256-bit-secret-key-must-be-32-chars-long!!
REDIS_URL=redis://redis:6379
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
RABBITMQ_PREFETCH=50
RABBITMQ_RETRY_MAX=5
RABBITMQ_BACKOFF_BASE_MS=1000
REDIS_PROCESSING_TTL_MS=3600000
REDIS_PROCESSED_TTL_MS=604800000
```

### Frontend (.env)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
NEXT_PUBLIC_COOKIE_NAME=paycode_session
NODE_ENV=development
```

## CI/CD

GitHub Actions executa:
- Lint (backend e frontend)
- Testes unitários (backend e frontend)
- Build (backend e frontend)
- Testes com serviços (PostgreSQL, Redis, RabbitMQ)

Workflow: `.github/workflows/ci.yml`

## Processamento Assíncrono

### RabbitMQ Queues

- `financial_events` - Eventos financeiros (transações, saldos)
- `audit.logs` - Logs de auditoria
- Cada queue possui DLQ (Dead Letter Queue) para mensagens falhadas

### Workers

- **FinancialEventsWorker**: Processa eventos financeiros
- **AuditWorker**: Processa logs de auditoria
- **Idempotência**: Redis garante processamento único
- **Retry**: Backoff exponencial com máximo de 5 tentativas
- **Escalabilidade**: Múltiplas instâncias via Docker Compose

### Eventos Publicados

- `transaction.created` - Transação criada
- `transaction.completed` - Transação completada
- `transaction.reversed` - Transação revertida
- `wallet.balance.updated` - Saldo atualizado

## Documentação

- **Swagger**: http://localhost:4000/doc
- **Business Rules**: `BUSINESS_RULES.md`
