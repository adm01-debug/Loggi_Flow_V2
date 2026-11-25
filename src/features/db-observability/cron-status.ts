// Veredito sobre o estado do pg_cron usando so o que `get_cron_jobs_status()` ja devolve
// (schedule, active, last_start, last_status): a tela passa a dizer o que deu errado em vez de
// apenas listar os jobs. Nenhuma RPC nova e nenhum DDL.
import type { CronJobStatus } from "./types";

export type SituacaoCron = "falha" | "atrasado" | "sem_historico" | "parado" | "ok";

export interface CronJobAvaliado {
  job: CronJobStatus;
  situacao: SituacaoCron;
  /** proximo disparo esperado depois de `last_start`; `null` quando nao da para calcular */
  proxima: Date | null;
}

export interface ResumoCron {
  total: number;
  falha: number;
  atrasado: number;
  sem_historico: number;
  parado: number;
  ok: number;
  /** o que pede atencao de quem olha a tela: falha + atrasado + sem_historico */
  em_alerta: number;
}

const MINUTO = 60_000;
const DIA = 24 * 60 * MINUTO;
// O pg_cron agenda em UTC e aceita exatamente 5 campos (sem segundos nem ano).
const JANELA_DIAS = 370;

interface Cron {
  minutos: Set<number>;
  horas: Set<number>;
  dias: Set<number>;
  meses: Set<number>;
  semana: Set<number>;
  diaCoringa: boolean;
  semanaCoringa: boolean;
}

function expandirParte(parte: string, min: number, max: number): { de: number; ate: number; passo: number } | null {
  const [faixa, passoTexto, ...resto] = parte.split("/");
  if (resto.length > 0 || !faixa) return null;
  const passo = passoTexto === undefined ? 1 : Number(passoTexto);
  if (!Number.isInteger(passo) || passo < 1) return null;
  let de: number;
  let ate: number;
  if (faixa === "*") {
    de = min;
    ate = max;
  } else if (faixa.includes("-")) {
    const [a, b, ...mais] = faixa.split("-");
    if (mais.length > 0) return null;
    de = Number(a);
    ate = Number(b);
  } else {
    de = Number(faixa);
    // "30/15" significa "de 30 ate o fim, de 15 em 15".
    ate = passoTexto === undefined ? de : max;
  }
  if (!Number.isInteger(de) || !Number.isInteger(ate)) return null;
  if (de < min || ate > max || de > ate) return null;
  return { de, ate, passo };
}

function expandir(campo: string, min: number, max: number): Set<number> | null {
  if (!campo) return null;
  const out = new Set<number>();
  for (const parte of campo.split(",")) {
    const r = expandirParte(parte, min, max);
    if (!r) return null;
    for (let v = r.de; v <= r.ate; v += r.passo) out.add(v);
  }
  return out.size > 0 ? out : null;
}

/** Interpreta um `schedule` do pg_cron. `null` = formato que nao sabemos ler (e nao inventamos atraso). */
export function interpretarSchedule(schedule: string): Cron | null {
  const campos = String(schedule ?? "").trim().split(/\s+/);
  if (campos.length !== 5) return null;
  const minutos = expandir(campos[0], 0, 59);
  const horas = expandir(campos[1], 0, 23);
  const dias = expandir(campos[2], 1, 31);
  const meses = expandir(campos[3], 1, 12);
  const semana = expandir(campos[4], 0, 6);
  if (!minutos || !horas || !dias || !meses || !semana) return null;
  return {
    minutos,
    horas,
    dias,
    meses,
    semana,
    diaCoringa: campos[2] === "*",
    semanaCoringa: campos[4] === "*",
  };
}

