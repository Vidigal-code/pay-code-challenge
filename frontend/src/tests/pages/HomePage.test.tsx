import {render, screen} from "@testing-library/react";
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

    it("should render welcome message", () => {
        render(<HomePage />);
        expect(screen.getByText(/Seja bem-vindo a PAYCODE/i)).toBeInTheDocument();
    });

    it("should render signup and login buttons", () => {
        render(<HomePage />);
        expect(screen.getByText("Criar Conta")).toBeInTheDocument();
        expect(screen.getByText("Entrar")).toBeInTheDocument();
    });

    it("should render feature cards", () => {
        render(<HomePage />);
        expect(screen.getByText("Segurança Avançada")).toBeInTheDocument();
        expect(screen.getByText("Transações Rápidas")).toBeInTheDocument();
        expect(screen.getByText("Dashboard Completo")).toBeInTheDocument();
    });

    it("should render stats section", () => {
        render(<HomePage />);
        expect(screen.getByText("100%")).toBeInTheDocument();
        expect(screen.getByText("24/7")).toBeInTheDocument();
        expect(screen.getByText("0%")).toBeInTheDocument();
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

