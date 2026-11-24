import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

/**
 * Etapa 137 - o desenho "grava o marcador primeiro e trata o conflito" (B-01)
 * nao e testavel por importacao: as duas edge functions chamam `serve()` no
 * topo do modulo. O contrato e verificado na fonte, que e exatamente o que a
 * regressao mudaria.
 */
interface Caso {
  nome: string;
  caminho: string;
  primeiroWrite: string;
  /** Saida que nao grava nada e precisa continuar reprocessavel. */
  saidaSemWrite?: string;
}

const CASOS: Caso[] = [
  {
    nome: 'lalamove-webhook',
    caminho: 'supabase/functions/lalamove-webhook/index.ts',
    primeiroWrite: 'rastreamento_historico',
  },
  {
    nome: 'rodonaves-webhook',
    caminho: 'supabase/functions/rodonaves-webhook/index.ts',
    primeiroWrite: '.update(updateData)',
    saidaSemWrite: 'Entrega não encontrada',
  },
];

describe.each(CASOS)(
  'Contrato de idempotencia - $nome (B-01)',
  ({ caminho, primeiroWrite, saidaSemWrite }) => {
    const fonte = readFileSync(caminho, 'utf8');

    it('grava o marcador antes do primeiro write de negocio', () => {
      const marcador = fonte.indexOf('webhook_events_processed');
      const write = fonte.indexOf(primeiroWrite);

      expect(marcador).toBeGreaterThan(-1);
      expect(write).toBeGreaterThan(-1);
      expect(marcador).toBeLessThan(write);
    });

    it('trata a violacao de unicidade (23505) como duplicata', () => {
      expect(fonte).toMatch(/23505/);
      expect(fonte).toMatch(/duplicate: true/);
    });

    it('nao faz consulta previa nem gravacao tardia do marcador', () => {
      expect(fonte).not.toContain('existingEvent');
      expect(fonte).not.toContain('Mark as processed');
      expect(fonte).not.toContain('.maybeSingle()');
      const gravacoes = fonte.match(
        /from\(['"]webhook_events_processed['"]\)/g,
      );
      expect(gravacoes).toHaveLength(1);
    });

    if (saidaSemWrite) {
      it('mantem reprocessavel a saida que nao grava nada', () => {
        const saida = fonte.indexOf(saidaSemWrite);
        const marcador = fonte.indexOf('webhook_events_processed');
        expect(saida).toBeGreaterThan(-1);
        expect(saida).toBeLessThan(marcador);
      });
    }
  },
);
