import { markRaw, ref, shallowRef, triggerRef } from 'vue';
import { ESS_REFRESH_MS } from '@/core/constants';
import { createSimulator } from '@/core/simulator';
import type { EnergyState } from '@/core/types';
import { EmsApi } from '@/core/api';
import { mapToEnergyState } from '@/core/apiMapper';

// 数据来源：
// - 真实接口（默认）：每 ESS_REFRESH_MS 拉取 Device/Meter/BigScreen/Event 并映射为 EnergyState。
// - 模拟器兜底：VITE_USE_MOCK=1 时，或首个接口周期尚未返回/接口不可用时使用，避免白屏。
// 逆流演练（simulateBackflow）始终走本地模拟器，不依赖后端写能力。

const USE_MOCK = (import.meta.env.VITE_USE_MOCK as string | undefined) === '1';
const POLL_MS = ESS_REFRESH_MS;

const sim = createSimulator();
const state = shallowRef<EnergyState>(markRaw(sim.state));
const version = ref(0);
const soundOn = ref(false);
const online = ref(false); // 是否已成功接入真实数据
const lastError = ref('');

const MOCK_STEP_MS = 2000;

let timer: number | undefined;
let demoTimer: number | undefined;
let dirty = false;
let fetching = false;
let controller: AbortController | undefined;

function publish(): void {
  triggerRef(state);
  version.value++;
  dirty = false;
}

/** 结束逆流演练，恢复接口轮询。 */
function stopDemo(): void {
  if (demoTimer !== undefined) window.clearInterval(demoTimer);
  demoTimer = undefined;
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
    // 首个周期失败时保持模拟器数据展示，不清空界面。
  } finally {
    fetching = false;
  }
}

function tickMock(): void {
  sim.step(Date.now());
  if (document.hidden) {
    dirty = true;
    return;
  }
  publish();
}

function tick(): void {
  if (USE_MOCK) {
    tickMock();
    return;
  }
  // 逆流演练期间由演练定时器驱动模拟器，不打断演练画面。
  if (demoTimer !== undefined) return;
  void pullReal();
}

function onVisibility(): void {
  if (!document.hidden && dirty) publish();
}

export function startEnergyLoop(): void {
  if (timer !== undefined) return;
  tick(); // 立即拉取一次
  timer = window.setInterval(tick, USE_MOCK ? MOCK_STEP_MS : POLL_MS);
  document.addEventListener('visibilitychange', onVisibility);
}

export function stopEnergyLoop(): void {
  if (timer !== undefined) window.clearInterval(timer);
  timer = undefined;
  stopDemo();
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
    pollSec: USE_MOCK ? MOCK_STEP_MS / 1000 : POLL_MS / 1000,
    simulateBackflow(seconds = 20) {
      // 逆流演练基于本地模拟器：演练期间以 2s 步进推进画面，结束后自动恢复接口数据。
      const until = Date.now() + seconds * 1000 + 1500;
      sim.simulateBackflow(seconds);
      sim.step(Date.now());
      state.value = markRaw(sim.state);
      publish();
      stopDemo();
      demoTimer = window.setInterval(() => {
        if (Date.now() >= until) {
          stopDemo();
          void pullReal();
          return;
        }
        sim.step(Date.now());
        publish();
      }, MOCK_STEP_MS);
    },
    ack() {
      sim.ack();
      state.value.backflow.acked = true;
      publish();
    }
  };
}
