<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import { fmtTime } from '@/core/utils';
import { EmsApi } from '@/core/api';
import type { RawEventPageItem } from '@/core/api';
import { parseTime } from '@/core/apiMapper';
import ListPager from '@/components/ListPager.vue';

type Kind = '事件' | '告警';
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
  { id: '告警', label: '告警' },
  { id: '事件', label: '事件' }
];

// eventType 必传：0=事件，1=报警；全部传 -1（0 会被当成事件，null/空串会 400）
const TYPE_CODE: Record<Kind, number> = { 事件: 0, 告警: 1 };
const ALL_EVENT_TYPE = -1;

const filter = ref<Filter>('all');
const date = ref<string | null>(null);
const appliedFilter = ref<Filter>('all');
const appliedDate = ref<string | null>(null);
const page = ref(1);
const pageSize = ref(50);
const total = ref(0);
const rows = ref<AlarmRow[]>([]);
const loading = ref(false);
const listError = ref('');

function kindOf(item: RawEventPageItem): Kind {
  return item.eventTypeCode === 1 || item.eventTypeName === '报警' || item.eventTypeName === '告警' ? '告警' : '事件';
}

function toRow(item: RawEventPageItem, index: number): AlarmRow {
  return {
    id: item.id,
    no: (page.value - 1) * pageSize.value + index + 1,
    workspace: item.workSpaceName ? `WorkSpace${item.workSpaceName}` : 'WorkSpace0',
    channel: item.channelId == null || String(item.channelId).trim() === '' ? '—' : String(item.channelId),
    kind: kindOf(item),
    name: item.eventName || '—',
    desc: item.eventMsg || '',
    ts: parseTime(item.eventTime)
  };
}

function queryBody() {
  return {
    eventType: appliedFilter.value === 'all' ? ALL_EVENT_TYPE : TYPE_CODE[appliedFilter.value],
    eventDate: appliedDate.value ?? '',
    pageIndex: page.value,
    pageSize: pageSize.value
  };
}

async function load() {
  loading.value = true;
  listError.value = '';
  try {
    const res = await EmsApi.eventPage(queryBody());
    rows.value = (res.eventList ?? []).map(toRow);
    total.value = res.page?.totalCount ?? rows.value.length;
  } catch (e) {
    listError.value = e instanceof Error ? e.message : String(e);
    rows.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

onMounted(load);

const counts = computed(() => ({ all: total.value }));
const pages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)));

function reloadFromFirstPage() {
  if (page.value === 1) void load();
  else page.value = 1;
}

function selectFilter(next: Filter) {
  if (filter.value === next) return;
  filter.value = next;
  appliedFilter.value = next;
  appliedDate.value = date.value;
  reloadFromFirstPage();
}

function search() {
  appliedFilter.value = filter.value;
  appliedDate.value = date.value;
  reloadFromFirstPage();
}

function reset() {
  filter.value = 'all';
  date.value = null;
  appliedFilter.value = 'all';
  appliedDate.value = null;
  reloadFromFirstPage();
}

watch([page, pageSize], () => { void load(); });
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
          @click="selectFilter(item.id)"
        >{{ item.label }}<b v-if="item.id === 'all'" class="num">{{ counts.all }}</b></button>
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
        <button type="button" class="ghost" @click="reset">重置</button>
        <button type="button" class="search" @click="search">搜索</button>
      </div>
    </header>

    <div class="data">
    <div class="board">
      <table v-if="rows.length">
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
          <tr v-for="item in rows" :key="item.id" :class="item.kind === '告警' ? 'alarm' : 'event'">
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
      <p v-else-if="loading" class="empty">加载中…<span>正在获取事件记录</span></p>
      <p v-else-if="listError" class="empty">事件记录加载失败<span>{{ listError }}</span></p>
      <p v-else class="empty">没有符合条件的记录<span>换个类型或日期后再搜索</span></p>
    </div>
    <footer class="foot">
      <p>共 <b class="num">{{ total }}</b> 条</p>
      <ListPager v-model:page="page" v-model:size="pageSize" :pages="pages" />
    </footer>
    </div>
  </div>
</template>

<style scoped>
.page {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 60px;
  padding: 11px 12px;
  border: 1px solid var(--desk-line);
  border-radius: 8px;
  background: var(--desk-surface);
}

.bar p {
  margin: 0;
  color: #7eb4cc;
  font-size: 13px;
}

.bar b { color: #e7f6ff; font-weight: 500; }

.filters {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 36px;
  padding: 3px;
  border: 1px solid var(--desk-line-strong);
  border-radius: 8px;
  background: #06101b;
}

.filters button {
  height: 28px;
  padding: 0 14px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--desk-muted);
  font: inherit;
  cursor: pointer;
}

.filters button.on,
.filters button.on b {
  color: #06101b;
  background: var(--desk-accent);
  font-weight: 500;
}

.filters button b {
  margin-left: 6px;
  color: var(--desk-accent);
  font-weight: 600;
}

.filters button.on b {
  display: inline-flex;
  min-width: 20px;
  height: 18px;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border-radius: 4px;
  background: #06101b;
  color: var(--desk-accent);
}


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
  color: var(--desk-muted);
  font-size: 12px;
}

.find :deep(.word) { width: 180px; }

.find :deep(.date) {
  --el-date-editor-width: 168px;
  width: 168px;
}

.ghost,
.search {
  height: 36px;
  padding: 0 16px;
  border-radius: 6px;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

.ghost {
  color: var(--desk-text-2);
  background: var(--desk-surface);
  border: 1px solid var(--desk-line-strong);
}

.ghost:hover { border-color: var(--desk-accent); color: var(--desk-text); }

.search {
  border: 0;
  background: var(--desk-accent);
  color: #06101b;
  font-weight: 500;
}

.search:hover { filter: brightness(1.08); }

.data {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--desk-line);
  border-radius: 8px;
  background: var(--desk-surface);
  overflow: hidden;
}

.foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 48px;
  padding: 0 16px;
  background: var(--desk-deep);
}

.foot p { margin: 0; color: var(--desk-muted); font-size: 13px; }
.foot b { color: var(--desk-text); font-weight: 500; }

.board {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
}

th, td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--desk-line);
  text-align: left;
  vertical-align: middle;
}

th {
  position: sticky;
  top: 0;
  z-index: 2;
  color: var(--desk-muted);
  font-weight: 500;
  background: var(--desk-deep);
  box-shadow: 0 1px 0 var(--desk-line);
}

td { color: var(--desk-text-2); }

.time { color: var(--desk-text-2); white-space: nowrap; }
.msg { color: var(--desk-muted); line-height: 1.45; }

.lv {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border: 1px solid var(--desk-line-strong);
  border-radius: 4px;
  background: var(--desk-line);
  font-size: 12px;
  font-weight: 500;
}

tr.event .lv { color: var(--desk-accent); }
tr.alarm .lv { color: #ff8a8a; border-color: rgba(255, 138, 138, 0.35); }
tr.alarm td:first-child { box-shadow: inset 3px 0 0 #ff8a8a; }

tbody tr:hover td { background: rgba(109, 209, 250, 0.04); }

.empty {
  margin: 0;
  padding: 56px 16px;
  display: grid;
  justify-items: center;
  gap: 6px;
  color: var(--desk-text);
}

.empty span { color: var(--desk-dim); font-size: 13px; }
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
  border-radius: 8px;
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
