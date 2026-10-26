<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useEnergy } from '@/composables/useEnergy';
import { ESS_REFRESH_MS } from '@/core/constants';
import { fmt } from '@/core/utils';
import type { BmsData, PcsChannel } from '@/core/types';
import PcsPowerChart from '@/components/PcsPowerChart.vue';

const { state } = useEnergy();
const RANGE_MS = 15 * 60 * 1000;
const PANEL_W = 420;
const PANEL_H = 440;
const WORKSPACE = 'WorkSpace0';

interface Row { label: string; text: string; em?: boolean; cls?: string }

function pcsRows(ch: PcsChannel): Row[] {
  const statusCls = ch.status === '运行' ? 'ok' : ch.status === '故障' ? 'bad' : '';
  const powerCls = ch.power > 0.5 ? 'pos' : ch.power < -0.5 ? 'neg' : '';
  const fault = (v: string) => (v === '无' ? 'ok' : 'bad');
  return [
    { label: '最新时间', text: ch.time || '--' },
    { label: '采样电压/V', text: fmt(ch.voltage, 1) },
    { label: '采样电流/A', text: fmt(ch.current, 1) },
    { label: '当前功率/KW', text: fmt(ch.power, 2), em: true, cls: powerCls },
    { label: '充电安时/AH', text: fmt(ch.chgAh, 2) },
    { label: '放电安时/AH', text: fmt(ch.disAh, 2) },
    { label: '充电瓦时/WH', text: fmt(ch.chgWh, 0) },
    { label: '放电瓦时/WH', text: fmt(ch.disWh, 0) },
    { label: '工步信息', text: ch.step || '--', em: true },
    { label: '当前状态', text: ch.status, em: true, cls: statusCls },
    { label: '工作模式', text: ch.mode || '--' },
    { label: '故障信息', text: ch.fault, cls: fault(ch.fault) },
    { label: 'PWM故障信息', text: ch.pwmFault, cls: fault(ch.pwmFault) },
    { label: 'DCDC故障信息', text: ch.dcdcFault, cls: fault(ch.dcdcFault) }
  ];
}

function bmsRows(b: BmsData): Row[] {
  const status = b.totalI > 1 ? '充电中' : b.totalI < -1 ? '放电中' : '静置';
  return [
    { label: '当前状态', text: status, em: true, cls: 'ok' },
    { label: '总电压/V', text: fmt(b.totalV, 1) },
    { label: '总电流/A', text: fmt(b.totalI, 1) },
    { label: 'SOC/%', text: fmt(b.soc, 1), em: true },
    { label: '最大单体/V', text: fmt(b.maxCellV, 3), em: true },
    { label: '最大单体编号', text: `#${b.maxCellNo}` },
    { label: '最小单体/V', text: fmt(b.minCellV, 3), em: true },
    { label: '最小单体编号', text: `#${b.minCellNo}` },
    { label: '最大温度/℃', text: fmt(b.maxT, 1) },
    { label: '最大温度编号', text: `#${b.maxTNo}` },
    { label: '最小温度/℃', text: fmt(b.minT, 1) },
    { label: '最小温度编号', text: `#${b.minTNo}` }
  ];
}

function curveOf(index: number, now: number): [number, number][] {
  const src = state.value.pcsHistory?.[index] ?? [];
  const from = now - RANGE_MS;
  const out: [number, number][] = [];
  let last = 0;
  for (const p of src) {
    if (p[0] < from) continue;
    if (out.length && p[0] - last < 9000) continue;
    out.push(p);
    last = p[0];
  }
  return out;
}

function capture() {
  const s = state.value;
  const b = s.bms;
  const hasBms = b.cells.length > 0;
  const bms = hasBms ? bmsRows(b) : null;
  const bmsStatus = b.totalI > 1 ? '充电中' : b.totalI < -1 ? '放电中' : '静置';
  const bmsStatusCls = b.totalI > 1 ? 'pos' : b.totalI < -1 ? 'neg' : '';
  return s.pcs.map((ch, i) => ({
    no: ch.no,
    workspace: WORKSPACE,
    time: ch.time || '--',
    status: ch.status,
    statusCls: ch.status === '运行' ? 'ok' : ch.status === '故障' ? 'bad' : '',
    power: fmt(ch.power, 2),
    powerCls: ch.power > 0.5 ? 'pos' : ch.power < -0.5 ? 'neg' : '',
    voltage: fmt(ch.voltage, 1),
    current: fmt(ch.current, 1),
    color: i === 0 ? '#3ad4ff' : '#7dffc3',
    pcs: pcsRows(ch),
    curve: curveOf(i, s.ts),
    bms: bms && {
      status: bmsStatus,
      statusCls: bmsStatusCls,
      soc: fmt(b.soc, 1),
      maxCell: fmt(b.maxCellV, 3),
      maxNo: b.maxCellNo,
      minCell: fmt(b.minCellV, 3),
      minNo: b.minCellNo,
      rows: bms
    }
  }));
}

