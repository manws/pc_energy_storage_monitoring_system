<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useEnergy } from '@/composables/useEnergy';
import { METERS, PHASES } from '@/core/constants';
import { fmt, powerDir } from '@/core/utils';
import type { MeterId, MeterReading } from '@/core/types';
import BasePanel from './base/BasePanel.vue';

const props = defineProps<{ selected: MeterId }>();
const emit = defineEmits<{ (e: 'update:selected', id: MeterId): void }>();
const { state } = useEnergy();
const auto = ref(false);
let timer: number | undefined;

watch(auto, (on) => {
  window.clearInterval(timer);
  if (!on) return;
  timer = window.setInterval(() => {
    const idx = METERS.findIndex((m) => m.id === props.selected);
    emit('update:selected', METERS[(idx + 1) % METERS.length].id);
  }, 6000);
});
onBeforeUnmount(() => window.clearInterval(timer));

const meta = computed(() => METERS.find((m) => m.id === props.selected) ?? METERS[0]);

const view = computed(() => {
  const e: MeterReading = state.value.meters[props.selected];
  const curr = [e.ia, e.ib, e.ic];
  const avg = (curr[0] + curr[1] + curr[2]) / 3;
  const unbalance = avg > 1 ? (Math.max(...curr.map((c) => Math.abs(c - avg))) / avg) * 100 : 0;
  const alarm = props.selected === 'grid' && state.value.backflow.active;
  return {
    e,
    alarm,
    unbalance,
    dir: alarm ? { text: '逆流', cls: 'text-red-400' } : powerDir(e.ps),
    phases: PHASES.map((ph) => ({
      ...ph,
      u: e[`u${ph.key}` as keyof MeterReading],
      i: e[`i${ph.key}` as keyof MeterReading],
      p: e[`p${ph.key}` as keyof MeterReading]
    })),
    lines: [
      { label: 'AB线电压', v: e.uab },
      { label: 'BC线电压', v: e.ubc },
      { label: 'CA线电压', v: e.uca }
    ]
  };
});
</script>

<template>
  <BasePanel :title="`${meta.name} · 参数`" sub="Detail" index="02" :alarm="view.alarm">
    <template #extra>
      <span class="text-[12px] text-slate-400">自动轮播</span>
      <el-switch v-model="auto" size="small" />
    </template>
    <div class="detail">
      <div class="hero" :class="{ 'is-alarm': view.alarm }">
        <div>
          <div class="label">总有功功率 Ps</div>
          <div class="leading-none mt-1">
            <span class="num text-[40px]" :style="{ color: view.alarm ? '#dc2626' : meta.color }">{{ fmt(view.e.ps, 2) }}</span>
            <span class="text-[13px] text-slate-400 ml-1">kW</span>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
          <span class="label">功率方向</span><span class="text-right" :class="view.dir.cls">{{ view.dir.text }}</span>
          <span class="label">电流不平衡</span><span class="text-right num text-[14px] text-slate-100">{{ fmt(view.unbalance, 1) }}%</span>
          <span class="label">接入设备</span><span class="text-right text-slate-300">{{ meta.device }}</span>
        </div>
      </div>

      <table class="w-full text-[13px] tbl">
        <thead>
          <tr>
            <th class="text-left">参数</th>
            <th v-for="ph in view.phases" :key="ph.key" :style="{ color: ph.color }">{{ ph.name }}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>相电压 <span class="unit">V</span></td>
            <td v-for="ph in view.phases" :key="ph.key" class="num">{{ fmt(ph.u, 1) }}</td>
          </tr>
          <tr>
            <td>相电流 <span class="unit">A</span></td>
            <td v-for="ph in view.phases" :key="ph.key">
              <div class="num">{{ fmt(ph.i, 1) }}</div>
              <div class="bar"><i :style="{ width: `${Math.min(100, (ph.i / 240) * 100)}%`, background: ph.color }" /></div>
            </td>
          </tr>
          <tr>
            <td>有功功率 <span class="unit">kW</span></td>
            <td v-for="ph in view.phases" :key="ph.key" class="num">{{ fmt(ph.p, 2) }}</td>
          </tr>
        </tbody>
      </table>

      <div class="grid grid-cols-3 gap-2">
        <div v-for="l in view.lines" :key="l.label" class="cell py-1.5 text-center">
          <div class="label !text-[11px]">{{ l.label }}</div>
          <div class="num text-[17px] text-cyan-200">{{ fmt(l.v, 1) }}<span class="text-[11px] text-slate-500 ml-0.5">V</span></div>
        </div>
      </div>
    </div>
  </BasePanel>
</template>

<style scoped>
.detail {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 10px;
  padding: 12px;
}

.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 10px;
  background: #f6f4ef;
  box-shadow: inset 0 0 0 1px var(--c-line);
}

.hero.is-alarm {
  background: radial-gradient(120% 160% at 0% 0%, rgba(220, 38, 38, 0.14), transparent 60%), #fff5f5;
  box-shadow: inset 0 0 0 1.5px rgba(220, 38, 38, 0.55);
}

.tbl th {
  font-weight: 600;
  font-size: 12px;
  padding: 4px 6px;
  text-align: right;
  border-bottom: 1px solid rgba(16, 90, 60, 0.1);
}

.tbl td {
  padding: 4px 6px;
  text-align: right;
  color: #14261f;
  font-size: 16px;
  border-bottom: 1px dashed rgba(16, 90, 60, 0.08);
}

.tbl td:first-child,
.tbl th:first-child {
  text-align: left;
  font-size: 12px;
  color: var(--c-dim);
  font-family: inherit;
}

.unit {
  color: #a3b2ab;
  font-size: 11px;
}

.bar {
  height: 4px;
  margin-top: 3px;
  border-radius: 4px;
  background: #e9f0ec;
  overflow: hidden;
}

.bar i {
  display: block;
  height: 100%;
  border-radius: 4px;
  transition: width 0.8s var(--ease);
}
</style>
