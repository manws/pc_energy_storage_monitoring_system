<script setup lang="ts">
import { computed } from 'vue';
import { useEnergy } from '@/composables/useEnergy';
import { downsample, fmt } from '@/core/utils';
import { ESS_CAPACITY, SAFE_MARGIN } from '@/core/constants';
import type { HistoryPoint } from '@/core/types';
import AnimatedNumber from './base/AnimatedNumber.vue';
import Sparkline from './base/Sparkline.vue';

const { state } = useEnergy();
const TAIL = 150;

const tail = (h: HistoryPoint[]) => h.slice(-TAIL).map((p) => p[1]);

interface Kpi {
  id: string;
  label: string;
  icon: string;
  unit: string;
  color: string;
  value: number;
  decimals: number;
  sub: string;
  subCls?: string;
  trend?: number[];
  zero?: boolean;
  alarm?: boolean;
}

const kpis = computed<Kpi[]>(() => {
  const s = state.value;
  const P = s.power;
  const bf = s.backflow.active;
  const h = s.history;
  const testTrend = tail(h.cab1).map((v, i) => v + (h.cab2[h.cab2.length - TAIL + i]?.[1] ?? 0) + (h.cab3[h.cab3.length - TAIL + i]?.[1] ?? 0));
  const running = (['cab1', 'cab2', 'cab3'] as const).filter((id) => s.cabPhase[id] !== 'rest').length;
  const essTxt = P.ess > 0.5 ? '充电中' : P.ess < -0.5 ? '放电中' : '静置';
  return [
    {
      id: 'grid', label: '市电总有功功率', icon: 'ri-flashlight-fill', unit: 'kW', color: bf ? '#ff6b6b' : '#2ee59a',
      value: P.grid, decimals: 2, trend: downsample(tail(h.grid), 50), zero: true, alarm: bf,
      sub: bf ? '逆流告警 · 请立即处理' : P.grid < SAFE_MARGIN ? `临界 · 裕量 ${fmt(P.grid, 1)} kW` : `防逆流正常 · 裕量 ${fmt(P.grid, 1)} kW`,
      subCls: bf ? 'text-red-400' : P.grid < SAFE_MARGIN ? 'text-amber-400' : 'text-emerald-400'
    },
    {
      id: 'ess', label: '储能运行功率', icon: 'ri-battery-2-charge-fill', unit: 'kW', color: '#3ad4ff',
      value: P.ess, decimals: 2, trend: downsample(tail(h.ess), 50),
      sub: s.essLimited ? `${essTxt} · 防逆流限功率` : essTxt, subCls: s.essLimited ? 'text-amber-400' : 'text-slate-400'
    },
    {
      id: 'test', label: '测试柜总功率', icon: 'ri-server-fill', unit: 'kW', color: '#8ef06a',
      value: P.cab1 + P.cab2 + P.cab3, decimals: 2, trend: downsample(testTrend, 50),
      sub: `运行 ${running}/3 台 · 厂区负载 ${fmt(P.base, 1)} kW`
    },
    {
      id: 'soc', label: '储能电池 SOC', icon: 'ri-battery-saver-fill', unit: '%', color: '#7eb6ff',
      value: s.bms.soc, decimals: 1, trend: downsample(s.socHistory, 50),
      sub: `可用 ≈ ${fmt((s.bms.soc / 100) * ESS_CAPACITY, 1)} / ${ESS_CAPACITY} kWh`
    },
    {
      id: 'energy', label: '今日市电用电量', icon: 'ri-bar-chart-box-fill', unit: 'kWh', color: '#7ee7ff',
      value: s.energy.grid.imp, decimals: 1, sub: `反送电量 ${fmt(s.energy.grid.exp, 2)} kWh`
    },
    {
      id: 'alarm', label: '今日告警次数', icon: 'ri-alarm-warning-fill', unit: '次', color: '#f5c15a',
      value: s.alarmCountToday, decimals: 0, sub: `其中逆流 ${s.backflow.count} 次`,
      subCls: s.backflow.count ? 'text-red-400' : 'text-slate-400'
    }
  ];
});
</script>

<template>
  <div class="grid grid-cols-6 gap-3 h-[92px]">
    <div v-for="(k, n) in kpis" :key="k.id" class="kpi" :class="{ 'is-alarm': k.alarm }" :style="{ '--c': k.color, animationDelay: `${n * 60}ms` }">
      <div class="flex items-center gap-2 min-w-0">
        <div class="ico"><i :class="k.icon" /></div>
        <div class="label truncate">{{ k.label }}</div>
        <Sparkline v-if="k.trend" :values="k.trend" :color="k.color" :width="72" :height="26" :zero="k.zero" class="ml-auto shrink-0" />
      </div>
      <div class="flex items-baseline gap-1 leading-none mt-1">
        <AnimatedNumber :value="k.value" :decimals="k.decimals" class="text-[24px]" :style="{ color: k.alarm ? '#ff6b6b' : '#e7f6ff' }" />
        <span class="text-[12px] text-slate-400">{{ k.unit }}</span>
      </div>
      <div class="text-[12px] mt-1 leading-4" :class="k.subCls || 'text-slate-400'">{{ k.sub }}</div>
    </div>
  </div>
</template>

<style scoped>
.kpi {
  position: relative;
  padding: 6px 12px;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: 0;
  border-radius: 2px;
  background: linear-gradient(180deg, rgba(12, 48, 86, 0.55), rgba(4, 18, 38, 0.82));
  border: 1px solid rgba(90, 196, 255, 0.4);
  box-shadow: var(--shadow-soft);
  overflow: hidden;
  animation: rise-in 0.7s var(--ease) both;
  transition: border-color 0.3s var(--ease);
}

.kpi::before {
  content: '';
  position: absolute;
  left: 0;
  top: 14px;
  bottom: 14px;
  width: 2px;
  border-radius: 0 2px 2px 0;
  background: var(--c);
}

.kpi:hover {
  border-color: color-mix(in srgb, var(--c) 45%, var(--c-line));
}

.kpi.is-alarm {
  background: radial-gradient(120% 140% at 0% 0%, rgba(220, 38, 38, 0.28), transparent 60%), rgba(40, 8, 12, 0.85);
  box-shadow: inset 0 0 0 1.5px rgba(220, 38, 38, 0.6), 0 12px 30px -14px rgba(220, 38, 38, 0.45);
}

.kpi.is-alarm::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: inset 0 0 0 2px #dc2626;
  animation: blink-soft 1s var(--ease) infinite;
  pointer-events: none;
}

.ico {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  font-size: 15px;
  color: var(--c);
  border-radius: 8px;
  background: color-mix(in srgb, var(--c) 16%, #07182c);
}
</style>
