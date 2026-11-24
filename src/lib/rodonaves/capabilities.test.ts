import { describe, it, expect } from "vitest";
import {
  capabilitiesByGateway,
  capabilityCoverage,
  capabilityReason,
  getCapability,
  isActionAvailable,
  listCapabilities,
  CAPABILITY_STATUS_LABELS,
  GATEWAY_LATENCY,
  type RTEGateway,
} from "./capabilities";

describe("matriz de capacidades", () => {
  it("não possui ações duplicadas", () => {
    const actions = listCapabilities().map((c) => c.action);
    expect(new Set(actions).size).toBe(actions.length);
  });

  it("todo status possui rótulo", () => {
    for (const capability of listCapabilities()) {
      expect(CAPABILITY_STATUS_LABELS[capability.status]).toBeTruthy();
    }
  });

  it("todo gateway referenciado possui perfil de latência", () => {
    for (const capability of listCapabilities()) {
      expect(GATEWAY_LATENCY[capability.gateway]).toBeDefined();
      expect(GATEWAY_LATENCY[capability.gateway].p95).toBeGreaterThanOrEqual(
        GATEWAY_LATENCY[capability.gateway].p50,
      );
    }
  });
});

describe("disponibilidade", () => {
  it("libera a rota de ouro (cotação → rastreio → comprovante)", () => {
    expect(isActionAvailable("quotation")).toBe(true);
    expect(isActionAvailable("track-batch")).toBe(true);
    expect(isActionAvailable("delivery-proof")).toBe(true);
  });

  it("bloqueia o escopo de gestão interna", () => {
    expect(isActionAvailable("customer-list")).toBe(false);
    expect(isActionAvailable("occurrence-receipt")).toBe(false);
    expect(isActionAvailable("orders")).toBe(false);
  });

  it("libera as rotas recuperadas (cliente por CNPJ e fator de cubagem)", () => {
    expect(isActionAvailable("customer-get-by-taxid")).toBe(true);
    expect(isActionAvailable("cubage-factor")).toBe(true);
    expect(capabilityReason("customer-get-by-taxid")).toBeNull();
  });

  it("mantém bloqueadas as rotas que a RTE responde 403 (doc v6.9.0)", () => {
    const bloqueadas = [
      "track-batch-paginated",
      "delivery-proof-hq",
      "delivery-info",
      "delivery-receipt-batch",
      "delivery-receipt-by-protocols",
      "pickup-available-dates-by-params",
      "tracking-steps-bot",
      "tracking-last-steps-bot",
      "unit-calendar",
      "city-search",
      "address-by-zipcode",
      "self-attendance-quotation",
    ];
    for (const action of bloqueadas) {
      expect(isActionAvailable(action), action).toBe(false);
    }
  });

  it("aponta apenas cadeias de fallback que terminam em rota liberada", () => {
    // O lote de comprovantes cai em outra rota bloqueada que tem a propria
    // cadeia (receipt-key-list -> delivery-receipt-by-protocols -> delivery-proof),
    // entao a integridade e o fim da cadeia, nao o primeiro salto.
    const fimDaCadeia = (acao: string): string | null => {
      let atual = getCapability(acao)?.fallback;
      const vistas = new Set<string>();
      while (atual && atual !== "local") {
        if (vistas.has(atual)) return null;
        vistas.add(atual);
        const proxima = getCapability(atual);
        if (!proxima) return null;
        if (proxima.status === "liberado") return atual;
        atual = proxima.fallback;
      }
      return atual === "local" ? "local" : null;
    };

    for (const capability of listCapabilities()) {
      if (!capability.fallback) continue;
      expect(fimDaCadeia(capability.action), capability.action).not.toBeNull();
    }
  });

  it("marca endpoints instáveis como indisponíveis", () => {
    expect(isActionAvailable("generate-first-quotation")).toBe(false);
    expect(capabilityReason("generate-first-quotation")).toContain("500");
  });

  it("aplica fail-open para ações não mapeadas", () => {
    expect(getCapability("acao-inexistente")).toBeNull();
    expect(isActionAvailable("acao-inexistente")).toBe(true);
    expect(capabilityReason("acao-inexistente")).toBeNull();
  });

  it("não retorna motivo para ações disponíveis", () => {
    expect(capabilityReason("track")).toBeNull();
  });

  it("sempre retorna motivo para ações indisponíveis", () => {
    for (const capability of listCapabilities()) {
      if (!isActionAvailable(capability.action)) {
        expect(capabilityReason(capability.action)).toBeTruthy();
      }
    }
  });
});

describe("agregações", () => {
  it("agrupa por gateway sem perder itens", () => {
    const grouped = capabilitiesByGateway();
    const total = (Object.keys(grouped) as RTEGateway[]).reduce(
      (sum, key) => sum + grouped[key].length,
      0,
    );
    expect(total).toBe(listCapabilities().length);
  });

  it("cobertura soma exatamente o total", () => {
    const c = capabilityCoverage();
    expect(
      c.liberado + c.bloqueado + c.offline + c.instavel + c.naoTestado,
    ).toBe(c.total);
    expect(c.coverageRate).toBeGreaterThan(0);
    expect(c.coverageRate).toBeLessThanOrEqual(100);
  });
});
