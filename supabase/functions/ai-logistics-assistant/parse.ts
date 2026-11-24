/**
 * Validação do texto que vai para o modelo (etapa 153 / achado B-04).
 *
 * Módulo puro: pode ser importado por testes sem carregar deno.land/esm.sh.
 */

import {
  requireEnum,
  requireString,
  ValidationError,
} from "../_shared/validate.ts";

/** Teto da pergunta do usuário. Escolhido para cobrir qualquer pergunta real de logística (4000 caracteres). */
export const MAX_MESSAGE_LENGTH = 4000;
/** Mesmo teto que o `index.ts` já aplica no provedor com `.slice(-10)`. */
export const MAX_HISTORY_ITEMS = 10;
/** Respostas do assistente em Markdown: teto por item, sem teto de soma (o histórico é cortado em 10). */
export const MAX_HISTORY_ITEM_LENGTH = 8000;
export const HISTORY_ROLES = ["user", "assistant", "system"] as const;

export interface AssistantChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AssistantRequest {
  message: string;
  conversationHistory: AssistantChatMessage[];
  stream: boolean;
}

function asObject(value: unknown): Record<string, unknown> {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function parseHistory(value: unknown): AssistantChatMessage[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new ValidationError(
      "conversationHistory",
      "conversationHistory must be an array",
    );
  }
  if (value.length > MAX_HISTORY_ITEMS) {
    throw new ValidationError(
      "conversationHistory",
      `conversationHistory must have at most ${MAX_HISTORY_ITEMS} items`,
    );
  }
  return value.map((item, index) => {
    const entry = asObject(item);
    try {
      return {
        role: requireEnum(entry, "role", HISTORY_ROLES),
        content: requireString(entry, "content", {
          maxLength: MAX_HISTORY_ITEM_LENGTH,
        }),
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ValidationError(
          `conversationHistory[${index}].${error.field}`,
          error.message,
        );
      }
      throw error;
    }
  });
}

/**
 * Valida `message` (ou o alias `prompt`), `conversationHistory` e `stream`.
 * Texto vazio mantém a resposta em português que o app já exibe.
 */
export function parseAssistantRequest(body: unknown): AssistantRequest {
  const input = asObject(body);

  const rawMessage = input.message ?? input.prompt;
  if (typeof rawMessage !== "string" || rawMessage.trim().length === 0) {
    throw new ValidationError("message", "Por favor, envie uma mensagem.");
  }
  const message = requireString({ message: rawMessage }, "message", {
    maxLength: MAX_MESSAGE_LENGTH,
  });

  const rawStream = input.stream;
  if (
    rawStream !== undefined &&
    rawStream !== null &&
    typeof rawStream !== "boolean"
  ) {
    throw new ValidationError("stream", "stream must be a boolean");
  }

  return {
    message,
    conversationHistory: parseHistory(input.conversationHistory),
    stream: rawStream === true,
  };
}
