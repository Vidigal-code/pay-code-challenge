import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store } from '../../store';
import WalletPage from '../../app/wallet/page';
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

const isDocker = process.env.DOCKER_ENV === 'true' || process.env.CI === 'true';
const API_URL = isDocker ? 'http://api:4000' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000');

describe('Wallet Integration Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockHttp.get.mockImplementation((url: string) => {
      if (url === '/wallet') {
        return Promise.resolve({
          data: { wallet: { id: '1', userId: 'user1', balance: 100 } },
        });
      }
      if (url === '/wallet/transactions') {
        return Promise.resolve({
          data: {
            transactions: [],
            total: 0,
            page: 1,
            pageSize: 10,
          },
        });
      }
      if (url === '/wallet/dashboard/kpis') {
        return Promise.resolve({
          data: {
            kpis: {
              totalBalance: 100,
              totalDeposits: 100,
              totalTransfers: 0,
              totalReceived: 0,
              totalTransactions: 0,
              completedTransactions: 0,
              failedTransactions: 0,
              reversedTransactions: 0,
            },
          },
        });
      }
      if (url === '/auth/profile') {
        return Promise.resolve({
          data: { id: 'user1', name: 'Test User', email: 'user1@example.com' },
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    mockHttp.post.mockImplementation((url: string, data?: any) => {
      if (url === '/wallet/deposit') {
        return Promise.resolve({
          data: {
            transaction: { id: 'tx1', type: 'DEPOSIT', status: 'COMPLETED', amount: data.amount },
            wallet: { id: '1', balance: 100 + data.amount },
          },
        });
      }
      if (url === '/wallet/transfer') {
        return Promise.resolve({
          data: {
            transaction: { id: 'tx2', type: 'TRANSFER', status: 'COMPLETED', amount: data.amount },
            senderWallet: { id: '1', balance: 100 - data.amount },
            receiverWallet: { id: '2', balance: data.amount },
          },
        });
      }
      return Promise.reject(new Error('Not found'));
    });
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

  it('should display wallet balance', async () => {
    renderWithProviders(<WalletPage />);

    await waitFor(() => {
      expect(screen.getByText(/Carteira PAYCODE/i)).toBeInTheDocument();
    });
  });

  it('should open deposit modal and submit deposit', async () => {
    renderWithProviders(<WalletPage />);

    await waitFor(() => {
      expect(screen.getByText(/Depositar/i)).toBeInTheDocument();
    });

    const depositButton = screen.getByText(/Depositar/i);
    fireEvent.click(depositButton);

    await waitFor(() => {
      expect(screen.getByText(/Depositar Dinheiro/i)).toBeInTheDocument();
    });

    const depositModal = screen.getByText(/Depositar Dinheiro/i).closest('div') as HTMLElement;
    const amountInput = within(depositModal).getByLabelText(/Valor/i);
    fireEvent.change(amountInput, { target: { value: '50' } });

    const submitButton = within(depositModal).getByRole('button', { name: /Depositar/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockHttp.post).toHaveBeenCalledWith('/wallet/deposit', {
        amount: 50,
        description: undefined,
      });
    });
  });

  it('should open transfer modal and submit transfer', async () => {
    renderWithProviders(<WalletPage />);

    await waitFor(() => {
      expect(screen.getByText(/Transferir/i)).toBeInTheDocument();
    });

    const transferButton = screen.getByText(/Transferir/i);
    fireEvent.click(transferButton);

    await waitFor(() => {
      expect(screen.getByText(/Transferir Dinheiro/i)).toBeInTheDocument();
    });

    const transferModal = screen.getByText(/Transferir Dinheiro/i).closest('div') as HTMLElement;
    const receiverInput = within(transferModal).getByLabelText(/ID ou Email do Destinatário/i);
    const amountInput = within(transferModal).getByLabelText(/Valor/i);

    fireEvent.change(receiverInput, { target: { value: 'user2' } });
    fireEvent.change(amountInput, { target: { value: '25' } });

    const submitButton = within(transferModal).getByRole('button', { name: /Transferir/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockHttp.post).toHaveBeenCalledWith('/wallet/transfer', {
        receiverId: 'user2',
        amount: 25,
        description: undefined,
      });
    });
  });

  it('should validate deposit amount', async () => {
    renderWithProviders(<WalletPage />);

    await waitFor(() => {
      expect(screen.getByText(/Depositar/i)).toBeInTheDocument();
    });

    const depositButton = screen.getByText(/Depositar/i);
    fireEvent.click(depositButton);

    await waitFor(() => {
      expect(screen.getByText(/Depositar Dinheiro/i)).toBeInTheDocument();
    });

    const depositModal = screen.getByText(/Depositar Dinheiro/i).closest('div') as HTMLElement;
    const amountInput = within(depositModal).getByLabelText(/Valor/i);
    fireEvent.change(amountInput, { target: { value: '-10' } });

    const submitButton = within(depositModal).getByRole('button', { name: /Depositar/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockHttp.post).not.toHaveBeenCalled();
    });
  });

  it('should validate transfer receiver ID', async () => {
    renderWithProviders(<WalletPage />);

    await waitFor(() => {
      expect(screen.getByText(/Transferir/i)).toBeInTheDocument();
    });

    const transferButton = screen.getByText(/Transferir/i);
    fireEvent.click(transferButton);

    await waitFor(() => {
      expect(screen.getByText(/Transferir Dinheiro/i)).toBeInTheDocument();
    });

    const transferModal = screen.getByText(/Transferir Dinheiro/i).closest('div') as HTMLElement;
    const amountInput = within(transferModal).getByLabelText(/Valor/i);
    fireEvent.change(amountInput, { target: { value: '25' } });

    const submitButton = within(transferModal).getByRole('button', { name: /Transferir/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockHttp.post).not.toHaveBeenCalled();
    });
  });
});

