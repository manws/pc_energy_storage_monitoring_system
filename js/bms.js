import { echarts } from './echarts.js';
import { BMS_FIELDS, CELL_COUNT, TEMP_COUNT } from './data.js';
import { $, fmt, isNum } from './utils.js';

const STORE_KEY = 'bms-pinned-fields';
const DEFAULT_PINNED = ['totalV', 'totalI', 'maxCellV', 'minCellV', 'maxT', 'minT'];

function loadPinned() {
  try {
    const v = JSON.parse(localStorage.getItem(STORE_KEY));
    if (Array.isArray(v) && v.every((k) => BMS_FIELDS.some((f) => f.key === k))) return v;
  } catch (e) { /* ignore */ }
  return [...DEFAULT_PINNED];
}

const valText = (f, b) => {
  const v = b[f.key];
  if (!isNum(v)) return '--';
  return `${f.prefix || ''}${fmt(v, f.d)}`;
};

function pinnedCard(f, b) {
  return `
    <div class="rounded border bg-slate-900/50 px-2 py-1.5" style="border-color:${f.color}55">
      <div class="text-[11px] text-slate-400 flex items-center gap-1"><i class="${f.icon}" style="color:${f.color}"></i>${f.label}</div>
      <div class="num text-lg font-bold leading-6" style="color:${f.color}">${valText(f, b)}<span class="text-[10px] text-slate-400 ml-0.5">${f.unit}</span></div>
    </div>`;
}

function otherRow(f, b) {
  return `
    <div class="flex justify-between items-center text-xs border-b border-slate-700/40 py-1">
      <span class="text-slate-400">${f.label}</span>
      <span class="num text-slate-100">${valText(f, b)}${f.unit ? ` ${f.unit}` : ''}</span>
    </div>`;
}

function heatColor(t) {
  const hue = 210 - 210 * Math.min(1, Math.max(0, t));
  return `hsl(${hue} 85% 55%)`;
}

function heatmap(values, maxNo, minNo, unit, d) {
  if (!Array.isArray(values) || !values.length) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values.map((v, i) => {
    const no = i + 1;
    const mark = no === maxNo ? 'outline outline-2 outline-white z-10' : no === minNo ? 'outline outline-2 outline-cyan-200 z-10' : '';
    return `<div title="#${no}  ${v.toFixed(d)}${unit}" class="aspect-square rounded-[2px] relative ${mark}" style="background:${heatColor((v - min) / span)}"></div>`;
  }).join('');
}

