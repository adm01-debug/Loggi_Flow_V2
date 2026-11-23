import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { RenderHookOptions } from "@testing-library/react";
import { renderHook } from "@testing-library/react";

/** Cria um QueryClient isolado por teste (retry desligado para nao travar em erro). */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

/** Wrapper com QueryClientProvider para usar com renderHook. */
export function withQuery(
  client?: QueryClient,
): NonNullable<RenderHookOptions<unknown>["wrapper"]> {
  const qc = client ?? makeQueryClient();
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  };
}

/** Atalho: renderHook com QueryClientProvider automatico. */
export function renderHookWithQuery<R>(
  render: () => R,
  client?: QueryClient,
) {
  return renderHook(render, { wrapper: withQuery(client) });
}