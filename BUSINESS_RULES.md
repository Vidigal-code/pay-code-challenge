# Regras de Negócio - PAYCODE Fintech Platform

Este documento descreve todas as regras de negócio implementadas no sistema PAYCODE, uma plataforma fintech para carteiras digitais.

---

## 1. REGRAS DE USUÁRIO E AUTENTICAÇÃO

### 1.1. Cadastro (Signup)
- ✅ Email deve ser único no sistema (`EMAIL_ALREADY_USED`)
- ✅ Senha deve ter no mínimo 8 caracteres
- ✅ Email é normalizado: `trim().toLowerCase()`
- ✅ Senha é hasheada com bcrypt (custo 10)
- ✅ **Wallet é criada automaticamente** com saldo zero ao cadastrar
- ✅ JWT/JWE token é gerado e armazenado em cookie httpOnly

### 1.2. Autenticação
- ✅ JWT + JWE (JSON Web Encryption) para segurança avançada
- ✅ Token armazenado em cookie httpOnly (mitiga XSS)
- ✅ Cookie com SameSite=Lax e secure em produção
- ✅ Sessão expira conforme configuração (padrão: 7 dias)
- ✅ Logout limpa cookie e encerra sessão

### 1.3. Perfil do Usuário
- ✅ Atualização de nome: livre (sem validação especial)
- ✅ Atualização de email: requer `currentPassword`
- ✅ Atualização de senha: requer `currentPassword` e `newPassword`
- ✅ Validação: email único no sistema (`EMAIL_ALREADY_IN_USE`)
- ✅ Validação: senha atual deve estar correta (`INVALID_CURRENT_PASSWORD`)

### 1.4. Segurança Avançada
- ✅ **JWT + JWE (JSON Web Encryption)**: Payload criptografado além de assinado
- ✅ **JWKS (JSON Web Key Set)**: Rotação automática de chaves a cada 24 horas
  - Endpoint: `GET /.well-known/jwks.json`
  - Mantém até 3 chaves ativas para rotação gradual
- ✅ **KMS (Key Management Service)**: Gerenciamento seguro de chaves
  - Simulado para desenvolvimento local
  - Pronto para integração com AWS KMS ou GCP KMS em produção
- ✅ **JWE para Dados Sensíveis**: CPF, cartão de crédito e transferências criptografados
  - Tokens expiram em 1 hora
  - Usa KMS para gerenciamento de chaves
- ✅ **OWASP API Security**: Proteções contra todas as vulnerabilidades principais
- ✅ **Rate Limiting Rigoroso**: 
  - Geral: 30 requisições por minuto
  - Transações financeiras: 10 requisições por minuto
- ✅ **Helmet**: Headers de segurança HTTP
- ✅ **CORS Restrito**: Apenas origens permitidas
- ✅ **TLS**: HTTPS obrigatório em produção
- ✅ **Validação de Input**: Class-validator em todos os DTOs
- ✅ **Logs Estruturados**: Pino para auditoria e debugging

---

## 2. REGRAS DE WALLET (CARTEIRA)

### 2.1. Criação de Wallet
- ✅ **Automática**: Wallet é criada automaticamente no signup
- ✅ **Saldo Inicial**: Sempre zero (0.00)
- ✅ **Única por Usuário**: Um usuário possui apenas uma wallet
- ✅ **Validação**: Não pode criar wallet duplicada (`WALLET_ALREADY_EXISTS`)

### 2.2. Saldo da Wallet
- ✅ **Tipo Decimal**: Saldo armazenado como DECIMAL(19,2) no banco
- ✅ **Precisão**: Suporta valores até 999.999.999.999.999.99
- ✅ **Negativo Permitido**: Saldo pode ficar negativo (em casos de reversão)
- ✅ **Depósito em Saldo Negativo**: Se saldo estiver negativo, depósito adiciona ao valor atual

### 2.3. Consulta de Wallet
- ✅ Endpoint: `GET /wallet`
- ✅ Retorna: id, userId, balance, createdAt, updatedAt
- ✅ Requer autenticação (JWT/JWE)

---

## 3. REGRAS DE DEPÓSITO

