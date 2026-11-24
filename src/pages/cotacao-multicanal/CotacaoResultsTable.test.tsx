import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CotacaoResultsTable } from "./CotacaoResultsTable";
import type { CotacaoMulticanal } from "@/hooks/logistics/useCotacoesMulticanal";

// A tabela passou a ser alimentada pela linha do banco (CotacaoMulticanal), e
// nao mais pelo tipo local CotacaoManual que vivia em useState. Estes testes
// provam o contrato novo: nome vindo do join transportadoras, valor_cotado e o
// id da cotacao (nao o transportadora_id) na acao de registrar resposta.

const base: Omit<CotacaoMulticanal, "id" | "transportadora_id" | "canal" | "status" | "valor_cotado" | "prazo_dias" | "observacoes" | "transportadora"> = {
  user_id: "u1",
  origem_estado: "SP",
  origem_cidade: null,
  destino_estado: "RJ",
  destino_cidade: null,
  peso_kg: 10,
  volumes: 1,
  valor_mercadoria: 100,
  expires_at: "2026-01-01T00:00:00Z",
  responded_at: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

function cotacao(over: Partial<CotacaoMulticanal>): CotacaoMulticanal {
  return {
    ...base,
    id: "c1",
    transportadora_id: "t1",
    canal: "whatsapp",
    status: "pendente",
    valor_cotado: null,
    prazo_dias: null,
    observacoes: null,
    transportadora: {
      id: "t1",
      nome_fantasia: "Transp A",
      razao_social: "Transp A LTDA",
      score_performance: null,
    },
    ...over,
  };
}

describe("CotacaoResultsTable", () => {
  it("mostra o nome fantasia do join e o valor_cotado da linha", () => {
    render(
      <CotacaoResultsTable
        cotacoes={[cotacao({ status: "respondido", valor_cotado: 120 })]}
        melhorCotacao={null}
        onRegistrar={() => {}}
        onEscolher={() => {}}
      />,
    );
    expect(screen.getByText("Transp A")).toBeTruthy();
    expect(screen.getByText("R$ 120.00")).toBeTruthy();
  });

  it("registra a resposta pelo id da cotacao, nao pelo transportadora_id", () => {
    const onRegistrar = vi.fn();
    render(
      <CotacaoResultsTable
        cotacoes={[cotacao({ id: "c-abc", transportadora_id: "t-xyz" })]}
        melhorCotacao={null}
        onRegistrar={onRegistrar}
        onEscolher={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Registrar" }));
    expect(onRegistrar).toHaveBeenCalledWith("c-abc");
  });

  it("nao oferece Registrar para cotacao ja respondida", () => {
    render(
      <CotacaoResultsTable
        cotacoes={[cotacao({ status: "respondido", valor_cotado: 90 })]}
        melhorCotacao={null}
        onRegistrar={() => {}}
        onEscolher={() => {}}
      />,
    );
    expect(screen.queryByRole("button", { name: "Registrar" })).toBeNull();
  });

  it("escolhe a cotacao respondida pelo id da linha", () => {
    const onEscolher = vi.fn();
    render(
      <CotacaoResultsTable
        cotacoes={[cotacao({ id: "c-esc", status: "respondido", valor_cotado: 75 })]}
        melhorCotacao={null}
        onRegistrar={() => {}}
        onEscolher={onEscolher}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Escolher" }));
    expect(onEscolher).toHaveBeenCalledWith("c-esc");
  });

  it("nao oferece Escolher para pendente nem para a ja escolhida", () => {
    render(
      <CotacaoResultsTable
        cotacoes={[
          cotacao({ id: "c-p", status: "pendente" }),
          cotacao({ id: "c-s", status: "selecionado", valor_cotado: 70 }),
        ]}
        melhorCotacao={null}
        onRegistrar={() => {}}
        onEscolher={() => {}}
      />,
    );
    expect(screen.queryByRole("button", { name: "Escolher" })).toBeNull();
  });

  it("mostra a cotacao marcada como selecionada", () => {
    render(
      <CotacaoResultsTable
        cotacoes={[cotacao({ status: "selecionado", valor_cotado: 80 })]}
        melhorCotacao={null}
        onRegistrar={() => {}}
        onEscolher={() => {}}
      />,
    );
    expect(screen.getByText("Selecionada")).toBeTruthy();
  });
});