function casaData(c: Cron, dia: Date): boolean {
  if (!c.meses.has(dia.getUTCMonth() + 1)) return false;
  const casaDia = c.dias.has(dia.getUTCDate());
  const casaSemana = c.semana.has(dia.getUTCDay());
  // Regra do cron: com dia-do-mes e dia-da-semana ambos restritos, vale OR; com um deles em `*`, AND.
  if (c.diaCoringa && c.semanaCoringa) return true;
  if (c.diaCoringa) return casaSemana;
  if (c.semanaCoringa) return casaDia;
  return casaDia || casaSemana;
}

const cache = new Map<string, Date | null>();

function primeiroDoDia(dia: Date, horas: number[], minutos: number[], limite: number): Date | null {
  for (const h of horas) {
    for (const m of minutos) {
      const t = Date.UTC(dia.getUTCFullYear(), dia.getUTCMonth(), dia.getUTCDate(), h, m);
      if (t / MINUTO > limite) return new Date(t);
    }
  }
  return null;
}

function buscarProximo(c: Cron, limite: number): Date | null {
  const minutos = [...c.minutos].sort((a, b) => a - b);
  const horas = [...c.horas].sort((a, b) => a - b);
  const hoje = new Date(limite * MINUTO);
  const base = Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate());
  for (let d = 0; d <= JANELA_DIAS; d++) {
    const dia = new Date(base + d * DIA);
    if (!casaData(c, dia)) continue;
    const achado = primeiroDoDia(dia, horas, minutos, limite);
    if (achado) return achado;
  }
  return null;
}

/** Primeiro disparo do `schedule` depois de `depois` (UTC, precisao de minuto). */
export function proximaOcorrencia(schedule: string, depois: Date): Date | null {
  const chave = `${schedule}|${depois.getTime()}`;
  if (cache.has(chave)) return cache.get(chave) ?? null;
  const c = interpretarSchedule(schedule);
  const achado = c ? buscarProximo(c, depois.getTime() / MINUTO) : null;
  if (cache.size > 500) cache.clear();
  cache.set(chave, achado);
  return achado;
}

export function avaliarCronJob(job: CronJobStatus, agora: Date): CronJobAvaliado {
  if (!job.active) return { job, situacao: "parado", proxima: null };
  if (job.last_status === "failed") return { job, situacao: "falha", proxima: null };
  if (!job.last_start) return { job, situacao: "sem_historico", proxima: null };
  const inicio = new Date(job.last_start);
  if (Number.isNaN(inicio.getTime())) return { job, situacao: "sem_historico", proxima: null };
  const proxima = proximaOcorrencia(job.schedule, inicio);
  // Sem saber ler o schedule nao classificamos atraso: melhor "ok" do que alarme falso.
  if (!proxima) return { job, situacao: "ok", proxima: null };
  // Atrasado = perdeu uma janela inteira: o proximo disparo passou e a folga entre dois disparos tambem.
  const folga = Math.max(proxima.getTime() - inicio.getTime(), MINUTO);
  return {
    job,
    situacao: agora.getTime() - proxima.getTime() > folga ? "atrasado" : "ok",
    proxima,
  };
}

const PESO: Record<SituacaoCron, number> = {
  falha: 0,
  atrasado: 1,
  sem_historico: 2,
  parado: 3,
  ok: 4,
};

/** Avalia a lista e devolve os problemas primeiro, com o resumo que a tela mostra no topo. */
export function avaliarCronJobs(
  jobs: CronJobStatus[],
  agora: Date = new Date(),
): { itens: CronJobAvaliado[]; resumo: ResumoCron } {
  const itens = jobs
    .map((job) => avaliarCronJob(job, agora))
    .sort((a, b) => PESO[a.situacao] - PESO[b.situacao] || a.job.jobname.localeCompare(b.job.jobname));
  const resumo: ResumoCron = {
    total: itens.length,
    falha: 0,
    atrasado: 0,
    sem_historico: 0,
    parado: 0,
    ok: 0,
    em_alerta: 0,
  };
  for (const i of itens) resumo[i.situacao] += 1;
  resumo.em_alerta = resumo.falha + resumo.atrasado + resumo.sem_historico;
  return { itens, resumo };
}
