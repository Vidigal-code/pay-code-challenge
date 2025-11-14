import {render, screen, fireEvent} from "@testing-library/react";
import {Provider} from "react-redux";
import {configureStore} from "@reduxjs/toolkit";
import Navbar from "../../components/Navbar";
import themeReducer from "../../store/slices/theme.slice";
import authReducer from "../../store/slices/authSlice";

const createMockStore = (initialTheme: "light" | "dark" = "light", isAuthenticated: boolean = false) => {
    return configureStore({
        reducer: {
            theme: themeReducer,
            auth: authReducer,
        },
        preloadedState: {
            theme: {
                theme: initialTheme,
            },
            auth: {
                isAuthenticated,
            },
        },
    });
};

describe("Navbar", () => {
    it("should render PAYCODE logo", () => {
        const store = createMockStore();
        render(
            <Provider store={store}>
                <Navbar />
            </Provider>,
        );
        expect(screen.getByText("PAYCODE")).toBeInTheDocument();
    });

    it("should toggle theme when theme button is clicked", () => {
        const store = createMockStore("light");
        render(
            <Provider store={store}>
                <Navbar />
            </Provider>,
        );

        const themeButton = screen.getByRole("button", {name: /Toggle theme/i});
        expect(themeButton).toBeInTheDocument();

        fireEvent.click(themeButton);
        expect(store.getState().theme.theme).toBe("dark");
    });

    it("should show login and signup links when not authenticated", () => {
        const store = createMockStore("light", false);
        render(
            <Provider store={store}>
                <Navbar />
            </Provider>,
        );

        expect(screen.getByText("Entrar")).toBeInTheDocument();
        expect(screen.getByText("Criar Conta")).toBeInTheDocument();
    });

    it("should be responsive with hamburger menu on mobile", () => {
        const store = createMockStore();
        render(
            <Provider store={store}>
                <Navbar />
            </Provider>,
        );

        const hamburgerButton = screen.getByRole("button", {name: /menu/i});
        expect(hamburgerButton).toBeInTheDocument();

        fireEvent.click(hamburgerButton);
        const entrarLinks = screen.getAllByText("Entrar");
        expect(entrarLinks.length).toBeGreaterThan(0);
    });
});