### 3.1. Validações
- ✅ **Valor Mínimo**: Amount deve ser maior que 0 (`INVALID_AMOUNT`)
- ✅ **Usuário Deve Existir**: Validação de usuário autenticado
- ✅ **Wallet Automática**: Se wallet não existir, cria automaticamente

### 3.2. Processamento
- ✅ **Transação Criada**: Status inicial `PENDING`
- ✅ **Atualização de Saldo**: 
  - Se saldo negativo: depósito adiciona ao valor atual
  - Se saldo positivo: depósito adiciona normalmente
- ✅ **Status Final**: `COMPLETED` se sucesso, `FAILED` se erro
- ✅ **Rollback Automático**: Se falhar, reverte saldo ao valor anterior

### 3.3. Rollback de Depósito
- ✅ **Salva Estado Anterior**: Armazena saldo antes da operação
- ✅ **Em Caso de Falha**: Reverte saldo ao valor anterior
- ✅ **Transação Marcada**: Status muda para `FAILED`
- ✅ **Log de Erro**: Erro de rollback é logado mas não interrompe o fluxo

### 3.4. Exemplo
```
Saldo anterior: -50.00
Depósito: 100.00
Saldo após: 50.00

Se falhar:
Rollback para: -50.00
Status: FAILED
```

---

## 4. REGRAS DE TRANSFERÊNCIA

### 4.1. Validações
- ✅ **Valor Mínimo**: Amount deve ser maior que 0 (`INVALID_AMOUNT`)
- ✅ **Saldo Suficiente**: Remetente deve ter saldo suficiente (`INSUFFICIENT_BALANCE`)
- ✅ **Não Pode Transferir para Si Mesmo**: `CANNOT_TRANSFER_TO_SELF`
- ✅ **Remetente Deve Existir**: Validação de usuário autenticado
- ✅ **Destinatário Deve Existir**: `RECEIVER_NOT_FOUND`

### 4.2. Processamento
- ✅ **Transação Criada**: Status inicial `PENDING` para remetente
- ✅ **Atualização de Saldos**:
  - Remetente: subtrai amount
  - Destinatário: adiciona amount
- ✅ **Transação de Recebimento**: Cria transação para destinatário com status `COMPLETED`
- ✅ **Status Final**: `COMPLETED` se sucesso, `FAILED` se erro
- ✅ **Rollback Automático**: Se falhar, reverte ambos os saldos

### 4.3. Rollback de Transferência
- ✅ **Salva Estados Anteriores**: Armazena saldos de remetente e destinatário
- ✅ **Em Caso de Falha**: 
  - Reverte saldo do remetente ao valor anterior
  - Reverte saldo do destinatário ao valor anterior
  - Marca transação de recebimento como `FAILED` (se foi criada)
- ✅ **Transação Marcada**: Status muda para `FAILED`
- ✅ **Log de Erro**: Erro de rollback é logado mas não interrompe o fluxo

### 4.4. Exemplo
```
Remetente saldo anterior: 100.00
Destinatário saldo anterior: 50.00
Transferência: 30.00

Após sucesso:
Remetente: 70.00
Destinatário: 80.00

Se falhar:
Rollback:
Remetente: 100.00
Destinatário: 50.00
Status: FAILED
```

---

## 5. REGRAS DE REVERSÃO DE TRANSAÇÃO

### 5.1. Validações
- ✅ **Transação Deve Existir**: `TRANSACTION_NOT_FOUND`
- ✅ **Status Deve Ser COMPLETED**: Apenas transações completas podem ser revertidas (`TRANSACTION_CANNOT_BE_REVERSED`)
- ✅ **Tipo Válido**: Apenas `DEPOSIT` e `TRANSFER` podem ser revertidas
- ✅ **Não Pode Reverter Reversão**: Transações do tipo `REVERSAL` não podem ser revertidas
- ✅ **Não Pode Reverter Já Revertida**: Se `originalTransactionId` existe, não pode reverter novamente

### 5.2. Reversão de Depósito
- ✅ **Cria Transação de Reversão**: Tipo `REVERSAL`, status `PENDING`
- ✅ **Subtrai do Saldo**: Remove o valor do depósito original
- ✅ **Validação de Saldo**: Se não tiver saldo suficiente, ainda subtrai (pode ficar negativo)
- ✅ **Status Final**: Transação original vira `REVERSED`, reversão vira `COMPLETED`