export function createBmsPanel() {
  const root = $('#bmsPanel');
  const modalRoot = $('#modalRoot');
  let pinned = loadPinned();
  let heatMode = 'v';
  let last = null;

  root.innerHTML = `
    <div class="flex flex-col gap-3 h-full">
      <div class="flex gap-3 items-stretch">
        <div class="relative w-[140px] shrink-0">
          <div id="bmsGauge" class="w-[140px] h-[140px]"></div>
          <div id="bmsSocTag" class="text-center text-[11px] text-slate-400 -mt-2">--</div>
        </div>
        <div id="bmsPinned" class="flex-1 grid grid-cols-2 gap-2 content-start"></div>
      </div>
      <div id="bmsOthers" class="grid grid-cols-2 gap-x-4"></div>
      <div class="rounded border border-slate-700/60 bg-slate-900/40 p-2">
        <div class="flex items-center justify-between mb-2">
          <div class="text-xs text-slate-300"><i class="ri-grid-line text-cyan-300"></i> <span id="heatTitle">单体电压分布</span> <span id="heatDelta" class="num text-[11px] text-slate-400 ml-1"></span></div>
          <div id="heatTabs" class="flex gap-1">
            <button class="chip active rounded px-2 py-0.5 text-[11px]" data-heat="v">电压</button>
            <button class="chip rounded px-2 py-0.5 text-[11px]" data-heat="t">温度</button>
          </div>
        </div>
        <div id="bmsHeat" class="grid gap-[2px]"></div>
        <div class="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
          <span>低</span><div class="flex-1 h-1.5 rounded" style="background:linear-gradient(90deg,hsl(210 85% 55%),hsl(120 85% 55%),hsl(50 85% 55%),hsl(0 85% 55%))"></div><span>高</span>
          <span class="ml-2"><span class="inline-block w-2 h-2 outline outline-2 outline-white mr-1"></span>最大</span>
          <span><span class="inline-block w-2 h-2 outline outline-2 outline-cyan-200 mr-1"></span>最小</span>
        </div>
      </div>
    </div>`;

  const gauge = echarts.init($('#bmsGauge'));
  gauge.setOption({
    series: [{
      type: 'gauge',
      startAngle: 220,
      endAngle: -40,
      min: 0,
      max: 100,
      radius: '92%',
      progress: { show: true, width: 10, roundCap: true, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#22d3ee' }, { offset: 1, color: '#a78bfa' }]), shadowBlur: 10, shadowColor: '#22d3ee' } },
      axisLine: { roundCap: true, lineStyle: { width: 10, color: [[1, 'rgba(56,189,248,.15)']] } },
      axisTick: { distance: -18, splitNumber: 2, lineStyle: { color: 'rgba(148,163,184,.5)', width: 1 } },
      splitLine: { distance: -20, length: 6, lineStyle: { color: 'rgba(148,163,184,.7)', width: 1.5 } },
      axisLabel: { show: false },
      pointer: { show: false },
      anchor: { show: false },
      title: { offsetCenter: [0, '32%'], color: '#94a3b8', fontSize: 11 },
      detail: { valueAnimation: true, offsetCenter: [0, '-4%'], fontSize: 26, fontWeight: 'bold', color: '#fff', formatter: '{value}%', fontFamily: 'Bahnschrift, Consolas, monospace' },
      data: [{ value: 0, name: 'SOC' }]
    }]
  });
  window.addEventListener('resize', () => gauge.resize());

  const heatEl = $('#bmsHeat');
  const heatTabs = $('#heatTabs');

  heatTabs.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-heat]');
    if (!btn) return;
    heatMode = btn.dataset.heat;
    heatTabs.querySelectorAll('[data-heat]').forEach((b) => b.classList.toggle('active', b === btn));
    renderHeat();
  });

  function renderHeat() {
    if (!last) return;
    const b = last.bms;
    if (heatMode === 'v') {
      heatEl.style.gridTemplateColumns = 'repeat(28, minmax(0, 1fr))';
      $('#heatTitle').textContent = `单体电压分布（${CELL_COUNT}串）`;
      $('#heatDelta').textContent = `压差 ${fmt((b.maxCellV - b.minCellV) * 1000, 0)} mV`;
      heatEl.innerHTML = heatmap(b.cells, b.maxCellNo, b.minCellNo, 'V', 3);
    } else {
      heatEl.style.gridTemplateColumns = 'repeat(16, minmax(0, 1fr))';
      $('#heatTitle').textContent = `温度点分布（${TEMP_COUNT}点）`;
      $('#heatDelta').textContent = `温差 ${fmt(b.maxT - b.minT, 1)} ℃`;
      heatEl.innerHTML = heatmap(b.temps, b.maxTNo, b.minTNo, '℃', 1);
    }
  }

  function renderFields() {
    if (!last) return;
    const b = last.bms;
    const pinnedFields = BMS_FIELDS.filter((f) => pinned.includes(f.key));
    const others = BMS_FIELDS.filter((f) => !pinned.includes(f.key));
    $('#bmsPinned').innerHTML = pinnedFields.length ? pinnedFields.map((f) => pinnedCard(f, b)).join('')
      : '<div class="col-span-2 text-xs text-slate-500 grid place-items-center h-full">未选择重点显示项</div>';
    $('#bmsOthers').innerHTML = others.map((f) => otherRow(f, b)).join('');
  }

  function openModal() {
    modalRoot.innerHTML = `
      <div data-close class="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm grid place-items-center p-4">
        <div class="panel w-full max-w-md fade-in">
          <div class="panel-title">BMS 重点显示配置<button data-close class="ml-auto text-slate-400 hover:text-white"><i class="ri-close-line text-lg"></i></button></div>
          <div class="p-4">
            <p class="text-xs text-slate-400 mb-3">勾选的参数将以大号卡片突出显示，其余参数以列表形式展示。SOC 始终以仪表盘显示。</p>
            <div id="pinForm" class="grid grid-cols-2 gap-2">
              ${BMS_FIELDS.map((f) => `
                <label class="chip rounded px-3 py-2 flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" value="${f.key}" class="accent-cyan-400" ${pinned.includes(f.key) ? 'checked' : ''}>
                  <i class="${f.icon}" style="color:${f.color}"></i>${f.label}
                </label>`).join('')}
            </div>
            <div class="flex justify-between mt-4">
              <button data-reset class="chip rounded px-3 py-1.5 text-xs">恢复默认</button>
              <button data-save class="rounded px-4 py-1.5 text-xs text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 shadow-[0_0_12px_rgba(34,211,238,.5)]">保存</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  modalRoot.addEventListener('click', (ev) => {
    const t = ev.target;
    if (t.closest('[data-save]')) {
      pinned = [...modalRoot.querySelectorAll('#pinForm input:checked')].map((i) => i.value);
      localStorage.setItem(STORE_KEY, JSON.stringify(pinned));
      modalRoot.innerHTML = '';
      renderFields();
      return;
    }
    if (t.closest('[data-reset]')) {
      modalRoot.querySelectorAll('#pinForm input').forEach((i) => { i.checked = DEFAULT_PINNED.includes(i.value); });
      return;
    }
    if (t.matches('[data-close]') || t.closest('button[data-close]')) modalRoot.innerHTML = '';
  });

  $('#bmsConfigBtn').addEventListener('click', openModal);

  function update(s) {
    last = s;
    const soc = s.bms.soc;
    if (isNum(soc)) {
      gauge.setOption({ series: [{ data: [{ value: Number(soc.toFixed(1)), name: 'SOC' }] }] });
      const I = s.bms.totalI;
      $('#bmsSocTag').innerHTML = I > 1 ? '<span class="text-sky-400"><i class="ri-arrow-up-line"></i>充电中</span>'
        : I < -1 ? '<span class="text-amber-400"><i class="ri-arrow-down-line"></i>放电中</span>' : '静置';
    }
    renderFields();
    renderHeat();
  }

  return { update };
}
