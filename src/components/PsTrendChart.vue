<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useChart } from '@/composables/useChart';
import { useEnergy } from '@/composables/useEnergy';
import { echarts } from '@/core/echarts';
import { HISTORY_MS, METERS } from '@/core/constants';
import { fmt, fmtTime, pad } from '@/core/utils';
import type { MeterId } from '@/core/types';
import BasePanel from './base/BasePanel.vue';

const { state, version } = useEnergy();
const el = ref<HTMLElement | null>(null);
const range = ref(HISTORY_MS);
const hidden = reactive<Record<MeterId, boolean>>({ grid: false, ess: false, cab1: false, cab2: false, cab3: false });

const RANGES = [
  { label: '15分钟', v: 15 * 60 * 1000 },
  { label: '30分钟', v: 30 * 60 * 1000 },
  { label: '1小时', v: HISTORY_MS }
];

const hexA = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

const chart = useChart(el, (c) => {
  c.setOption({
    animation: false,
    grid: { left: 48, right: 20, top: 18, bottom: 26 },
    legend: { show: false, data: METERS.map((m) => m.short) },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(6, 24, 44, .94)',
      borderColor: 'rgba(90,196,255,.35)',
      padding: [8, 12],
      textStyle: { color: '#c5e6f5', fontSize: 12 },
      extraCssText: 'border-radius:4px;box-shadow:0 0 18px rgba(16,110,200,.35);',
      axisPointer: { type: 'line', lineStyle: { color: 'rgba(58,212,255,.55)', type: 'dashed' } },
      formatter: (raw: unknown) => {
        const items = Array.isArray(raw) ? (raw as { value: [number, number]; marker: string; seriesName: string }[]) : [];
        if (!items.length) return '';
        const head = `<div style="color:#7eb4cc;margin-bottom:4px">${fmtTime(items[0].value[0])}</div>`;
        return head + items.map((it) => {
          const v = it.value[1];
          const warn = it.seriesName === '市电' && v < 0;
          return `<div style="display:flex;justify-content:space-between;gap:20px">${it.marker}${it.seriesName}<b style="color:${warn ? '#ff8a8a' : '#e7f6ff'}">${fmt(v, 2)} kW</b></div>`;
        }).join('');
      }
    },
    xAxis: {
      type: 'time',
      axisLine: { lineStyle: { color: 'rgba(90,196,255,.25)' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#7eb4cc',
        fontSize: 11,
        formatter: (v: number) => {
          const d = new Date(v);
          return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
        }
      },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#7eb4cc', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(90,196,255,.12)', type: 'dashed' } }
    },
    series: METERS.map((m, i) => ({
      name: m.short,
      type: 'line',
      showSymbol: false,
      smooth: 0.3,
      sampling: 'lttb',
      z: i === 0 ? 10 : 2,
      lineStyle: { width: i === 0 ? 2.4 : 1.3, color: m.color },
      itemStyle: { color: m.color },
      emphasis: { disabled: true },
      areaStyle: i === 0
        ? { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: hexA(m.color, 0.22) }, { offset: 1, color: hexA(m.color, 0) }]) }
        : undefined,
      markLine: i === 0
        ? {
            symbol: 'none',
            silent: true,
            lineStyle: { color: '#dc2626', type: 'dashed', width: 1.2 },
            label: { formatter: '防逆流线 0 kW', color: '#dc2626', position: 'insideEndTop', fontSize: 11 },
            data: [{ yAxis: 0 }]
          }
        : undefined,
      markArea: i === 0
        ? {
            silent: true,
            itemStyle: { color: 'rgba(220,38,38,.06)' },
            data: [[{ yAxis: -1000 }, { yAxis: 0 }]]
          }
        : undefined,
      data: []
    }))
  });
  render();
});

function render() {
  const c = chart.value;
  if (!c) return;
  const s = state.value;
  const now = s.ts;
  const from = now - range.value;
  c.setOption({
    xAxis: { min: from, max: now },
    series: METERS.map((m) => {
      const h = s.history[m.id];
      let i = h.length - Math.ceil(range.value / 2000) - 2;
      if (i < 0) i = 0;
      return { data: h.slice(i) };
    })
  });
}

watch(version, render);
watch(range, render);

function toggle(id: MeterId, name: string) {
  hidden[id] = !hidden[id];
  chart.value?.dispatchAction({ type: 'legendToggleSelect', name });
}

const legend = computed(() => METERS.map((m) => {
  const v = state.value.meters[m.id].ps;
  return { ...m, v, warn: m.id === 'grid' && v < 0 };
}));
</script>

<template>
  <BasePanel title="五路电表总有功功率趋势" sub="Ps · Rolling 1h" index="05">
    <template #extra>
      <button v-for="r in RANGES" :key="r.v" class="chip" :class="{ 'is-active': range === r.v }" @click="range = r.v">{{ r.label }}</button>
    </template>
    <div class="flex flex-col h-full">
      <div class="flex gap-2 px-3 pt-2.5">
        <button
          v-for="l in legend"
          :key="l.id"
          class="lg"
          :class="{ 'is-off': hidden[l.id] }"
          :style="{ '--c': l.color }"
          @click="toggle(l.id, l.short)"
        >
          <i class="dot" />
          <span class="text-slate-300">{{ l.short }}</span>
          <span class="num text-[15px]" :style="{ color: l.warn ? '#dc2626' : l.color }">{{ fmt(l.v, 1) }}</span>
          <span class="text-[10px] text-slate-500">kW</span>
        </button>
      </div>
      <div ref="el" class="flex-1 min-h-0" />
    </div>
  </BasePanel>
</template>

<style scoped>
.lg {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 12px;
  font-size: 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--c) 14%, #07182c);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 22%, transparent);
  transition: opacity 0.4s var(--ease), transform 0.4s var(--ease);
}

.lg:hover {
  transform: translateY(-1px);
}

.lg.is-off {
  opacity: 0.35;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--c);
}
</style>