### 5.3. Reversão de Transferência
- ✅ **Cria Transação de Reversão**: Tipo `REVERSAL`, status `PENDING`
- ✅ **Devolve ao Remetente**: Adiciona valor ao saldo do remetente original
- ✅ **Subtrai do Destinatário**: Remove valor do saldo do destinatário original
- ✅ **Validação de Saldo**: Se destinatário não tiver saldo suficiente, ainda subtrai (pode ficar negativo)
- ✅ **Status Final**: Transação original vira `REVERSED`, reversão vira `COMPLETED`

### 5.4. Exemplo de Reversão de Depósito
```
Depósito original: 100.00
Saldo após depósito: 150.00

Reversão:
Saldo após reversão: 50.00
Transação original: REVERSED
Transação de reversão: COMPLETED
```

### 5.5. Exemplo de Reversão de Transferência
```
Transferência original: 50.00
Remetente após transferência: 50.00
Destinatário após transferência: 100.00

Reversão:
Remetente após reversão: 100.00
Destinatário após reversão: 50.00
Transação original: REVERSED
Transação de reversão: COMPLETED
```

---

## 6. REGRAS DE TRANSAÇÕES

### 6.1. Tipos de Transação
- ✅ **DEPOSIT**: Depósito de dinheiro na wallet
- ✅ **TRANSFER**: Transferência entre usuários
- ✅ **REVERSAL**: Reversão de uma transação anterior

### 6.2. Status de Transação
- ✅ **PENDING**: Transação criada, aguardando processamento
- ✅ **COMPLETED**: Transação processada com sucesso
- ✅ **REVERSED**: Transação foi revertida
- ✅ **FAILED**: Transação falhou (com rollback automático)

### 6.3. Campos da Transação
- ✅ **id**: Identificador único
- ✅ **walletId**: ID da wallet relacionada
- ✅ **senderId**: ID do remetente (opcional, apenas para TRANSFER)
- ✅ **receiverId**: ID do destinatário (opcional, apenas para TRANSFER)
- ✅ **type**: Tipo da transação (DEPOSIT, TRANSFER, REVERSAL)
- ✅ **status**: Status atual (PENDING, COMPLETED, REVERSED, FAILED)
- ✅ **amount**: Valor da transação (DECIMAL(19,2))
- ✅ **description**: Descrição opcional
- ✅ **originalTransactionId**: ID da transação original (apenas para REVERSAL)
- ✅ **reversedById**: ID do usuário que reverteu (apenas para REVERSED)
- ✅ **reversedAt**: Data/hora da reversão (apenas para REVERSED)
- ✅ **createdAt**: Data/hora de criação
- ✅ **updatedAt**: Data/hora de atualização

### 6.4. Listagem de Transações
- ✅ **Paginação**: `page` e `pageSize` (padrão: 10)
- ✅ **Filtros**: Por tipo, status, data
- ✅ **Ordenação**: Por data de criação (mais recente primeiro)
- ✅ **Escopo**: Apenas transações do usuário autenticado (enviadas ou recebidas)

---

## 7. REGRAS DE DASHBOARD E KPIs

### 7.1. KPIs Disponíveis
- ✅ **totalBalance**: Saldo total da wallet
- ✅ **totalDeposits**: Total de depósitos (período)
- ✅ **totalTransfers**: Total enviado em transferências (período)
- ✅ **totalReceived**: Total recebido em transferências (período)
- ✅ **totalTransactions**: Total de transações (período)
- ✅ **completedTransactions**: Transações completadas (período)
- ✅ **failedTransactions**: Transações falhadas (período)
- ✅ **reversedTransactions**: Transações revertidas (período)

### 7.2. Filtros de Período
- ✅ **startDate**: Data inicial (opcional, padrão: últimos 30 dias)
- ✅ **endDate**: Data final (opcional, padrão: hoje)
- ✅ **Formato**: ISO 8601 (YYYY-MM-DD)

### 7.3. Cálculos
- ✅ **Depósitos**: Soma de transações tipo DEPOSIT com status COMPLETED
- ✅ **Transferências Enviadas**: Soma de transações tipo TRANSFER onde senderId = userId
- ✅ **Transferências Recebidas**: Soma de transações tipo TRANSFER onde receiverId = userId
- ✅ **Contadores**: Contagem por status e tipo