const cards = ref(capture());
const openKey = ref<string | null>(null);
const pos = ref({ top: 80, left: 16, scale: 1 });
const opened = computed(() => {
  if (!openKey.value) return null;
  const [no, kind] = openKey.value.split(':');
  const card = cards.value.find((c) => c.no === Number(no));
  if (!card || (kind === 'bms' && !card.bms)) return null;
  return {
    title: kind === 'bms' ? `通道 ${card.no} · 电池参数` : `通道 ${card.no} · 设备参数`,
    color: card.color,
    rows: kind === 'bms' ? card.bms!.rows : card.pcs
  };
});
const panelStyle = computed(() => ({
  position: 'fixed',
  top: `${pos.value.top}px`,
  left: `${pos.value.left}px`,
  transform: `scale(${pos.value.scale})`,
  transformOrigin: 'top left',
  zIndex: '80'
}));
let timer = 0;
let closeTimer = 0;

function place(el: HTMLElement) {
  const screen = document.querySelector('.screen') as HTMLElement | null;
  const sb = screen?.getBoundingClientRect();
  const tb = el.getBoundingClientRect();
  const scale = screen && sb ? sb.width / screen.offsetWidth || 1 : 1;
  const w = PANEL_W * scale;
  const h = PANEL_H * scale;
  let left = tb.right - w;
  let top = tb.bottom + 8;
  if (left < 8) left = 8;
  if (left + w > window.innerWidth - 8) left = Math.max(8, window.innerWidth - 8 - w);
  if (top + h > window.innerHeight - 8) top = Math.max(8, tb.top - h - 8);
  pos.value = { top, left, scale };
}

function show(key: string, e: Event) {
  window.clearTimeout(closeTimer);
  openKey.value = key;
  place(e.currentTarget as HTMLElement);
}

function scheduleClose() {
  window.clearTimeout(closeTimer);
  closeTimer = window.setTimeout(() => { openKey.value = null; }, 160);
}

function cancelClose() {
  window.clearTimeout(closeTimer);
}

onMounted(() => {
  cards.value = capture();
  timer = window.setInterval(() => { cards.value = capture(); }, ESS_REFRESH_MS);
});
onBeforeUnmount(() => {
  window.clearInterval(timer);
  window.clearTimeout(closeTimer);
});
</script>

