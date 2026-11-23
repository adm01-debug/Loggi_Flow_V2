import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  bodyHash,
  buildEventKey,
} from "../../supabase/functions/_shared/eventKey";

const LALAMOVE = "supabase/functions/lalamove-webhook/index.ts";
const NEXUS = "supabase/functions/nexus-webhook-receiver/index.ts";
const CARRIER = "supabase/functions/carrier-webhook-receiver/index.ts";

const fonte = (caminho: string) => readFileSync(caminho, "utf8");

describe("buildEventKey (etapa 138, achado B-02)", () => {
  it("o mesmo evento gera sempre a mesma chave", async () => {
    const partes = ["evt-1", "order-9", "ON_GOING", "2026-11-23T10:00:00Z"];
    const a = await buildEventKey("lalamove", partes);
    const b = await buildEventKey("lalamove", [...partes]);

    expect(a).not.toBeNull();
    expect(a!.key).toBe(b!.key);
    expect(a!.key).toBe("lalamove:evt-1-order-9-ON_GOING-2026-11-23T10:00:00Z");
    expect(a!.provider).toBe("lalamove");
    expect(a!.id).toBe("evt-1-order-9-ON_GOING-2026-11-23T10:00:00Z");
  });

  it("descarta partes vazias e devolve null quando nada identifica o evento", async () => {
    expect(await buildEventKey("lalamove", [undefined, null, "", "   "])).toBeNull();
    expect(await buildEventKey("carrier:R1", ["id-1", "", undefined])).toEqual({
      provider: "carrier:R1",
      id: "id-1",
      key: "carrier:R1:id-1",
    });
  });

  it("sem identificador, entra o hash do corpo - deterministico, nunca aleatorio", async () => {
    const corpo = {
      carrier_id: "R1",
      event_type: "ocorrencia",
      status: "em rota",
    };
    const a = await buildEventKey("carrier:R1", [], corpo);
    const b = await buildEventKey("carrier:R1", [], {
      status: "em rota",
      event_type: "ocorrencia",
      carrier_id: "R1",
    });
    const c = await buildEventKey("carrier:R1", [], {
      ...corpo,
      status: "entregue",
    });

    expect(a).not.toBeNull();
    expect(a!.id).toMatch(/^sha256-[0-9a-f]{32}$/);
    expect(a!.key).toBe(b!.key);
    expect(c!.key).not.toBe(a!.key);
    expect(a!.id).toBe(`sha256-${await bodyHash(corpo)}`);
  });

  it("chaves diferentes para identificadores diferentes", async () => {
    const a = await buildEventKey("lalamove", ["order-9", "ON_GOING"]);
    const b = await buildEventKey("lalamove", ["order-9", "COMPLETED"]);
    expect(a!.key).not.toBe(b!.key);
  });
});

describe("contrato na fonte dos webhooks (etapas 139, 140, 141)", () => {
  it("139 - lalamove nao inventa chave aleatoria e recusa evento sem identificador", () => {
    const src = fonte(LALAMOVE);

    expect(src).not.toMatch(/crypto\.randomUUID/);
    expect(src).toMatch(/buildEventKey\('lalamove'/);
    expect(src).toMatch(/const finalEventId = eventKey\.id;/);
    expect(src).toMatch(/status: 400/);
    expect(src).toMatch(
      /if \(!eventId && data\?\.orderId\) \{\s*const quando = data\?\.timestamp \|\| \(await bodyHash\(data\)\);/,
    );
    expect(src).toMatch(/const partesEvento: Array<string \| undefined> = \[eventId\];/);
  });

  it("140 - nexus nao usa o relogio do servidor na chave de dedupe", () => {
    const src = fonte(NEXUS);

    expect(src).not.toMatch(/Date\.now\(\)/);
    expect(src).toMatch(/buildEventKey\(\s*`nexus:\$\{body\.event \?\? body\.source \?\? "unknown"\}`/);
    expect(src).toMatch(/claimIdempotencyKey\(eventKey\.provider, eventKey\.id\)/);
  });

  it("141 - carrier nao colapsa eventos sem timestamp numa unica chave", () => {
    const src = fonte(CARRIER);

    expect(src).not.toMatch(/\$\{payload\.timestamp \?\? ""\}/);
    expect(src).toMatch(/buildEventKey\(\s*`carrier:\$\{payload\.carrier_id\}`/);
    expect(src).toMatch(
      /\[payload\.event_type, payload\.timestamp \|\| \(await bodyHash\(payload\)\)\]/,
    );
    expect(src).toMatch(/claimIdempotencyKey\(eventKey\.provider, eventKey\.id\)/);
  });
});
