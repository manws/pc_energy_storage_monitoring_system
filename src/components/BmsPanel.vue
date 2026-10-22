<script setup lang="ts">
import { computed, ref } from 'vue';
import { useEnergy } from '@/composables/useEnergy';
import { BMS_FIELDS, CELL_COUNT, DEFAULT_BMS_PINNED, TEMP_COUNT } from '@/core/constants';
import { fmt, isNum } from '@/core/utils';
import type { BmsFieldKey, BmsFieldMeta } from '@/core/types';
import BasePanel from './base/BasePanel.vue';
import AnimatedNumber from './base/AnimatedNumber.vue';
import BmsHeatmap from './BmsHeatmap.vue';
import BmsPinDialog from './BmsPinDialog.vue';

const STORE_KEY = 'bms-pinned-fields';
const { state } = useEnergy();
const dialog = ref(false);
const heat = ref<'v' | 't'>('v');

function load(): BmsFieldKey[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (Array.isArray(raw) && raw.every((k) => BMS_FIELDS.some((f) => f.key === k))) return raw as BmsFieldKey[];
  } catch {
    return [...DEFAULT_BMS_PINNED];
  }
  return [...DEFAULT_BMS_PINNED];
}

const pinned = ref<BmsFieldKey[]>(load());

function save(v: BmsFieldKey[]) {
  pinned.value = v;
  localStorage.setItem(STORE_KEY, JSON.stringify(v));
}

const text = (f: BmsFieldMeta, v: number) => (isNum(v) ? `${f.prefix ?? ''}${fmt(v, f.d)}` : '--');

const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R;

const view = computed(() => {
  const b = state.value.bms;
  const fields = BMS_FIELDS.map((f) => ({ ...f, text: text(f, b[f.key]) }));
  const I = b.totalI;
  return {
    soc: b.soc,
    dash: `${((b.soc / 100) * RING_C * 0.75).toFixed(1)} ${RING_C.toFixed(1)}`,
    socColor: b.soc < 15 ? '#d97706' : '#10a36b',
    status: I > 1 ? { t: '充电中', c: 'text-emerald-400', i: 'ri-arrow-up-line' } : I < -1 ? { t: '放电中', c: 'text-sky-400', i: 'ri-arrow-down-line' } : { t: '静置', c: 'text-slate-400', i: 'ri-pause-line' },
    pinned: fields.filter((f) => pinned.value.includes(f.key)),
    others: fields.filter((f) => !pinned.value.includes(f.key)),
    deltaV: (b.maxCellV - b.minCellV) * 1000,
    deltaT: b.maxT - b.minT,
    b
  };
});
</script>

