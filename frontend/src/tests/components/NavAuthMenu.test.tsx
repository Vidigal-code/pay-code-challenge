import React from "react";
import {render, screen, waitFor, act} from "@testing-library/react";
import {Provider} from "react-redux";
import {configureStore} from "@reduxjs/toolkit";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import NavAuthMenu from "../../components/NavAuthMenu";
import themeReducer from "../../store/slices/theme.slice";
import authReducer from "../../store/slices/authSlice";
import * as useAuthHook from "../../hooks/useAuth";

jest.mock("../../hooks/useAuth");
const mockUseAuth = useAuthHook.useAuth as jest.MockedFunction<typeof useAuthHook.useAuth>;

type ThemeState = ReturnType<typeof themeReducer>;

const createMockStore = (isAuthenticated: boolean = false) => {
    return configureStore({
        reducer: {
            theme: themeReducer,
            auth: authReducer,
        },
        preloadedState: {
            theme: {
                theme: "light",
            } as ThemeState,
            auth: {
                isAuthenticated,
            },
        },
    });
};

const createQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
    },
});

const renderWithProviders = (component: React.ReactElement, store: ReturnType<typeof createMockStore>, client?: QueryClient) => {
    const queryClient = client ?? createQueryClient();
    return render(
        <Provider store={store}>
            <QueryClientProvider client={queryClient}>
                {component}
            </QueryClientProvider>
        </Provider>,
    );
};

describe("NavAuthMenu", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        Object.defineProperty(document, "cookie", {
            writable: true,
            value: "",
        });
    });

    it("should show login and signup when not authenticated", async () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: false,
            login: jest.fn(),
            signup: jest.fn(),
            logout: jest.fn(),
            setAuthenticated: jest.fn(),
        });

        const store = createMockStore(false);
        renderWithProviders(<NavAuthMenu initialAuth={false} />, store);

        await waitFor(() => {
            expect(screen.getByText("Entrar")).toBeInTheDocument();
            expect(screen.getByText(/Registrar/i)).toBeInTheDocument();
        });
    });

    it("should show dashboard, wallet, profile and logout when authenticated", async () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            login: jest.fn(),
            signup: jest.fn(),
            logout: jest.fn(),
            setAuthenticated: jest.fn(),
        });

        Object.defineProperty(document, "cookie", {
            writable: true,
            value: "paycode_session=test-token",
        });

        const store = createMockStore(true);
        renderWithProviders(<NavAuthMenu initialAuth={true} />, store);

        await waitFor(() => {
            expect(screen.getByText("Dashboard")).toBeInTheDocument();
            expect(screen.getByText("Carteira")).toBeInTheDocument();
            expect(screen.getByText("Perfil")).toBeInTheDocument();
            expect(screen.getByText("Sair")).toBeInTheDocument();
        });
    });

    it("should call logout when logout button is clicked", async () => {
        const mockLogout = jest.fn();
        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            login: jest.fn(),
            signup: jest.fn(),
            logout: mockLogout,
            setAuthenticated: jest.fn(),
        });

        Object.defineProperty(document, "cookie", {
            writable: true,
            value: "paycode_session=test-token",
        });

        const store = createMockStore(true);
        renderWithProviders(<NavAuthMenu initialAuth={true} />, store);

        await waitFor(() => {
            const logoutButton = screen.getByText("Sair");
            expect(logoutButton).toBeInTheDocument();
            logoutButton.click();
        });

        await waitFor(() => {
            expect(mockLogout).toHaveBeenCalled();
        });
    });

    it("should update when authentication state changes", async () => {
        mockUseAuth.mockReturnValue({
            isAuthenticated: false,
            login: jest.fn(),
            signup: jest.fn(),
            logout: jest.fn(),
            setAuthenticated: jest.fn(),
        });

        const store = createMockStore(false);
        const queryClient = createQueryClient();
        const {rerender} = renderWithProviders(<NavAuthMenu initialAuth={false} />, store, queryClient);

        await waitFor(() => {
            expect(screen.getByText("Entrar")).toBeInTheDocument();
        });

        await act(async () => {
            store.dispatch({type: "auth/setAuthenticated", payload: true});
            Object.defineProperty(document, "cookie", {
                writable: true,
                value: "paycode_session=test-token",
            });
        });

        mockUseAuth.mockReturnValue({
            isAuthenticated: true,
            login: jest.fn(),
            signup: jest.fn(),
            logout: jest.fn(),
            setAuthenticated: jest.fn(),
        });

        await act(async () => {
            rerender(
                <Provider store={store}>
                    <QueryClientProvider client={queryClient}>
                        <NavAuthMenu initialAuth={true} />
                    </QueryClientProvider>
                </Provider>,
            );
        });

        await waitFor(() => {
            expect(screen.getByText("Dashboard")).toBeInTheDocument();
        }, {timeout: 2000});
    });
});

