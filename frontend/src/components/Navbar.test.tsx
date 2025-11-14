import {render, screen, fireEvent} from "@testing-library/react";
import {Provider} from "react-redux";
import {configureStore} from "@reduxjs/toolkit";
import Navbar from "./Navbar";
import authReducer from "../store/slices/authSlice";
import themeReducer from "../store/slices/theme.slice";

const createMockStore = (isAuth = false, theme: "light" | "dark" = "light") => {
    return configureStore({
        reducer: {
            auth: authReducer,
            theme: themeReducer,
        },
        preloadedState: {
            auth: {isAuthenticated: isAuth, user: null},
            theme: {theme},
        },
    });
};

describe("Navbar", () => {
    it("renders logo and navigation", () => {
        const store = createMockStore();
        render(
            <Provider store={store}>
                <Navbar />
            </Provider>,
        );

        expect(screen.getByText("PAYCODE")).toBeInTheDocument();
    });

    it("shows login and signup when not authenticated", () => {
        const store = createMockStore(false);
        render(
            <Provider store={store}>
                <Navbar />
            </Provider>,
        );

        expect(screen.getByText("Entrar")).toBeInTheDocument();
        expect(screen.getByText("Criar Conta")).toBeInTheDocument();
    });

    it("shows wallet and profile when authenticated", () => {
        const store = createMockStore(true);
        render(
            <Provider store={store}>
                <Navbar />
            </Provider>,
        );

        expect(screen.getByText("Carteira")).toBeInTheDocument();
        expect(screen.getByText("Perfil")).toBeInTheDocument();
    });

    it("toggles mobile menu", () => {
        const store = createMockStore();
        render(
            <Provider store={store}>
                <Navbar />
            </Provider>,
        );

        const menuButton = screen.getByLabelText("Toggle menu");
        fireEvent.click(menuButton);

        expect(screen.getByText("Entrar")).toBeInTheDocument();
    });

    it("toggles theme", () => {
        const store = createMockStore(false, "light");
        render(
            <Provider store={store}>
                <Navbar />
            </Provider>,
        );

        const themeButton = screen.getByLabelText("Toggle theme");
        fireEvent.click(themeButton);

        expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
});

