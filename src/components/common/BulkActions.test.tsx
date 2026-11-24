import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Trash2 } from "lucide-react";
import { BulkActions } from "./BulkActions";

// Este teste cobre a logica de BulkActions. Os primitivos de UI e o
// ConfirmProvider entrariam no denominador de cobertura com cobertura baixa,
// entao sao mockados. ConfirmDialog e BulkActions permanecem reais: e o gate de
// requireTyping contra a acao destrutiva que se quer provar.

type Children = { children?: React.ReactNode };
type ButtonProps = React.ComponentProps<"button"> & {
  variant?: string;
  size?: string;
  asChild?: boolean;
};

vi.mock("@/components/ui/button", async () => {
  const react = await import("react");
  return {
    Button: ({ className, onClick, disabled, children }: ButtonProps) =>
      react.createElement(
        "button",
        { type: "button", className, onClick, disabled },
        children,
      ),
  };
});

vi.mock("@/components/ui/dropdown-menu", async () => {
  const react = await import("react");
  return {
    DropdownMenu: ({ children }: Children) =>
      react.createElement(react.Fragment, null, children),
    DropdownMenuTrigger: ({ children }: Children) =>
      react.createElement(react.Fragment, null, children),
    DropdownMenuContent: ({ children }: Children) =>
      react.createElement("div", null, children),
    DropdownMenuItem: ({ className, onClick, children }: ButtonProps) =>
      react.createElement(
        "button",
        { type: "button", className, onClick },
        children,
      ),
    DropdownMenuSeparator: () => react.createElement("div"),
  };
});

vi.mock("@/components/ui/alert-dialog", async () => {
  const react = await import("react");
  return {
    AlertDialog: ({ open, children }: Children & { open?: boolean }) =>
      open ? react.createElement("div", { role: "dialog" }, children) : null,
    AlertDialogContent: ({ children }: Children) =>
      react.createElement("div", null, children),
    AlertDialogHeader: ({ children }: Children) =>
      react.createElement("div", null, children),
    AlertDialogTitle: ({ children }: Children) =>
      react.createElement("h2", null, children),
    AlertDialogDescription: ({ children }: Children) =>
      react.createElement("p", null, children),
    AlertDialogFooter: ({ children }: Children) =>
      react.createElement("div", null, children),
    AlertDialogCancel: ({ className, onClick, disabled, children }: ButtonProps) =>
      react.createElement(
        "button",
        { type: "button", className, onClick, disabled },
        children,
      ),
    AlertDialogAction: ({ className, onClick, disabled, children }: ButtonProps) =>
      react.createElement(
        "button",
        { type: "button", className, onClick, disabled },
        children,
      ),
  };
});

vi.mock("@/components/ui/input", async () => {
  const react = await import("react");
  return {
    Input: ({
      value,
      onChange,
      placeholder,
      className,
    }: React.ComponentProps<"input">) =>
      react.createElement("input", { value, onChange, placeholder, className }),
  };
});

vi.mock("@/components/common/ConfirmProvider", () => {
  const stub = {
    icon: () => null,
    iconClass: "",
    buttonClass: "",
    bgClass: "",
    borderClass: "",
    pulseClass: "",
  };
  return {
    typeConfig: {
      danger: stub,
      warning: stub,
      info: stub,
      success: stub,
      critical: stub,
    },
  };
});

vi.mock("@/components/common/DeleteButton", () => ({ DeleteButton: () => null }));
vi.mock("@/components/common/InlineConfirm", () => ({ InlineConfirm: () => null }));

const renderBulk = () => {
  const onClick = vi.fn();
  render(
    <BulkActions
      selectedIds={["a", "b"]}
      totalCount={2}
      onClearSelection={vi.fn()}
      actions={[
        {
          id: "delete",
          label: "Excluir Selecionados",
          icon: Trash2,
          variant: "destructive",
          onClick,
          confirmTitle: "Excluir itens?",
          confirmTyping: "EXCLUIR",
        },
      ]}
    />,
  );
  return { onClick };
};

const abrirConfirmacao = () => {
  fireEvent.click(screen.getByRole("button", { name: /excluir selecionados/i }));
  return within(screen.getByRole("dialog"));
};

describe("BulkActions - acao destrutiva", () => {
  it("nao executa a acao ao clicar no botao: apenas abre a confirmacao", () => {
    const { onClick } = renderBulk();
    abrirConfirmacao();

    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByText("Excluir itens?")).toBeInTheDocument();
  });

  it("nao confirma enquanto a palavra exigida nao for digitada", () => {
    const { onClick } = renderBulk();
    const dialog = abrirConfirmacao();

    fireEvent.click(
      dialog.getByRole("button", { name: /excluir selecionados/i }),
    );
    expect(onClick).not.toHaveBeenCalled();

    fireEvent.change(dialog.getByPlaceholderText(/digite "excluir"/i), {
      target: { value: "EXCLUIR" },
    });
    fireEvent.click(
      dialog.getByRole("button", { name: /excluir selecionados/i }),
    );

    expect(onClick).toHaveBeenCalledWith(["a", "b"]);
  });

  it("acao nao destrutiva executa direto, sem confirmacao", () => {
    const onClick = vi.fn();
    render(
      <BulkActions
        selectedIds={["a"]}
        totalCount={1}
        onClearSelection={vi.fn()}
        actions={[{ id: "ok", label: "Homologar", onClick }]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /homologar/i }));
    expect(onClick).toHaveBeenCalledWith(["a"]);
  });
});