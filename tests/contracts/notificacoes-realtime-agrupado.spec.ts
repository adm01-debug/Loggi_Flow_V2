import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const HOOK = readFileSync(
  join(process.cwd(), "src/hooks/data/useNotificacoesRealtime.ts"),
  "utf8",
);
const TELA = readFileSync(join(process.cwd(), "src/pages/Notificacoes.tsx"), "utf8");
const REALTIME = readFileSync(
  join(process.cwd(), "src/hooks/data/useRealtime.tsx"),
  "utf8",
);

/** Sem comentarios: contagem de ocorrencia de codigo nao pode contar o que esta comentado. */
function semComentarios(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

const LIMPO = semComentarios(HOOK);

/** O corpo do `setTimeout` do agendamento. */
function corpoDaJanela(): string {
  const inicio = LIMPO.indexOf("recargaAgendada.current = setTimeout(");
  expect(inicio).toBeGreaterThan(-1);
  const fim = LIMPO.indexOf("}, JANELA_RECARGA_MS)");
  expect(fim).toBeGreaterThan(inicio);
  return LIMPO.slice(inicio, fim);
}

/** O corpo do `onNotificationUpdate` (do `useCallback` ate o `, [qc, filtroAtivo`). */
function corpoDoUpdate(): string {
  const inicio = LIMPO.indexOf("const onNotificationUpdate = useCallback(");
  expect(inicio).toBeGreaterThan(-1);
  const fim = LIMPO.indexOf("[qc, filtroAtivo, agendarRecarga]", inicio);
  expect(fim).toBeGreaterThan(inicio);
  return LIMPO.slice(inicio, fim);
}

describe("Notificacoes: tempo real agrupado (etapa 216 / P-02)", () => {
  it("a tela mantem o tempo real e nao recarrega a listagem por aviso", () => {
    expect(TELA).toContain("useNotificacoesRealtime({");
    // O contrato da etapa: nenhum `refetch()` no caminho do aviso — e a tela nao importa mais o
    // `useRealtime` direto, quem fala com ele e o hook de notificacoes.
    expect(TELA).not.toContain("refetch");
    expect(TELA).not.toContain('from "@/hooks/data/useRealtime"');
    // A tela nao passa `queryKey` ao tempo real: aquela invalidacao, dentro do hook, e imediata — a
    // rajada voltaria a gerar uma requisicao por aviso. As mutacoes da propria tela seguem invalidando.
    const chamada = TELA.slice(TELA.indexOf("useNotificacoesRealtime({"));
    expect(chamada.slice(0, chamada.indexOf("});"))).not.toContain("queryKey");
  });

  it("o payload do tempo real traz a linha — e por isso o update pode ser pontual", () => {
    // Evidencia da decisao de usar `setQueriesData`: o hook entrega `{ old, new }`, nao um aviso vazio.
    expect(REALTIME).toContain("onUpdate?: (payload: { old: T; new: T }) => void;");
  });

  it("acumula a rajada numa janela de 300 a 500 ms", () => {
    const janela = LIMPO.match(/const JANELA_RECARGA_MS = (\d+);/);
    expect(janela, "falta a constante da janela").not.toBeNull();
    const ms = Number(janela?.[1]);
    expect(ms).toBeGreaterThanOrEqual(300);
    expect(ms).toBeLessThanOrEqual(500);
    // A janela e o argumento do agendamento, nao um numero solto: sem isso a constante nao vale nada.
    expect(corpoDaJanela() + "}, JANELA_RECARGA_MS)").toContain("}, JANELA_RECARGA_MS)");
  });

  it("reinicia a janela a cada aviso, em vez de empilhar recargas", () => {
    const agendamento = LIMPO.indexOf("recargaAgendada.current = setTimeout(");
    const cancelamento = LIMPO.indexOf("clearTimeout(recargaAgendada.current)");
    expect(agendamento).toBeGreaterThan(-1);
    expect(cancelamento).toBeGreaterThan(-1);
    expect(cancelamento).toBeLessThan(agendamento);
  });

  it("dispara uma unica invalidacao, e dentro da janela", () => {
    expect(LIMPO.match(/invalidateQueries/g) ?? []).toHaveLength(1);
    const invalidacao = LIMPO.indexOf(".invalidateQueries(");
    const inicio = LIMPO.indexOf("recargaAgendada.current = setTimeout(");
    expect(invalidacao).toBeGreaterThan(inicio);
  });

  it("cancela a recarga agendada quando a tela sai", () => {
    const cancelamentos = LIMPO.match(/clearTimeout\(recargaAgendada.current\)/g) ?? [];
    expect(cancelamentos).toHaveLength(2);
    // O segundo e o cleanup do unmount: dentro de um efeito que devolve funcao.
    expect(LIMPO).toContain("useEffect(\n    () => () => {");
  });

  it("aplica a alteracao da linha no cache, sem requisicao", () => {
    const update = corpoDoUpdate();
    expect(update).toContain("qc.setQueriesData<ServerPageResult<Notificacao>>(");
    expect(update).toContain('{ queryKey: ["notifications"] }');
    expect(update.indexOf("n.id === linha.id")).toBeGreaterThan(-1);
  });

  it("nao escreve na entrada de contagem, que nao tem `data`", () => {
    // Sem o guard, o `setQueriesData` (que casa tambem com `["notifications","stats"]`) trocaria a
    // contagem do cabecalho por uma pagina de linhas.
    const update = corpoDoUpdate();
    const guarda = update.indexOf("Array.isArray(atual.data)");
    expect(guarda).toBeGreaterThan(-1);
    // O guard tem de estar dentro do atualizador, que so roda para as entradas que casam com a chave.
    expect(guarda).toBeGreaterThan(update.indexOf("setQueriesData"));
  });

  it("com filtro ou busca ativos volta para a recarga", () => {
    const update = corpoDoUpdate();
    const filtro = update.indexOf("if (filtroAtivo) {");
    expect(filtro).toBeGreaterThan(-1);
    expect(update.indexOf("agendarRecarga();", filtro)).toBeGreaterThan(filtro);
    // O atalho pontual so pode valer depois da saida por filtro.
    expect(update.indexOf("setQueriesData", filtro)).toBeGreaterThan(filtro);
  });

  it("a tela informa o filtro ativo pelos tres filtros da consulta", () => {
    expect(TELA).toContain(
      'filtroAtivo: typeFilter !== "all" || readFilter !== "all" || termo.trim() !== "",',
    );
  });

  it("insert e delete recarregam agrupados; update nao", () => {
    const tempoReal = LIMPO.slice(LIMPO.indexOf("useRealtime<Notificacao>({"));
    expect(tempoReal).toContain('table: "notifications",');
    expect(tempoReal).toContain("onInsert: agendarRecarga,");
    expect(tempoReal).toContain("onDelete: agendarRecarga,");
    expect(tempoReal).toContain("onUpdate: onNotificationUpdate,");
  });
});
