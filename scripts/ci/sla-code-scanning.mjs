#!/usr/bin/env node
// W83 — SLA dos alertas abertos de Code Scanning (usado pelo branch-hygiene-audit.yml).
// high/critical → 14 dias; medium/low → 30 dias. Violação → exit 1.
//
// Saiu do YAML em 15/10/2026: inline no workflow, o heredoc do Node estava menos
// indentado que o `run: |` e o arquivo inteiro virou YAML inválido (o GitHub
// recusava o workflow em todo push). Mesmo corrigida a indentação, o passo tinha
// dois defeitos: `echo $ALERTAS | node - <<EOF` entregava o heredoc no stdin e o
// JSON se perdia; e a severidade vinha de `rule.severity` (error/warning/note),
// que nunca vale "high" — nenhum alerta recebia o SLA de 14 dias.
//
// Uso: node scripts/ci/sla-code-scanning.mjs < alertas.json  (markdown no stdout)

import { readFileSync } from 'node:fs';
import { executadoDiretamente } from '../lib/seguranca-processo.mjs';

export const SLA_DIAS = { alto: 14, baixo: 30 };

// security_severity_level (low/medium/high/critical) e o campo de severidade de
// seguranca; regras sem ele (qualidade) usam rule.severity: error conta como alto.
export function nivel(alerta) {
  const seg = alerta?.rule?.security_severity_level;
  if (seg) return String(seg).toLowerCase();
  return alerta?.rule?.severity === 'error' ? 'high' : 'low';
}

// O id da regra e o caminho do arquivo vêm do conteúdo analisado: sem caractere de
// controle, para uma quebra de linha não virar outro comando `::` no log do Actions
// nem fechar o bloco de código do relatório.
function emUmaLinha(valor) {
  return String(valor).replace(/[\u0000-\u001f\u007f]+/g, ' ').replaceAll('`', "'");
}

export function avaliarSla(alertas, agoraMs = Date.now()) {
  const violacoes = [];
  for (const a of alertas) {
    const sev = emUmaLinha(nivel(a));
    const prazo = sev === 'high' || sev === 'critical' ? SLA_DIAS.alto : SLA_DIAS.baixo;
    const dias = Math.floor((agoraMs - new Date(a?.created_at ?? Number.NaN).getTime()) / 86_400_000);
    const onde = `#${emUmaLinha(a?.number ?? '?')}: ${emUmaLinha(a?.rule?.id ?? '?')} em ${emUmaLinha(a?.most_recent_instance?.location?.path ?? '?')}`;
    // Sem `created_at` válido não dá para provar que o alerta está no prazo: conta
    // como violação (antes passava como "dentro do SLA").
    if (!Number.isFinite(dias)) violacoes.push(`${sev.toUpperCase()} (idade desconhecida: created_at inválido) — ${onde}`);
    else if (dias > prazo) violacoes.push(`${sev.toUpperCase()} (${dias}d > ${prazo}d) — ${onde}`);
  }
  return { total: alertas.length, violacoes };
}

export function relatorio({ total, violacoes }) {
  const linhas = [
    '',
    '### 🔒 Code Scanning — SLA (W83)',
    '',
    `SLA: high/critical → ${SLA_DIAS.alto}d · medium/low → ${SLA_DIAS.baixo}d`,
    '',
    `Alertas abertos: ${total}`,
    '',
  ];
  if (violacoes.length) linhas.push('⚠️ **Violações de SLA:**', '```', ...violacoes, '```');
  else linhas.push('✅ Nenhuma violação de SLA.');
  return `${linhas.join('\n')}\n`;
}

// Lê o JSON do stdin (`node sla-code-scanning.mjs < alertas.json`): o script não
// recebe caminho nenhum, então não há caminho a validar.
function main() {
  let alertas;
  try {
    alertas = JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    alertas = null;
  }
  if (!Array.isArray(alertas)) {
    // Repo privado sem GitHub Advanced Security responde 403/404 aqui: é o caso
    // esperado enquanto o code scanning não estiver habilitado, por isso exit 0.
    const detalhe = typeof alertas?.message === 'string' ? ` Resposta: ${emUmaLinha(alertas.message)}` : '';
    console.error('::warning::W83: a API não devolveu uma lista de alertas');
    process.stdout.write(`\n### ⚠️ Code Scanning — SLA (W83)\n\nNão foi possível consultar os alertas (permissão, API ou code scanning não habilitado no repositório).${detalhe}\n`);
    return;
  }
  const r = avaliarSla(alertas);
  process.stdout.write(relatorio(r));
  if (r.violacoes.length) {
    for (const v of r.violacoes) console.error(`::error::W83: SLA vencido — ${v.replaceAll('%', '%25')}`);
    process.exitCode = 1;
  }
}

if (executadoDiretamente(import.meta.url)) main();