<template>
  <div class="page">
    <article
      v-for="card in cards"
      :key="card.no"
      class="chassis"
      :class="{ 'no-bms': !card.bms }"
      :style="{ '--accent': card.color }"
    >
      <header class="rail">
        <p class="mark">
          <em>工作单元</em>
          <strong>{{ card.workspace }}</strong>
        </p>
        <i class="sep" />
        <p class="mark channel">
          <em>通道</em>
          <strong class="num">{{ card.no }}</strong>
        </p>
      </header>

      <div class="bays">
        <section class="bay">
          <header>
            <b>充放电设备</b>
            <button
              type="button"
              class="detail"
              :aria-expanded="openKey === card.no + ':dev'"
              @mouseenter="show(card.no + ':dev', $event)"
              @mouseleave="scheduleClose"
              @focus="show(card.no + ':dev', $event)"
              @blur="scheduleClose"
            >详情</button>
          </header>
          <p class="state" :class="card.statusCls">{{ card.status }}</p>
          <dl class="facts">
            <div><dt>功率</dt><dd class="num" :class="card.powerCls">{{ card.power }}<i>kW</i></dd></div>
            <div><dt>电压</dt><dd class="num">{{ card.voltage }}<i>V</i></dd></div>
            <div><dt>电流</dt><dd class="num">{{ card.current }}<i>A</i></dd></div>
          </dl>
          <time class="num">{{ card.time }}</time>
        </section>

        <section v-if="card.bms" class="bay">
          <header>
            <b>BMS信息</b>
            <button
              type="button"
              class="detail"
              :aria-expanded="openKey === card.no + ':bms'"
              @mouseenter="show(card.no + ':bms', $event)"
              @mouseleave="scheduleClose"
              @focus="show(card.no + ':bms', $event)"
              @blur="scheduleClose"
            >详情</button>
          </header>
          <p class="state" :class="card.bms.statusCls">{{ card.bms.status }}</p>
          <dl class="facts">
            <div><dt>SOC</dt><dd class="num">{{ card.bms.soc }}<i>%</i></dd></div>
            <div><dt>最大单体</dt><dd class="num">{{ card.bms.maxCell }}<i>V #{{ card.bms.maxNo }}</i></dd></div>
            <div><dt>最小单体</dt><dd class="num">{{ card.bms.minCell }}<i>V #{{ card.bms.minNo }}</i></dd></div>
          </dl>
          <time class="num">{{ card.time }}</time>
        </section>

        <section class="bay plot">
          <header><b>功率曲线</b></header>
          <div class="plot-body">
            <PcsPowerChart compact :points="card.curve" :color="card.color" />
          </div>
        </section>
      </div>
    </article>

    <Teleport to="body">
      <div
        v-if="opened"
        class="panel"
        :style="{ ...panelStyle, '--accent': opened.color }"
        @mouseenter="cancelClose"
        @mouseleave="scheduleClose"
      >
        <h3>{{ opened.title }}</h3>
        <div v-for="row in opened.rows" :key="row.label" class="row" :class="{ em: row.em }">
          <span>{{ row.label }}</span>
          <b :class="row.cls">{{ row.text }}</b>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.page {
  height: 100%;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  padding: 10px 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.page::-webkit-scrollbar { width: 8px; }
.page::-webkit-scrollbar-thumb { background: rgba(90, 196, 255, 0.35); border-radius: 4px; }

.chassis {
  flex: none;
  height: calc((100% - 24px) / 3.5);
  min-height: 172px;
  max-height: 228px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 10px 10px;
  border: 1px solid rgba(90, 196, 255, 0.38);
  background:
    linear-gradient(90deg, var(--accent), transparent 42%) top / 100% 2px no-repeat,
    rgba(4, 16, 32, 0.55);
}

.rail {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 26px;
}
.mark {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 0;
}
.mark em {
  font-style: normal;
  font-size: 12px;
  letter-spacing: 0.16em;
  color: #7eb4cc;
}
.mark strong { font-size: 16px; font-weight: 600; letter-spacing: 0.04em; }
.mark.channel strong { font-size: 26px; line-height: 1; color: var(--accent); }
.sep { width: 1px; height: 16px; background: rgba(90, 196, 255, 0.4); }

.bays {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 280px 280px minmax(0, 1fr);
  gap: 8px;
}
.chassis.no-bms .bays { grid-template-columns: 280px minmax(0, 1fr); }

.bay {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 14px 8px;
  background: rgba(6, 28, 52, 0.78);
  border: 1px solid rgba(90, 196, 255, 0.2);
}
.bay header { display: flex; align-items: center; gap: 8px; }
.bay header b { font-size: 12px; font-weight: 600; letter-spacing: 0.1em; color: #c5e6f5; }
.bay time { color: #7eb4cc; font-size: 12px; }

.state {
  margin: 0;
  padding-left: 8px;
  border-left: 3px solid currentColor;
  font-size: 18px;
  font-weight: 650;
  line-height: 1.1;
  letter-spacing: 0.16em;
  color: #d5e8f2;
}
.state.ok, .ok { color: #7dffc3; }
.state.bad, .bad { color: #ff8a8a; }
.state.pos, .pos { color: #7dffc3; }
.state.neg, .neg { color: #8aecff; }

.facts {
  flex: 1;
  margin: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
}
.facts div { display: grid; grid-template-columns: 4.5em minmax(0, 1fr); align-items: baseline; column-gap: 8px; }
.facts dt { color: #7eb4cc; font-size: 12px; }
.facts dd { margin: 0; font-size: 16px; line-height: 1.2; text-align: right; white-space: nowrap; }
.facts i { margin-left: 3px; color: #7eb4cc; font-style: normal; font-size: 11px; font-family: 'Instrument Sans', 'PingFang SC', sans-serif; }

.plot-body { position: relative; flex: 1; min-height: 0; }
.plot-body :deep(.plot) { position: absolute; inset: 0; }

.detail {
  margin-left: auto;
  padding: 0 0 1px;
  border: 0;
  border-bottom: 1px dashed rgba(122, 212, 255, 0.7);
  background: none;
  color: #9adfff;
  font: inherit;
  font-size: 12px;
  letter-spacing: 0.12em;
  cursor: pointer;
}
.detail:hover { color: #e7f6ff; border-bottom-color: #e7f6ff; }
.detail:focus-visible {
  color: #e7f6ff;
  border-bottom-color: #e7f6ff;
}

.panel {
  width: 420px;
  padding: 12px 14px 10px;
  background: rgba(4, 16, 32, 0.97);
  border: 1px solid rgba(90, 196, 255, 0.45);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.45);
}
.panel h3 { margin: 0 0 8px; font-size: 14px; font-weight: 600; }
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 3px 0;
  border-bottom: 1px solid rgba(90, 196, 255, 0.1);
  font-size: 12px;
}
.row span { color: #7eb4cc; }
.row b { font-weight: 500; }
.row.em b { color: var(--accent); }
.row.em b.ok, .ok { color: #7dffc3; }
.row.em b.bad, .bad { color: #ff8a8a; }
.row.em b.pos { color: #7dffc3; }
.row.em b.neg { color: #8aecff; }

@media (prefers-reduced-motion: reduce) {
  .panel { transition: none; }
}
</style>
