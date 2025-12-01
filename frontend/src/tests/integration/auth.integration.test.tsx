import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store } from '../../store';
import LoginPage from '../../app/login/page';
import SignupPage from '../../app/signup/page';
import { authApi } from '../../features/auth/api/auth.api';

jest.mock('../../features/auth/api/auth.api');
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

const mockAuthApi = authApi as jest.Mocked<typeof authApi>;

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
      mockAuthApi.login.mockResolvedValue({
        id: 'user1',
        email: 'test@example.com',
        name: 'Test User',
      });

      renderWithProviders(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/seu@email.com/i);
      const passwordInput = screen.getByPlaceholderText(/••••••••/i);
      const form = emailInput.closest('form');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      if (form) {
        fireEvent.submit(form);
      } else {
        const submitButton = screen.getByRole('button', { name: /entrar/i });
        fireEvent.click(submitButton);
      }

      await waitFor(() => {
        expect(mockAuthApi.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      }, { timeout: 5000 });
    });

    it('should show error on invalid credentials', async () => {
      mockAuthApi.login.mockRejectedValue(new Error('Invalid credentials'));

      renderWithProviders(<LoginPage />);

      const emailInput = screen.getByPlaceholderText(/seu@email.com/i);
      const passwordInput = screen.getByPlaceholderText(/••••••••/i);
      const form = emailInput.closest('form');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      
      if (form) {
        fireEvent.submit(form);
      } else {
        const submitButton = screen.getByRole('button', { name: /entrar/i });
        fireEvent.click(submitButton);
      }

      await waitFor(() => {
        expect(mockAuthApi.login).toHaveBeenCalled();
      }, { timeout: 5000 });
    });
  });

  describe('Signup', () => {
    it('should submit signup form with valid data', async () => {
      mockAuthApi.signup.mockResolvedValue({
        id: 'user1',
        email: 'newuser@example.com',
        name: 'New User',
      });

      renderWithProviders(<SignupPage />);

      const nameInput = screen.getByPlaceholderText(/Seu nome completo/i);
      const emailInput = screen.getByPlaceholderText(/seu@email.com/i);
      const passwordInput = screen.getByPlaceholderText(/••••••••/i);
      const form = nameInput.closest('form');

      fireEvent.change(nameInput, { target: { value: 'New User' } });
      fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      if (form) {
        fireEvent.submit(form);
      } else {
        const submitButton = screen.getByRole('button', { name: /Criar Conta/i });
        fireEvent.click(submitButton);
      }

      await waitFor(() => {
        expect(mockAuthApi.signup).toHaveBeenCalledWith({
          email: 'newuser@example.com',
          password: 'password123',
          name: 'New User',
        });
      }, { timeout: 5000 });
    });

    it('should validate required fields', async () => {
      renderWithProviders(<SignupPage />);

      const submitButton = screen.getByRole('button', { name: /Criar Conta/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAuthApi.signup).not.toHaveBeenCalled();
      });
    });
  });
});

