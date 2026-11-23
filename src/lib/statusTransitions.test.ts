import { describe, expect, it } from "vitest";

import type { ColetaStatus, EntregaStatus } from "./statusTransitions";
import {
  TRANSICOES_COLETA,
  TRANSICOES_ENTREGA,
  podeTransicionarColeta,
  podeTransicionarEntrega,
} from "./statusTransitions";

const ENTREGA_STATUS_TODOS: EntregaStatus[] = [
  "aguardando_producao",
  "pronto_despacho",
  "cotacao_frete",
  "nf_emitida",
  "despachado",
  "em_transito",
  "saiu_entrega",
  "entregue",
  "ocorrencia",
  "finalizado",
];

const COLETA_STATUS_TODOS: ColetaStatus[] = [
  "aguardando_liberacao",
  "solicitada",
  "em_transito",
  "chegou_expedicao",
  "conferencia_ok",
  "divergencia",
  "finalizada",
];

describe("TRANSICOES_ENTREGA", () => {
  it("todo valor do enum e chave do mapa", () => {
    for (const s of ENTREGA_STATUS_TODOS) {
      expect(TRANSICOES_ENTREGA).toHaveProperty(s);
    }
  });

  it("pronto_despacho nao pode ir direto para entregue", () => {
    expect(podeTransicionarEntrega("pronto_despacho", "entregue")).toBe(false);
  });

  it("saiu_entrega pode ir para entregue ou ocorrencia", () => {
    expect(podeTransicionarEntrega("saiu_entrega", "entregue")).toBe(true);
    expect(podeTransicionarEntrega("saiu_entrega", "ocorrencia")).toBe(true);
  });

  it("finalizado nao tem transicoes", () => {
    expect(TRANSICOES_ENTREGA.finalizado).toHaveLength(0);
  });

  it("fluxo linear de despacho valido", () => {
    expect(podeTransicionarEntrega("pronto_despacho", "cotacao_frete")).toBe(true);
    expect(podeTransicionarEntrega("cotacao_frete", "nf_emitida")).toBe(true);
    expect(podeTransicionarEntrega("nf_emitida", "despachado")).toBe(true);
  });
});

describe("TRANSICOES_COLETA", () => {
  it("todo valor do enum e chave do mapa", () => {
    for (const s of COLETA_STATUS_TODOS) {
      expect(TRANSICOES_COLETA).toHaveProperty(s);
    }
  });

  it("finalizada nao tem transicoes", () => {
    expect(TRANSICOES_COLETA.finalizada).toHaveLength(0);
  });

  it("chegou_expedicao pode bifurcar para conferencia_ok ou divergencia", () => {
    expect(podeTransicionarColeta("chegou_expedicao", "conferencia_ok")).toBe(true);
    expect(podeTransicionarColeta("chegou_expedicao", "divergencia")).toBe(true);
    expect(podeTransicionarColeta("chegou_expedicao", "finalizada")).toBe(false);
  });

  it("fluxo linear valido", () => {
    expect(podeTransicionarColeta("aguardando_liberacao", "solicitada")).toBe(true);
    expect(podeTransicionarColeta("solicitada", "em_transito")).toBe(true);
    expect(podeTransicionarColeta("em_transito", "chegou_expedicao")).toBe(true);
  });
});