<template>
  <BasePanel title="储能电池 BMS" sub="Battery" index="08">
    <template #extra>
      <button class="chip" @click="dialog = true"><i class="ri-star-line" /> 重点显示</button>
    </template>
    <div class="flex flex-col gap-2 p-2.5">
      <div class="flex gap-3 shrink-0">
        <div class="relative w-[112px] h-[112px] shrink-0">
          <svg viewBox="0 0 128 128" class="w-full h-full">
            <defs>
              <linearGradient id="soc-g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#7fdcb5" />
                <stop offset="1" :stop-color="view.socColor" />
              </linearGradient>
            </defs>
            <g transform="rotate(135 64 64)">
              <circle cx="64" cy="64" :r="RING_R" fill="none" stroke="rgba(90,196,255,.18)" stroke-width="10" :stroke-dasharray="`${RING_C * 0.75} ${RING_C}`" stroke-linecap="round" />
              <circle cx="64" cy="64" :r="RING_R" fill="none" stroke="url(#soc-g)" stroke-width="10" :stroke-dasharray="view.dash" stroke-linecap="round" class="ring" />
            </g>
            <circle cx="64" cy="64" r="40" fill="none" stroke="rgba(90,196,255,.28)" stroke-dasharray="2 4" />
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <div class="leading-none"><AnimatedNumber :value="view.soc" :decimals="1" class="text-[30px] text-slate-100" /><span class="text-[12px] text-slate-400">%</span></div>
            <div class="text-[11px] text-slate-400 mt-0.5">SOC</div>
            <div class="text-[11px] mt-0.5" :class="view.status.c"><i :class="view.status.i" />{{ view.status.t }}</div>
          </div>
        </div>
        <div class="flex-1 grid grid-cols-2 gap-1.5 content-start">
          <div v-for="f in view.pinned" :key="f.key" class="pin" :style="{ '--c': f.color }">
            <div class="label !text-[11px] flex items-center gap-1"><i :class="f.icon" :style="{ color: f.color }" />{{ f.label }}</div>
            <div class="num text-[20px] leading-6" :style="{ color: f.color }">{{ f.text }}<span class="text-[11px] text-slate-500 ml-0.5">{{ f.unit }}</span></div>
          </div>
          <div v-if="!view.pinned.length" class="col-span-2 text-[12px] text-slate-500 text-center py-8">未选择重点显示项</div>
        </div>
      </div>

      <div v-if="view.others.length" class="grid grid-cols-2 gap-x-4 shrink-0">
        <div v-for="f in view.others" :key="f.key" class="flex justify-between items-center h-[22px] border-b border-slate-800">
          <span class="label !text-[12px]">{{ f.label }}</span>
          <span class="num text-[14px] text-slate-100">{{ f.text }} <span class="text-[10px] text-slate-500">{{ f.unit }}</span></span>
        </div>
      </div>

      <div class="cell p-2">
        <div class="flex items-center justify-between mb-1.5 shrink-0">
          <span class="text-[12px] text-slate-300">
            <i class="ri-grid-line text-cyan-300" />
            {{ heat === 'v' ? `单体电压分布 · ${CELL_COUNT}串` : `温度点分布 · ${TEMP_COUNT}点` }}
            <span class="num text-[13px] ml-1" :class="heat === 'v' ? 'text-pink-300' : 'text-orange-300'">
              {{ heat === 'v' ? `压差 ${fmt(view.deltaV, 0)} mV` : `温差 ${fmt(view.deltaT, 1)} ℃` }}
            </span>
          </span>
          <span class="flex gap-1">
            <button class="chip !text-[11px]" :class="{ 'is-active': heat === 'v' }" @click="heat = 'v'">电压</button>
            <button class="chip !text-[11px]" :class="{ 'is-active': heat === 't' }" @click="heat = 't'">温度</button>
          </span>
        </div>
        <BmsHeatmap
          v-if="heat === 'v'"
          :values="view.b.cells" :cols="28" :max-no="view.b.maxCellNo" :min-no="view.b.minCellNo" unit="V" :decimals="3"
        />
        <BmsHeatmap
          v-else
          :values="view.b.temps" :cols="16" :max-no="view.b.maxTNo" :min-no="view.b.minTNo" unit="℃" :decimals="1"
        />
        <div class="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500 shrink-0">
          <span>低</span>
          <div class="flex-1 h-1 legend" />
          <span>高</span>
          <span class="ml-2 flex items-center gap-1"><i class="inline-block w-2 h-2 border-2 border-slate-100" />最大</span>
          <span class="flex items-center gap-1"><i class="inline-block w-2 h-2 border-2 border-sky-400" />最小</span>
        </div>
      </div>
    </div>
    <BmsPinDialog v-model="dialog" :pinned="pinned" @save="save" />
  </BasePanel>
</template>

<style scoped>
.ring {
  transition: stroke-dasharray 1s var(--ease);
}

.pin {
  padding: 5px 10px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--c) 14%, #07182c);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 16%, transparent);
  transition: transform 0.4s var(--ease);
}

.pin:hover {
  transform: translateY(-1px);
}

.legend {
  border-radius: 4px;
  background: linear-gradient(90deg, #d8f3e6, #7fdcb5, #f2c46a, #d9a441, #dc2626);
}
</style>
