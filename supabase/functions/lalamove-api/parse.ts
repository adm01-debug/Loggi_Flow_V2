import {
  requireEnum,
  requireString,
  ValidationError,
} from "../_shared/validate.ts";

export const ALLOWED_METHODS = ["GET", "POST", "PUT"] as const;

// `path`/`method` do corpo escolhem o caminho e o verbo usados na conta
// Lalamove da empresa: fora desta lista nada é encaminhado. Mesmo desenho de
// `external-db-bridge/index.ts` (ALLOWED_ACTIONS/ALLOWED_TABLES).
export const ALLOWED_PATHS = [
  "/quotations",
  "/orders",
  "/orders/{id}",
  "/orders/{id}/cancel",
] as const;

const ORDER_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;

export type LalamoveRoute =
  | "quotation"
  | "create_order"
  | "get_order"
  | "cancel_order";

export interface LalamoveRouteInput {
  route: LalamoveRoute;
  orderId: string | null;
  upstreamPath: string;
}

function requireMethod(method: string, expected: string, path: string): void {
  if (method !== expected) {
    throw new ValidationError(
      "method",
      `method must be ${expected} for ${path}`,
    );
  }
}

/**
 * B-04: o caminho enviado à Lalamove era montado com `body.path`/`body.method`
 * sem lista de valores permitidos e casado por substring (`includes('orders')`),
 * então quem chamasse escolhia o verbo e o caminho usados na conta da empresa.
 * Aqui o caminho de destino é reconstruído a partir de um identificador
 * validado, nunca concatenado do corpo.
 */
export function parseLalamoveRoute(
  body: Record<string, unknown>,
): LalamoveRouteInput {
  const method = requireEnum(body, "method", ALLOWED_METHODS);
  const path = requireString(body, "path").replace(/\/+$/, "");
  if (!path.startsWith("/")) {
    throw new ValidationError("path", "path must start with /");
  }
  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "v3") parts.shift();

  if (parts.length === 1 && parts[0] === "quotations") {
    requireMethod(method, "POST", "/quotations");
    return {
      route: "quotation",
      orderId: null,
      upstreamPath: "/v3/quotations",
    };
  }

  if (parts.length === 1 && parts[0] === "orders") {
    requireMethod(method, "POST", "/orders");
    return { route: "create_order", orderId: null, upstreamPath: "/v3/orders" };
  }

  if (parts[0] === "orders" && parts.length >= 2) {
    const orderId = parts[1];
    if (!ORDER_ID.test(orderId)) {
      throw new ValidationError(
        "path",
        "path must carry a valid order id (letters, digits, - and _)",
      );
    }
    if (parts.length === 2) {
      requireMethod(method, "GET", "/orders/{id}");
      return {
        route: "get_order",
        orderId,
        upstreamPath: `/v3/orders/${orderId}`,
      };
    }
    if (parts.length === 3 && parts[2] === "cancel") {
      requireMethod(method, "PUT", "/orders/{id}/cancel");
      return {
        route: "cancel_order",
        orderId,
        upstreamPath: `/v3/orders/${orderId}/cancel`,
      };
    }
  }

  throw new ValidationError(
    "path",
    `path must be one of: ${ALLOWED_PATHS.join(", ")}`,
  );
}
