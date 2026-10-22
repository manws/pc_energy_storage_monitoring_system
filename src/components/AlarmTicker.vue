<script setup lang="ts">
import { computed, ref } from 'vue';
import { useEnergy } from '@/composables/useEnergy';
import { fmtTime } from '@/core/utils';
import type { AlarmLevel } from '@/core/types';
import BasePanel from './base/BasePanel.vue';

type Filter = 'all' | 'danger' | 'warning' | 'info';

const { state } = useEnergy();
const filter = ref<Filter>('all');

const FILTERS: { v: Filter; label: string }[] = [
  { v: 'all', label: '全部' },
  { v: 'danger', label: '严重' },
  { v: 'warning', label: '预警' },
  { v: 'info', label: '事件' }
];

const LEVEL: Record<AlarmLevel, { text: string; color: string; icon: string }> = {
  danger: { text: '严重', color: '#dc2626', icon: 'ri-alarm-warning-fill' },
  warning: { text: '预警', color: '#d97706', icon: 'ri-error-warning-fill' },
  info: { text: '事件', color: '#2a9d8f', icon: 'ri-information-fill' },
  success: { text: '恢复', color: '#10a36b', icon: 'ri-checkbox-circle-fill' }
};

const list = computed(() => {
  const f = filter.value;
  const out = [];
  for (const a of state.value.alarms) {
    if (f === 'all' || a.level === f || (f === 'info' && a.level === 'success')) out.push(a);
    if (out.length >= 30) break;
  }
  return out;
});

const counts = computed(() => {
  const c = { danger: 0, warning: 0 };
  for (const a of state.value.alarms) {
    if (a.level === 'danger') c.danger++;
    else if (a.level === 'warning') c.warning++;
  }
  return c;
});
</script>

<template>
  <BasePanel title="告警与事件" sub="Alarm Log" index="06">
    <template #extra>
      <span class="text-[11px] text-slate-500 mr-2">严重 <b class="num text-red-400 text-[13px]">{{ counts.danger }}</b> · 预警 <b class="num text-amber-400 text-[13px]">{{ counts.warning }}</b></span>
      <button v-for="f in FILTERS" :key="f.v" class="chip" :class="{ 'is-active': filter === f.v }" @click="filter = f.v">{{ f.label }}</button>
    </template>
    <div class="log thin-scroll">
      <TransitionGroup name="row" tag="ul">
        <li v-for="a in list" :key="a.id" class="item" :class="{ 'is-danger': a.level === 'danger' }">
          <i :class="LEVEL[a.level].icon" :style="{ color: LEVEL[a.level].color }" class="text-[14px]" />
          <span class="num text-[13px] text-slate-500 w-[64px] shrink-0">{{ fmtTime(a.ts) }}</span>
          <span class="tag" :style="{ color: LEVEL[a.level].color }">{{ LEVEL[a.level].text }}</span>
          <span class="text-cyan-200 w-[70px] shrink-0 truncate">{{ a.source }}</span>
          <span class="text-slate-200 truncate">{{ a.msg }}</span>
        </li>
      </TransitionGroup>
      <div v-if="!list.length" class="text-center text-[12px] text-slate-500 py-8">暂无记录</div>
    </div>
  </BasePanel>
</template>

<style scoped>
.log {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 6px 10px;
}

.item {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 30px;
  padding: 0 10px;
  font-size: 13px;
  border-radius: 8px;
  transition: background 0.3s var(--ease);
}

.item:hover {
  background: rgba(16, 56, 92, 0.55);
}

.item.is-danger {
  background: linear-gradient(90deg, rgba(180, 30, 30, 0.28), transparent 75%);
}

.tag {
  font-size: 11px;
  line-height: 18px;
  padding: 0 8px;
  border-radius: 999px;
  background: color-mix(in srgb, currentColor 16%, #07182c);
  flex-shrink: 0;
}

.row-enter-active {
  transition: opacity 0.6s var(--ease), transform 0.6s var(--ease);
}

.row-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
