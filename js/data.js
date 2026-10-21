import { rand, clamp, fmtTime } from './utils.js';

export const STEP_MS = 2000;
export const HISTORY_MS = 3600 * 1000;
export const CELL_COUNT = 224;
export const TEMP_COUNT = 64;
export const ESS_CAPACITY = 215;
export const CONTROL_MARGIN = 8;
export const TEMP_WARN = 32.5;

export const METERS = [
  { id: 'grid', name: '市电电表', short: '市电', color: '#22d3ee', icon: 'ri-building-4-line', device: '市电进线' },
  { id: 'ess', name: '储能电表', short: '储能', color: '#a78bfa', icon: 'ri-battery-2-charge-line', device: '储能充放电设备' },
  { id: 'cab1', name: '配电柜1电表', short: '配电柜1', color: '#34d399', icon: 'ri-server-line', device: '测试电池充放电设备' },
  { id: 'cab2', name: '配电柜2电表', short: '配电柜2', color: '#fbbf24', icon: 'ri-server-line', device: '测试电池充放电设备' },
  { id: 'cab3', name: '配电柜3电表', short: '配电柜3', color: '#f472b6', icon: 'ri-server-line', device: '测试电池充放电设备' }
];

export const PHASES = [
  { key: 'a', name: 'A相', color: '#facc15' },
  { key: 'b', name: 'B相', color: '#22c55e' },
  { key: 'c', name: 'C相', color: '#ef4444' }
];

export const PCS_FIELDS = [
  { key: 'time', label: '最新时间' },
  { key: 'voltage', label: '采样电压/V', d: 1 },
  { key: 'current', label: '采样电流/A', d: 1 },
  { key: 'power', label: '当前功率/KW', d: 2 },
  { key: 'chgAh', label: '充电安时/AH', d: 2 },
  { key: 'disAh', label: '放电安时/AH', d: 2 },
  { key: 'chgWh', label: '充电瓦时/WH', d: 0 },
  { key: 'disWh', label: '放电瓦时/WH', d: 0 },
  { key: 'step', label: '工步信息' },
  { key: 'status', label: '当前状态' },
  { key: 'mode', label: '工作模式' },
  { key: 'fault', label: '故障信息' },
  { key: 'pwmFault', label: 'PWM故障信息' },
  { key: 'dcdcFault', label: 'DCDC故障信息' }
];

export const BMS_FIELDS = [
  { key: 'totalV', label: '总电压', unit: 'V', d: 1, icon: 'ri-flashlight-line', color: '#22d3ee' },
  { key: 'totalI', label: '总电流', unit: 'A', d: 1, icon: 'ri-pulse-line', color: '#a78bfa' },
  { key: 'maxCellV', label: '最大单体', unit: 'V', d: 3, icon: 'ri-arrow-up-circle-line', color: '#f472b6' },
  { key: 'maxCellNo', label: '最大单体编号', unit: '', d: 0, prefix: '#', icon: 'ri-hashtag', color: '#f472b6' },
  { key: 'minCellV', label: '最小单体', unit: 'V', d: 3, icon: 'ri-arrow-down-circle-line', color: '#38bdf8' },
  { key: 'minCellNo', label: '最小单体编号', unit: '', d: 0, prefix: '#', icon: 'ri-hashtag', color: '#38bdf8' },
  { key: 'maxT', label: '最大温度', unit: '℃', d: 1, icon: 'ri-temp-hot-line', color: '#fb923c' },
  { key: 'maxTNo', label: '最大温度编号', unit: '', d: 0, prefix: '#', icon: 'ri-hashtag', color: '#fb923c' },
  { key: 'minT', label: '最小温度', unit: '℃', d: 1, icon: 'ri-temp-cold-line', color: '#34d399' },
  { key: 'minTNo', label: '最小温度编号', unit: '', d: 0, prefix: '#', icon: 'ri-hashtag', color: '#34d399' }
];

const CAB_CFG = {
  cab1: { period: 420, chg: 62, dis: 55, offset: 0 },
  cab2: { period: 540, chg: 48, dis: 52, offset: 170 },
  cab3: { period: 360, chg: 40, dis: 45, offset: 260 }
};

