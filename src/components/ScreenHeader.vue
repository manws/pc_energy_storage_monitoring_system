<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useClock } from '@/composables/useClock';
import { useEnergy } from '@/composables/useEnergy';

const { time, date } = useClock();
const { state, soundOn, simulateBackflow } = useEnergy();
const isFull = ref(false);

const alarm = computed(() => state.value.backflow.active);

function drill() {
  simulateBackflow(20);
  ElMessage({ message: '已触发 20 秒逆流演练，储能强制满功率放电', type: 'warning', grouping: true });
}

function toggleFull() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
}

const onFs = () => { isFull.value = !!document.fullscreenElement; };
onMounted(() => document.addEventListener('fullscreenchange', onFs));
onBeforeUnmount(() => document.removeEventListener('fullscreenchange', onFs));
</script>

<template>
  <header class="head">
    <div class="relative flex items-center gap-3 w-[600px]">
      <div class="logo"><i class="ri-leaf-line" /></div>
      <div class="pill">
        <span class="stat">
          <span class="dot" :class="alarm ? 'is-alarm' : ''" />
          <span :class="alarm ? 'text-red-400 font-semibold' : 'text-emerald-400 font-medium'">{{ alarm ? '逆流告警' : '系统运行正常' }}</span>
        </span>
        <span class="sep" />
        <span class="stat"><span class="label">在线电表</span><span class="num text-slate-100 text-[16px]">5/5</span></span>
        <span class="sep" />
        <span class="stat"><span class="label">采集周期</span><span class="num text-slate-100 text-[16px]">2s</span></span>
      </div>
    </div>

    <div class="title">
      <span class="eyebrow">Factory Energy Center</span>
      <h1>厂区智慧能源监控中心</h1>
    </div>

    <div class="relative flex items-center justify-end gap-2.5 w-[600px]">
      <div class="pill !gap-3">
        <span class="num text-[24px] leading-none text-slate-100 tracking-wide">{{ time }}</span>
        <span class="text-[12px] text-slate-400">{{ date }}</span>
      </div>
      <el-tooltip content="人工触发 20 秒逆流演练" placement="bottom">
        <button class="hbtn is-warn" @click="drill">
          <span class="ico"><i class="ri-error-warning-line" /></span>逆流演练
        </button>
      </el-tooltip>
      <div class="hbtn !cursor-default">
        <i :class="soundOn ? 'ri-volume-up-line text-cyan-300' : 'ri-volume-mute-line text-slate-400'" />
        <el-switch v-model="soundOn" size="small" />
      </div>
      <el-tooltip :content="isFull ? '退出全屏' : '全屏'" placement="bottom">
        <button class="hbtn !px-0 w-[38px] justify-center" @click="toggleFull"><i :class="isFull ? 'ri-fullscreen-exit-line' : 'ri-fullscreen-line'" /></button>
      </el-tooltip>
    </div>
  </header>
</template>

<style scoped>
.head {
  position: relative;
  height: 76px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px 6px;
}

.logo {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  font-size: 18px;
  color: #e7f6ff;
  border-radius: 4px;
  background: linear-gradient(180deg, #1aa8e6, #0a4e8a);
  box-shadow: 0 0 14px rgba(58, 180, 255, 0.55);
}

.stat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.pill {
  height: 38px;
  display: inline-flex;
  align-items: center;
  gap: 14px;
  padding: 0 14px;
  font-size: 13px;
  border-radius: 2px;
  color: #c5e6f5;
  background: rgba(6, 28, 52, 0.72);
  border: 1px solid rgba(90, 196, 255, 0.35);
  box-shadow: inset 0 0 12px rgba(40, 140, 220, 0.12);
}

.sep {
  width: 1px;
  height: 14px;
  background: var(--c-line);
}

.dot {
  position: relative;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #2ee59a;
  box-shadow: 0 0 8px rgba(46, 229, 154, 0.8);
}

.dot::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: currentColor;
  color: rgba(46, 229, 154, 0.45);
  animation: blink-soft 1.8s var(--ease) infinite;
}

.dot.is-alarm {
  background: #dc2626;
}

.dot.is-alarm::after {
  color: rgba(220, 38, 38, 0.4);
  animation-duration: 0.8s;
}

.title {
  position: absolute;
  left: 50%;
  top: 6px;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.eyebrow {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: #7ee7ff;
}

.eyebrow::before,
.eyebrow::after {
  content: '';
  display: inline-block;
  width: 36px;
  height: 1px;
  margin: 0 10px 3px;
  background: linear-gradient(90deg, transparent, #3ad4ff);
  vertical-align: middle;
}

.eyebrow::after {
  background: linear-gradient(90deg, #3ad4ff, transparent);
}

.title h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: 0.28em;
  padding-left: 0.28em;
  color: #f4fbff;
  text-shadow: 0 0 18px rgba(80, 200, 255, 0.65);
}

.hbtn {
  height: 38px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  font-size: 13px;
  color: #c5e6f5;
  border-radius: 2px;
  background: rgba(6, 28, 52, 0.72);
  border: 1px solid rgba(90, 196, 255, 0.35);
  box-shadow: inset 0 0 12px rgba(40, 140, 220, 0.12);
  cursor: pointer;
  transition: background 0.25s var(--ease), color 0.25s, border-color 0.25s;
}

.hbtn:hover {
  background: rgba(20, 70, 110, 0.8);
  color: #e7f6ff;
  border-color: #7ee7ff;
}

.hbtn:active {
  transform: scale(0.97);
}

.hbtn.is-warn {
  padding-left: 5px;
  color: #f5c15a;
}

.hbtn.is-warn:hover {
  background: rgba(80, 50, 10, 0.45);
}

.ico {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  background: rgba(245, 193, 90, 0.16);
  transition: transform 0.4s var(--ease);
}

.hbtn.is-warn:hover .ico {
  transform: translateX(1px) scale(1.06);
}
</style>
