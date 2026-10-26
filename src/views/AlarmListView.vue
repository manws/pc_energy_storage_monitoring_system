<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import { useEnergy } from '@/composables/useEnergy';
import { fmtTime } from '@/core/utils';
import type { AlarmItem } from '@/core/types';
import ListPager from '@/components/ListPager.vue';

type Kind = '事件' | '报警';
type Filter = 'all' | Kind;

interface AlarmRow {
  id: number;
  no: number;
  workspace: string;
  channel: string;
  kind: Kind;
  name: string;
  desc: string;
  ts: number;
}

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: '事件', label: '事件' },
  { id: '报警', label: '报警' }
];

const { state } = useEnergy();
const filter = ref<Filter>('all');
const keyword = ref('');
const date = ref<string | null>(null);
const page = ref(1);
const pageSize = ref(50);
const rows = ref<AlarmRow[]>([]);

function dayKey(ts: number) {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function eventName(source: string, msg: string) {
  if (msg.includes('逆流已解除')) return '逆流解除';
  if (msg.includes('逆流')) return '逆流报警';
  if (msg.includes('温度恢复')) return '温度恢复';
  if (msg.includes('温度偏高')) return '温度偏高';
  if (msg.includes('SOC偏低')) return 'SOC偏低';
  if (msg.includes('功率调节')) return '防逆流延迟';
  if (msg.includes('自检通过')) return 'BMS自检';
  if (msg.includes('通讯链路')) return '通道通讯';
  if (msg.includes('数据采集')) return '电表采集';
  if (msg.includes('服务启动')) return '服务启动';
  if (msg.includes('切换至')) return '工况切换';
  if (msg.includes('已确认')) return '告警确认';
  return source;
}

function channelOf(source: string, msg: string) {
  if (msg.includes('CH1') && msg.includes('CH2')) return '20, 21';
  if (msg.includes('CH1')) return '20';
  if (msg.includes('CH2')) return '21';
  if (source === 'BMS' || source === '储能PCS') return '20, 21';
  return '—';
}

function toRow(item: AlarmItem, index: number): AlarmRow {
  const kind: Kind = item.level === 'danger' || item.level === 'warning' ? '报警' : '事件';
  return {
    id: item.id,
    no: index + 1,
    workspace: 'WorkSpace0',
    channel: channelOf(item.source, item.msg),
    kind,
    name: eventName(item.source, item.msg),
    desc: item.msg,
    ts: item.ts
  };
}

onMounted(() => {
  rows.value = state.value.alarms.map(toRow);
});

const matched = computed(() => {
  const word = keyword.value.trim().toLowerCase();
  return rows.value.filter((item) => {
    if (filter.value !== 'all' && item.kind !== filter.value) return false;
    if (date.value && dayKey(item.ts) !== date.value) return false;
    if (!word) return true;
    return [item.workspace, item.channel, item.name, item.desc].some((field) => field.toLowerCase().includes(word));
  });
});
const counts = computed(() => {
  const tally = { all: rows.value.length, 事件: 0, 报警: 0 };
  for (const item of rows.value) tally[item.kind] += 1;
  return tally;
});
const pages = computed(() => Math.max(1, Math.ceil(matched.value.length / pageSize.value)));
const shown = computed(() => matched.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value));

watch([filter, keyword, date], () => { page.value = 1; });
watch(pages, (n) => { if (page.value > n) page.value = n; });
</script>

