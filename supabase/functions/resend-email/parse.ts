import { requireString, ValidationError } from "../_shared/validate.ts";

const EMAIL = /^[^@\s<>]+@[^@\s<>]+\.[^@\s<>]+$/;
// "Nome <email>" ou email puro: o `from` vai para o provedor e não pode levar
// quebra de linha (injeção de cabeçalho).
const FROM =
  /^[^\r\n<>]*<[^@\s<>]+@[^@\s<>]+\.[^@\s<>]+>$|^[^@\s<>]+@[^@\s<>]+\.[^@\s<>]+$/;

export const MAX_RECIPIENTS = 50;
export const MAX_SUBJECT_LENGTH = 200;
export const MAX_HTML_LENGTH = 100_000;

export interface EmailRequest {
  to: string[];
  subject: string;
  html: string;
  from?: string;
}

function requireRecipient(value: unknown, index: number | null): string {
  const rotulo = index === null ? "to" : `to[${index}]`;

  if (typeof value !== "string") {
    throw new ValidationError("to", `${rotulo} must be a string email address`);
  }
  const email = value.trim();
  if (email.length === 0 || email.length > 320 || !EMAIL.test(email)) {
    throw new ValidationError("to", `${rotulo} must be a valid email address`);
  }
  return email;
}

/**
 * B-04: `to`, `subject` e `html` iam crus para o provedor — endereço malformado
 * virava erro pago do Resend devolvido ao cliente e corpo sem teto virava
 * cobrança (e risco de bloqueio da conta). Validação aqui, antes da chamada.
 */
export function parseEmailRequest(
  body: Record<string, unknown>,
): EmailRequest {
  const bruto = body.to;
  let to: string[];
  if (Array.isArray(bruto)) {
    if (bruto.length === 0) {
      throw new ValidationError("to", "to must have at least one recipient");
    }
    if (bruto.length > MAX_RECIPIENTS) {
      throw new ValidationError(
        "to",
        `to must have at most ${MAX_RECIPIENTS} recipients`,
      );
    }
    to = bruto.map((item, i) => requireRecipient(item, i));
  } else {
    to = [requireRecipient(bruto, null)];
  }

  const subject = requireString(body, "subject", {
    maxLength: MAX_SUBJECT_LENGTH,
  });

  const html = requireString(body, "html", { maxLength: MAX_HTML_LENGTH });

  const from = body.from === undefined || body.from === null || body.from === ""
    ? undefined
    : requireString(body, "from", { maxLength: 320, pattern: FROM });

  return { to, subject, html, from };
}
