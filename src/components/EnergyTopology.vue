<script setup lang="ts">
import { computed } from 'vue';
import { useEnergy } from '@/composables/useEnergy';
import { METERS, PHASE_TEXT } from '@/core/constants';
import { fmt } from '@/core/utils';
import type { PowerKey } from '@/core/types';
import BasePanel from './base/BasePanel.vue';

const { state } = useEnergy();
const VW = 1000;
const VH = 300;
const BUS_X = 400;
const GRID_Y = 150;
const BRANCH_Y = [42, 114, 186, 258];

interface Branch { id: PowerKey; name: string; color: string; icon: string; device: string; y: number }

const grid = METERS[0];
const branches: Branch[] = METERS.slice(1).map((m, i) => ({
  id: m.id, name: m.name, color: m.color, icon: m.icon, device: m.device, y: BRANCH_Y[i]
}));

const pos = (x: number, y: number) => ({ left: `${(x / VW) * 100}%`, top: `${(y / VH) * 100}%` });

const flowStyle = (p: number, color: string) => {
  const idle = Math.abs(p) < 0.5;
  return {
    stroke: color,
    animationDuration: `${Math.max(0.4, 1.8 - Math.abs(p) / 90).toFixed(2)}s`,
    animationDirection: p < 0 ? 'reverse' : 'normal',
    animationPlayState: idle ? 'paused' : 'running',
    opacity: idle ? 0.2 : 1
  };
};

const view = computed(() => {
  const s = state.value;
  const alarm = s.backflow.active;
  return {
    alarm,
    gridP: s.power.grid,
    gridColor: alarm ? '#dc2626' : grid.color,
    branches: branches.map((b) => {
      const p = s.power[b.id];
      const status = b.id === 'ess'
        ? (p > 0.5 ? '充电' : p < -0.5 ? '放电' : s.essStep === 4 ? '停机' : '静置')
        : PHASE_TEXT[s.cabPhase[b.id as 'cab1' | 'cab2' | 'cab3']];
      return { ...b, p, status };
    })
  };
});
</script>

<template>
  <BasePanel title="厂区能流拓扑" sub="Energy Flow" index="02" :alarm="view.alarm">
    <template #extra>
      <span class="text-[11px] text-slate-500 flex items-center gap-3">
        <span><i class="inline-block w-4 h-[2px] align-middle bg-sky-400 mr-1" />正向受电</span>
        <span><i class="inline-block w-4 h-[2px] align-middle bg-amber-400 mr-1" />反向馈电</span>
      </span>
    </template>
    <div class="relative w-full h-full px-4 py-2">
      <div class="relative w-full h-full">
        <svg class="absolute inset-0 w-full h-full" :viewBox="`0 0 ${VW} ${VH}`" preserveAspectRatio="none">
          <defs>
            <linearGradient id="bus-g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#7fdcb5" />
              <stop offset="1" stop-color="#0b8456" />
            </linearGradient>
          </defs>
          <path :d="`M80 ${GRID_Y} H${BUS_X}`" stroke="rgba(90,196,255,.35)" stroke-width="4" fill="none" />
          <path :d="`M80 ${GRID_Y} H${BUS_X}`" class="flow" fill="none" :style="flowStyle(view.gridP, view.gridColor)" />
          <g v-for="b in view.branches" :key="b.id">
            <path :d="`M${BUS_X} ${b.y} H800`" stroke="rgba(90,196,255,.35)" stroke-width="4" fill="none" />
            <path :d="`M${BUS_X} ${b.y} H800`" class="flow" fill="none" :style="flowStyle(b.p, b.color)" />
          </g>
          <line :x1="BUS_X" y1="28" :x2="BUS_X" y2="272" stroke="url(#bus-g)" stroke-width="8" stroke-linecap="round" />
        </svg>

        <div class="node" :style="pos(56, GRID_Y)">
          <div class="src" :class="{ 'is-alarm': view.alarm }"><i class="ri-government-line" /></div>
          <div class="text-[12px] text-slate-300 mt-1 text-center">市电电网</div>
        </div>

        <div class="node" :style="pos(240, GRID_Y)">
          <div class="gm" :class="{ 'is-alarm': view.alarm }">
            <div class="text-[12px] text-slate-300"><i class="ri-dashboard-3-line text-cyan-300" /> 市电电表</div>
            <div class="num text-[24px] leading-7" :style="{ color: view.gridColor }">{{ fmt(view.gridP, 1) }}<span class="text-[12px] text-slate-400 ml-1">kW</span></div>
            <div class="text-[11px]" :class="view.alarm ? 'text-red-400 font-bold' : 'text-emerald-400'">{{ view.alarm ? '⚠ 逆流告警' : '受电正常' }}</div>
          </div>
        </div>

        <template v-for="b in view.branches" :key="b.id">
          <div class="node" :style="pos(590, b.y)">
            <div class="bm" :style="{ '--bc': `${b.color}55` }">
              <i class="ri-dashboard-3-line" :style="{ color: b.color }" />
              <span class="text-[12px] text-slate-300">{{ b.name }}</span>
              <span class="num text-[17px] w-[64px] text-right" :style="{ color: b.color }">{{ fmt(b.p, 1) }}</span>
              <span class="text-[10px] text-slate-500">kW</span>
            </div>
          </div>
          <div class="node" :style="pos(880, b.y)">
            <div class="dev" :style="{ '--bc': `${b.color}33` }">
              <i :class="b.icon" class="text-[18px]" :style="{ color: b.color }" />
              <div class="leading-4">
                <div class="text-[12px] text-slate-200">{{ b.device }}</div>
                <div class="text-[11px] text-slate-500">{{ b.status }}</div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </BasePanel>
</template>

<style scoped>
svg path,
svg line {
  vector-effect: non-scaling-stroke;
}

.flow {
  stroke-width: 3;
  stroke-linecap: round;
  stroke-dasharray: 8 12;
  animation: flow-dash 1s linear infinite;
  will-change: stroke-dashoffset;
}

.node {
  position: absolute;
  transform: translate(-50%, -50%);
}

.src {
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  font-size: 26px;
  color: #fff;
  border-radius: 10px;
  background: linear-gradient(180deg, #1aa8e6, #0a4e8a);
  box-shadow: 0 0 16px rgba(58, 180, 255, 0.55);
}

.src.is-alarm {
  background: #c03028;
  animation: blink-soft 1.2s var(--ease) infinite;
}

.gm {
  min-width: 150px;
  padding: 8px 14px;
  text-align: center;
  white-space: nowrap;
  border-radius: 10px;
  background: rgba(6, 28, 52, 0.85);
  box-shadow: inset 0 0 0 1px rgba(90, 196, 255, 0.45), 0 0 12px rgba(20, 120, 210, 0.2);
}

.gm.is-alarm {
  background: rgba(60, 12, 16, 0.85);
  box-shadow: inset 0 0 0 1.5px #dc2626, 0 12px 26px -12px rgba(220, 38, 38, 0.5);
}

.bm {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 214px;
  padding: 4px 12px;
  white-space: nowrap;
  border-radius: 8px;
  background: rgba(6, 28, 52, 0.82);
  box-shadow: inset 0 0 0 1px var(--bc), 0 0 10px rgba(20, 120, 210, 0.15);
}

.dev {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 172px;
  padding: 5px 12px;
  white-space: nowrap;
  border-radius: 12px;
  background: rgba(8, 36, 64, 0.8);
  box-shadow: inset 0 0 0 1px var(--bc);
}
</style>
