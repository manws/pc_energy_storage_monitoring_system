import { fmt, isNum } from './utils.js';

const KPIS = [
  { id: 'grid', label: '市电总有功功率', icon: 'ri-flashlight-fill', unit: 'kW', color: '#22d3ee' },
  { id: 'ess', label: '储能运行功率', icon: 'ri-battery-2-charge-fill', unit: 'kW', color: '#a78bfa' },
  { id: 'test', label: '测试柜总功率', icon: 'ri-server-fill', unit: 'kW', color: '#34d399' },
  { id: 'soc', label: '储能电池 SOC', icon: 'ri-battery-saver-fill', unit: '%', color: '#fbbf24' },
  { id: 'energy', label: '今日市电用电量', icon: 'ri-bar-chart-box-fill', unit: 'kWh', color: '#38bdf8' },
  { id: 'alarm', label: '今日告警次数', icon: 'ri-alarm-warning-fill', unit: '次', color: '#f472b6' }
];

const card = (k) => `
  <div id="kpi-${k.id}" class="panel px-4 py-3 flex items-center gap-3 transition" style="--c:${k.color}">
    <div class="kpi-icon"><i class="${k.icon}"></i></div>
    <div class="min-w-0 flex-1">
      <div class="text-xs text-slate-400 tracking-wider">${k.label}</div>
      <div class="flex items-baseline gap-1">
        <span data-v class="num text-[26px] leading-8 font-bold text-white">--</span>
        <span class="text-xs text-slate-400">${k.unit}</span>
      </div>
      <div data-sub class="text-[11px] text-slate-400 truncate">--</div>
    </div>
  </div>`;

export function createKpis(root) {
  root.innerHTML = KPIS.map(card).join('');
  const els = Object.fromEntries(KPIS.map((k) => {
    const el = root.querySelector(`#kpi-${k.id}`);
    return [k.id, { el, v: el.querySelector('[data-v]'), sub: el.querySelector('[data-sub]') }];
  }));

  const set = (id, v, sub, color) => {
    els[id].v.textContent = v;
    els[id].sub.innerHTML = sub;
    els[id].v.style.color = color || '#fff';
  };

  function update(s) {
    const P = s.power;
    if (!isNum(P.grid)) return;
    const bf = s.backflow.active;
    set('grid', fmt(P.grid, 2),
      bf ? '<span class="text-red-400 font-semibold"><i class="ri-alarm-warning-fill"></i> 逆流告警！</span>'
        : `<span class="text-emerald-400"><i class="ri-shield-check-fill"></i> 防逆流正常</span> · 裕量 ${fmt(P.grid, 1)}kW`,
      bf ? '#f87171' : '#67e8f9');
    els.grid.el.classList.toggle('alarm-pulse', bf);

    const essTxt = P.ess > 0.5 ? '<span class="text-sky-400">充电中</span>' : P.ess < -0.5 ? '<span class="text-amber-400">放电中</span>' : '静置';
    set('ess', fmt(P.ess, 2), `${essTxt}${s.essLimited ? ' · <span class="text-amber-300">防逆流限功率</span>' : ''}`);

    const test = P.cab1 + P.cab2 + P.cab3;
    const running = ['cab1', 'cab2', 'cab3'].filter((id) => s.cabPhase[id] !== 'rest').length;
    set('test', fmt(test, 2), `运行中 ${running}/3 台 · 厂区负载 ${fmt(P.base, 1)}kW`);

    const soc = s.bms.soc;
    set('soc', fmt(soc, 1), `可用电量 ≈ ${fmt((soc / 100) * 215, 1)} kWh / 215kWh`, soc < 15 ? '#fbbf24' : '#fde68a');

    const en = s.energy.grid;
    set('energy', fmt(en.imp, 1), `反送电量 ${fmt(en.exp, 2)} kWh`);

    set('alarm', String(s.alarmCountToday), `逆流 ${s.backflow.count} 次 · 实时告警 ${bf ? 1 : 0} 条`, s.alarmCountToday ? '#f9a8d4' : '#fff');
  }

  return { update };
}
