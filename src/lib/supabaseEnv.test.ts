import { describe, it, expect } from "vitest";
import { limparValorEnv, sanitizarUrlSupabase, refDoProjeto } from "./supabaseEnv";

const LIMPA = "https://jvfhclubfpxrtrrazrgr.supabase.co";
const SUJA = '"https://jvfhclubfpxrtrrazrgr.supabase.co"';

describe("limparValorEnv", () => {
  it("remove as aspas duplas que a Vercel gravou dentro do valor", () => {
    expect(limparValorEnv(SUJA)).toBe(LIMPA);
  });

  it("remove aspas simples e espacos em volta", () => {
    expect(limparValorEnv("  'https://x.supabase.co'  ")).toBe("https://x.supabase.co");
  });

  it("remove barra final que duplicaria a barra das edge functions", () => {
    expect(limparValorEnv("https://x.supabase.co/")).toBe("https://x.supabase.co");
  });

  it("devolve string vazia para ausente", () => {
    expect(limparValorEnv(undefined)).toBe("");
    expect(limparValorEnv(null)).toBe("");
    expect(limparValorEnv("   ")).toBe("");
  });

  it("nao altera valor que ja esta correto", () => {
    expect(limparValorEnv(LIMPA)).toBe(LIMPA);
  });
});

describe("sanitizarUrlSupabase", () => {
  it("aceita a URL suja que derrubou a producao", () => {
    expect(sanitizarUrlSupabase(SUJA)).toBe(LIMPA);
  });

  it("recusa valor ausente", () => {
    expect(sanitizarUrlSupabase(undefined)).toBeNull();
    expect(sanitizarUrlSupabase("")).toBeNull();
  });

  it("recusa texto que nao e URL", () => {
    expect(sanitizarUrlSupabase("jvfhclubfpxrtrrazrgr.supabase.co")).toBeNull();
    expect(sanitizarUrlSupabase("undefined")).toBeNull();
  });

  it("recusa protocolo que nao e http(s)", () => {
    expect(sanitizarUrlSupabase("ws://x.supabase.co")).toBeNull();
    expect(sanitizarUrlSupabase("javascript:alert(1)")).toBeNull();
  });
});

describe("refDoProjeto", () => {
  it("extrai o ref mesmo com a URL suja", () => {
    expect(refDoProjeto(SUJA)).toBe("jvfhclubfpxrtrrazrgr");
  });

  it("extrai o ref da URL limpa", () => {
    expect(refDoProjeto(LIMPA)).toBe("jvfhclubfpxrtrrazrgr");
  });

  it("devolve vazio quando a URL e invalida", () => {
    expect(refDoProjeto("nao-e-url")).toBe("");
    expect(refDoProjeto(undefined)).toBe("");
  });
});
