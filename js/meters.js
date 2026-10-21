import { METERS, PHASES } from './data.js';
import { $, fmt, isNum, powerDir } from './utils.js';

const MAX_P = 150;

function listItem(m) {
  return `
    <button data-meter="${m.id}" class="meter-item w-full text-left rounded px-3 py-2 flex items-center gap-3" style="--c:${m.color}">
      <i class="${m.icon} text-xl" style="color:${m.color}"></i>
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between text-sm">
          <span class="text-slate-200">${m.name}</span>
          <span><span data-ps class="num text-lg font-bold" style="color:${m.color}">--</span><span class="text-[11px] text-slate-400 ml-1">kW</span></span>
        </div>
        <div class="flex items-center gap-2 mt-1">
          <div class="flex-1 h-1.5 rounded bg-slate-700/60 overflow-hidden">
            <div data-bar class="h-full rounded transition-all duration-700" style="width:0;background:linear-gradient(90deg,transparent,${m.color})"></div>
          </div>
          <span data-dir class="text-[11px] w-8 text-right">--</span>
        </div>
      </div>
    </button>`;
}

function phaseCard(ph, e) {
  const i = e[`i${ph.key}`];
  return `
    <div class="rounded border border-slate-700/60 bg-slate-900/40 p-2 relative overflow-hidden">
      <div class="absolute top-0 left-0 right-0 h-0.5" style="background:${ph.color}"></div>
      <div class="text-xs font-semibold mb-1" style="color:${ph.color}">${ph.name}</div>
      <div class="text-[11px] text-slate-400">电压</div>
      <div class="num text-base text-white">${fmt(e[`u${ph.key}`], 1)}<span class="text-[10px] text-slate-400 ml-0.5">V</span></div>
      <div class="text-[11px] text-slate-400 mt-1">电流</div>
      <div class="num text-base text-white">${fmt(i, 1)}<span class="text-[10px] text-slate-400 ml-0.5">A</span></div>
      <div class="h-1 rounded bg-slate-700/60 mt-1 overflow-hidden"><div class="h-full" style="width:${Math.min(100, (i / 240) * 100)}%;background:${ph.color}"></div></div>
      <div class="text-[11px] text-slate-400 mt-1">有功功率</div>
      <div class="num text-base text-white">${fmt(e[`p${ph.key}`], 2)}<span class="text-[10px] text-slate-400 ml-0.5">kW</span></div>
    </div>`;
}

function detailHtml(m, e, isBackflow) {
  const curr = [e.ia, e.ib, e.ic];
  const avg = (curr[0] + curr[1] + curr[2]) / 3;
  const unbalance = avg > 1 ? (Math.max(...curr.map((c) => Math.abs(c - avg))) / avg) * 100 : 0;
  const dir = powerDir(e.ps);
  const alarm = m.id === 'grid' && isBackflow;
  return `
    <div class="flex flex-col gap-3">
      <div class="rounded-md p-3 flex items-center justify-between border ${alarm ? 'border-red-500 alarm-pulse bg-red-950/40' : 'border-slate-700/60 bg-slate-900/40'}">
        <div>
          <div class="text-xs text-slate-400">总有功功率 Ps</div>
          <div class="num text-4xl font-bold" style="color:${alarm ? '#f87171' : m.color}">${fmt(e.ps, 2)}<span class="text-sm text-slate-400 ml-1">kW</span></div>
        </div>
        <div class="text-right text-xs leading-6">
          <div>方向 <span class="${dir.cls}">${dir.text}</span></div>
          <div>不平衡度 <span class="num text-white">${fmt(unbalance, 1)}%</span></div>
          <div class="text-slate-400">${m.device}</div>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-2">${PHASES.map((ph) => phaseCard(ph, e)).join('')}</div>
      <div class="grid grid-cols-3 gap-2">
        ${[['AB线电压', e.uab], ['BC线电压', e.ubc], ['CA线电压', e.uca]].map(([l, v]) => `
          <div class="rounded border border-sky-500/20 bg-sky-500/5 py-1.5 text-center">
            <div class="text-[11px] text-slate-400">${l}</div>
            <div class="num text-sm text-cyan-200">${fmt(v, 1)} V</div>
          </div>`).join('')}
      </div>
    </div>`;
}

export function createMeterPanel() {
  const listEl = $('#meterList');
  const detailEl = $('#meterDetail');
  const nameEl = $('#meterDetailName');
  const autoBtn = $('#meterAutoBtn');
  let selected = 'grid';
  let autoTimer = null;
  let lastState = null;

  listEl.innerHTML = METERS.map(listItem).join('');
  const items = Object.fromEntries(METERS.map((m) => {
    const el = listEl.querySelector(`[data-meter="${m.id}"]`);
    return [m.id, { el, ps: el.querySelector('[data-ps]'), bar: el.querySelector('[data-bar]'), dir: el.querySelector('[data-dir]') }];
  }));

  function renderDetail() {
    if (!lastState) return;
    const m = METERS.find((x) => x.id === selected);
    const e = lastState.meters[selected];
    if (!m || !e) return;
    nameEl.textContent = `${m.name} · 详细参数`;
    detailEl.innerHTML = detailHtml(m, e, lastState.backflow.active);
    METERS.forEach((x) => items[x.id].el.classList.toggle('active', x.id === selected));
  }

  function select(id) {
    selected = id;
    renderDetail();
  }

  listEl.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-meter]');
    if (btn) select(btn.dataset.meter);
  });

  autoBtn.addEventListener('click', () => {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    } else {
      autoTimer = setInterval(() => {
        const idx = METERS.findIndex((m) => m.id === selected);
        select(METERS[(idx + 1) % METERS.length].id);
      }, 6000);
    }
    autoBtn.classList.toggle('active', !!autoTimer);
    autoBtn.innerHTML = autoTimer ? '<i class="ri-pause-circle-line"></i> 轮播中' : '<i class="ri-play-circle-line"></i> 自动轮播';
  });

  function update(s) {
    lastState = s;
    METERS.forEach((m) => {
      const e = s.meters[m.id];
      if (!e || !isNum(e.ps)) return;
      const it = items[m.id];
      const alarm = m.id === 'grid' && s.backflow.active;
      it.ps.textContent = fmt(e.ps, 2);
      it.ps.style.color = alarm ? '#f87171' : m.color;
      it.bar.style.width = `${Math.min(100, (Math.abs(e.ps) / MAX_P) * 100)}%`;
      const d = powerDir(e.ps);
      it.dir.textContent = alarm ? '逆流' : d.text;
      it.dir.className = `text-[11px] w-8 text-right ${alarm ? 'text-red-400 font-bold' : d.cls}`;
    });
    renderDetail();
  }

  return { update, select };
}
