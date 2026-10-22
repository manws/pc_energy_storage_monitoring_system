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

const rows = computed(() => {
  const s = state.value;
  return METERS.map((m) => {
    const ps = s.meters[m.id].ps;
    const alarm = m.id === 'grid' && s.backflow.active;
    return {
      ...m,
      ps,
      alarm,
      dir: alarm ? { text: '逆流', cls: 'text-red-400' } : powerDir(ps)
    };
  });
});

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
  <BasePanel title="电表实时监测" sub="Meters" index="01" :alarm="view.alarm">
    <template #extra>
      <span class="text-[12px] text-slate-400">自动轮播</span>
      <el-switch v-model="auto" size="small" />
    </template>
    <div class="split">
      <ul class="list">
        <li
          v-for="r in rows"
          :key="r.id"
          class="row"
          :class="{ 'is-on': selected === r.id, 'is-alarm': r.alarm }"
          :style="{ '--c': r.alarm ? '#ff6b6b' : r.color }"
          @click="emit('update:selected', r.id)"
        >
          <i :class="r.icon" />
          <div class="min-w-0">
            <div class="text-[14px] text-slate-100 leading-5 truncate">{{ r.name }}</div>
            <div class="text-[11px] text-slate-500 truncate">{{ r.device }}</div>
          </div>
          <div class="ml-auto text-right">
            <span class="num text-[18px]" :style="{ color: r.alarm ? '#ff6b6b' : r.color }">{{ fmt(r.ps, 2) }}</span>
            <span class="text-[11px] text-slate-500 ml-0.5">kW</span>
            <div class="text-[11px]" :class="r.dir.cls">{{ r.dir.text }}</div>
          </div>
        </li>
      </ul>

      <div class="detail">
        <div class="hero">
          <div>
            <div class="label">{{ meta.name }} · 总有功功率 Ps</div>
            <div class="leading-none mt-1">
              <span class="num text-[32px]" :style="{ color: view.alarm ? '#ff6b6b' : meta.color }">{{ fmt(view.e.ps, 2) }}</span>
              <span class="text-[12px] text-slate-400 ml-1">kW</span>
            </div>
          </div>
          <div class="facts">
            <span class="label">功率方向</span><span :class="view.dir.cls">{{ view.dir.text }}</span>
            <span class="label">电流不平衡</span><span class="num text-slate-100">{{ fmt(view.unbalance, 1) }}%</span>
          </div>
        </div>
        <table class="tbl">
          <thead>
            <tr>
              <th class="text-left">参数</th>
              <th v-for="ph in view.phases" :key="ph.key" :style="{ color: ph.color }">{{ ph.name }}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>相电压 V</td>
              <td v-for="ph in view.phases" :key="ph.key" class="num">{{ fmt(ph.u, 1) }}</td>
            </tr>
            <tr>
              <td>相电流 A</td>
              <td v-for="ph in view.phases" :key="ph.key" class="num">{{ fmt(ph.i, 1) }}</td>
            </tr>
            <tr>
              <td>有功功率 kW</td>
              <td v-for="ph in view.phases" :key="ph.key" class="num">{{ fmt(ph.p, 2) }}</td>
            </tr>
          </tbody>
        </table>
        <div class="lines">
          <div v-for="l in view.lines" :key="l.label" class="cell">
            <div class="label">{{ l.label }}</div>
            <div class="num text-[16px] text-cyan-200">{{ fmt(l.v, 1) }}<span class="text-[11px] text-slate-500"> V</span></div>
          </div>
        </div>
      </div>
    </div>
  </BasePanel>
</template>

<style scoped>
.split {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 8px;
  list-style: none;
}

.row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 4px 10px;
  cursor: pointer;
  border: 1px solid transparent;
  background: rgba(8, 36, 64, 0.55);
}

.row.is-on {
  border-color: var(--c);
  box-shadow: inset 3px 0 0 var(--c);
}

.detail {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px 12px 12px;
  border-top: 1px solid rgba(90, 196, 255, 0.18);
}

.hero, .facts, .lines { display: flex; }
.hero { justify-content: space-between; gap: 12px; align-items: flex-end; }
.facts { display: grid; grid-template-columns: auto auto; gap: 4px 12px; font-size: 12px; align-content: end; }
.tbl { width: 100%; font-size: 13px; }
.tbl th, .tbl td { padding: 6px 4px; text-align: right; }
.tbl th:first-child, .tbl td:first-child { text-align: left; color: #7eb4cc; }
.lines { gap: 8px; }
.cell { flex: 1; text-align: center; padding: 6px 0; }
</style>
