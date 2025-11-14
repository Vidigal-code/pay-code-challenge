import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store } from '../../store';
import LoginPage from '../../app/login/page';
import SignupPage from '../../app/signup/page';
import { http } from '../../lib/http';

jest.mock('../../lib/http');
jest.mock('../../hooks/useToast', () => ({
  useToast: () => ({
    show: jest.fn(),
  }),
}));
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const mockHttp = http as jest.Mocked<typeof http>;

describe('Auth Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {component}
        </QueryClientProvider>
      </Provider>
    );
  };

  describe('Login', () => {
    it('should submit login form with valid credentials', async () => {
      mockHttp.post.mockResolvedValue({
        data: {
          id: 'user1',
          email: 'test@example.com',
          name: 'Test User',
        },
      });

      renderWithProviders(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/seu@email.com/i);
      const passwordInput = screen.getByPlaceholderText(/••••••••/i);
      const submitButton = screen.getByRole('button', { name: /entrar/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockHttp.post).toHaveBeenCalledWith('/auth/login', {
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('should show error on invalid credentials', async () => {
      mockHttp.post.mockRejectedValue({
        response: {
          data: {
            code: 'INVALID_CREDENTIALS',
            message: 'Credenciais inválidas',
          },
        },
      });

      renderWithProviders(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/seu@email.com/i);
      const passwordInput = screen.getByPlaceholderText(/••••••••/i);
      const submitButton = screen.getByRole('button', { name: /entrar/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockHttp.post).toHaveBeenCalled();
      });
    });
  });

  describe('Signup', () => {
    it('should submit signup form with valid data', async () => {
      mockHttp.post.mockResolvedValue({
        data: {
          id: 'user1',
          email: 'newuser@example.com',
          name: 'New User',
        },
      });

      renderWithProviders(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/Seu nome completo/i);
      const emailInput = screen.getByPlaceholderText(/seu@email.com/i);
      const passwordInput = screen.getByPlaceholderText(/••••••••/i);
      const submitButton = screen.getByRole('button', { name: /Criar Conta/i });

      fireEvent.change(nameInput, { target: { value: 'New User' } });
      fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockHttp.post).toHaveBeenCalledWith('/auth/signup', {
          email: 'newuser@example.com',
          password: 'password123',
          name: 'New User',
        });
      });
    });

    it('should validate required fields', async () => {
      renderWithProviders(<SignupPage />);

      const submitButton = screen.getByRole('button', { name: /Criar Conta/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockHttp.post).not.toHaveBeenCalled();
      });
    });
  });
});

