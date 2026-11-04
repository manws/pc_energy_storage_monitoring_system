import { computed, markRaw, ref, shallowRef, triggerRef } from 'vue';
import { ESS_REFRESH_MS, STEP_MS } from '@/core/constants';
import type { EnergyState } from '@/core/types';
import { EmsApi } from '@/core/api';
import { emptyChannel, emptyReading, mapBigScreen, mapDevice, mapMeter } from '@/core/apiMapper';

// 按页面拉对应接口，避免大屏/电表/储能互相拖累：
// - 大屏只调 bigScreen
// - 电表页只调 meterData，2s 刷新
// - 储能监控只调 deviceData
// 首次返回前 state 为空态，接口失败维持上一次真实数据并提示「接口异常」。

export type EnergyScope = 'screen' | 'meter' | 'device' | 'idle';

const SCREEN_POLL_MS = ESS_REFRESH_MS;
const METER_POLL_MS = STEP_MS;

/** 空态：接口返回前的占位，不包含任何假数据。 */
function emptyState(): EnergyState {
  const meters: EnergyState['meters'] = {
    grid: emptyReading(), ess: emptyReading(), cab1: emptyReading(), cab2: emptyReading(), cab3: emptyReading()
  };
  return {
    ts: 0,
    power: { base: 0, grid: 0, ess: 0, cab1: 0, cab2: 0, cab3: 0 },
    meters,
    history: { grid: [], ess: [], cab1: [], cab2: [], cab3: [] },
    pcsHistory: [],
    socHistory: [],
    pcs: [emptyChannel(1), emptyChannel(2)],
    bms: {
      soc: 0, totalV: 0, totalI: 0,
      maxCellV: 0, maxCellNo: 1, minCellV: 0, minCellNo: 1,
      maxT: 0, maxTNo: 1, minT: 0, minTNo: 1,
      tempBase: 0, cells: [], temps: []
    },
    cabPhase: { cab1: 'rest', cab2: 'rest', cab3: 'rest' },
    essLimited: false,
    essStep: 1,
    energy: {
      grid: { imp: 0, exp: 0 }, ess: { imp: 0, exp: 0 },
      cab1: { imp: 0, exp: 0 }, cab2: { imp: 0, exp: 0 }, cab3: { imp: 0, exp: 0 }
    },
    backflow: { active: false, since: 0, count: 0, totalSec: 0, peak: 0, lastAt: 0, acked: false },
    alarms: [],
    alarmCountToday: 0
  };
}

const state = shallowRef<EnergyState>(markRaw(emptyState()));
const version = ref(0);
const soundOn = ref(false);
const online = ref(false); // 是否已成功接入真实数据
const lastError = ref('');

let timer: number | undefined;
let dirty = false;
let fetching = false;
let pullId = 0;
let controller: AbortController | undefined;
let scope: EnergyScope = 'idle';
const pollMs = ref(SCREEN_POLL_MS);

function intervalOf(next: EnergyScope): number {
  return next === 'meter' ? METER_POLL_MS : SCREEN_POLL_MS;
}

function publish(): void {
  triggerRef(state);
  version.value++;
  dirty = false;
}

function commit(next: EnergyState): void {
  state.value = markRaw(next);
  if (document.hidden) {
    dirty = true;
    return;
  }
  publish();
}

async function pullReal(): Promise<void> {
  if (fetching || scope === 'idle') return;
  fetching = true;
  const id = ++pullId;
  controller = new AbortController();
  const signal = controller.signal;
  const currentScope = scope;
  try {
    let next: EnergyState;
    if (currentScope === 'screen') {
      next = mapBigScreen(await EmsApi.bigScreen(signal), state.value);
    } else if (currentScope === 'meter') {
      next = mapMeter(await EmsApi.meterData(signal), state.value);
    } else {
      next = mapDevice(await EmsApi.deviceData(signal), state.value);
    }
    online.value = true;
    lastError.value = '';
    commit(next);
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') return;
    lastError.value = e instanceof Error ? e.message : String(e);
    // 失败时保留上一次真实数据；首次失败则维持空态，页面显示「接口异常」。
  } finally {
    if (id === pullId) fetching = false;
  }
}

function tick(): void {
  void pullReal();
}

function onVisibility(): void {
  if (!document.hidden && dirty) publish();
}

function clearTimer(): void {
  if (timer !== undefined) window.clearInterval(timer);
  timer = undefined;
}

function armTimer(ms: number): void {
  clearTimer();
  if (scope === 'idle') return;
  tick();
  timer = window.setInterval(tick, ms);
}

export function setEnergyScope(next: EnergyScope): void {
  const ms = intervalOf(next);
  const changed = scope !== next || pollMs.value !== ms;
  scope = next;
  pollMs.value = ms;
  if (next === 'idle') {
    controller?.abort();
    fetching = false;
    clearTimer();
    return;
  }
  document.addEventListener('visibilitychange', onVisibility);
  if (changed || timer === undefined) {
    pullId += 1;
    controller?.abort();
    fetching = false;
    armTimer(ms);
  }
}

export function startEnergyLoop(): void {
  document.addEventListener('visibilitychange', onVisibility);
}

export function stopEnergyLoop(): void {
  setEnergyScope('idle');
  document.removeEventListener('visibilitychange', onVisibility);
}

export function useEnergy() {
  return {
    state,
    version,
    soundOn,
    online,
    lastError,
    /** 当前数据刷新周期（秒），用于页头展示。 */
    pollSec: computed(() => pollMs.value / 1000),
    /** 确认当前逆流告警（仅本地标记，不涉及模拟数据）。 */
    ack() {
      state.value.backflow.acked = true;
      publish();
    }
  };
}
