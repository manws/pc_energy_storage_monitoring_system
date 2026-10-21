import { METERS, PHASE_TEXT } from './data.js';
import { $, fmt, isNum } from './utils.js';

const BUS_X = 380;
const BRANCHES = [
  { id: 'ess', y: 40 },
  { id: 'cab1', y: 100 },
  { id: 'cab2', y: 160 },
  { id: 'cab3', y: 220 },
  { id: 'base', y: 280 }
];
const LOAD = { id: 'base', short: '厂区负载', name: '厂区负载(计算)', color: '#38bdf8', icon: 'ri-home-gear-line', device: '照明/空调/动力' };

const pos = (x, y) => `left:${x / 10}%;top:${y / 3.2}%`;

function node(x, y, inner, extra = '') {
  return `<div class="absolute -translate-x-1/2 -translate-y-1/2 ${extra}" style="${pos(x, y)}">${inner}</div>`;
}

function track(id, d, color) {
  return `
    <path d="${d}" stroke="${color}" stroke-opacity=".22" stroke-width="3" fill="none"/>
    <path id="flow-${id}" class="flow" d="${d}" stroke="${color}" stroke-width="3" fill="none" stroke-linecap="round" style="filter:drop-shadow(0 0 4px ${color})"/>`;
}

export function createTopology() {
  const root = $('#topology');
  const metas = BRANCHES.map((b) => ({ ...b, m: b.id === 'base' ? LOAD : METERS.find((x) => x.id === b.id) }));
  const grid = METERS[0];

  const svg = `
    <svg class="absolute inset-0 w-full h-full" viewBox="0 0 1000 320">
      <defs>
        <linearGradient id="busGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#22d3ee"/><stop offset="1" stop-color="#2563eb"/>
        </linearGradient>
      </defs>
      ${track('grid', `M110 160 H${BUS_X}`, grid.color)}
      ${metas.map((b) => track(b.id, `M${BUS_X} ${b.y} H780`, b.m.color)).join('')}
      <line x1="${BUS_X}" y1="26" x2="${BUS_X}" y2="294" stroke="url(#busGrad)" stroke-width="7" stroke-linecap="round" style="filter:drop-shadow(0 0 6px #22d3ee)"/>
      <text x="${BUS_X + 10}" y="314" fill="#7dd3fc" font-size="12">0.4kV 低压母线</text>
    </svg>`;

  const nodes = [
    node(60, 160, `
      <div class="flex flex-col items-center">
        <div class="w-12 h-12 rounded-full grid place-items-center border border-cyan-400/60 bg-cyan-500/10 shadow-[0_0_18px_rgba(34,211,238,.45)]"><i class="ri-government-line text-2xl text-cyan-300"></i></div>
        <div class="text-[11px] text-slate-300 mt-1 whitespace-nowrap">市电电网</div>
      </div>`),
    node(240, 160, `
      <div id="topo-grid" class="rounded-md border px-3 py-1.5 text-center bg-slate-950/80 border-cyan-400/60 transition">
        <div class="text-[11px] text-slate-300 whitespace-nowrap"><i class="ri-dashboard-3-line text-cyan-300"></i> 市电电表</div>
        <div class="num text-lg font-bold leading-5" data-v style="color:${grid.color}">--</div>
        <div class="text-[10px]" data-s>--</div>
      </div>`),
    ...metas.map((b) => node(575, b.y, `
      <div id="topo-${b.id}" class="rounded border px-2 py-0.5 bg-slate-950/85 flex items-center gap-2 whitespace-nowrap" style="border-color:${b.m.color}80">
        <i class="${b.id === 'base' ? 'ri-calculator-line' : 'ri-dashboard-3-line'} text-sm" style="color:${b.m.color}"></i>
        <span class="text-[11px] text-slate-300">${b.m.name}</span>
        <span class="num text-sm font-bold" data-v style="color:${b.m.color}">--</span>
      </div>`)),
    ...metas.map((b) => node(870, b.y, `
      <div class="rounded border px-2 py-0.5 bg-slate-900/80 flex items-center gap-2 whitespace-nowrap" style="border-color:${b.m.color}55">
        <i class="${b.m.icon} text-base" style="color:${b.m.color}"></i>
        <div class="leading-4">
          <div class="text-[11px] text-slate-200">${b.id === 'base' ? LOAD.device : b.m.device}</div>
          <div class="text-[10px] text-slate-400" id="dev-${b.id}">--</div>
        </div>
      </div>`))
  ];

  root.innerHTML = `<div class="relative w-full" style="aspect-ratio:1000/320">${svg}${nodes.join('')}</div>`;

  const flowEl = (id) => root.querySelector(`#flow-${id}`);

  function setFlow(id, p, alarm) {
    const el = flowEl(id);
    if (!el || !isNum(p)) return;
    const idle = Math.abs(p) < 0.5;
    el.classList.toggle('idle', idle);
    el.classList.toggle('rev', p < 0);
    el.style.animationDuration = `${Math.max(0.35, 1.6 - Math.abs(p) / 100)}s`;
    if (id === 'grid') {
      el.setAttribute('stroke', alarm ? '#ef4444' : METERS[0].color);
      el.style.filter = `drop-shadow(0 0 ${alarm ? 8 : 4}px ${alarm ? '#ef4444' : METERS[0].color})`;
    }
  }

  function update(s) {
    const P = s.power;
    const alarm = s.backflow.active;
    setFlow('grid', P.grid, alarm);
    const g = root.querySelector('#topo-grid');
    g.querySelector('[data-v]').textContent = `${fmt(P.grid, 1)} kW`;
    g.querySelector('[data-v]').style.color = alarm ? '#f87171' : METERS[0].color;
    g.querySelector('[data-s]').innerHTML = alarm ? '<span class="text-red-400 font-bold">⚠ 逆流</span>' : '<span class="text-emerald-400">受电正常</span>';
    g.classList.toggle('alarm-pulse', alarm);

    metas.forEach((b) => {
      const p = P[b.id];
      setFlow(b.id, p, false);
      const chip = root.querySelector(`#topo-${b.id} [data-v]`);
      if (chip) chip.textContent = `${fmt(p, 1)} kW`;
      const dev = root.querySelector(`#dev-${b.id}`);
      if (!dev) return;
      if (b.id === 'ess') dev.textContent = `SOC ${fmt(s.bms.soc, 1)}% · ${p > 0.5 ? '充电' : p < -0.5 ? '放电' : '静置'}`;
      else if (b.id === 'base') dev.textContent = '常规用电负载';
      else dev.textContent = `${PHASE_TEXT[s.cabPhase[b.id]] || '--'}`;
    });
  }

  return { update };
}
