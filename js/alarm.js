import { $, fmt, fmtTime, fmtDuration, isNum } from './utils.js';

const LEVEL = {
  danger: { text: '严重', cls: 'bg-red-500/20 text-red-400 border-red-500/50', icon: 'ri-alarm-warning-fill text-red-400' },
  warning: { text: '预警', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/50', icon: 'ri-error-warning-fill text-amber-300' },
  info: { text: '事件', cls: 'bg-sky-500/15 text-sky-300 border-sky-500/40', icon: 'ri-information-fill text-sky-300' },
  success: { text: '恢复', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40', icon: 'ri-checkbox-circle-fill text-emerald-400' }
};

function row(a) {
  const l = LEVEL[a.level] || LEVEL.info;
  return `
    <div class="flex items-center gap-3 px-2 py-1.5 rounded text-xs hover:bg-sky-500/5 border-b border-slate-800/80 ${a.level === 'danger' ? 'bg-red-500/5' : ''}">
      <i class="${l.icon} text-sm"></i>
      <span class="num text-slate-400 w-[70px] shrink-0">${fmtTime(a.ts)}</span>
      <span class="px-1.5 py-0.5 rounded border text-[10px] shrink-0 ${l.cls}">${l.text}</span>
      <span class="text-cyan-200 w-[72px] shrink-0 truncate">${a.source}</span>
      <span class="text-slate-200 truncate">${a.msg}</span>
    </div>`;
}

function stat(label, value, cls = 'text-white') {
  return `
    <div class="rounded border border-slate-700/60 bg-slate-900/40 px-3 py-2">
      <div class="text-[11px] text-slate-400">${label}</div>
      <div class="num text-lg font-bold ${cls}">${value}</div>
    </div>`;
}

export function createAlarmCenter({ onAck }) {
  const banner = $('#alarmBanner');
  const frame = $('#alarmFrame');
  const logEl = $('#alarmLog');
  const filterEl = $('#alarmFilter');
  const statsEl = $('#backflowStats');
  const soundBtn = $('#soundBtn');
  let filter = 'all';
  let soundOn = false;
  let audioCtx = null;
  let last = null;
  let lastLogKey = '';

  function beep() {
    if (!audioCtx) return;
    [0, 0.25].forEach((delay) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + delay + 0.18);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(audioCtx.currentTime + delay);
      osc.stop(audioCtx.currentTime + delay + 0.2);
    });
  }

  soundBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    if (soundOn && !audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    audioCtx?.resume?.();
    soundBtn.classList.toggle('active', soundOn);
    soundBtn.innerHTML = soundOn ? '<i class="ri-volume-up-line"></i><span class="hidden xl:inline">声音开</span>'
      : '<i class="ri-volume-mute-line"></i><span class="hidden xl:inline">声音关</span>';
  });

  filterEl.addEventListener('click', (ev) => {
    const btn = ev.target.closest('[data-filter]');
    if (!btn) return;
    filter = btn.dataset.filter;
    filterEl.querySelectorAll('[data-filter]').forEach((b) => b.classList.toggle('active', b === btn));
    lastLogKey = '';
    renderLog();
  });

  banner.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-ack]') && typeof onAck === 'function') {
      onAck();
      if (last) update(last);
    }
  });

  function renderLog() {
    if (!last) return;
    const list = last.alarms.filter((a) => filter === 'all' || a.level === filter || (filter === 'info' && a.level === 'success'));
    const key = `${filter}-${list.length}-${list[0]?.id ?? 0}`;
    if (key === lastLogKey) return;
    lastLogKey = key;
    logEl.innerHTML = list.length ? list.map(row).join('') : '<div class="text-center text-xs text-slate-500 py-10">暂无记录</div>';
  }

  function renderBanner(s) {
    const bf = s.backflow;
    if (!bf.active) {
      banner.classList.add('hidden');
      frame.classList.add('hidden');
      document.body.classList.remove('is-backflow');
      return;
    }
    const dur = Math.round((s.ts - bf.since) / 1000);
    banner.classList.remove('hidden');
    frame.classList.toggle('hidden', bf.acked);
    document.body.classList.add('is-backflow');
    banner.innerHTML = `
      <i class="ri-alarm-warning-fill text-3xl text-red-300 ${bf.acked ? '' : 'animate-pulse'}"></i>
      <div class="flex-1 min-w-0">
        <div class="font-bold text-red-100 tracking-wider">市电逆流告警 · 防逆流保护触发</div>
        <div class="text-xs text-red-200/90 mt-0.5">
          当前市电总有功功率 <b class="num text-base text-white">${fmt(s.power.grid, 2)} kW</b>
          · 已持续 <b class="num text-white">${dur}</b> 秒 · 峰值 <b class="num text-white">${fmt(bf.peak, 2)} kW</b>
          · 请立即检查储能及测试柜放电状态
        </div>
      </div>
      ${bf.acked ? '<span class="text-xs text-red-200 border border-red-300/50 rounded px-3 py-1"><i class="ri-check-line"></i> 已确认</span>'
        : '<button data-ack class="shrink-0 rounded px-4 py-1.5 text-sm bg-white text-red-600 font-bold hover:bg-red-50">确认告警</button>'}`;
    if (soundOn && !bf.acked) beep();
  }

  function renderStats(s) {
    const bf = s.backflow;
    const g = s.power.grid;
    const pct = isNum(g) ? Math.max(0, Math.min(100, ((g + 30) / 230) * 100)) : 0;
    const zero = (30 / 230) * 100;
    const level = g < 0 ? { t: '逆流', c: 'text-red-400' } : g < 15 ? { t: '临界', c: 'text-amber-300' } : { t: '安全', c: 'text-emerald-400' };
    statsEl.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <div class="text-xs text-slate-400">实时状态</div>
        <div class="text-sm font-bold ${level.c}"><i class="ri-shield-flash-line"></i> ${level.t}</div>
      </div>
      <div class="relative h-3 rounded bg-slate-800 overflow-hidden mb-1">
        <div class="absolute inset-y-0 left-0" style="width:${zero}%;background:rgba(239,68,68,.35)"></div>
        <div class="absolute inset-y-0 left-0 rounded transition-all duration-700" style="width:${pct}%;background:linear-gradient(90deg,#ef4444,#f59e0b ${zero + 6}%,#22d3ee)"></div>
        <div class="absolute inset-y-0 w-0.5 bg-white" style="left:${zero}%"></div>
      </div>
      <div class="flex justify-between text-[10px] text-slate-500 mb-3"><span>-30kW</span><span>0 防逆流线</span><span>200kW</span></div>
      <div class="grid grid-cols-2 gap-2">
        ${stat('今日逆流次数', `${bf.count} 次`, bf.count ? 'text-red-400' : 'text-emerald-400')}
        ${stat('累计逆流时长', fmtDuration(bf.totalSec), bf.totalSec ? 'text-amber-300' : 'text-white')}
        ${stat('近1小时最小Ps', `${fmt(minRecent(s), 2)} kW`, minRecent(s) < 0 ? 'text-red-400' : 'text-cyan-200')}
        ${stat('最近逆流时间', bf.lastAt ? fmtTime(bf.lastAt) : '无', 'text-slate-200')}
      </div>
      <div class="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
        <span>防逆流策略：储能限放电 / 自动转充电</span>
        <span class="${s.essLimited ? 'text-amber-300' : 'text-emerald-400'}">${s.essLimited ? '● 调节中' : '● 投入'}</span>
      </div>`;
  }

  function minRecent(s) {
    const h = s.history.grid;
    if (!Array.isArray(h) || !h.length) return NaN;
    let m = Infinity;
    for (const p of h) if (p[1] < m) m = p[1];
    return m;
  }

  function update(s) {
    last = s;
    renderBanner(s);
    renderLog();
    renderStats(s);
  }

  return { update };
}
