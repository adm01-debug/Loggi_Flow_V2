/**
 * Saneamento da URL do Supabase vinda do ambiente.
 *
 * Em 17/11 a producao quebrou com
 * `Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL` porque o valor
 * gravado no painel da Vercel tinha aspas duplas literais dentro dele. O Vite
 * injeta a variavel como texto cru, entao o bundle de producao ficou com
 * `const Vo='"https://<ref>.supabase.co"'` e o `createClient` recebeu uma URL
 * invalida. O mesmo valor sujo tambem corrompia o `project ref` usado na chave
 * de sessao do localStorage em `useAuth` (`sb-"https-auth-token`).
 *
 * Painel de env nao tem validacao; o codigo precisa ter.
 */

/** Remove aspas e espacos que o painel de ambiente deixa passar. */
export function limparValorEnv(bruto: string | undefined | null): string {
  if (bruto === undefined || bruto === null) return "";
  let texto = String(bruto).trim();
  // remove aspas simples ou duplas que envolvem o valor inteiro
  while (
    texto.length >= 2 &&
    ((texto.startsWith('"') && texto.endsWith('"')) ||
      (texto.startsWith("'") && texto.endsWith("'")))
  ) {
    texto = texto.slice(1, -1).trim();
  }
  // barra final quebra a montagem de `${URL}/functions/v1/...`
  while (texto.endsWith("/")) {
    texto = texto.slice(0, -1);
  }
  return texto;
}

/**
 * Devolve a URL limpa quando ela e http(s) valida; caso contrario `null`.
 * Nunca lanca - quem chama decide o que fazer com a ausencia.
 */
export function sanitizarUrlSupabase(bruto: string | undefined | null): string | null {
  const texto = limparValorEnv(bruto);
  if (texto === "") return null;
  let url: URL;
  try {
    url = new URL(texto);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  return texto;
}

/**
 * Extrai o `project ref` (primeiro rotulo do host) usado na chave
 * `sb-<ref>-auth-token` do localStorage. String vazia se a URL for invalida.
 */
export function refDoProjeto(bruto: string | undefined | null): string {
  const url = sanitizarUrlSupabase(bruto);
  if (url === null) return "";
  return new URL(url).hostname.split(".")[0];
}
