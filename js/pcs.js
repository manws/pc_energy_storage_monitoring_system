import { PCS_FIELDS } from './data.js';
import { $, fmt, isNum } from './utils.js';

const STATUS_CLS = {
  运行: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
  待机: 'bg-slate-500/15 text-slate-300 border-slate-500/40',
  故障: 'bg-red-500/20 text-red-400 border-red-500/60'
};

function valueHtml(f, ch) {
  const v = ch[f.key];
  if (f.key === 'status') return `<span class="px-1.5 py-0.5 rounded border text-[11px] ${STATUS_CLS[v] || STATUS_CLS.待机}">${v}</span>`;
  if (['fault', 'pwmFault', 'dcdcFault'].includes(f.key)) {
    const ok = v === '无';
    return `<span class="${ok ? 'text-emerald-400' : 'text-red-400 font-semibold'}"><i class="${ok ? 'ri-checkbox-circle-line' : 'ri-error-warning-fill'}"></i> ${v}</span>`;
  }
  if (f.key === 'mode') return `<span class="${v.includes('防逆流') ? 'text-amber-300' : 'text-cyan-200'}">${v}</span>`;
  if (f.key === 'time') return `<span class="num text-slate-300">${String(v).slice(11) || '--'}</span>`;
  if (f.key === 'step') return `<span class="text-slate-200">${v}</span>`;
  if (isNum(v)) {
    const color = f.key === 'power' ? (v > 0 ? 'text-sky-300' : v < 0 ? 'text-amber-300' : 'text-white') : 'text-white';
    return `<span class="num ${color}">${fmt(v, f.d)}</span>`;
  }
  return `<span>${v ?? '--'}</span>`;
}

function compareView(pcs) {
  return `
    <table class="w-full text-xs">
      <thead>
        <tr class="text-slate-400">
          <th class="text-left font-normal py-1">参数</th>
          <th class="text-right font-normal py-1"><span class="text-cyan-300">● CH1</span></th>
          <th class="text-right font-normal py-1"><span class="text-violet-300">● CH2</span></th>
        </tr>
      </thead>
      <tbody>
        ${PCS_FIELDS.map((f, i) => `
          <tr class="${i % 2 ? '' : 'bg-sky-500/5'}">
            <td class="py-1 pl-1 text-slate-400 whitespace-nowrap">${f.label}</td>
            <td class="py-1 text-right">${valueHtml(f, pcs[0])}</td>
            <td class="py-1 pr-1 text-right">${valueHtml(f, pcs[1])}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

function singleView(ch) {
  const hero = ['voltage', 'current', 'power'];
  const rest = PCS_FIELDS.filter((f) => !hero.includes(f.key));
  return `
    <div class="flex flex-col gap-2">
      <div class="grid grid-cols-3 gap-2">
        ${PCS_FIELDS.filter((f) => hero.includes(f.key)).map((f) => `
          <div class="rounded border border-sky-500/25 bg-sky-500/5 p-2 text-center">
            <div class="text-[11px] text-slate-400">${f.label}</div>
            <div class="text-xl font-bold">${valueHtml(f, ch)}</div>
          </div>`).join('')}
      </div>
      <div class="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
        ${rest.map((f) => `
          <div class="flex items-center justify-between border-b border-slate-700/40 pb-1 gap-2">
            <span class="text-slate-400 whitespace-nowrap">${f.label}</span>
            <span class="text-right truncate">${valueHtml(f, ch)}</span>
          </div>`).join('')}
      </div>
    </div>`;
}

export function createPcsPanel() {
  const root = $('#pcsPanel');
  const tabs = $('#pcsTabs');
  let tab = 'both';
  let last = null;

  const render = () => {
    if (!last || !Array.isArray(last.pcs)) return;
    root.innerHTML = tab === 'both' ? compareView(last.pcs) : singleView(last.pcs[Number(tab)]);
  };

  tabs.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-tab]');
    if (!btn) return;
    tab = btn.dataset.tab;
    tabs.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('active', b === btn));
    render();
  });

  return {
    update(s) {
      last = s;
      render();
    }
  };
}
