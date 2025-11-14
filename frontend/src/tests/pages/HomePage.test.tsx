import {render, screen, waitFor} from "@testing-library/react";
import {useRouter} from "next/navigation";
import HomePage from "../../app/page";

jest.mock("next/navigation", () => ({
    useRouter: jest.fn(),
}));

describe("HomePage", () => {
    beforeEach(() => {
        (useRouter as jest.Mock).mockReturnValue({
            push: jest.fn(),
        });
        Object.defineProperty(document, "cookie", {
            writable: true,
            value: "",
        });
    });

    it("should render welcome message", async () => {
        render(<HomePage />);
        await waitFor(() => {
            expect(screen.getByText(/PAYCODE/i)).toBeInTheDocument();
        });
    });

    it("should render signup and login buttons", async () => {
        render(<HomePage />);
        await waitFor(() => {
            expect(screen.getByText("Criar Conta Grátis")).toBeInTheDocument();
            expect(screen.getByText("Entrar")).toBeInTheDocument();
        });
    });

    it("should render feature cards", async () => {
        render(<HomePage />);
        await waitFor(() => {
            expect(screen.getByText("Segurança Avançada")).toBeInTheDocument();
            expect(screen.getByText("Transações Rápidas")).toBeInTheDocument();
            expect(screen.getByText("Dashboard e KPIs")).toBeInTheDocument();
        });
    });

    it("should render stats section", async () => {
        render(<HomePage />);
        await waitFor(() => {
            expect(screen.getByText("100%")).toBeInTheDocument();
            expect(screen.getByText("24/7")).toBeInTheDocument();
            expect(screen.getByText("0%")).toBeInTheDocument();
        });
    });

    it("should redirect to wallet if session exists", () => {
        const mockPush = jest.fn();
        (useRouter as jest.Mock).mockReturnValue({
            push: mockPush,
        });
        Object.defineProperty(document, "cookie", {
            writable: true,
            value: "paycode_session=test",
        });

        render(<HomePage />);
        setTimeout(() => {
            expect(mockPush).toHaveBeenCalledWith("/wallet");
        }, 100);
    });
});

