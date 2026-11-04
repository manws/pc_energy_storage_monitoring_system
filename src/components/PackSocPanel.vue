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
    <div class="chart">
      <div v-for="p in packs" :key="p.name" class="pack">
        <div class="top">
          <span class="name">{{ p.name }}</span>
          <span class="num val">{{ fmt(p.soc, 1) }}<i>%</i></span>
        </div>
        <div class="track">
          <i :style="{ width: `${Math.min(100, Math.max(0, p.soc))}%` }" />
        </div>
        <div class="scale"><span>0</span><span>50</span><span>100</span></div>
      </div>
      <div class="range">
        <span>最高 <b class="num">{{ fmt(range.max, 1) }}%</b></span>
        <span>最低 <b class="num">{{ fmt(range.min, 1) }}%</b></span>
      </div>
    </div>
  </BasePanel>
</template>

<style scoped>
.chart {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px 8px;
}

.pack {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  padding: 8px 10px;
  background: rgba(8, 36, 64, 0.55);
  border: 1px solid rgba(90, 196, 255, 0.22);
}

.top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.name { font-size: 13px; letter-spacing: 0.08em; color: #c5e6f5; }
.val { font-size: 26px; line-height: 1; color: #e7f6ff; }
.val i { margin-left: 2px; font-style: normal; font-size: 12px; color: #7eb4cc; font-family: 'Instrument Sans', 'PingFang SC', sans-serif; }

.track {
  position: relative;
  height: 12px;
  border: 1px solid rgba(90, 196, 255, 0.35);
  background:
    linear-gradient(90deg, transparent 49.6%, rgba(90, 196, 255, 0.45) 49.6%, rgba(90, 196, 255, 0.45) 50.4%, transparent 50.4%),
    rgba(4, 16, 28, 0.65);
  overflow: hidden;
}

.track i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #1aa8e6, #7ee7ff);
}

.scale {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  line-height: 1;
  color: #5d8eaa;
  font-variant-numeric: tabular-nums;
}

.range {
  flex: none;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 0 2px;
  font-size: 12px;
  color: #7eb4cc;
}

.range b { font-weight: 500; color: #e7f6ff; }
</style>
