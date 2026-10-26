<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { WORKSPACES } from '@/core/workspaceConfig';
import type { BmsCfg, MeterCfg } from '@/core/workspaceConfig';

const SECTIONS = [
  { id: 'meter', label: '电表配置' },
  { id: 'ess', label: '储能配置' },
  { id: 'device', label: '设备配置' },
  { id: 'param', label: '设备参数' },
  { id: 'bms', label: 'BMS配置' },
  { id: 'protocol', label: 'BMS协议' }
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

const workspaceId = ref(WORKSPACES[0].id);
const section = ref<SectionId>('meter');
const meterIndex = ref(0);
const bmsIndex = ref(0);

const workspace = computed(() => WORKSPACES.find((w) => w.id === workspaceId.value) ?? WORKSPACES[0]);
const channelList = computed(() => workspace.value.channels.split(/[,，]\s*/).map((item) => item.trim()).filter(Boolean));
const meter = computed(() => workspace.value.meters[meterIndex.value] ?? workspace.value.meters[0]);
const bms = computed(() => workspace.value.bms[bmsIndex.value] ?? workspace.value.bms[0]);

watch(workspaceId, () => {
  meterIndex.value = 0;
  bmsIndex.value = 0;
});

function meterFields(m: MeterCfg) {
  return [
    ['电表名称', m.name],
    ['目标IP', m.ip],
    ['目标端口', String(m.port)],
    ['从机地址', String(m.slave)],
    ['起始地址', m.start],
    ['数据个数', String(m.count)]
  ] as const;
}

function bmsFields(b: BmsCfg) {
  return [
    ['BMS名称', b.name],
    ['BMS索引', String(b.index)],
    ['通道ID', b.channelId],
    ['TCP目标IP', b.tcpIp],
    ['TCP端口号', String(b.tcpPort)],
    ['UDP本地IP', b.udpLocalIp],
    ['UDP本地端口', String(b.udpLocalPort)],
    ['UDP远程IP', b.udpRemoteIp],
    ['UDP远程端口', String(b.udpRemotePort)]
  ] as const;
}
</script>

<template>
  <div class="page">
    <div class="unit">
    <header class="unit-head">
      <div class="ws">
        <span>工作单元</span>
        <el-select
          v-model="workspaceId"
          class="desk-field ws-select"
          popper-class="desk-select"
          :teleported="false"
          :fit-input-width="true"
        >
          <el-option v-for="item in WORKSPACES" :key="item.id" :label="item.id" :value="item.id" />
        </el-select>
      </div>
      <p class="channels">
        <span>设备通道</span>
        <b v-for="ch in channelList" :key="ch" class="ch num">{{ ch }}</b>
      </p>
    </header>

    <nav class="tabs" aria-label="配置分类">
      <button
        v-for="item in SECTIONS"
        :key="item.id"
        type="button"
        :class="{ on: section === item.id }"
        :aria-current="section === item.id ? 'page' : undefined"
        @click="section = item.id"
      >{{ item.label }}</button>
    </nav>

    <section class="board">
      <template v-if="section === 'meter'">
        <div class="picks" role="tablist">
          <button
            v-for="(item, i) in workspace.meters"
            :key="item.name"
            type="button"
            :class="{ on: meterIndex === i }"
            @click="meterIndex = i"
          >{{ item.name }}</button>
        </div>
        <dl class="sheet">
          <div v-for="[label, value] in meterFields(meter)" :key="label">
            <dt>{{ label }}</dt>
            <dd class="num">{{ value }}</dd>
          </div>
        </dl>
      </template>

      <dl v-else-if="section === 'ess'" class="sheet cols">
        <div><dt>SOC最低预警</dt><dd class="num">{{ workspace.ess.socMinWarn }}</dd><i>%</i></div>
        <div><dt>单体最低预警</dt><dd class="num">{{ workspace.ess.cellMinWarn }}</dd><i>V</i></div>
        <div><dt>SOC最低告警</dt><dd class="num">{{ workspace.ess.socMinAlarm }}</dd><i>%</i></div>
        <div><dt>单体最低告警</dt><dd class="num">{{ workspace.ess.cellMinAlarm }}</dd><i>V</i></div>
        <div><dt>SOC最高预警</dt><dd class="num">{{ workspace.ess.socMaxWarn }}</dd><i>%</i></div>
        <div><dt>单体最高预警</dt><dd class="num">{{ workspace.ess.cellMaxWarn }}</dd><i>V</i></div>
        <div><dt>SOC最高告警</dt><dd class="num">{{ workspace.ess.socMaxAlarm }}</dd><i>%</i></div>
        <div><dt>单体最高告警</dt><dd class="num">{{ workspace.ess.cellMaxAlarm }}</dd><i>V</i></div>
        <div><dt>SOC保持线值</dt><dd class="num">{{ workspace.ess.socHold }}</dd><i>%</i></div>
        <div><dt>单体保持线值</dt><dd class="num">{{ workspace.ess.cellHold }}</dd><i>V</i></div>
        <div class="span"><dt>设备最大功率</dt><dd class="num">{{ workspace.ess.deviceMaxKw }}</dd><i>KW</i></div>
        <div class="span"><dt>通道最大功率</dt><dd class="num">{{ workspace.ess.channelMaxKw }}</dd><i>KW</i></div>
        <div class="span"><dt>设备最大电流</dt><dd class="num">{{ workspace.ess.deviceMaxA }}</dd><i>A</i></div>
        <div class="span"><dt>市电充电阈值</dt><dd class="num">{{ workspace.ess.gridChgKw }}</dd><i>KW</i></div>
        <div class="span"><dt>市电放电阈值</dt><dd class="num">{{ workspace.ess.gridDisKw }}</dd><i>KW</i></div>
      </dl>

      <dl v-else-if="section === 'device'" class="sheet">
        <div><dt>设备名称</dt><dd class="num">{{ workspace.device.name }}</dd></div>
        <div><dt>TCP目标IP</dt><dd class="num">{{ workspace.device.tcpIp }}</dd></div>
        <div><dt>TCP端口号</dt><dd class="num">{{ workspace.device.tcpPort }}</dd></div>
        <div><dt>UDP本地IP</dt><dd class="num">{{ workspace.device.udpLocalIp }}</dd></div>
        <div><dt>UDP本地端口</dt><dd class="num">{{ workspace.device.udpLocalPort }}</dd></div>
        <div><dt>UDP远程IP</dt><dd class="num">{{ workspace.device.udpRemoteIp }}</dd></div>
        <div><dt>UDP远程端口</dt><dd class="num">{{ workspace.device.udpRemotePort }}</dd></div>
        <div><dt>通道ID序列</dt><dd class="num">{{ workspace.device.channels }}</dd></div>
      </dl>

      <dl v-else-if="section === 'param'" class="sheet">
        <div><dt>总电压最大值</dt><dd class="num">{{ workspace.params.vMax }}</dd><i>V</i></div>
        <div><dt>总电压最小值</dt><dd class="num">{{ workspace.params.vMin }}</dd><i>V</i></div>
        <div><dt>总电流最大值</dt><dd class="num">{{ workspace.params.iMax }}</dd><i>A</i></div>
        <div><dt>总电流最小值</dt><dd class="num">{{ workspace.params.iMin }}</dd><i>A</i></div>
        <div><dt>总功率最大值</dt><dd class="num">{{ workspace.params.pMax }}</dd><i>KW</i></div>
        <div><dt>总功率最小值</dt><dd class="num">{{ workspace.params.pMin }}</dd><i>KW</i></div>
        <div><dt>温度最大值</dt><dd class="num">{{ workspace.params.tMax }}</dd><i>℃</i></div>
        <div><dt>温度最小值</dt><dd class="num">{{ workspace.params.tMin }}</dd><i>℃</i></div>
        <div><dt>单体电压最大值</dt><dd class="num">{{ workspace.params.cellMax }}</dd><i>V</i></div>
        <div><dt>单体电压最小值</dt><dd class="num">{{ workspace.params.cellMin }}</dd><i>V</i></div>
      </dl>

      <template v-else-if="section === 'bms'">
        <div class="picks" role="tablist">
          <button
            v-for="(item, i) in workspace.bms"
            :key="item.name + item.channelId"
            type="button"
            :class="{ on: bmsIndex === i }"
            @click="bmsIndex = i"
          >{{ item.name }}</button>
        </div>
        <dl class="sheet">
          <div v-for="[label, value] in bmsFields(bms)" :key="label">
            <dt>{{ label }}</dt>
            <dd class="num">{{ value }}</dd>
          </div>
        </dl>
      </template>

      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>序号</th>
              <th>CanId</th>
              <th>信号名称</th>
              <th>标识参数</th>
              <th>Bit类型</th>
              <th>起始位</th>
              <th>长度</th>
              <th>分辨率</th>
              <th>偏移量</th>
              <th>单位</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in workspace.protocol" :key="row.no">
              <td class="num">{{ row.no }}</td>
              <td class="num">{{ row.canId }}</td>
              <td>{{ row.name }}</td>
              <td>{{ row.tag }}</td>
              <td>{{ row.bitType }}</td>
              <td class="num">{{ row.start }}</td>
              <td class="num">{{ row.length }}</td>
              <td class="num">{{ row.resolution }}</td>
              <td class="num">{{ row.offset }}</td>
              <td>{{ row.unit || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    </div>
  </div>
</template>

<style scoped>
.page {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 14px 18px 16px;
}

.unit {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(90, 196, 255, 0.38);
  background:
    linear-gradient(90deg, #3ad4ff, transparent 32%) top / 100% 2px no-repeat,
    rgba(4, 16, 32, 0.38);
}

.unit-head {
  display: flex;
  align-items: center;
  min-height: 58px;
  padding: 0 18px;
  border-bottom: 1px solid rgba(90, 196, 255, 0.22);
  background: rgba(8, 36, 64, 0.42);
}

.ws {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #c5e6f5;
  font-size: 14px;
  letter-spacing: 0.08em;
}

.ws-select { width: 220px; }
.ws-select :deep(.el-select__wrapper) {
  height: 36px;
  min-height: 36px;
  border-radius: 0;
  background: rgba(6, 28, 52, 0.9);
  box-shadow: 0 0 0 1px rgba(90, 196, 255, 0.55) inset;
}
.ws-select :deep(.el-select__wrapper.is-focused),
.ws-select :deep(.el-select__wrapper.is-hovering) {
  box-shadow: 0 0 0 1px #7ee7ff inset;
}
.ws-select :deep(.el-select__placeholder),
.ws-select :deep(.el-select__selected-item) { color: #e7f6ff; }
.ws-select :deep(.el-select__caret) { color: #7ee7ff; }


.channels {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 0 28px;
  padding-left: 28px;
  border-left: 1px solid rgba(90, 196, 255, 0.28);
  color: #7eb4cc;
  font-size: 13px;
}

.ch {
  min-width: 40px;
  height: 28px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(90, 196, 255, 0.35);
  background: rgba(6, 28, 52, 0.5);
  color: #e7f6ff;
  font-weight: 500;
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(90, 196, 255, 0.22);
}

.tabs button,
.picks button {
  height: 34px;
  padding: 0 16px;
  border: 1px solid rgba(90, 196, 255, 0.35);
  background: rgba(6, 28, 52, 0.55);
  color: #c5e6f5;
  font: inherit;
  letter-spacing: 0.06em;
  cursor: pointer;
}

.tabs button.on,
.picks button.on {
  color: #04101c;
  background: #3ad4ff;
  border-color: #7ee7ff;
}


.board {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px 18px 20px;
}

.picks {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;
}

.sheet {
  display: grid;
  grid-template-columns: max-content;
  gap: 12px 0;
  margin: 8px 0 0 28px;
}

.sheet.cols {
  grid-template-columns: max-content max-content;
  column-gap: 72px;
}

.sheet div {
  display: grid;
  grid-template-columns: 132px 220px auto;
  align-items: center;
  gap: 12px;
}

.sheet .span { grid-column: 1; }

.sheet dt { color: #9fd0e6; text-align: right; }

.sheet dd {
  margin: 0;
  height: 32px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border: 1px solid rgba(90, 196, 255, 0.28);
  background: rgba(8, 32, 58, 0.5);
  color: #8ecbff;
}

.sheet i {
  color: #9fd0e6;
  font-style: normal;
  font-family: 'Instrument Sans', 'PingFang SC', sans-serif;
  font-size: 13px;
}

.table-wrap { min-width: 0; }

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

th, td {
  padding: 8px 10px;
  border-bottom: 1px solid rgba(90, 196, 255, 0.16);
  text-align: left;
  white-space: nowrap;
}

th {
  position: sticky;
  top: 0;
  color: #7eb4cc;
  font-weight: 500;
  background: rgba(7, 24, 44, 0.78);
}

td { color: #d7eef8; }

tbody tr:hover td { background: rgba(58, 212, 255, 0.08); }
</style>