const PHASE_WEIGHT = {
  grid: [1.02, 0.99, 0.99],
  ess: [1, 1, 1],
  cab1: [1.03, 0.98, 0.99],
  cab2: [0.97, 1.02, 1.01],
  cab3: [1, 1.04, 0.96]
};

export const PHASE_TEXT = { chg: '充电测试', dis: '放电测试', rest: '静置' };

function cabinetTarget(sec, cfg) {
  const p = ((sec + cfg.offset) % cfg.period) / cfg.period;
  if (p < 0.42) return { p: cfg.chg, phase: 'chg' };
  if (p < 0.5) return { p: 0, phase: 'rest' };
  if (p < 0.9) return { p: -cfg.dis, phase: 'dis' };
  return { p: 0, phase: 'rest' };
}

function essPlan(sec) {
  const p = (sec % 600) / 600;
  if (p < 0.4) return { target: -70, step: 1 };
  if (p < 0.48) return { target: 0, step: 2 };
  if (p < 0.9) return { target: 60, step: 3 };
  return { target: 0, step: 4 };
}

function electrical(ps, weights, bus) {
  const sum = weights[0] + weights[1] + weights[2];
  const ph = weights.map((w) => (ps * w) / sum);
  const u = bus.map((v) => v + rand(-0.3, 0.3));
  const line = (a, b) => Math.sqrt(a * a + b * b + a * b);
  const i = ph.map((p, k) => (Math.abs(p) * 1000) / (u[k] * 0.96) + rand(0.1, 0.4));
  return {
    ua: u[0], ub: u[1], uc: u[2],
    uab: line(u[0], u[1]), ubc: line(u[1], u[2]), uca: line(u[2], u[0]),
    ia: i[0], ib: i[1], ic: i[2],
    pa: ph[0], pb: ph[1], pc: ph[2],
    ps
  };
}

function makeChannel(no) {
  return {
    no, time: '--', voltage: 0, current: 0, power: 0,
    chgAh: rand(120, 160), disAh: rand(115, 150), chgWh: rand(82000, 98000), disWh: rand(78000, 92000),
    step: '--', status: '待机', mode: '静置', fault: '无', pwmFault: '无', dcdcFault: '无'
  };
}

function extreme(arr, cmp) {
  let idx = 0;
  for (let k = 1; k < arr.length; k++) if (cmp(arr[k], arr[idx])) idx = k;
  return { v: arr[idx], no: idx + 1 };
}

