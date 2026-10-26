<script setup lang="ts">
import { ref, watch } from 'vue';
import { useChart } from '@/composables/useChart';
import { echarts } from '@/core/echarts';
import { fmt, fmtTime } from '@/core/utils';

const props = withDefaults(defineProps<{ points: [number, number][]; color?: string; compact?: boolean }>(), {
  color: '#3ad4ff',
  compact: false
});
const el = ref<HTMLElement | null>(null);

function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function option(points: [number, number][]) {
  return {
    animation: false,
    grid: props.compact
      ? { left: 36, right: 8, top: 8, bottom: 18 }
      : { left: 52, right: 16, top: 16, bottom: 28 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(6, 24, 44, .94)',
      borderColor: 'rgba(90,196,255,.35)',
      textStyle: { color: '#c5e6f5', fontSize: 12 },
      formatter: (raw: unknown) => {
        const items = Array.isArray(raw) ? raw as { value: [number, number] }[] : [];
        const p = items[0]?.value;
        if (!p) return '';
        return `${fmtTime(p[0])}<br/><b style="color:#e7f6ff">${fmt(p[1], 2)} kW</b>`;
      }
    },
    xAxis: {
      type: 'time',
      axisLabel: { color: '#7eb4cc', fontSize: 11, formatter: (v: number) => fmtTime(v).slice(0, 5) },
      axisLine: { lineStyle: { color: 'rgba(90,196,255,.28)' } },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      name: props.compact ? '' : 'kW',
      nameTextStyle: { color: '#7eb4cc', fontSize: 11 },
      axisLabel: { color: '#7eb4cc', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(90,196,255,.12)' } }
    },
    series: [{
      type: 'line',
      name: '功率',
      showSymbol: false,
      smooth: true,
      data: points,
      lineStyle: { width: 2, color: props.color },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: hexA(props.color, 0.28) },
          { offset: 1, color: hexA(props.color, 0) }
        ])
      }
    }]
  };
}

const chart = useChart(el, (c) => c.setOption(option(props.points)));
watch(() => props.points, (points) => chart.value?.setOption(option(points)));
</script>

<template>
  <div ref="el" class="plot" />
</template>

<style scoped>
.plot { width: 100%; height: 100%; min-height: 0; }
</style>
