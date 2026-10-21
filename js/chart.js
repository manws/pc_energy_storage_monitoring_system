import { echarts } from './echarts.js';
import { METERS, HISTORY_MS } from './data.js';
import { $, fmt, fmtTime, pad } from './utils.js';

function legendChip(m) {
  return `
    <button data-name="${m.short}" class="chip rounded-full pl-2 pr-3 py-1 flex items-center gap-2 text-xs transition">
      <span class="w-2.5 h-2.5 rounded-full" style="background:${m.color};box-shadow:0 0 8px ${m.color}"></span>
      <span class="text-slate-300">${m.short}</span>
      <span data-v class="num font-bold" style="color:${m.color}">--</span>
    </button>`;
}

export function createPsChart() {
  const el = $('#psChart');
  const legendEl = $('#chartLegend');
  const rangeEl = $('#rangeTabs');
  const chart = echarts.init(el, null, { renderer: 'canvas' });
  let range = HISTORY_MS;
  const hidden = new Set();

  legendEl.innerHTML = METERS.map(legendChip).join('');

  chart.setOption({
    animation: false,
    grid: { left: 52, right: 24, top: 24, bottom: 30 },
    legend: { show: false, data: METERS.map((m) => m.short) },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(2,12,30,.92)',
      borderColor: 'rgba(34,211,238,.5)',
      textStyle: { color: '#e2e8f0', fontSize: 12 },
      axisPointer: { type: 'line', lineStyle: { color: 'rgba(34,211,238,.6)' } },
      formatter: (items) => {
        if (!Array.isArray(items) || !items.length) return '';
        const t = fmtTime(items[0].value[0]);
        return `<div style="margin-bottom:4px;color:#94a3b8">${t}</div>` + items.map((it) => {
          const v = Array.isArray(it.value) ? it.value[1] : null;
          const warn = it.seriesName === '市电' && v < 0;
          return `<div style="display:flex;justify-content:space-between;gap:18px"><span>${it.marker}${it.seriesName}</span><b style="color:${warn ? '#f87171' : '#fff'}">${fmt(v, 2)} kW</b></div>`;
        }).join('');
      }
    },
    xAxis: {
      type: 'time',
      axisLine: { lineStyle: { color: 'rgba(148,163,184,.3)' } },
      axisLabel: { color: '#94a3b8', formatter: (v) => { const d = new Date(v); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; } },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      name: 'kW',
      nameTextStyle: { color: '#94a3b8' },
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: 'rgba(148,163,184,.1)', type: 'dashed' } }
    },
    series: METERS.map((m, i) => ({
      name: m.short,
      type: 'line',
      showSymbol: false,
      smooth: true,
      sampling: 'lttb',
      data: [],
      z: i === 0 ? 10 : 2,
      lineStyle: { width: i === 0 ? 2.6 : 1.4, color: m.color },
      itemStyle: { color: m.color },
      areaStyle: i === 0 ? { opacity: 0.12 } : undefined,
      markLine: i === 0 ? {
        symbol: 'none',
        silent: true,
        lineStyle: { color: '#ef4444', type: 'dashed', width: 1.5 },
        label: { formatter: '防逆流线 0kW', color: '#f87171', position: 'insideEndTop' },
        data: [{ yAxis: 0 }]
      } : undefined
    }))
  });

  legendEl.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-name]');
    if (!btn) return;
    const name = btn.dataset.name;
    if (hidden.has(name)) hidden.delete(name);
    else hidden.add(name);
    btn.style.opacity = hidden.has(name) ? '.35' : '1';
    chart.dispatchAction({ type: 'legendToggleSelect', name });
  });

  rangeEl.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-range]');
    if (!btn) return;
    range = Number(btn.dataset.range) || HISTORY_MS;
    rangeEl.querySelectorAll('[data-range]').forEach((b) => b.classList.toggle('active', b === btn));
    if (lastState) update(lastState);
  });

  let lastState = null;
  function update(s) {
    lastState = s;
    const now = s.ts;
    chart.setOption({
      xAxis: { min: now - range, max: now },
      series: METERS.map((m) => ({ data: s.history[m.id].slice() }))
    });
    METERS.forEach((m) => {
      const v = s.meters[m.id]?.ps;
      const chip = legendEl.querySelector(`[data-name="${m.short}"] [data-v]`);
      if (!chip) return;
      chip.textContent = `${fmt(v, 1)}kW`;
      chip.style.color = m.id === 'grid' && v < 0 ? '#f87171' : m.color;
    });
  }

  window.addEventListener('resize', () => chart.resize());
  return { update, chart };
}
