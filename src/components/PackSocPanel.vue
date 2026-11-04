<script setup lang="ts">
import { computed } from 'vue';
import { useEnergy } from '@/composables/useEnergy';
import { fmt } from '@/core/utils';
import BasePanel from './base/BasePanel.vue';

const { state } = useEnergy();

const packs = computed(() => {
  const list = state.value.socHistory;
  if (!list.length) return [];
  return list.map((soc, i) => ({ name: `电池包${i + 1}`, soc }));
});

const range = computed(() => {
  if (!packs.value.length) return { max: 0, min: 0 };
  const values = packs.value.map((p) => p.soc);
  return { max: Math.max(...values), min: Math.min(...values) };
});
</script>

<template>
  <BasePanel title="储能电池 SOC" sub="Battery Packs" index="05">
    <template #extra>
      <span class="text-[12px] text-slate-400">最高 {{ fmt(range.max, 1) }}% · 最低 {{ fmt(range.min, 1) }}%</span>
    </template>
    <div class="chart">
      <div v-for="p in packs" :key="p.name" class="col">
        <span class="num val">{{ fmt(p.soc, 0) }}</span>
        <div class="track">
          <i :style="{ height: `${p.soc}%` }" />
        </div>
        <span class="name">{{ p.name }}</span>
      </div>
    </div>
  </BasePanel>
</template>

<style scoped>
.chart {
  height: 100%;
  min-height: 0;
  display: flex;
  align-items: stretch;
  gap: 6px;
  padding: 10px 12px 8px;
}

.col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.val { font-size: 11px; color: #c5e6f5; }
.name { font-size: 11px; color: #7eb4cc; }

.track {
  flex: 1;
  width: 100%;
  max-width: 22px;
  border: 1px solid rgba(90, 196, 255, 0.28);
  background: rgba(4, 16, 28, 0.55);
  display: flex;
  align-items: flex-end;
}

.track i {
  width: 100%;
  background: linear-gradient(180deg, #7ee7ff, #1aa8e6);
}
</style>
