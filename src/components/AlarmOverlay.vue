<script setup lang="ts">
import { computed, watch } from 'vue';
import { useEnergy } from '@/composables/useEnergy';
import { fmt } from '@/core/utils';

const { state, version, soundOn, ack } = useEnergy();
let audio: AudioContext | null = null;

const bf = computed(() => {
  const s = state.value;
  return {
    active: s.backflow.active,
    acked: s.backflow.acked,
    grid: s.power.grid,
    peak: s.backflow.peak,
    dur: Math.max(0, Math.round((s.ts - s.backflow.since) / 1000))
  };
});

function beep() {
  if (!audio) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    audio = new Ctx();
  }
  const ctx = audio;
  void ctx.resume();
  [0, 0.25].forEach((d) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.06, ctx.currentTime + d);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + d + 0.18);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + d);
    osc.stop(ctx.currentTime + d + 0.2);
  });
}

watch(version, () => {
  if (soundOn.value && bf.value.active && !bf.value.acked) beep();
});
</script>

<template>
  <div v-if="bf.active && !bf.acked" class="frame" />
  <Transition name="drop">
    <div v-if="bf.active && !bf.acked" class="banner">
      <div class="icon is-blink"><i class="ri-alarm-warning-fill" /></div>
      <div class="flex-1 min-w-0">
        <div class="text-[17px] font-bold tracking-[.2em] text-red-50">市电逆流告警 · 防逆流保护触发</div>
        <div class="text-[13px] text-red-100/85 mt-0.5">
          当前市电总有功功率 <b class="num text-[20px] text-[#fff]">{{ fmt(bf.grid, 2) }}</b> kW
          <span class="mx-2 opacity-40">|</span>已持续 <b class="num text-[18px] text-[#fff]">{{ bf.dur }}</b> 秒
          <span class="mx-2 opacity-40">|</span>峰值 <b class="num text-[18px] text-[#fff]">{{ fmt(bf.peak, 2) }}</b> kW
          <span class="mx-2 opacity-40">|</span>请立即检查储能及测试柜放电状态
        </div>
      </div>
      <button class="ackbtn" @click="ack">确认告警<span class="ackico"><i class="ri-check-line" /></span></button>
    </div>
  </Transition>
</template>

<style scoped>
.frame {
  position: absolute;
  inset: 0;
  z-index: 40;
  pointer-events: none;
  box-shadow: inset 0 0 0 4px #dc2626, inset 0 0 160px rgba(220, 38, 38, 0.35);
  animation: blink-soft 1s var(--ease) infinite;
  will-change: opacity;
}

.banner {
  position: absolute;
  left: 50%;
  top: 84px;
  z-index: 45;
  width: 1100px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 12px 10px 10px;
  border-radius: 22px;
  background: linear-gradient(90deg, #c81e1e, #e03b3b 50%, #c81e1e);
  box-shadow: 0 24px 60px -18px rgba(220, 38, 38, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.25);
}

.icon {
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  font-size: 30px;
  color: #fff;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.16);
}

.icon.is-blink i {
  animation: blink-soft 0.8s var(--ease) infinite;
}

.drop-enter-active,
.drop-leave-active {
  transition: opacity 0.5s var(--ease), transform 0.5s var(--ease);
}

.drop-enter-from,
.drop-leave-to {
  opacity: 0;
  transform: translate(-50%, -16px);
}

.ackbtn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 44px;
  padding: 0 6px 0 20px;
  font-size: 15px;
  font-weight: 700;
  color: #c81e1e;
  border-radius: 999px;
  background: #fff;
  cursor: pointer;
  transition: transform 0.4s var(--ease);
}

.ackbtn:active {
  transform: scale(0.97);
}

.ackico {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #fff;
  background: #dc2626;
  transition: transform 0.4s var(--ease);
}

.ackbtn:hover .ackico {
  transform: translateX(2px) scale(1.06);
}
</style>
