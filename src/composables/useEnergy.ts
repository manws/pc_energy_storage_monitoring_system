import { markRaw, ref, shallowRef, triggerRef } from 'vue';
import { ESS_REFRESH_MS } from '@/core/constants';
import type { EnergyState } from '@/core/types';
import { EmsApi } from '@/core/api';
import { emptyChannel, emptyReading, mapToEnergyState } from '@/core/apiMapper';

// 数据来源：仅真实接口。每 ESS_REFRESH_MS 拉取 Device/Meter/BigScreen/Event 并映射为 EnergyState。
// 首次返回前 state 为空态（组件呈现「连接中/空数据」），接口失败维持上一次真实数据并提示「接口异常」，
// 不使用任何模拟数据。

const POLL_MS = ESS_REFRESH_MS;

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
    pcsHistory: [[], []],
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
let controller: AbortController | undefined;

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
  if (fetching) return;
  fetching = true;
  controller = new AbortController();
  const signal = controller.signal;
  try {
    const [device, meter, bigScreen, current] = await Promise.all([
      EmsApi.deviceData(signal),
      EmsApi.meterData(signal),
      EmsApi.bigScreen(signal),
      EmsApi.currentEvent(signal)
    ]);
    const next = mapToEnergyState({ device, meter, bigScreen, current }, state.value);
    online.value = true;
    lastError.value = '';
    commit(next);
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') return;
    lastError.value = e instanceof Error ? e.message : String(e);
    // 失败时保留上一次真实数据；首次失败则维持空态，页面显示「接口异常」。
  } finally {
    fetching = false;
  }
}

function tick(): void {
  void pullReal();
}

function onVisibility(): void {
  if (!document.hidden && dirty) publish();
}

export function startEnergyLoop(): void {
  if (timer !== undefined) return;
  tick(); // 立即拉取一次
  timer = window.setInterval(tick, POLL_MS);
  document.addEventListener('visibilitychange', onVisibility);
}

export function stopEnergyLoop(): void {
  if (timer !== undefined) window.clearInterval(timer);
  timer = undefined;
  controller?.abort();
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
    pollSec: POLL_MS / 1000,
    /** 确认当前逆流告警（仅本地标记，不涉及模拟数据）。 */
    ack() {
      state.value.backflow.acked = true;
      publish();
    }
  };
}
