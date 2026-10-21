<script setup lang="ts">
import { computed } from 'vue';
import { useEnergy } from '@/composables/useEnergy';
import { SAFE_MARGIN } from '@/core/constants';
import { clamp, fmt, fmtDuration, fmtTime } from '@/core/utils';
import BasePanel from './base/BasePanel.vue';

const { state } = useEnergy();
const MIN = -40;
const MAX = 200;
const R = 70;
const CX = 90;
const CY = 86;

const angleOf = (v: number) => Math.PI * (1 - (clamp(v, MIN, MAX) - MIN) / (MAX - MIN));
const pt = (a: number, r = R) => `${(CX + r * Math.cos(a)).toFixed(2)} ${(CY - r * Math.sin(a)).toFixed(2)}`;
const arc = (from: number, to: number, r = R) => {
  const a1 = angleOf(from);
  const a2 = angleOf(to);
  const large = Math.abs(a1 - a2) > Math.PI ? 1 : 0;
  return `M${pt(a1, r)} A${r} ${r} 0 ${large} 1 ${pt(a2, r)}`;
};

const ticks = [MIN, 0, 50, 100, 150, MAX].map((v) => {
  const a = angleOf(v);
  return { v, x1: pt(a, R + 6), x2: pt(a, R + 12), label: pt(a, R + 22) };
});

const zones = {
  red: arc(MIN, 0),
  amber: arc(0, SAFE_MARGIN),
  safe: arc(SAFE_MARGIN, MAX)
};

const view = computed(() => {
  const s = state.value;
  const g = s.power.grid;
  const bf = s.backflow;
  let min = Infinity;
  for (const p of s.history.grid) if (p[1] < min) min = p[1];
  const level = g < 0 ? { t: '逆流', c: '#dc2626' } : g < SAFE_MARGIN ? { t: '临界', c: '#d97706' } : { t: '安全', c: '#10a36b' };
  const a = angleOf(g);
  return {
    g,
    level,
    needle: pt(a, R - 14),
    progress: arc(MIN, clamp(g, MIN, MAX), R - 9),
    stats: [
      { label: '今日逆流次数', value: `${bf.count} 次`, cls: bf.count ? 'text-red-400' : 'text-emerald-400' },
      { label: '累计逆流时长', value: fmtDuration(bf.totalSec), cls: bf.totalSec ? 'text-amber-400' : 'text-slate-100' },
      { label: '近1h最小Ps', value: `${fmt(min, 2)} kW`, cls: min < 0 ? 'text-red-400' : 'text-slate-100' },
      { label: '最近逆流', value: bf.lastAt ? fmtTime(bf.lastAt) : '无', cls: 'text-slate-200' }
    ],
    limited: s.essLimited
  };
});
</script>

<template>
  <BasePanel title="市电防逆流监控" sub="Anti-Backflow" index="03" :alarm="state.backflow.active">
    <div class="guard">
      <div class="cluster">
      <div class="dial">
        <svg viewBox="0 0 180 118" class="gauge-svg">
          <path :d="zones.red" stroke="#f3b4b4" stroke-width="5" stroke-linecap="round" fill="none" />
          <path :d="zones.amber" stroke="#f6d49a" stroke-width="5" fill="none" />
          <path :d="zones.safe" stroke="#e3efe8" stroke-width="5" stroke-linecap="round" fill="none" />
          <path :d="view.progress" :stroke="view.level.c" stroke-width="7" fill="none" stroke-linecap="round" opacity="0.9" />
          <g v-for="t in ticks" :key="t.v">
            <path :d="`M${t.x1} L${t.x2}`" :stroke="t.v === 0 ? '#dc2626' : '#b4c0ba'" :stroke-width="t.v === 0 ? 2 : 1" />
            <text :x="t.label.split(' ')[0]" :y="t.label.split(' ')[1]" fill="#8b9a93" font-size="9" text-anchor="middle" dominant-baseline="middle">{{ t.v }}</text>
          </g>
          <line :x1="CX" :y1="CY" :x2="view.needle.split(' ')[0]" :y2="view.needle.split(' ')[1]" :stroke="view.level.c" stroke-width="2.5" stroke-linecap="round" class="needle" />
          <circle :cx="CX" :cy="CY" r="5" :fill="view.level.c" />
        </svg>
        <div class="read">
          <span class="num" :style="{ color: view.level.c }">{{ fmt(view.g, 1) }}</span>
          <span class="unit">kW</span>
        </div>
        <div class="level" :style="{ color: view.level.c }"><i class="ri-shield-flash-line" /> {{ view.level.t }}</div>
        <div class="strategy" :class="view.limited ? 'is-limit' : ''">储能策略{{ view.limited ? '调节中' : '已投入' }}</div>
      </div>
      <ul class="stats">
        <li v-for="st in view.stats" :key="st.label" class="stat">
          <span class="label">{{ st.label }}</span>
          <span class="num val" :class="st.cls">{{ st.value }}</span>
        </li>
      </ul>
      </div>
    </div>
  </BasePanel>
</template>

<style scoped>
.guard {
  height: 100%;
  display: flex;
  align-items: center;
  padding: 10px 14px;
  min-height: 0;
}

.cluster {
  width: 100%;
  display: grid;
  grid-template-columns: 168px minmax(0, 1fr);
  gap: 6px 12px;
  align-items: center;
}

.dial {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.gauge-svg {
  width: 168px;
  height: 110px;
}

.read {
  margin-top: 2px;
  line-height: 1;
}

.read .num {
  font-size: 28px;
}

.unit {
  margin-left: 2px;
  font-size: 12px;
  color: #8b9a93;
}

.level {
  margin-top: 6px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.14em;
}

.strategy {
  margin-top: 4px;
  font-size: 11px;
  color: #0b8456;
}

.strategy::before {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 5px;
  border-radius: 50%;
  background: currentColor;
  transform: translateY(-1px);
}

.strategy.is-limit {
  color: #d97706;
}

.stats {
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: 0;
  padding: 0;
  list-style: none;
}

.stat {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(26, 33, 30, 0.08);
}

.stat:last-child {
  border-bottom: none;
}

.val {
  font-size: 16px;
}

.needle {
  transition: all 0.6s var(--ease);
}
</style>
