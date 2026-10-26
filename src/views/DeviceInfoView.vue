<script setup lang="ts">
import { computed, ref } from 'vue';
import { useEnergy } from '@/composables/useEnergy';
import { CELL_COUNT, TEMP_COUNT } from '@/core/constants';
import { fmt } from '@/core/utils';
import BmsHeatmap from '@/components/BmsHeatmap.vue';

const { state } = useEnergy();
const heat = ref<'v' | 't'>('v');

const channels = computed(() => state.value.pcs.map((ch) => ({
  title: `通道 ${ch.no}`,
  status: ch.status,
  statusCls: ch.status === '运行' ? 'ok' : ch.status === '故障' ? 'bad' : '',
  mode: ch.mode,
  power: fmt(ch.power, 2),
  powerCls: ch.power > 0.5 ? 'pos' : ch.power < -0.5 ? 'neg' : '',
  voltage: fmt(ch.voltage, 1),
  current: fmt(ch.current, 1),
  time: String(ch.time).slice(11) || '--',
  step: ch.step || '--',
  energy: [
    { label: '充电安时', value: fmt(ch.chgAh, 2), unit: 'Ah' },
    { label: '放电安时', value: fmt(ch.disAh, 2), unit: 'Ah' },
    { label: '充电电量', value: fmt(ch.chgWh, 0), unit: 'Wh' },
    { label: '放电电量', value: fmt(ch.disWh, 0), unit: 'Wh' }
  ],
  faults: [
    { label: '故障', text: ch.fault, ok: ch.fault === '无' },
    { label: 'PWM', text: ch.pwmFault, ok: ch.pwmFault === '无' },
    { label: 'DCDC', text: ch.dcdcFault, ok: ch.dcdcFault === '无' }
  ]
})));

const bms = computed(() => {
  const b = state.value.bms;
  const I = b.totalI;
  return {
    soc: fmt(b.soc, 1),
    status: I > 1 ? '充电中' : I < -1 ? '放电中' : '静置',
    totalV: fmt(b.totalV, 1),
    totalI: fmt(b.totalI, 1),
    extremes: [
      { label: '最大单体', value: fmt(b.maxCellV, 3), unit: 'V', no: b.maxCellNo },
      { label: '最小单体', value: fmt(b.minCellV, 3), unit: 'V', no: b.minCellNo },
      { label: '最高温度', value: fmt(b.maxT, 1), unit: '℃', no: b.maxTNo },
      { label: '最低温度', value: fmt(b.minT, 1), unit: '℃', no: b.minTNo }
    ],
    raw: b
  };
});
</script>

<template>
  <div class="page">
    <article v-for="ch in channels" :key="ch.title" class="col">
      <header class="head">
        <div>
          <p class="kicker">储能充放电机</p>
          <h2>{{ ch.title }}</h2>
        </div>
        <div class="tags">
          <span class="pill" :class="ch.statusCls">{{ ch.status }}</span>
          <span class="mode">{{ ch.mode }}</span>
        </div>
      </header>

      <div class="hero">
        <div class="stat main">
          <em>功率</em>
          <div class="val"><b class="num" :class="ch.powerCls">{{ ch.power }}</b><span>kW</span></div>
        </div>
        <div class="stat">
          <em>电压</em>
          <div class="val"><b class="num">{{ ch.voltage }}</b><span>V</span></div>
        </div>
        <div class="stat">
          <em>电流</em>
          <div class="val"><b class="num">{{ ch.current }}</b><span>A</span></div>
        </div>
      </div>

      <div class="quad">
        <div v-for="item in ch.energy" :key="item.label" class="tile">
          <em>{{ item.label }}</em>
          <div class="val"><b class="num">{{ item.value }}</b><span>{{ item.unit }}</span></div>
        </div>
      </div>

      <footer class="foot">
        <div class="step">
          <em>工步</em>
          <b>{{ ch.step }}</b>
          <span class="time num">{{ ch.time }}</span>
        </div>
        <div class="faults">
          <span v-for="f in ch.faults" :key="f.label" class="pill" :class="f.ok ? 'ok' : 'bad'">
            {{ f.label }} {{ f.text }}
          </span>
        </div>
      </footer>
    </article>

    <article class="bms">
      <header class="head">
        <div>
          <p class="kicker">BMS · {{ CELL_COUNT }} 串</p>
          <h2>储能电池</h2>
        </div>
        <span class="pill ok">{{ bms.status }}</span>
      </header>
      <div class="strip">
        <div class="stat main">
          <em>SOC</em>
          <div class="val"><b class="num">{{ bms.soc }}</b><span>%</span></div>
        </div>
        <div class="stat">
          <em>总电压</em>
          <div class="val"><b class="num">{{ bms.totalV }}</b><span>V</span></div>
        </div>
        <div class="stat">
          <em>总电流</em>
          <div class="val"><b class="num">{{ bms.totalI }}</b><span>A</span></div>
        </div>
        <div v-for="item in bms.extremes" :key="item.label" class="stat">
          <em>{{ item.label }} <i class="num">#{{ item.no }}</i></em>
          <div class="val"><b class="num">{{ item.value }}</b><span>{{ item.unit }}</span></div>
        </div>
      </div>
      <div class="heat">
        <div class="heat-bar">
          <span>{{ heat === 'v' ? `${CELL_COUNT} 串单体电压` : `${TEMP_COUNT} 点温度` }} · 白框最大 · 蓝框最小</span>
          <div class="tools">
            <button type="button" class="chip" :class="{ 'is-active': heat === 'v' }" @click="heat = 'v'">电压</button>
            <button type="button" class="chip" :class="{ 'is-active': heat === 't' }" @click="heat = 't'">温度</button>
          </div>
        </div>
        <BmsHeatmap
          v-if="heat === 'v'"
          class="map"
          fit-height
          :values="bms.raw.cells"
          :cols="32"
          :max-no="bms.raw.maxCellNo"
          :min-no="bms.raw.minCellNo"
          unit="V"
          :decimals="3"
        />
        <BmsHeatmap
          v-else
          class="map"
          fit-height
          :values="bms.raw.temps"
          :cols="16"
          :max-no="bms.raw.maxTNo"
          :min-no="bms.raw.minTNo"
          unit="℃"
          :decimals="1"
        />
      </div>
    </article>
  </div>
