/**
 * EN - Frontend Test Fixes Documentation
 * 
 * This document describes the fixes applied to resolve TDD (Test-Driven Development) 
 * issues in the frontend tests.
 * 
 * PT - Documentação de Correções de Testes do Frontend
 * 
 * Este documento descreve as correções aplicadas para resolver problemas de TDD 
 * (Desenvolvimento Orientado por Testes) nos testes do frontend.
 */

## Issues Fixed / Problemas Corrigidos

### 1. Module Resolution for Path Aliases (@/)
**EN:** Jest was unable to resolve `@/` path aliases configured in `tsconfig.json`, causing "Cannot find module" errors.

**PT:** O Jest não conseguia resolver os aliases de caminho `@/` configurados no `tsconfig.json`, causando erros "Cannot find module".

**Fix / Correção:**
- Added `moduleNameMapper` to `frontend/jest.config.ts` to map `@/` aliases to `src/` directory
- This allows Jest to resolve imports like `@/features/auth/model/use-auth`

**Files Modified:**
- `frontend/jest.config.ts`

---

### 2. Theme Reducer Type Mismatch in NavAuthMenu Test
**EN:** TypeScript type error when creating mock Redux store with `themeReducer` - the reducer type didn't match the expected store state type.

**PT:** Erro de tipo TypeScript ao criar mock do Redux store com `themeReducer` - o tipo do reducer não correspondia ao tipo esperado do estado da store.

**Fix / Correção:**
- Added explicit type assertions in `frontend/src/tests/components/NavAuthMenu.test.tsx`
- Cast `themeReducer` and `initialTheme` to their correct types in `createMockStore`

**Files Modified:**
- `frontend/src/tests/components/NavAuthMenu.test.tsx`

---

### 3. HTMLElement Type Issue in Wallet Integration Test
**EN:** TypeScript error when trying to access `type` property on `HTMLElement` when finding submit button. Also, incorrect label text for receiver ID input.

**PT:** Erro TypeScript ao tentar acessar propriedade `type` em `HTMLElement` ao encontrar botão de submit. Também, texto de label incorreto para input de ID do destinatário.

**Fix / Correção:**
- Added type guard to ensure button is `HTMLButtonElement` before accessing `type` property
- Updated label text from "ID do Destinatário" to "ID ou Email do Destinatário" to match actual component

**Files Modified:**
- `frontend/src/tests/integration/wallet.integration.test.tsx`

---

### 4. Missing QueryClientProvider in Navbar Test
**EN:** `Navbar` component uses `useAuthStatus` hook which relies on `@tanstack/react-query`, but tests were not wrapped in `QueryClientProvider`, causing "No QueryClient set" error.

**PT:** O componente `Navbar` usa o hook `useAuthStatus` que depende de `@tanstack/react-query`, mas os testes não estavam envolvidos em `QueryClientProvider`, causando erro "No QueryClient set".

**Fix / Correção:**
- Created `createQueryClient` helper function
- Created `renderWithProviders` helper to wrap components with both Redux `Provider` and `QueryClientProvider`
- Updated all test render calls to use `renderWithProviders`

**Files Modified:**
- `frontend/src/tests/components/Navbar.test.tsx`

---

### 5. Incorrect API Mocking in Auth Integration Tests
**EN:** Tests were mocking `http.post` directly, but `LoginPage` and `SignupPage` components use `useAuth` hook which calls `authApi.login` and `authApi.signup` instead.

**PT:** Os testes estavam mockando `http.post` diretamente, mas os componentes `LoginPage` e `SignupPage` usam o hook `useAuth` que chama `authApi.login` e `authApi.signup` ao invés disso.

**Fix / Correção:**
- Changed mock from `jest.mock('../../lib/http')` to `jest.mock('../../features/auth/api/auth.api')`
- Updated all mock calls to use `mockAuthApi.login` and `mockAuthApi.signup`
- Changed form submission to use `fireEvent.submit(form)` instead of clicking button

**Files Modified:**
- `frontend/src/tests/integration/auth.integration.test.tsx`

---

### 6. Styled-JSX JSX Attribute Warning
**EN:** Warning "Received `true` for a non-boolean attribute `jsx`" appearing in test console output.

**PT:** Aviso "Received `true` for a non-boolean attribute `jsx`" aparecendo na saída do console dos testes.

**Fix / Correção:**
- Removed `jsx={true}` from `<style jsx>` tag in `frontend/src/app/page.tsx` (it's implicit)
- Added console error suppression in `frontend/jest.setup.ts` for this specific warning

**Files Modified:**
- `frontend/src/app/page.tsx`
- `frontend/jest.setup.ts`

---

## Summary / Resumo

**EN:** All frontend tests should now pass. The main changes were:
1. Configuring Jest to resolve path aliases
2. Fixing TypeScript type issues in test mocks
3. Adding QueryClientProvider for React Query hooks
4. Correcting API mocking strategy
5. Suppressing styled-jsx warnings in test environment

**PT:** Todos os testes do frontend devem passar agora. As principais mudanças foram:
1. Configurar Jest para resolver aliases de caminho
2. Corrigir problemas de tipo TypeScript em mocks de teste
3. Adicionar QueryClientProvider para hooks do React Query
4. Corrigir estratégia de mock de API
5. Suprimir avisos do styled-jsx no ambiente de teste

## Testing / Testando

Run the tests with:
```bash
cd frontend
npm test
```

Execute os testes com:
```bash
cd frontend
npm test
```

