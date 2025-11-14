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
                document.documentElement.classList.toggle("dark", action.payload === "dark");
            }
        },
        toggleTheme: (state) => {
            const newTheme = state.theme === "light" ? "dark" : "light";
            state.theme = newTheme;
            if (typeof window !== "undefined") {
                localStorage.setItem("theme", newTheme);
                document.documentElement.classList.toggle("dark", newTheme === "dark");
            }
        },
    },
});

export const {setTheme, toggleTheme} = themeSlice.actions;
export default themeSlice.reducer;

