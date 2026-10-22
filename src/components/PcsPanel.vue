<script setup lang="ts">
import { computed, ref } from 'vue';
import { useEnergy } from '@/composables/useEnergy';
import { PCS_FIELDS } from '@/core/constants';
import { fmt, isNum } from '@/core/utils';
import type { PcsChannel, PcsFieldMeta } from '@/core/types';
import BasePanel from './base/BasePanel.vue';

type Tab = 'both' | 0 | 1;
const { state } = useEnergy();
const tab = ref<Tab>('both');
const TABS: { v: Tab; label: string }[] = [
  { v: 'both', label: '双通道' },
  { v: 0, label: 'CH1' },
  { v: 1, label: 'CH2' }
];
const HERO = ['voltage', 'current', 'power'];
const FAULT_KEYS = ['fault', 'pwmFault', 'dcdcFault'];

interface Cell { text: string; cls: string; kind: 'num' | 'status' | 'fault' | 'text' }

function cell(f: PcsFieldMeta, ch: PcsChannel): Cell {
  const v = ch[f.key];
  if (f.key === 'status') return { text: String(v), kind: 'status', cls: v === '运行' ? 'st-run' : v === '故障' ? 'st-err' : 'st-idle' };
  if (FAULT_KEYS.includes(f.key)) return { text: String(v), kind: 'fault', cls: v === '无' ? 'text-emerald-400' : 'text-red-400' };
  if (f.key === 'time') return { text: String(v).slice(11) || '--', kind: 'num', cls: 'text-slate-300' };
  if (f.key === 'mode') return { text: String(v), kind: 'text', cls: String(v).includes('防逆流') ? 'text-amber-400' : 'text-cyan-200' };
  if (isNum(v)) {
    const cls = f.key === 'power' ? (v > 0 ? 'text-emerald-300' : v < 0 ? 'text-sky-300' : 'text-slate-100') : 'text-slate-100';
    return { text: fmt(v, f.d ?? 1), kind: 'num', cls };
  }
  return { text: String(v ?? '--'), kind: 'text', cls: 'text-slate-200' };
}

const rows = computed(() => {
  const [a, b] = state.value.pcs;
  return PCS_FIELDS.map((f) => ({ f, c: [cell(f, a), cell(f, b)] }));
});

const single = computed(() => {
  if (tab.value === 'both') return null;
  const ch = state.value.pcs[tab.value];
  return {
    hero: PCS_FIELDS.filter((f) => HERO.includes(f.key)).map((f) => ({ f, c: cell(f, ch) })),
    rest: PCS_FIELDS.filter((f) => !HERO.includes(f.key)).map((f) => ({ f, c: cell(f, ch) }))
  };
});

const anyFault = computed(() => state.value.pcs.some((c) => c.status === '故障'));
</script>

<template>
  <BasePanel title="储能充放电设备" sub="PCS" index="07" :alarm="anyFault">
    <template #extra>
      <button v-for="t in TABS" :key="String(t.v)" class="chip" :class="{ 'is-active': tab === t.v }" @click="tab = t.v">{{ t.label }}</button>
    </template>

    <div class="px-3 py-2">
      <table v-if="!single" class="w-full tbl">
        <thead>
          <tr>
            <th class="text-left">运行参数</th>
            <th><span class="ch" style="--c:#10a36b">CH1</span></th>
            <th><span class="ch" style="--c:#2a9d8f">CH2</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.f.key">
            <td class="lbl">{{ r.f.label }}</td>
            <td v-for="(c, i) in r.c" :key="i">
              <span v-if="c.kind === 'status'" class="st" :class="c.cls">{{ c.text }}</span>
              <span v-else-if="c.kind === 'fault'" :class="c.cls"><i :class="c.text === '无' ? 'ri-checkbox-circle-line' : 'ri-error-warning-fill'" /> {{ c.text }}</span>
              <span v-else :class="[c.cls, c.kind === 'num' ? 'num text-[15px]' : 'text-[12px]']">{{ c.text }}</span>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="flex flex-col gap-2.5">
        <div class="grid grid-cols-3 gap-2">
          <div v-for="h in single.hero" :key="h.f.key" class="cell py-2 text-center">
            <div class="label !text-[11px]">{{ h.f.label }}</div>
            <div class="num text-[26px] leading-8" :class="h.c.cls">{{ h.c.text }}</div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-x-4">
          <div v-for="r in single.rest" :key="r.f.key" class="flex items-center justify-between h-[30px] border-b border-slate-800 gap-2">
            <span class="label">{{ r.f.label }}</span>
            <span v-if="r.c.kind === 'status'" class="st" :class="r.c.cls">{{ r.c.text }}</span>
            <span v-else :class="[r.c.cls, r.c.kind === 'num' ? 'num text-[15px]' : 'text-[12px] truncate']">{{ r.c.text }}</span>
          </div>
        </div>
      </div>
    </div>
  </BasePanel>
</template>

<style scoped>
.tbl th {
  font-size: 12px;
  font-weight: 500;
  color: var(--c-dim);
  text-align: right;
  padding: 0 10px 6px;
  border-bottom: 1px solid rgba(90, 196, 255, 0.16);
}

.tbl td {
  height: 23px;
  padding: 0 10px;
  text-align: right;
  font-size: 12px;
  white-space: nowrap;
}

.tbl tbody tr:nth-child(odd) td {
  background: rgba(8, 36, 64, 0.45);
}

.tbl tbody tr td:first-child {
  border-radius: 8px 0 0 8px;
}

.tbl tbody tr td:last-child {
  border-radius: 0 8px 8px 0;
}

.tbl .lbl {
  text-align: left;
  color: var(--c-dim);
}

.ch {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 1px 10px;
  color: var(--c);
  font-weight: 600;
  border-radius: 999px;
  background: color-mix(in srgb, var(--c) 16%, #07182c);
}

.ch::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--c);
}

.st {
  display: inline-block;
  font-size: 11px;
  line-height: 18px;
  padding: 0 10px;
  border-radius: 999px;
}

.st-run { color: #2ee59a; background: rgba(46, 229, 154, 0.14); }
.st-idle { color: #9fd0e6; background: rgba(90, 196, 255, 0.1); }
.st-err { color: #ff8a8a; background: rgba(220, 38, 38, 0.18); }
</style>