---

## 8. REGRAS DE SEGURANÇA FINANCEIRA

### 8.1. Rate Limiting
- ✅ **Geral**: 30 requisições por minuto por IP
- ✅ **Transações Financeiras**: 10 requisições por minuto por usuário
  - Endpoints: `/wallet/deposit`, `/wallet/transfer`
- ✅ **Mensagem de Erro**: "Transaction rate limit exceeded. Please wait before making another transaction."

### 8.2. Validações de Valor
- ✅ **Valor Mínimo**: 0.01 (um centavo)
- ✅ **Valor Máximo**: 999.999.999.999.999.99 (limite do DECIMAL)
- ✅ **Precisão**: 2 casas decimais
- ✅ **Formato**: Número positivo

### 8.3. Validações de Saldo
- ✅ **Transferência**: Valida saldo suficiente antes de processar
- ✅ **Depósito**: Não requer validação de saldo (sempre permitido)
- ✅ **Reversão**: Pode deixar saldo negativo se necessário

### 8.4. Auditoria
- ✅ **Todas as Transações São Registradas**: Nenhuma operação financeira é silenciosa
- ✅ **Status Rastreável**: Cada transação tem status claro
- ✅ **Timestamps**: Todas as operações têm createdAt e updatedAt
- ✅ **Logs Estruturados**: Pino para auditoria completa

---

## 9. REGRAS DE ROLLBACK E CONSISTÊNCIA

### 9.1. Princípio de Rollback
- ✅ **Sempre Reverter em Caso de Falha**: Qualquer erro durante processamento reverte mudanças
- ✅ **Salvar Estado Anterior**: Antes de qualquer modificação, salva estado atual
- ✅ **Transação Atômica**: Operações financeiras são atômicas (tudo ou nada)

### 9.2. Cenários de Rollback
- ✅ **Falha na Atualização de Saldo**: Reverte ao valor anterior
- ✅ **Falha na Criação de Transação**: Reverte saldo (se foi atualizado)
- ✅ **Falha na Validação**: Não atualiza saldo, apenas marca transação como FAILED
- ✅ **Erro de Sistema**: Rollback automático em qualquer exceção

### 9.3. Garantias de Consistência
- ✅ **Saldo Sempre Consistente**: Não há saldo "fantasma" ou inconsistente
- ✅ **Transações Sempre Rastreáveis**: Todas as operações têm registro
- ✅ **Status Sempre Atualizado**: Status reflete o estado real da transação

---

## 10. REGRAS DE VALIDAÇÃO E ERROS

### 10.1. Códigos de Erro
- ✅ **INVALID_AMOUNT**: Valor inválido (<= 0)
- ✅ **INSUFFICIENT_BALANCE**: Saldo insuficiente para transferência
- ✅ **WALLET_NOT_FOUND**: Wallet não encontrada
- ✅ **WALLET_ALREADY_EXISTS**: Tentativa de criar wallet duplicada
- ✅ **TRANSACTION_NOT_FOUND**: Transação não encontrada
- ✅ **TRANSACTION_CANNOT_BE_REVERSED**: Transação não pode ser revertida
- ✅ **RECEIVER_NOT_FOUND**: Destinatário não encontrado
- ✅ **CANNOT_TRANSFER_TO_SELF**: Não pode transferir para si mesmo
- ✅ **USER_NOT_FOUND**: Usuário não encontrado

### 10.2. Validações de Input
- ✅ **Class-validator**: Validação automática em todos os DTOs
- ✅ **Sanitização**: Inputs são sanitizados antes de processar
- ✅ **Type Safety**: TypeScript garante tipos corretos

---

## 11. REGRAS DE PERFORMANCE E ESCALABILIDADE

### 11.1. Índices do Banco de Dados
- ✅ **Wallet**: Índice em `userId` (único)
- ✅ **Transaction**: Índices em `walletId`, `senderId`, `receiverId`, `type`, `status`, `createdAt`, `originalTransactionId`

### 11.2. Paginação
- ✅ **Padrão**: 10 itens por página
- ✅ **Máximo**: 50 itens por página
- ✅ **Otimização**: Queries otimizadas com LIMIT e OFFSET

