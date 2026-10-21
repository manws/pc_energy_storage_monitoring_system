export const rand = (a: number, b: number): number => a + Math.random() * (b - a);

export const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));

export const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export const fmt = (v: unknown, d = 1): string => (isNum(v) ? v.toFixed(d) : '--');

export const pad = (n: number): string => String(n).padStart(2, '0');

export function fmtTime(ts: number, withDate = false): string {
  if (!isNum(ts) || ts <= 0) return '--';
  const d = new Date(ts);
  const t = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  if (!withDate) return t;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${t}`;
}

export function fmtDuration(sec: number): string {
  if (!isNum(sec)) return '--';
  const s = Math.round(sec);
  if (s < 60) return `${s}秒`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}分${s % 60}秒`;
  return `${Math.floor(m / 60)}时${m % 60}分`;
}

export interface DirInfo {
  text: string;
  cls: string;
}

export function powerDir(p: number, posText = '受电', negText = '馈电'): DirInfo {
  if (!isNum(p) || Math.abs(p) < 0.5) return { text: '静置', cls: 'text-slate-400' };
  return p > 0 ? { text: posText, cls: 'text-emerald-400' } : { text: negText, cls: 'text-sky-400' };
}

export function sparkPath(values: number[], w: number, h: number, zeroLine = false): { line: string; area: string; zeroY: number } {
  const n = values.length;
  if (n < 2) return { line: '', area: '', zeroY: h };
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (zeroLine) {
    min = Math.min(min, 0);
    max = Math.max(max, 0);
  }
  const span = max - min || 1;
  const step = w / (n - 1);
  let line = '';
  for (let i = 0; i < n; i++) {
    const x = i * step;
    const y = h - ((values[i] - min) / span) * (h - 2) - 1;
    line += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  const zeroY = h - ((0 - min) / span) * (h - 2) - 1;
  return { line, area: `${line}L${w} ${h}L0 ${h}Z`, zeroY };
}

export function downsample(values: number[], target: number): number[] {
  if (values.length <= target) return values;
  const out: number[] = [];
  const bucket = values.length / target;
  for (let i = 0; i < target; i++) {
    const s = Math.floor(i * bucket);
    const e = Math.floor((i + 1) * bucket);
    let sum = 0;
    for (let k = s; k < e; k++) sum += values[k];
    out.push(sum / Math.max(1, e - s));
  }
  return out;
}