export function createSimulator() {
  const now = Date.now();
  const start = now - HISTORY_MS;
  const cellOffsets = Array.from({ length: CELL_COUNT }, () => rand(-0.012, 0.012));
  const tempOffsets = Array.from({ length: TEMP_COUNT }, () => rand(-2.2, 2.2));
  const midnight = new Date(now).setHours(0, 0, 0, 0);
  const hours = Math.max(1, (start - midnight) / 3600000);
  let seq = 0;

  const state = {
    ts: start,
    power: { base: 85, ess: 0, cab1: 0, cab2: 0, cab3: 0, grid: 80 },
    meters: {},
    history: Object.fromEntries(METERS.map((m) => [m.id, []])),
    pcs: [makeChannel(1), makeChannel(2)],
    bms: { soc: 62, tempBase: 26, cells: [], temps: [] },
    cabPhase: {},
    essLimited: false,
    essStep: 1,
    energy: {
      grid: { imp: hours * 92, exp: 0 },
      ess: { imp: hours * 21, exp: hours * 19 },
      cab1: { imp: hours * 26, exp: hours * 22 },
      cab2: { imp: hours * 21, exp: hours * 22 },
      cab3: { imp: hours * 17, exp: hours * 18 }
    },
    backflow: { active: false, since: 0, count: 0, totalSec: 0, minPs: Infinity, peak: 0, lastAt: 0, acked: false },
    forceUntil: 0,
    faultUntil: 0,
    tempWarn: false,
    socWarn: false,
    alarms: [],
    alarmCountToday: 0,
    warm: true
  };

  function pushAlarm(level, source, msg, ts = state.ts) {
    if (state.warm) return;
    state.alarms.unshift({ id: ++seq, ts, level, source, msg });
    if (state.alarms.length > 80) state.alarms.pop();
    if (level === 'danger' || level === 'warning') state.alarmCountToday++;
  }

  function updateChannel(ch, p, bmsV, dt, ts, fault, temp) {
    ch.power = p;
    ch.voltage = bmsV + (p > 0 ? 1.5 : -1.5) + rand(-0.3, 0.3);
    ch.current = (p * 1000) / ch.voltage;
    if (ch.current > 0) {
      ch.chgAh += (ch.current * dt) / 3600;
      ch.chgWh += (p * 1000 * dt) / 3600;
    } else {
      ch.disAh += (-ch.current * dt) / 3600;
      ch.disWh += (-p * 1000 * dt) / 3600;
    }
    ch.time = fmtTime(ts, true);
    ch.status = fault ? '故障' : Math.abs(p) < 1 ? '待机' : '运行';
    let mode = p > 1 ? '恒功率充电' : p < -1 ? '恒功率放电' : '静置';
    if (state.essLimited) mode = '防逆流限功率';
    ch.mode = mode;
    ch.step = `工步 ${state.essStep}/4 · ${mode}`;
    ch.fault = fault ? '功率响应超时' : '无';
    ch.pwmFault = '无';
    ch.dcdcFault = temp > TEMP_WARN ? '散热温度预警' : '无';
  }

  function step(ts) {
    const dt = STEP_MS / 1000;
    state.ts = ts;
    const sec = ts / 1000;
    const P = state.power;

    const baseT = 82 + 14 * Math.sin(sec / 900) + rand(-3, 3);
    P.base += (baseT - P.base) * 0.4;

    ['cab1', 'cab2', 'cab3'].forEach((id) => {
      const t = cabinetTarget(sec, CAB_CFG[id]);
      const prev = state.cabPhase[id];
      if (prev && prev !== t.phase) {
        const m = METERS.find((x) => x.id === id);
        pushAlarm('info', m.short, `测试设备切换至「${PHASE_TEXT[t.phase]}」`);
      }
      state.cabPhase[id] = t.phase;
      P[id] += (t.p - P[id]) * 0.35 + (t.p ? rand(-1.2, 1.2) : rand(-0.15, 0.15));
    });

    if (!state.warm && ts > state.faultUntil && ts > state.forceUntil && !state.backflow.active && Math.random() < 1 / 600) {
      state.faultUntil = ts + rand(6000, 14000);
      pushAlarm('warning', '储能PCS', '功率调节响应延迟，防逆流控制可能失效');
    }

    const plan = essPlan(sec);
    state.essStep = plan.step;
    let target = plan.target;
    if (state.bms.soc > 95 && target > 0) target = 0;
    if (state.bms.soc < 10 && target < 0) target = 0;
    const forced = ts < state.forceUntil;
    const fault = ts < state.faultUntil;
    let essP = P.ess + (target - P.ess) * 0.4 + rand(-0.8, 0.8);
    const others = P.base + P.cab1 + P.cab2 + P.cab3;
    state.essLimited = false;
    if (!forced && !fault && others + essP < CONTROL_MARGIN) {
      essP = CONTROL_MARGIN + rand(0, 3) - others;
      state.essLimited = true;
    }
    essP = clamp(essP, -120, 110);
    if (forced) essP = Math.min(essP, -others - rand(4, 16));
    else if (fault) essP = -others - rand(2, 10);
    P.ess = essP;
    P.grid = others + essP;

    const bus = [220 + rand(-2.5, 2.5), 220 + rand(-2.5, 2.5), 220 + rand(-2.5, 2.5)];
    METERS.forEach((m) => {
      const e = electrical(P[m.id], PHASE_WEIGHT[m.id], bus);
      state.meters[m.id] = e;
      const h = state.history[m.id];
      h.push([ts, Math.round(e.ps * 100) / 100]);
      while (h.length && h[0][0] < ts - HISTORY_MS) h.shift();
      const en = state.energy[m.id];
      if (e.ps > 0) en.imp += (e.ps * dt) / 3600;
      else en.exp += (-e.ps * dt) / 3600;
    });

    const bms = state.bms;
    const bmsV = bms.totalV || 716;
    const split = 0.5 + rand(-0.03, 0.03);
    updateChannel(state.pcs[0], essP * split, bmsV, dt, ts, fault, bms.maxT || 26);
    updateChannel(state.pcs[1], essP * (1 - split), bmsV, dt, ts, fault, bms.maxT || 26);

    const I = state.pcs[0].current + state.pcs[1].current;
    bms.soc = clamp(bms.soc + ((essP * dt) / 3600 / ESS_CAPACITY) * 100, 3, 99);
    const avg = 3.12 + (0.22 * bms.soc) / 100 + I * 0.00025;
    bms.cells = cellOffsets.map((o) => avg + o + rand(-0.002, 0.002));
    bms.tempBase += (25.5 + Math.abs(I) * 0.035 - bms.tempBase) * 0.05;
    bms.temps = tempOffsets.map((o) => bms.tempBase + o + rand(-0.15, 0.15));
    const mx = extreme(bms.cells, (a, b) => a > b);
    const mn = extreme(bms.cells, (a, b) => a < b);
    const tx = extreme(bms.temps, (a, b) => a > b);
    const tn = extreme(bms.temps, (a, b) => a < b);
    Object.assign(bms, {
      totalV: bms.cells.reduce((a, b) => a + b, 0), totalI: I,
      maxCellV: mx.v, maxCellNo: mx.no, minCellV: mn.v, minCellNo: mn.no,
      maxT: tx.v, maxTNo: tx.no, minT: tn.v, minTNo: tn.no
    });

    if (!state.tempWarn && bms.maxT > TEMP_WARN) {
      state.tempWarn = true;
      pushAlarm('warning', 'BMS', `电池温度偏高 ${bms.maxT.toFixed(1)}℃（温度点 #${bms.maxTNo}）`);
    } else if (state.tempWarn && bms.maxT < TEMP_WARN - 1) {
      state.tempWarn = false;
      pushAlarm('success', 'BMS', '电池温度恢复正常');
    }
    if (!state.socWarn && bms.soc < 15) {
      state.socWarn = true;
      pushAlarm('warning', 'BMS', `储能SOC偏低 ${bms.soc.toFixed(1)}%`);
    } else if (state.socWarn && bms.soc > 18) state.socWarn = false;

    const bf = state.backflow;
    if (P.grid < 0) {
      if (!bf.active) {
        Object.assign(bf, { active: true, since: ts, acked: false, lastAt: ts, peak: P.grid });
        bf.count++;
        pushAlarm('danger', '市电电表', `检测到逆流！总有功功率 ${P.grid.toFixed(2)} kW`);
      }
      bf.totalSec += dt;
      bf.peak = Math.min(bf.peak, P.grid);
    } else if (bf.active) {
      bf.active = false;
      pushAlarm('success', '市电电表', `逆流已解除，持续 ${Math.round((ts - bf.since) / 1000)} 秒，峰值 ${bf.peak.toFixed(2)} kW`);
    }
    bf.minPs = Math.min(bf.minPs, P.grid);
  }

  for (let t = start + STEP_MS; t <= now; t += STEP_MS) step(t);
  state.warm = false;
  state.backflow.count = 0;
  state.backflow.totalSec = 0;
  pushAlarm('info', '系统', '能源监控服务启动，历史数据加载完成', now - 60000);
  pushAlarm('success', 'BMS', '电池管理系统自检通过，224串单体在线', now - 45000);
  pushAlarm('info', '储能PCS', 'CH1 / CH2 通讯链路正常', now - 30000);
  pushAlarm('info', '采集网关', '5路电表数据采集正常（Modbus-TCP）', now - 15000);

  function simulateBackflow(seconds = 20) {
    state.forceUntil = Date.now() + seconds * 1000;
    pushAlarm('warning', '系统', `人工触发逆流演练（${seconds}秒），储能强制满功率放电`, Date.now());
  }

  function ack() {
    state.backflow.acked = true;
    pushAlarm('info', '值班员', '已确认市电逆流告警', Date.now());
  }

  return { state, step, simulateBackflow, ack };
}