### 11.3. Cache
- ✅ **Redis**: Rate limiting e cache de sessões
- ✅ **React Query**: Cache no frontend para melhor UX

---

## RESUMO DAS REGRAS CRÍTICAS

1. ✅ **Wallet criada automaticamente no signup**
2. ✅ **Rollback automático em caso de falha**
3. ✅ **Saldo pode ficar negativo (em reversões)**
4. ✅ **Depósito adiciona mesmo se saldo negativo**
5. ✅ **Transferência valida saldo antes de processar**
6. ✅ **Apenas transações COMPLETED podem ser revertidas**
7. ✅ **Rate limiting rigoroso para transações financeiras**
8. ✅ **JWT + JWE para segurança avançada**
9. ✅ **Todas as transações são rastreáveis e auditáveis**
10. ✅ **Consistência garantida com rollback automático**

---

## PADRÕES DE SEGURANÇA FINANCIAL

### Nível de Segurança: Enterprise Fintech
- ✅ **JWT + JWE**: Criptografia de payload além de assinatura
- ✅ **JWKS**: Rotação automática de chaves (24 horas)
- ✅ **KMS**: Gerenciamento seguro de chaves (AWS/GCP ready)
- ✅ **JWE para Dados Sensíveis**: CPF, cartão, transferências criptografados
- ✅ **OWASP API Security**: Proteções contra todas as vulnerabilidades principais
- ✅ **Rate Limiting**: Proteção contra abuso e ataques
- ✅ **Validações Rigorosas**: Múltiplas camadas de validação
- ✅ **Rollback Automático**: Garantia de consistência
- ✅ **Auditoria Completa**: Logs estruturados e rastreabilidade
- ✅ **HTTPS/TLS Obrigatório**: Em produção
- ✅ **Cookies Seguros**: httpOnly, SameSite, Secure
- ✅ **Helmet**: Headers de segurança HTTP
- ✅ **CORS Restrito**: Apenas origens permitidas

---

## INTERFACE E EXPERIÊNCIA DO USUÁRIO

### Design Fintech Moderno
- ✅ **Tailwind CSS**: Design system moderno e responsivo
- ✅ **Modo Claro/Escuro**: Toggle com Redux, persistido em localStorage
- ✅ **100% Responsivo**: Menu hambúrguer para mobile, breakpoints otimizados
- ✅ **React Icons**: Biblioteca de ícones moderna (react-icons)
- ✅ **Gradientes Modernos**: Design visual atraente com gradientes
- ✅ **Animações Suaves**: Transições e hover effects

### Página Inicial
- ✅ **Landing Page Interativa**: Mensagem "Seja bem-vindo a PAYCODE"
- ✅ **CTAs Destacados**: Botões para Login e Signup
- ✅ **Features Grid**: Cards com funcionalidades principais
- ✅ **Stats Section**: Estatísticas visuais (100% Seguro, 24/7, etc.)
- ✅ **Redirecionamento Inteligente**: Se autenticado, redireciona para /wallet

### Navegação
- ✅ **Navbar Responsivo**: Menu hambúrguer para mobile
- ✅ **Logo PAYCODE**: Identidade visual com gradiente
- ✅ **Menu Contextual**: Diferentes opções para autenticado/não autenticado
- ✅ **Toggle de Tema**: Botão para alternar modo claro/escuro
- ✅ **Logout**: Funcionalidade completa com limpeza de cookie

---

---

## 12. TESTES E QUALIDADE

### 12.1. Testes Unitários
- ✅ **Backend**: Testes para Use Cases (deposit, transfer, reverse, signup)
- ✅ **Frontend**: Testes para componentes (Navbar, HomePage)
- ✅ **Cobertura**: Testes críticos de regras de negócio

### 12.2. Testes de Integração
- ✅ **Backend**: Testes E2E para fluxos completos (auth, wallet)
- ✅ **Frontend**: Testes de integração de componentes com API
- ✅ **Cenários**: Cadastro → Login → Depósito → Transferência → Reversão

### 12.3. Qualidade de Código
- ✅ **TypeScript**: Tipagem estrita
- ✅ **ESLint**: Linting configurado
- ✅ **Prettier**: Formatação automática
- ✅ **SOLID**: Princípios aplicados
- ✅ **Clean Code**: Código limpo e legível

---

**Última atualização**: 2024-12-14