<template>
  <div class="page">
    <header class="bar">
      <nav class="filters" aria-label="事件类型">
        <button
          v-for="item in FILTERS"
          :key="item.id"
          type="button"
          :class="{ on: filter === item.id }"
          @click="filter = item.id"
        >{{ item.label }}<b class="num">{{ counts[item.id] }}</b></button>
      </nav>
      <div class="tools">
        <label class="find">
          日期
          <el-config-provider :locale="zhCn">
            <el-date-picker
              v-model="date"
              class="date desk-field"
              type="date"
              value-format="YYYY-MM-DD"
              format="YYYY-MM-DD"
              placeholder="选择日期"
              :editable="false"
              :show-footer="false"
              popper-class="desk-date"
            />
          </el-config-provider>
        </label>
        <label class="find">
          关键词
          <el-input v-model="keyword" class="desk-field word" placeholder="名称或描述" clearable />
        </label>
      </div>
    </header>

    <div class="board">
      <table v-if="shown.length">
        <thead>
          <tr>
            <th>序号</th>
            <th>工作单元</th>
            <th>通道信息</th>
            <th>事件类型</th>
            <th>事件名称</th>
            <th>事件描述</th>
            <th>事件时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in shown" :key="item.id" :class="item.kind === '报警' ? 'alarm' : 'event'">
            <td class="num">{{ item.no }}</td>
            <td>{{ item.workspace }}</td>
            <td class="num">{{ item.channel }}</td>
            <td><span class="lv">{{ item.kind }}</span></td>
            <td>{{ item.name }}</td>
            <td class="msg">{{ item.desc }}</td>
            <td class="num time">{{ fmtTime(item.ts, true) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else class="empty">没有符合条件的记录<span>换个类型、日期或关键字</span></p>
    </div>
    <footer class="foot">
      <p>共 <b class="num">{{ matched.length }}</b> 条 · 进入页面时的记录</p>
      <ListPager v-model:page="page" v-model:size="pageSize" :pages="pages" />
    </footer>
  </div>
</template>

<style scoped>
.page {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 18px 16px;
}

.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.bar p {
  margin: 0;
  color: #7eb4cc;
  font-size: 13px;
}

.bar b { color: #e7f6ff; font-weight: 500; }

.filters { display: flex; gap: 8px; }

.filters button {
  height: 32px;
  padding: 0 14px;
  border: 1px solid rgba(90, 196, 255, 0.35);
  background: rgba(6, 28, 52, 0.55);
  color: #c5e6f5;
  font: inherit;
  letter-spacing: 0.06em;
  cursor: pointer;
}

.filters button.on,
.filters button.on b {
  color: #04101c;
  background: #3ad4ff;
  border-color: #7ee7ff;
}

.filters button b {
  margin-left: 6px;
  color: #7ee7ff;
  font-weight: 500;
}

.filters button.on b { background: transparent; }


.tools {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-left: auto;
}

.find {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #9fd0e6;
  font-size: 13px;
}

.find :deep(.word) { width: 180px; }

.find :deep(.date) {
  --el-date-editor-width: 168px;
  width: 168px;
}

.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.foot p { margin: 0; color: #7eb4cc; font-size: 13px; }
.foot b { color: #e7f6ff; font-weight: 500; }

.board {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border: 1px solid rgba(90, 196, 255, 0.38);
  background: rgba(4, 16, 32, 0.45);
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

th, td {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(90, 196, 255, 0.14);
  text-align: left;
  vertical-align: middle;
}

th {
  position: sticky;
  top: 0;
  color: #7eb4cc;
  font-weight: 500;
  letter-spacing: 0.08em;
  background: #07182c;
}

td { color: #d7eef8; }

.time { color: #9fd0e6; white-space: nowrap; }
.msg { color: #e7f6ff; line-height: 1.45; }

.lv {
  display: inline-block;
  min-width: 32px;
  font-weight: 600;
  letter-spacing: 0.12em;
}

tr.event .lv { color: #7ee7ff; }
tr.alarm .lv { color: #ff8a8a; }
tr.alarm td:first-child { box-shadow: inset 3px 0 0 #ff8a8a; }

tbody tr:hover td { background: rgba(58, 212, 255, 0.06); }

.empty {
  margin: 0;
  padding: 56px 16px;
  display: grid;
  justify-items: center;
  gap: 6px;
  color: #e7f6ff;
}

.empty span { color: #7eb4cc; font-size: 13px; }
</style>

<style>
.desk-date.el-popper {
  --el-bg-color-overlay: #07182c;
  --el-text-color-regular: #d7eef8;
  --el-text-color-primary: #e7f6ff;
  --el-border-color-light: rgba(90, 196, 255, 0.45);
  --el-border-color-lighter: rgba(90, 196, 255, 0.2);
  --el-fill-color-light: rgba(58, 212, 255, 0.14);
  --el-datepicker-text-color: #e7f6ff;
  --el-datepicker-off-text-color: #4d7a90;
  --el-datepicker-header-text-color: #e7f6ff;
  --el-datepicker-icon-color: #9fd0e6;
  --el-datepicker-border-color: rgba(90, 196, 255, 0.28);
  --el-datepicker-inner-border-color: rgba(90, 196, 255, 0.16);
  --el-datepicker-active-color: #3ad4ff;
  --el-datepicker-hover-text-color: #04101c;
  --el-color-primary: #3ad4ff;
  background: #07182c;
  border: 1px solid rgba(90, 196, 255, 0.45);
  border-radius: 0;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
  font-family: 'Instrument Sans', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.desk-date .el-picker-panel,
.desk-date .el-date-picker {
  background: transparent;
  color: #e7f6ff;
}

.desk-date .el-date-picker__header-label,
.desk-date .el-picker-panel__icon-btn {
  color: #e7f6ff;
}

.desk-date .el-picker-panel__icon-btn:hover,
.desk-date .el-date-picker__header-label:hover {
  color: #7ee7ff;
}

.desk-date .el-date-table th {
  color: #7eb4cc;
  border-bottom-color: rgba(90, 196, 255, 0.2);
}

.desk-date .el-date-table td.available:hover .el-date-table-cell__text {
  background: rgba(58, 212, 255, 0.18);
  color: #e7f6ff;
}

.desk-date .el-date-table td.today .el-date-table-cell__text {
  color: #7ee7ff;
}

.desk-date .el-date-table td.current:not(.disabled) .el-date-table-cell__text {
  color: #04101c;
  background: #3ad4ff;
}

.desk-date .el-popper__arrow::before {
  background: #07182c;
  border-color: rgba(90, 196, 255, 0.45);
}
</style>
