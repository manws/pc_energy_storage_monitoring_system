export const $ = (sel, root = document) => root.querySelector(sel);

export const rand = (a, b) => a + Math.random() * (b - a);

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

export const fmt = (v, d = 1) => (isNum(v) ? v.toFixed(d) : '--');

export const pad = (n) => String(n).padStart(2, '0');

export function fmtTime(ts, withDate = false) {
  if (!isNum(ts)) return '--';
  const d = new Date(ts);
  const t = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  if (!withDate) return t;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${t}`;
}

export function fmtDuration(sec) {
  if (!isNum(sec)) return '--';
  const s = Math.round(sec);
  if (s < 60) return `${s}秒`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}分${s % 60}秒`;
  return `${Math.floor(m / 60)}时${m % 60}分`;
}

export function powerDir(p, posText = '受电', negText = '馈电') {
  if (!isNum(p) || Math.abs(p) < 0.5) return { text: '静置', cls: 'text-slate-400' };
  return p > 0 ? { text: posText, cls: 'text-sky-400' } : { text: negText, cls: 'text-amber-400' };
}
