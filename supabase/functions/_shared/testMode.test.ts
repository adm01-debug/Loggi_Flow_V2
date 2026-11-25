import { assertEquals } from "jsr:@std/assert@1";
import { resolveTestMode } from "./testMode.ts";

const PROD = "https://jvfhclubfpxrtrrazrgr.supabase.co";

Deno.test("producao recusa o bypass mesmo com ALLOW_TEST_MODE=true", () => {
  assertEquals(
    resolveTestMode({ allowTestMode: "true", supabaseUrl: PROD, testModeHeader: "true" }),
    false,
  );
});

Deno.test("producao recusa com a URL em maiusculas", () => {
  assertEquals(
    resolveTestMode({
      allowTestMode: "true",
      supabaseUrl: "HTTPS://JVFHCLUBFPXRTRRAZRGR.SUPABASE.CO",
      testModeHeader: "true",
    }),
    false,
  );
});

Deno.test("ambiente local aceita o bypass quando a variavel e o header estao ligados", () => {
  assertEquals(
    resolveTestMode({
      allowTestMode: "true",
      supabaseUrl: "http://127.0.0.1:54321",
      testModeHeader: "true",
    }),
    true,
  );
});

Deno.test("sem ALLOW_TEST_MODE o header sozinho nao abre nada", () => {
  assertEquals(
    resolveTestMode({ allowTestMode: undefined, supabaseUrl: "http://127.0.0.1:54321", testModeHeader: "true" }),
    false,
  );
  assertEquals(
    resolveTestMode({ allowTestMode: "false", supabaseUrl: "http://127.0.0.1:54321", testModeHeader: "true" }),
    false,
  );
});

Deno.test("sem o header, ALLOW_TEST_MODE=true nao abre nada", () => {
  assertEquals(
    resolveTestMode({ allowTestMode: "true", supabaseUrl: "http://127.0.0.1:54321", testModeHeader: null }),
    false,
  );
});
