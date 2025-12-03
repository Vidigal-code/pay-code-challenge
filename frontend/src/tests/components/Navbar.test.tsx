import React from "react";
import {render, screen, fireEvent, waitFor, act} from "@testing-library/react";
import {Provider} from "react-redux";
import {configureStore} from "@reduxjs/toolkit";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import Navbar from "../../components/Navbar";
import themeReducer from "../../store/slices/theme.slice";
import authReducer from "../../store/slices/authSlice";
import {setAuthenticated} from "../../store/slices/authSlice";

type ThemeState = ReturnType<typeof themeReducer>;

const createMockStore = (initialTheme: "light" | "dark" = "light", isAuthenticated: boolean = false) => {
    return configureStore({
        reducer: {
            theme: themeReducer,
            auth: authReducer,
        },
        preloadedState: {
            theme: {
                theme: initialTheme,
            } as ThemeState,
            auth: {
                isAuthenticated,
            },
        },
    });
};

const createQueryClient = () => {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
};

const renderWithProviders = (component: React.ReactElement, store: ReturnType<typeof createMockStore>) => {
    const queryClient = createQueryClient();
    return render(
        <Provider store={store}>
            <QueryClientProvider client={queryClient}>
                {component}
            </QueryClientProvider>
        </Provider>
    );
};

describe("Navbar", () => {
    beforeEach(() => {
        Object.defineProperty(document, "cookie", {
            writable: true,
            value: "",
        });
    });

    it("should render PAYCODE logo", async () => {
        const store = createMockStore();
        renderWithProviders(<Navbar initialAuth={false} />, store);
        await waitFor(() => {
            expect(screen.getByText("PAYCODE")).toBeInTheDocument();
        });
    });

    it("should toggle theme when theme button is clicked", async () => {
        const store = createMockStore("light");
        renderWithProviders(<Navbar initialAuth={false} />, store);

        await waitFor(() => {
            const themeButton = screen.getByRole("button", {name: /Toggle theme/i});
            expect(themeButton).toBeInTheDocument();
            fireEvent.click(themeButton);
        });

        await waitFor(() => {
            expect(store.getState().theme.theme).toBe("dark");
        });
    });

    it("should show login and signup links when not authenticated", async () => {
        const store = createMockStore("light", false);
        renderWithProviders(<Navbar initialAuth={false} />, store);

        await waitFor(() => {
            expect(screen.getByText("Entrar")).toBeInTheDocument();
            expect(screen.getByText(/Registrar/i)).toBeInTheDocument();
        });
    });

    it("should show dashboard, wallet, profile when authenticated", async () => {
        const store = createMockStore("light", true);
        Object.defineProperty(document, "cookie", {
            writable: true,
            value: "paycode_session=test-token",
        });
        
        renderWithProviders(<Navbar initialAuth={true} />, store);

        await waitFor(() => {
            expect(screen.getByText("Dashboard")).toBeInTheDocument();
            expect(screen.getByText("Carteira")).toBeInTheDocument();
            expect(screen.getByText("Perfil")).toBeInTheDocument();
        });
    });

    it("should update when authentication state changes", async () => {
        Object.defineProperty(document, "cookie", {
            writable: true,
            value: "",
        });
        
        const store = createMockStore("light", false);
        const queryClient = createQueryClient();
        const {rerender} = render(
            <Provider store={store}>
                <QueryClientProvider client={queryClient}>
                    <Navbar initialAuth={false} />
                </QueryClientProvider>
            </Provider>,
        );

        await waitFor(() => {
            expect(screen.getByText("Entrar")).toBeInTheDocument();
        }, {timeout: 3000});

        await act(async () => {
            store.dispatch(setAuthenticated(true));
            Object.defineProperty(document, "cookie", {
                writable: true,
                value: "paycode_session=test-token",
            });
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new Event('auth-changed'));
            }
        });

        rerender(
            <Provider store={store}>
                <QueryClientProvider client={queryClient}>
                    <Navbar initialAuth={true} />
                </QueryClientProvider>
            </Provider>,
        );

        await waitFor(() => {
            expect(screen.getByText("Dashboard")).toBeInTheDocument();
        }, {timeout: 3000});
    });

    it("should be responsive with hamburger menu on mobile", async () => {
        Object.defineProperty(document, "cookie", {
            writable: true,
            value: "",
        });
        
        const store = createMockStore("light", false);
        renderWithProviders(<Navbar initialAuth={false} />, store);

        await waitFor(() => {
            const hamburgerButton = screen.getByRole("button", {name: /menu/i});
            expect(hamburgerButton).toBeInTheDocument();
            fireEvent.click(hamburgerButton);
        });

        await waitFor(() => {
            const entrarLinks = screen.getAllByText("Entrar");
            expect(entrarLinks.length).toBeGreaterThan(0);
        }, {timeout: 3000});
    });
});

