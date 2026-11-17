import { describe, it, expect } from "vitest";
import { filtrarPorLimiar } from "./alertsFilter";
import type { RecentAlert } from "@/hooks/analytics/useDashboardMetrics";

function alerta(id: string, delta?: number): RecentAlert {
  return {
    id,
    type: "ocorrencia",
    message: id,
    severity: "warning",
    createdAt: "2026-01-01T00:00:00Z",
    ...(delta === undefined ? {} : { delta }),
  };
}

describe("filtrarPorLimiar", () => {
  it("nunca esconde alerta sem delta medido", () => {
    // Regressao: o filtro antigo inventava delta com id.charCodeAt(0) % 20,
    // o que escondia 100% de `divergencia-*` (delta 0) e `falha-frete-*`
    // (delta 2) no limiar padrao de 5.
    const entrada = [
      alerta("divergencia-abc"),
      alerta("falha-frete-abc"),
      alerta("coleta-atrasada-abc"),
    ];
    expect(filtrarPorLimiar(entrada, 5).map((a) => a.id)).toEqual([
      "divergencia-abc",
      "falha-frete-abc",
      "coleta-atrasada-abc",
    ]);
  });

  it("aplica o limiar so a quem tem delta", () => {
    const entrada = [alerta("baixo", 10), alerta("alto", 40), alerta("sem")];
    expect(filtrarPorLimiar(entrada, 30).map((a) => a.id)).toEqual([
      "alto",
      "sem",
    ]);
  });

  it("mantem alerta cujo delta empata com o limiar", () => {
    expect(filtrarPorLimiar([alerta("igual", 30)], 30)).toHaveLength(1);
  });

  it("trata delta zero como medido e o esconde acima do limiar", () => {
    expect(filtrarPorLimiar([alerta("zero", 0)], 5)).toHaveLength(0);
  });
});
