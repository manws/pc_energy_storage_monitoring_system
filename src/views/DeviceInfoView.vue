<script setup lang="ts">
import { computed, ref } from 'vue';
import { useEnergy } from '@/composables/useEnergy';
import { BMS_FIELDS, CELL_COUNT, PCS_FIELDS, TEMP_COUNT } from '@/core/constants';
import { fmt, isNum } from '@/core/utils';
import type { PcsChannel, PcsFieldMeta } from '@/core/types';
import BmsHeatmap from '@/components/BmsHeatmap.vue';

const { state } = useEnergy();
const heat = ref<'v' | 't'>('v');
const focus = ref<'ch0' | 'ch1' | 'bms'>('ch0');
const FAULT_KEYS = ['fault', 'pwmFault', 'dcdcFault'];

function cell(f: PcsFieldMeta, ch: PcsChannel) {
  const v = ch[f.key];
  if (f.key === 'status') return { text: String(v), cls: v === '运行' ? 'ok' : v === '故障' ? 'bad' : '' };
  if (FAULT_KEYS.includes(f.key)) return { text: String(v), cls: v === '无' ? 'ok' : 'bad' };
  if (f.key === 'time') return { text: String(v).slice(11) || '--', cls: '' };
  if (isNum(v)) return { text: fmt(v, f.d ?? 1), cls: '' };
  return { text: String(v ?? '--'), cls: '' };
}

const channels = computed(() => state.value.pcs.map((ch, i) => ({
  id: i === 0 ? 'ch0' as const : 'ch1' as const,
  title: `通道${ch.no}`,
  status: ch.status,
  power: ch.power,
  voltage: ch.voltage,
  current: ch.current,
  mode: ch.mode,
  rows: PCS_FIELDS.map((f) => ({ label: f.label, ...cell(f, ch) }))
})));

const bms = computed(() => {
  const b = state.value.bms;
  const I = b.totalI;
  return {
    soc: b.soc,
    status: I > 1 ? '充电中' : I < -1 ? '放电中' : '静置',
    fields: BMS_FIELDS.map((f) => ({ ...f, text: `${f.prefix ?? ''}${fmt(b[f.key], f.d)}${f.unit ? ' ' + f.unit : ''}` })),
    raw: b
  };
});
</script>

<template>
  <div class="page">
    <section class="cards">
      <button
        v-for="ch in channels"
        :key="ch.id"
        type="button"
        class="card"
        :class="{ 'is-on': focus === ch.id, 'is-bad': ch.status === '故障' }"
        @click="focus = ch.id"
      >
        <div class="card-top">
          <span>设备</span>
          <span class="st" :class="ch.status === '运行' ? 'ok' : ch.status === '故障' ? 'bad' : ''">{{ ch.status }}</span>
        </div>
        <div class="title">{{ ch.title }}</div>
        <div class="desc">储能充放电机</div>
        <div class="hero"><span class="num">{{ fmt(ch.power, 2) }}</span><span>kW</span></div>
        <div class="metrics">
          <span><em>电压</em>{{ fmt(ch.voltage, 1) }} V</span>
          <span><em>电流</em>{{ fmt(ch.current, 1) }} A</span>
        </div>
        <div class="mode">{{ ch.mode }}</div>
      </button>
      <button type="button" class="card" :class="{ 'is-on': focus === 'bms' }" @click="focus = 'bms'">
        <div class="card-top"><span>BMS</span><span class="st ok">{{ bms.status }}</span></div>
        <div class="title">储能电池</div>
        <div class="desc">{{ CELL_COUNT }} 串单体</div>
        <div class="hero"><span class="num">{{ fmt(bms.soc, 1) }}</span><span>%</span></div>
        <div class="mode">SOC</div>
      </button>
    </section>

    <section class="block">
      <header class="block-head"><h2>设备数据</h2><p>两路充放电机实时参数</p></header>
      <div class="cols">
        <article v-for="ch in channels" :key="ch.id" class="panel" :class="{ 'is-on': focus === ch.id }">
          <h3>{{ ch.title }}</h3>
          <div v-for="row in ch.rows" :key="row.label" class="field">
            <span>{{ row.label }}</span>
            <b :class="row.cls">{{ row.text }}</b>
          </div>
        </article>
      </div>
    </section>

    <section class="block">
      <header class="block-head">
        <h2>BMS 数据</h2>
        <div class="tools">
          <button type="button" class="chip" :class="{ 'is-active': heat === 'v' }" @click="heat = 'v'">电压</button>
          <button type="button" class="chip" :class="{ 'is-active': heat === 't' }" @click="heat = 't'">温度</button>
        </div>
      </header>
      <div class="bms-grid">
        <article v-for="f in bms.fields" :key="f.key" class="field">
          <span>{{ f.label }}</span>
          <b>{{ f.text }}</b>
        </article>
      </div>
      <div class="heat">
        <BmsHeatmap
          v-if="heat === 'v'"
          :values="bms.raw.cells"
          :cols="16"
          :max-no="bms.raw.maxCellNo"
          :min-no="bms.raw.minCellNo"
          unit="V"
          :decimals="3"
        />
        <BmsHeatmap
          v-else
          :values="bms.raw.temps"
          :cols="8"
          :max-no="bms.raw.maxTNo"
          :min-no="bms.raw.minTNo"
          unit="℃"
          :decimals="1"
        />
        <p class="hint">{{ heat === 'v' ? `${CELL_COUNT} 串单体电压` : `${TEMP_COUNT} 点温度` }}</p>
      </div>
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

.cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }

.card, .panel, .heat, .field {
  border: 1px solid rgba(90, 196, 255, 0.28);
  background: rgba(6, 28, 52, 0.72);
}

.card {
  padding: 14px 16px 16px;
  text-align: left;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.card.is-on, .panel.is-on { border-color: #7ee7ff; box-shadow: 0 0 16px rgba(58, 212, 255, 0.25); }
.card.is-bad { border-color: rgba(255, 107, 107, 0.7); }
.card-top, .metrics, .block-head, .field { display: flex; align-items: center; }
.card-top, .block-head { justify-content: space-between; }
.card-top, .desc, .mode, .hint { color: #7eb4cc; font-size: 12px; }
.title { margin-top: 10px; font-size: 20px; font-weight: 600; }
.hero { display: flex; align-items: baseline; gap: 6px; margin-top: 8px; }
.hero .num { font-size: 34px; line-height: 1; }
.metrics { gap: 16px; margin-top: 10px; }
.metrics em { display: block; font-style: normal; color: #7eb4cc; font-size: 12px; }
.st.ok { color: #2ee59a; }
.st.bad, .bad { color: #ff8a8a; }
.ok { color: #2ee59a; }

.block-head h2 { margin: 0; font-size: 16px; letter-spacing: 0.08em; }
.block-head p { margin: 0; color: #7eb4cc; }
.tools { display: flex; gap: 8px; }
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 10px; }
.panel { padding: 12px 14px; }
.panel h3 { margin: 0 0 8px; }
.field { justify-content: space-between; gap: 8px; padding: 8px 12px; margin-top: 6px; }
.field span { color: #7eb4cc; }
.bms-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; margin-top: 10px; }
.heat { margin-top: 12px; padding: 12px; }
.hint { margin: 8px 0 0; }
</style>
