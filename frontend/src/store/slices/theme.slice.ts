import {createSlice, PayloadAction} from "@reduxjs/toolkit";

type Theme = "light" | "dark";

interface ThemeState {
    theme: Theme;
}

const initialState: ThemeState = {
    theme: (typeof window !== "undefined" && localStorage.getItem("theme") as Theme) || "light",
};

const themeSlice = createSlice({
    name: "theme",
    initialState,
    reducers: {
        setTheme: (state, action: PayloadAction<Theme>) => {
            state.theme = action.payload;
            if (typeof window !== "undefined") {
                localStorage.setItem("theme", action.payload);
                const root = document.documentElement;
                if (action.payload === "dark") {
                    root.classList.add("dark");
                } else {
                    root.classList.remove("dark");
                }
            }
        },
        toggleTheme: (state) => {
            const newTheme = state.theme === "light" ? "dark" : "light";
            state.theme = newTheme;
            if (typeof window !== "undefined") {
                localStorage.setItem("theme", newTheme);
                const root = document.documentElement;
                if (newTheme === "dark") {
                    root.classList.add("dark");
                } else {
                    root.classList.remove("dark");
                }
            }
        },
    },
});

export const {setTheme, toggleTheme} = themeSlice.actions;
export default themeSlice.reducer;

