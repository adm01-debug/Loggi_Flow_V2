import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { chamadas, estado, reiniciar } from "./ia-historico-fixtures";

vi.mock("@/integrations/supabase/client", async () => {
  const { supabaseFake } = await import("./ia-historico-fixtures");
  return { supabase: supabaseFake };
});

vi.mock("@/hooks/auth/useAuth", async () => {
  const { estado: estadoAuth } = await import("./ia-historico-fixtures");
  return {
    useAuth: () => ({
      session: estadoAuth.usuario
        ? { user: { id: estadoAuth.usuario }, access_token: "token" }
        : null,
    }),
  };
});

const { AIAssistant } = await import("@/components/ai/AIAssistant");

/** Resposta de streaming do `ai-logistics-assistant` no formato SSE que o painel consome. */
function respostaEmStream(texto: string) {
  const pedacos = [
    `data: ${JSON.stringify({ choices: [{ delta: { content: texto } }] })}\n`,
    "data: [DONE]\n",
  ];
  let i = 0;
  return {
    ok: true,
    body: {
      getReader: () => ({
        read: async () =>
          i < pedacos.length
            ? { done: false, value: new TextEncoder().encode(pedacos[i++]) }
            : { done: true, value: undefined },
      }),
    },
  };
}

function botaoLimpar(container: HTMLElement): HTMLButtonElement {
  const botao = [...container.querySelectorAll("button")].find((b) =>
    b.querySelector("svg")?.getAttribute("class")?.includes("trash"),
  );
  expect(botao).toBeDefined();
  return botao as HTMLButtonElement;
}

async function enviar(texto: string) {
  const campo = screen.getByPlaceholderText("Comando de voz ou texto...");
  fireEvent.change(campo, { target: { value: texto } });
  fireEvent.keyDown(campo, { key: "Enter" });
}

beforeEach(() => {
  reiniciar();
  Element.prototype.scrollIntoView = vi.fn();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(respostaEmStream("Resposta")),
  );
});

describe("AIAssistant: historico persistido em ai_chat_messages", () => {
  it("ao abrir, le so os ultimos 50 turnos do proprio usuario", async () => {
    estado.historico = [
      { role: "user", content: "Quantos fretes ontem?" },
      { role: "assistant", content: "Foram 12 entregas concluidas." },
    ];

    render(<AIAssistant />);

    expect(
      await screen.findByText("Foram 12 entregas concluidas."),
    ).toBeInTheDocument();
    expect(screen.getByText("Quantos fretes ontem?")).toBeInTheDocument();

    const consulta = chamadas.find((c) => c.op === "select");
    expect(consulta?.tabela).toBe("ai_chat_messages");
    expect(consulta?.usuario).toBe("u-teste");
    expect(consulta?.teto).toBe(50);
  });

  it("grava o turno do usuario e a resposta da IA, os dois com o user_id da sessao", async () => {
    render(<AIAssistant />);

    await enviar("Analise os atrasos");

    expect(await screen.findByText("Resposta")).toBeInTheDocument();

    await waitFor(() => {
      expect(chamadas.filter((c) => c.op === "insert")).toHaveLength(2);
    });

    const [turnoUsuario, turnoIa] = chamadas.filter((c) => c.op === "insert");
    expect(turnoUsuario.payload).toMatchObject({
      user_id: "u-teste",
      role: "user",
      content: "Analise os atrasos",
    });
    expect(turnoIa.payload).toMatchObject({
      user_id: "u-teste",
      role: "assistant",
      content: "Resposta",
    });
  });

  it("limpar a conversa apaga no banco so as mensagens do usuario logado", async () => {
    estado.historico = [{ role: "user", content: "conversa antiga" }];

    const { container } = render(<AIAssistant />);
    expect(await screen.findByText("conversa antiga")).toBeInTheDocument();

    fireEvent.click(botaoLimpar(container));

    await waitFor(() => {
      expect(chamadas.some((c) => c.op === "delete")).toBe(true);
    });
    const remocao = chamadas.find((c) => c.op === "delete");
    expect(remocao?.tabela).toBe("ai_chat_messages");
    expect(remocao?.usuario).toBe("u-teste");
    await waitFor(() =>
      expect(screen.queryByText("conversa antiga")).not.toBeInTheDocument(),
    );
  });

  it("falha ao gravar nao derruba a conversa", async () => {
    estado.falha = true;

    render(<AIAssistant />);

    await enviar("Otimizar custos");

    expect(await screen.findByText("Resposta")).toBeInTheDocument();
    expect(chamadas.filter((c) => c.op === "insert")).toHaveLength(2);
  });

  it("sem sessao, nao consulta nem grava nada", async () => {
    estado.usuario = null;

    render(<AIAssistant />);

    await enviar("Qualquer coisa");

    expect(await screen.findByText("Resposta")).toBeInTheDocument();
    expect(chamadas.filter((c) => c.op === "insert")).toHaveLength(0);
    expect(chamadas.some((c) => c.op === "select")).toBe(false);
  });
});
