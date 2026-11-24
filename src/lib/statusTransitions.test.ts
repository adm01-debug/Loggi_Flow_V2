import { describe, expect, it } from "vitest";

import type { ColetaStatus, EntregaStatus } from "./statusTransitions";
import {
  ERRCODE_TRANSICAO_INVALIDA,
  ROTULOS_COLETA,
  ROTULOS_ENTREGA,
  TRANSICOES_COLETA,
  TRANSICOES_ENTREGA,
  podeTransicionarColeta,
  mensagemRecusaTransicao,
  podeTransicionarEntrega,
  reconhecerRecusaTransicao,
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

/** Erro como o supabase-js entrega o RAISE EXCEPTION das etapas 029/030. */
function erroDoBanco(atual: string, pretendido: string, code = ERRCODE_TRANSICAO_INVALIDA) {
  return {
    code,
    message: `Transição de status inválida: ${atual} -> ${pretendido}`,
    details: null,
    hint: null,
  };
}

describe("rotulos de operacao", () => {
  it("todo valor do enum de entrega tem rotulo", () => {
    for (const s of ENTREGA_STATUS_TODOS) {
      expect(ROTULOS_ENTREGA[s], s).toBeTruthy();
    }
  });

  it("todo valor do enum de coleta tem rotulo", () => {
    for (const s of COLETA_STATUS_TODOS) {
      expect(ROTULOS_COLETA[s], s).toBeTruthy();
    }
  });
});

describe("reconhecerRecusaTransicao", () => {
  it("le os dois status da mensagem do banco", () => {
    expect(reconhecerRecusaTransicao(erroDoBanco("pronto_despacho", "entregue"), "entrega")).toEqual({
      atual: "pronto_despacho",
      pretendido: "entregue",
    });
  });

  it("ignora erro de outro codigo", () => {
    expect(
      reconhecerRecusaTransicao(erroDoBanco("pronto_despacho", "entregue", "23503"), "entrega"),
    ).toBeNull();
  });

  it("ignora erro comum, nulo e valor solto", () => {
    expect(reconhecerRecusaTransicao(new Error("Conflito de versão"), "entrega")).toBeNull();
    expect(reconhecerRecusaTransicao(null, "entrega")).toBeNull();
    expect(reconhecerRecusaTransicao("Transição de status inválida: a -> b", "entrega")).toBeNull();
  });

  it("ignora 23514 que nao e recusa de transicao", () => {
    expect(
      reconhecerRecusaTransicao({ code: "23514", message: "new row violates check constraint" }, "entrega"),
    ).toBeNull();
  });
});

describe("mensagemRecusaTransicao", () => {
  it("nomeia o estado atual e o proximo passo", () => {
    expect(mensagemRecusaTransicao(erroDoBanco("pronto_despacho", "entregue"), "entrega")).toBe(
      'Esta entrega está em "Pronto para Despacho" e não pode ir para "Entregue". O próximo passo é "Cotação de Frete".',
    );
  });

  it("lista os dois destinos quando ha bifurcacao", () => {
    expect(mensagemRecusaTransicao(erroDoBanco("saiu_entrega", "finalizado"), "entrega")).toBe(
      'Esta entrega está em "Saiu para Entrega" e não pode ir para "Finalizado". Os próximos passos são "Entregue" ou "Ocorrência".',
    );
  });

  it("diz que o fluxo terminou quando nao ha proximo passo", () => {
    expect(mensagemRecusaTransicao(erroDoBanco("finalizada", "solicitada"), "coleta")).toBe(
      'Esta coleta está em "Finalizada" e não pode ir para "Solicitada". Não há próximo passo a partir daqui — o fluxo já terminou.',
    );
  });

  it("devolve null para os demais erros, sem esconder a mensagem original", () => {
    expect(mensagemRecusaTransicao(new Error("Conflito de versão"), "entrega")).toBeNull();
    expect(mensagemRecusaTransicao({ code: "42501", message: "forbidden" }, "entrega")).toBeNull();
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