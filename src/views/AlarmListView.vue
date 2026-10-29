<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import { fmtTime } from '@/core/utils';
import { EmsApi } from '@/core/api';
import type { RawEventPageItem } from '@/core/api';
import { parseTime } from '@/core/apiMapper';
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

// eventType: 0=事件, 1=报警
const TYPE_CODE: Record<Kind, number> = { 事件: 0, 报警: 1 };

const filter = ref<Filter>('all');
const keyword = ref('');
const date = ref<string | null>(null);
const page = ref(1);
const pageSize = ref(50);
const total = ref(0);
const rows = ref<AlarmRow[]>([]);
const loading = ref(false);
const listError = ref('');

function kindOf(item: RawEventPageItem): Kind {
  return item.eventTypeCode === 1 || item.eventTypeName === '报警' ? '报警' : '事件';
}

function toRow(item: RawEventPageItem, index: number): AlarmRow {
  return {
    id: item.id,
    no: (page.value - 1) * pageSize.value + index + 1,
    workspace: item.workSpaceName ? `WorkSpace${item.workSpaceName}` : 'WorkSpace0',
    channel: item.channelId || '—',
    kind: kindOf(item),
    name: item.eventName || '—',
    desc: item.eventMsg || '',
    ts: parseTime(item.eventTime)
  };
}

async function load() {
  loading.value = true;
  listError.value = '';
  try {
    const body: { eventType?: number; eventDate?: string; pageIndex: number; pageSize: number } = {
      pageIndex: page.value,
      pageSize: pageSize.value
    };
    if (filter.value !== 'all') body.eventType = TYPE_CODE[filter.value];
    if (date.value) body.eventDate = date.value;
    const res = await EmsApi.eventPage(body);
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

// 关键词过滤在当前页内进行（后端不支持关键词检索）。
const shown = computed(() => {
  const word = keyword.value.trim().toLowerCase();
  if (!word) return rows.value;
  return rows.value.filter((item) =>
    [item.workspace, item.channel, item.name, item.desc].some((field) => field.toLowerCase().includes(word))
  );
});
const counts = computed(() => ({ all: total.value }));
const pages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)));

// 筛选条件变化：回第一页并重新拉取；翻页/改每页条数：直接重新拉取。
watch([filter, date], () => { page.value = 1; void load(); });
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
          @click="filter = item.id"
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
      <p v-else-if="loading" class="empty">加载中…<span>正在获取事件记录</span></p>
      <p v-else-if="listError" class="empty">事件记录加载失败<span>{{ listError }}</span></p>
      <p v-else class="empty">没有符合条件的记录<span>换个类型、日期或关键字</span></p>
    </div>
    <footer class="foot">
      <p>共 <b class="num">{{ total }}</b> 条</p>
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
  border: 1px solid rgba(90, 196, 255, 0.28);
  background: #06182e;
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
  background: #06182e;
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
