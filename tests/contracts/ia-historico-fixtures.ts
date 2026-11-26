/**
 * Estado e duplo do cliente Supabase para o contrato do historico da IA.
 * Vive em arquivo separado porque `vi.mock` e hoisted: o teste importa daqui
 * dinamicamente dentro da fabrica do mock.
 */

export interface Chamada {
  op: "select" | "insert" | "delete";
  tabela: string;
  usuario?: string;
  teto?: number;
  payload?: Record<string, unknown>;
}

export const chamadas: Chamada[] = [];

export const estado = {
  historico: [] as { role: string; content: string }[],
  falha: false,
  usuario: "u-teste" as string | null,
};

export function reiniciar() {
  chamadas.length = 0;
  estado.historico = [];
  estado.falha = false;
  estado.usuario = "u-teste";
}

function cadeia(tabela: string) {
  const elo: Record<string, unknown> = {};

  const ultima = () => chamadas[chamadas.length - 1];

  elo.select = () => {
    chamadas.push({ op: "select", tabela });
    return elo;
  };
  elo.insert = (payload: Record<string, unknown>) => {
    chamadas.push({ op: "insert", tabela, payload });
    return Promise.resolve({
      data: null,
      error: estado.falha ? { message: "permissao negada" } : null,
    });
  };
  elo.delete = () => {
    chamadas.push({ op: "delete", tabela });
    return elo;
  };
  elo.eq = (_coluna: string, valor: string) => {
    const atual = ultima();
    if (atual && atual.usuario === undefined) atual.usuario = valor;
    return elo;
  };
  elo.order = () => elo;
  elo.limit = (teto: number) => {
    const atual = ultima();
    if (atual) atual.teto = teto;
    return elo;
  };
  elo.then = (resolver: (valor: unknown) => unknown) =>
    Promise.resolve({
      data: estado.historico,
      error: estado.falha ? { message: "permissao negada" } : null,
    }).then(resolver);

  return elo;
}

export const supabaseFake = { from: (tabela: string) => cadeia(tabela) };