</template>

<style scoped>
.page {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding: 14px 16px 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 12px;
}

.col, .bms {
  min-width: 0;
  border: 1px solid rgba(90, 196, 255, 0.28);
  background: rgba(6, 28, 52, 0.62);
}
.col { padding: 14px 16px 12px; display: flex; flex-direction: column; gap: 10px; }
.bms {
  grid-column: 1 / -1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 16px 14px;
}

.head, .step, .heat-bar, .val { display: flex; align-items: center; }
.head, .step, .heat-bar { justify-content: space-between; }
.head { gap: 12px; }
.head h2 { margin: 2px 0 0; font-size: 20px; font-weight: 600; }
.kicker, em, .mode, .time, .heat-bar > span { color: #7eb4cc; font-style: normal; }
.kicker { margin: 0; font-size: 12px; letter-spacing: 0.06em; }
.tags { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.mode { font-size: 12px; }

.pill {
  padding: 2px 8px;
  font-size: 12px;
  line-height: 18px;
  border: 1px solid rgba(126, 180, 204, 0.45);
  color: #d5e8f2;
}
.pill.ok { color: #7dffc3; border-color: rgba(125, 255, 195, 0.45); }
.pill.bad { color: #ff8a8a; border-color: rgba(255, 138, 138, 0.55); }

.hero, .quad, .strip { display: grid; gap: 8px; }
.hero { grid-template-columns: 1.35fr 1fr 1fr; }
.quad { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.strip { grid-template-columns: 1.25fr repeat(6, minmax(0, 1fr)); }

.stat, .tile, .soc {
  padding: 8px 10px;
  background: rgba(4, 18, 36, 0.45);
  border: 1px solid rgba(90, 196, 255, 0.14);
}
.stat em, .tile em { display: block; font-size: 12px; }
.stat em i { font-style: normal; margin-left: 4px; }
.val { align-items: baseline; gap: 4px; margin-top: 2px; }
.stat b, .tile b { font-size: 18px; font-weight: 500; line-height: 1.1; }
.stat.main b, .soc b { font-size: 28px; }
.val span { font-size: 12px; color: #7eb4cc; }
.pos { color: #7dffc3; }
.neg { color: #8aecff; }

.foot { display: flex; flex-direction: column; gap: 8px; }
.step { gap: 8px; }
.step em { flex: none; font-size: 12px; }
.step b { min-width: 0; font-size: 14px; font-weight: 500; }
.time { flex: none; margin-left: auto; font-size: 12px; }
.faults { display: flex; gap: 8px; }

.heat {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(4, 18, 36, 0.35);
  border: 1px solid rgba(90, 196, 255, 0.14);
}
.heat-bar { flex: none; font-size: 12px; }
.tools { display: flex; gap: 6px; }
.map { flex: 1; min-height: 0; }
</style>
