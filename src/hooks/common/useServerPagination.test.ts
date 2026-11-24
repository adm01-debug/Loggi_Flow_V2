import { describe, expect, it, vi } from "vitest";
import { act, waitFor } from "@testing-library/react";
import { renderHookWithQuery } from "@/test/renderWithQuery";
import { useServerPagination, type ServerPageResult } from "./useServerPagination";

interface Faixa {
  from: number;
  to: number;
}

/** Fonte de dados falsa: devolve a fatia pedida e o total no servidor. */
function fonte(total: number, count: number | null = total) {
  return vi.fn(
    async ({ from, to }: Faixa): Promise<ServerPageResult<number>> => ({
      data: Array.from({ length: Math.max(0, Math.min(to + 1, total) - from) }, (_, i) => from + i),
      count,
      error: null,
    }),
  );
}

describe("useServerPagination (etapa 202)", () => {
  it("na pagina 1 pede a faixa 0..pageSize-1", async () => {
    const buscar = fonte(25);
    const { result } = renderHookWithQuery(() => useServerPagination(["entregas"], buscar, { pageSize: 10 }));

    await waitFor(() => expect(result.current.rows).toHaveLength(10));
    expect(buscar).toHaveBeenCalledWith({ from: 0, to: 9 });
    expect(result.current.currentPage).toBe(1);
  });

  it("setPage vira a faixa da pagina pedida", async () => {
    const buscar = fonte(25);
    const { result } = renderHookWithQuery(() => useServerPagination(["entregas"], buscar, { pageSize: 10 }));
    await waitFor(() => expect(result.current.rows).toHaveLength(10));

    act(() => result.current.setPage(2));

    await waitFor(() => expect(buscar).toHaveBeenLastCalledWith({ from: 10, to: 19 }));
    await waitFor(() => expect(result.current.currentPage).toBe(2));
    expect(result.current.rows).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
  });

  it("total e totalPages vem do count do servidor, nao de rows.length", async () => {
    const buscar = fonte(25);
    const { result } = renderHookWithQuery(() => useServerPagination(["entregas"], buscar, { pageSize: 10 }));

    await waitFor(() => expect(result.current.rows).toHaveLength(10));
    expect(result.current.total).toBe(25);
    expect(result.current.totalPages).toBe(3);
  });

  it("setPage fora da faixa sofre clamp em [1, totalPages]", async () => {
    const buscar = fonte(25);
    const { result } = renderHookWithQuery(() => useServerPagination(["entregas"], buscar, { pageSize: 10 }));
    await waitFor(() => expect(result.current.rows).toHaveLength(10));

    act(() => result.current.setPage(99));
    await waitFor(() => expect(result.current.currentPage).toBe(3));

    act(() => result.current.setPage(0));
    await waitFor(() => expect(result.current.currentPage).toBe(1));

    act(() => result.current.setPage(Number.NaN));
    await waitFor(() => expect(result.current.currentPage).toBe(1));
  });

  it("setPageSize troca o tamanho e volta para a pagina 1", async () => {
    const buscar = fonte(25);
    const { result } = renderHookWithQuery(() => useServerPagination(["entregas"], buscar, { pageSize: 10 }));
    await waitFor(() => expect(result.current.rows).toHaveLength(10));
    act(() => result.current.setPage(3));
    await waitFor(() => expect(result.current.currentPage).toBe(3));

    act(() => result.current.setPageSize(5));

    await waitFor(() => expect(result.current.pageSize).toBe(5));
    expect(result.current.currentPage).toBe(1);
    await waitFor(() => expect(buscar).toHaveBeenLastCalledWith({ from: 0, to: 4 }));
  });

  it("trocar o filtro volta para a pagina 1", async () => {
    const buscar = fonte(25);
    let filtros: readonly unknown[] = ["entregas", "aberto"];
    const { result, rerender } = renderHookWithQuery(() =>
      useServerPagination(filtros, buscar, { pageSize: 10 }),
    );
    await waitFor(() => expect(result.current.rows).toHaveLength(10));
    act(() => result.current.setPage(2));
    await waitFor(() => expect(result.current.currentPage).toBe(2));

    filtros = ["entregas", "entregue"];
    rerender();

    await waitFor(() => expect(result.current.currentPage).toBe(1));
    expect(result.current.totalPages).toBe(3);
  });

  it("erro do cliente de dados vira isError sem quebrar a lista", async () => {
    const buscar = vi.fn(async (): Promise<ServerPageResult<number>> => ({
      data: null,
      count: null,
      error: new Error("supabase down"),
    }));
    const { result } = renderHookWithQuery(() => useServerPagination(["entregas"], buscar, { pageSize: 10 }));

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe("supabase down");
    expect(result.current.rows).toEqual([]);
  });

  it("sem count, avanca enquanto a pagina vier cheia e para na parcial", async () => {
    const buscar = fonte(25, null);
    const { result } = renderHookWithQuery(() => useServerPagination(["entregas"], buscar, { pageSize: 10 }));
    await waitFor(() => expect(result.current.rows).toHaveLength(10));
    expect(result.current.total).toBe(10);
    expect(result.current.totalPages).toBe(2);

    act(() => result.current.nextPage());
    await waitFor(() => expect(result.current.currentPage).toBe(2));
    expect(result.current.totalPages).toBe(3);

    act(() => result.current.nextPage());

    await waitFor(() => expect(result.current.currentPage).toBe(3));
    expect(result.current.rows).toHaveLength(5);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.total).toBe(25);
  });

  it("usa a pagina de partida quando initialPage e informada", async () => {
    const buscar = fonte(25);
    const { result } = renderHookWithQuery(() =>
      useServerPagination(["entregas"], buscar, { pageSize: 10, initialPage: 2 }),
    );

    await waitFor(() => expect(buscar).toHaveBeenCalledWith({ from: 10, to: 19 }));
    await waitFor(() => expect(result.current.currentPage).toBe(2));
  });
});
