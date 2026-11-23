import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Trash2 } from "lucide-react";
import { BulkActions } from "./BulkActions";

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

describe("BulkActions - acao destrutiva", () => {
  it("nao executa a acao ao clicar no botao: apenas abre a confirmacao", () => {
    const { onClick } = renderBulk();
    fireEvent.click(screen.getByRole("button", { name: /excluir selecionados/i }));

    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByText("Excluir itens?")).toBeInTheDocument();
  });

  it("nao confirma enquanto a palavra exigida nao for digitada", () => {
    const { onClick } = renderBulk();
    fireEvent.click(screen.getByRole("button", { name: /excluir selecionados/i }));

    const botoes = screen.getAllByRole("button", { name: /excluir selecionados/i });
    fireEvent.click(botoes[botoes.length - 1]);
    expect(onClick).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText(/digite "excluir"/i), {
      target: { value: "EXCLUIR" },
    });
    const depois = screen.getAllByRole("button", { name: /excluir selecionados/i });
    fireEvent.click(depois[depois.length - 1]);

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
