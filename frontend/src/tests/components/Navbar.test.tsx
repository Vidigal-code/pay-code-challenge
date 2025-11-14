import {render, screen, fireEvent} from "@testing-library/react";
import {Provider} from "react-redux";
import {configureStore} from "@reduxjs/toolkit";
import Navbar from "../../components/Navbar";
import themeReducer from "../../store/slices/theme.slice";

const createMockStore = (initialTheme: "light" | "dark" = "light") => {
    return configureStore({
        reducer: {
            theme: themeReducer,
        },
        preloadedState: {
            theme: {
                theme: initialTheme,
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

        const themeButton = screen.getByRole("button", {name: /toggle theme/i});
        expect(themeButton).toBeInTheDocument();

        fireEvent.click(themeButton);
        expect(store.getState().theme.theme).toBe("dark");
    });

    it("should show login and signup links when not authenticated", () => {
        const store = createMockStore();
        render(
            <Provider store={store}>
                <Navbar />
            </Provider>,
        );

        expect(screen.getByText("Login")).toBeInTheDocument();
        expect(screen.getByText("Sign Up")).toBeInTheDocument();
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
        expect(screen.getByText("Login")).toBeInTheDocument();
    });
});

