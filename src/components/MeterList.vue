<script setup lang="ts">
import { computed } from 'vue';
import { useEnergy } from '@/composables/useEnergy';
import { METERS } from '@/core/constants';
import { downsample, fmt, powerDir } from '@/core/utils';
import type { MeterId } from '@/core/types';
import BasePanel from './base/BasePanel.vue';
import Sparkline from './base/Sparkline.vue';

defineProps<{ selected: MeterId }>();
const emit = defineEmits<{ (e: 'update:selected', id: MeterId): void }>();
const { state } = useEnergy();

const rows = computed(() => {
  const s = state.value;
  return METERS.map((m) => {
    const ps = s.meters[m.id].ps;
    const alarm = m.id === 'grid' && s.backflow.active;
    const dir = powerDir(ps);
    return {
      ...m,
      ps,
      alarm,
      dir: alarm ? { text: '逆流', cls: 'text-red-400' } : dir,
      trend: downsample(s.history[m.id].slice(-150).map((p) => p[1]), 40)
    };
  });
});
</script>

<template>
  <BasePanel title="电表实时监测" sub="Meters" index="01">
    <template #extra><span class="text-[11px] text-slate-500">总有功功率 Ps · 近5分钟</span></template>
    <ul class="flex flex-col gap-1 p-2">
      <li
        v-for="r in rows"
        :key="r.id"
        class="row"
        :class="{ 'is-active': selected === r.id, 'is-alarm': r.alarm }"
        :style="{ '--c': r.alarm ? '#dc2626' : r.color }"
        @click="emit('update:selected', r.id)"
      >
        <div class="icon"><i :class="r.icon" /></div>
        <div class="w-[92px] shrink-0">
          <div class="text-[14px] text-slate-100 leading-5">{{ r.name }}</div>
          <div class="text-[11px] text-slate-500 truncate">{{ r.device }}</div>
        </div>
        <Sparkline :values="r.trend" :color="r.alarm ? '#dc2626' : r.color" :width="120" :height="28" :zero="r.id === 'grid'" />
        <div class="ml-auto text-right">
          <div class="leading-6">
            <span class="num text-[22px]" :style="{ color: r.alarm ? '#dc2626' : r.color }">{{ fmt(r.ps, 2) }}</span>
            <span class="text-[11px] text-slate-500 ml-0.5">kW</span>
          </div>
          <div class="text-[11px]" :class="r.dir.cls">{{ r.dir.text }}</div>
        </div>
      </li>
    </ul>
  </BasePanel>
</template>

<style scoped>
.row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 46px;
  padding: 0 12px;
  cursor: pointer;
  border-radius: 8px;
  background: rgba(8, 36, 64, 0.55);
  border: 1px solid transparent;
  transition: background 0.4s var(--ease), box-shadow 0.4s var(--ease), transform 0.4s var(--ease);
}

.row:hover {
  background: rgba(16, 56, 92, 0.7);
}

.row:active {
  transform: scale(0.99);
}

.row.is-active {
  background: rgba(12, 48, 86, 0.85);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 55%, transparent);
}

.row.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12px;
  bottom: 12px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--c);
}

.row.is-alarm {
  background: rgba(80, 16, 20, 0.55);
}

.icon {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  font-size: 17px;
  color: var(--c);
  border-radius: 10px;
  background: color-mix(in srgb, var(--c) 18%, #07182c);
}
</style>
