<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useChart } from '@/composables/useChart';
import { useEnergy } from '@/composables/useEnergy';
import { echarts } from '@/core/echarts';
import { METERS } from '@/core/constants';
import { downsample, fmt, fmtTime, pad, powerDir } from '@/core/utils';
import type { MeterId } from '@/core/types';
import Sparkline from '@/components/base/Sparkline.vue';

const { state, version } = useEnergy();
const el = ref<HTMLElement | null>(null);
const range = ref(15 * 60 * 1000);
const hidden = ref<MeterId[]>([]);

const RANGES = [
  { label: '5分钟', v: 5 * 60 * 1000 },
  { label: '15分钟', v: 15 * 60 * 1000 },
  { label: '1小时', v: 60 * 60 * 1000 }
];

const hexA = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

const cards = computed(() => {
  const s = state.value;
  return METERS.map((m) => {
    const ps = s.meters[m.id].ps;
    const alarm = m.id === 'grid' && (s.backflow.active || ps < 0);
    return {
      ...m,
      ps,
      alarm,
      dir: alarm ? { text: '逆流', cls: 'is-alarm' } : powerDir(ps),
      spark: downsample(s.history[m.id].slice(-90).map((p) => p[1]), 36)
    };
  });
});

const chart = useChart(el, (c) => {
  c.setOption({
    animation: false,
    grid: { left: 56, right: 18, top: 16, bottom: 28 },
    legend: { show: false, data: METERS.map((m) => m.short) },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(6, 24, 44, .94)',
      borderColor: 'rgba(90,196,255,.35)',
      textStyle: { color: '#c5e6f5', fontSize: 12 },
      formatter: (raw: unknown) => {
        const items = Array.isArray(raw) ? (raw as { value: [number, number]; marker: string; seriesName: string }[]) : [];
        if (!items.length) return '';
        const head = `<div style="color:#7eb4cc;margin-bottom:4px">${fmtTime(items[0].value[0])}</div>`;
        return head + items.map((it) => `<div style="display:flex;justify-content:space-between;gap:18px">${it.marker}${it.seriesName}<b>${fmt(it.value[1], 2)} kW</b></div>`).join('');
      }
    },
    xAxis: {
      type: 'time',
      axisLine: { lineStyle: { color: 'rgba(90,196,255,.25)' } },
      axisTick: { show: false },
      axisLabel: { color: '#7eb4cc', fontSize: 11, formatter: (v: number) => `${pad(new Date(v).getHours())}:${pad(new Date(v).getMinutes())}` },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      name: 'kW',
      nameTextStyle: { color: '#7eb4cc' },
      axisLabel: { color: '#7eb4cc', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(90,196,255,.12)', type: 'dashed' } }
    },
    series: METERS.map((m, i) => ({
      name: m.short,
      type: 'line',
      showSymbol: false,
      smooth: 0.25,
      sampling: 'lttb',
      lineStyle: { width: i === 0 ? 2.2 : 1.3, color: m.color },
      itemStyle: { color: m.color },
      areaStyle: i === 0 ? { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: hexA(m.color, 0.22) }, { offset: 1, color: hexA(m.color, 0) }]) } : undefined,
      data: []
    }))
  });
  render();
});

function render() {
  const c = chart.value;
  if (!c) return;
  const now = state.value.ts;
  const from = now - range.value;
  c.setOption({
    xAxis: { min: from, max: now },
    series: METERS.map((m) => {
      const h = state.value.history[m.id];
      let i = h.length - Math.ceil(range.value / 2000) - 2;
      if (i < 0) i = 0;
      return { data: h.slice(i) };
    })
  });
}

watch(version, render);
watch(range, render);

function toggle(id: MeterId, name: string) {
  hidden.value = hidden.value.includes(id) ? hidden.value.filter((x) => x !== id) : [...hidden.value, id];
  chart.value?.dispatchAction({ type: 'legendToggleSelect', name });
}
</script>

<template>
  <div class="page">
    <section class="meters">
      <article v-for="m in cards" :key="m.id" class="card" :class="{ 'is-alarm': m.alarm }" :style="{ '--c': m.color }">
        <div class="card-top">
          <span class="mark"><i :class="m.icon" /></span>
          <div>
            <div class="name">{{ m.name }}</div>
            <div class="sub">{{ m.device }}</div>
          </div>
        </div>
        <div class="p-label">有功功率 P</div>
        <div class="p-row">
          <span class="num p-val">{{ fmt(m.ps, 2) }}</span>
          <span class="unit">kW</span>
        </div>
        <div class="meta">
          <span class="dir" :class="m.dir.cls">{{ m.dir.text }}</span>
          <Sparkline :values="m.spark" :color="m.alarm ? '#ff6b6b' : m.color" :width="108" :height="28" :zero="m.id === 'grid'" />
        </div>
      </article>
    </section>
    <section class="chart-card">
      <header class="chart-head">
        <div>
          <h2>有功功率实时波形</h2>
          <p>五路电表同一时刻对照</p>
        </div>
        <div class="tools">
          <button v-for="r in RANGES" :key="r.v" type="button" class="chip" :class="{ 'is-active': range === r.v }" @click="range = r.v">{{ r.label }}</button>
        </div>
      </header>
      <div class="legend">
        <button v-for="m in cards" :key="m.id" type="button" class="lg" :class="{ off: hidden.includes(m.id) }" :style="{ '--c': m.color }" @click="toggle(m.id, m.short)">
          <i />{{ m.short }} <b class="num">{{ fmt(m.ps, 1) }}</b>
        </button>
      </div>
      <div ref="el" class="chart" />
    </section>
  </div>
</template>

<style scoped>
.page {
  height: 100%;
  overflow: auto;
  padding: 18px 22px 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.meters {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.card,
.chart-card {
  border: 1px solid rgba(90, 196, 255, 0.28);
  background: rgba(6, 28, 52, 0.72);
  box-shadow: inset 0 0 18px rgba(30, 140, 220, 0.1);
}

.card {
  min-height: 168px;
  padding: 14px;
  display: flex;
  flex-direction: column;
}

.card.is-alarm { border-color: rgba(255, 107, 107, 0.7); }

.card-top { display: flex; gap: 10px; align-items: center; }
.mark {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  color: var(--c);
  background: color-mix(in srgb, var(--c) 16%, transparent);
}
.name { font-weight: 600; }
.sub, .p-label, .unit { color: #7eb4cc; font-size: 12px; }
.p-label { margin-top: 14px; }
.p-row { display: flex; align-items: baseline; gap: 6px; }
.p-val { font-size: 32px; line-height: 1.1; color: var(--c); }
.meta { margin-top: auto; display: flex; align-items: center; justify-content: space-between; padding-top: 8px; }
.dir.is-alarm, .is-alarm .p-val { color: #ff8a8a; }

.chart-card {
  min-height: 360px;
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 14px 14px 8px;
}

.chart-head, .legend, .tools { display: flex; align-items: center; }
.chart-head { justify-content: space-between; }
.chart-head h2 { margin: 0; font-size: 16px; letter-spacing: 0.08em; }
.chart-head p { margin: 4px 0 0; color: #7eb4cc; font-size: 12px; }
.tools { gap: 8px; }
.legend { gap: 8px; padding: 10px 0; flex-wrap: wrap; }
.lg {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 10px;
  border: 1px solid rgba(90, 196, 255, 0.28);
  background: transparent;
  color: #c5e6f5;
  font: inherit;
  cursor: pointer;
}
.lg i { width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
.lg.off { opacity: 0.4; }
.chart { flex: 1; min-height: 240px; }
</style>
