<script setup lang="ts">
import { computed } from 'vue';
import { useEnergy } from '@/composables/useEnergy';
import { fmt } from '@/core/utils';
import BasePanel from './base/BasePanel.vue';

const PACK = 16;
const { state } = useEnergy();

const packs = computed(() => {
  const cells = state.value.bms.cells;
  if (!cells.length) return [{ name: '电池包', soc: state.value.bms.soc }];
  const count = Math.ceil(cells.length / PACK);
  return Array.from({ length: count }, (_, i) => {
    const slice = cells.slice(i * PACK, (i + 1) * PACK);
    const avg = slice.reduce((sum, v) => sum + v, 0) / slice.length;
    const soc = Math.min(100, Math.max(0, ((avg - 3) / 0.65) * 100));
    return { name: `${i + 1}`, soc };
  });
});
</script>

<template>
  <BasePanel title="储能电池 SOC" sub="Battery Packs" index="05">
    <template #extra>
      <span class="text-[12px] text-slate-400">整包 {{ fmt(state.bms.soc, 1) }}%</span>
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
