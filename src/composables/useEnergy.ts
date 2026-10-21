import { markRaw, ref, shallowRef, triggerRef } from 'vue';
import { STEP_MS } from '@/core/constants';
import { createSimulator } from '@/core/simulator';
import type { EnergyState } from '@/core/types';

const sim = createSimulator();
const state = shallowRef<EnergyState>(markRaw(sim.state));
const version = ref(0);
const soundOn = ref(false);
let timer: number | undefined;
let dirty = false;

function publish(): void {
  triggerRef(state);
  version.value++;
  dirty = false;
}

function tick(): void {
  sim.step(Date.now());
  if (document.hidden) {
    dirty = true;
    return;
  }
  publish();
}

function onVisibility(): void {
  if (!document.hidden && dirty) publish();
}

export function startEnergyLoop(): void {
  if (timer !== undefined) return;
  timer = window.setInterval(tick, STEP_MS);
  document.addEventListener('visibilitychange', onVisibility);
}

export function stopEnergyLoop(): void {
  if (timer !== undefined) window.clearInterval(timer);
  timer = undefined;
  document.removeEventListener('visibilitychange', onVisibility);
}

export function useEnergy() {
  return {
    state,
    version,
    soundOn,
    simulateBackflow(seconds = 20) {
      sim.simulateBackflow(seconds);
      publish();
    },
    ack() {
      sim.ack();
      publish();
    }
  };
}
