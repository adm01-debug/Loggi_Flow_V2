#!/usr/bin/env node
/**
 * W26: fonte única da regra "apply pendente".
 *
 * Chama check-migration-drift.mjs --classificar, escreve uma secao no
 * GITHUB_STEP_SUMMARY e sai com o mesmo codigo de saida:
 *   exit 0 — sem drift e sem apply-pendente (clean)
 *   exit 1 — drift real (arquivo em producao sem par no disco, ou vice-versa)
 *   exit 2 — somente apply-pendente (migrations no disco sem ledger no banco)
 *   exit 3 — nao classificado (check-migration-drift.mjs ausente ou nao executou)
 *
 * NOTA(loggi): check-migration-drift.mjs AINDA NAO foi portado do Zapp_Web_V2
 * para este repositorio (42KB, logica de ledger de migrations). Sem DESTINO_URL
 * este script sai 0 sem chamar o drift script. Com DESTINO_URL e o arquivo
 * ausente, sai 3 e diz isso no resumo: o types-sync so trata o exit 2 como
 * "aguardando apply", entao segue como sem apply pendente, sem afirmar um
 * drift que ninguem mediu.
 *
 * Uso:
 *   node scripts/db-audit/lote-pendente.mjs [-- <args extras para check-migration-drift>]
 */

import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRIFT_SCRIPT = path.join(__dirname, 'check-migration-drift.mjs');

function writeSummary(lines) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  try {
    appendFileSync(summaryPath, lines.join('\n') + '\n');
  } catch {
    // nao fatal
  }
}

// Sem DESTINO_URL nao ha banco para comparar; validacao local sempre passa.
if (!process.env.DESTINO_URL) {
  writeSummary([
    '### ✅ Lote pendente — sem drift',
    '',
    'DESTINO_URL nao definido; somente validacao local (sem banco).',
  ]);
  process.exitCode = 0;
} else if (!existsSync(DRIFT_SCRIPT)) {
  console.error('ERRO: scripts/db-audit/check-migration-drift.mjs ausente; apply pendente nao foi classificado.');
  writeSummary([
    '### ⚠️ Lote pendente — nao classificado',
    '',
    'scripts/db-audit/check-migration-drift.mjs nao existe neste repositorio;',
    'nao foi possivel comparar as migrations do disco com o ledger do banco.',
  ]);
  process.exitCode = 3;
} else {
  const result = spawnSync(
    process.execPath,
    [DRIFT_SCRIPT, '--classificar', ...process.argv.slice(2)],
    { stdio: 'inherit', encoding: 'utf8' },
  );

  const rc = result.status ?? 3;

  if (rc === 0) {
    writeSummary([
      '### ✅ Lote pendente — sem drift',
      '',
      'Todas as migrations locais estao registradas no ledger do banco.',
    ]);
  } else if (rc === 2) {
    writeSummary([
      '### ⏳ Lote pendente — apply aguardado',
      '',
      'Existem migrations no disco sem registro no ledger do banco.',
      'O apply acontecera no ciclo de lote do dia.',
      '',
      '> Nao e drift — e o estado esperado entre o merge e o apply.',
    ]);
  } else if (rc === 3) {
    writeSummary([
      '### ⚠️ Lote pendente — nao classificado',
      '',
      'check-migration-drift.mjs nao terminou (encerrado por sinal ou falha ao iniciar).',
    ]);
  } else {
    writeSummary([
      '### ❌ Lote pendente — drift real detectado',
      '',
      'Ha diferenca entre as migrations no disco e o ledger do banco.',
    ]);
  }

  process.exitCode = rc;
}
