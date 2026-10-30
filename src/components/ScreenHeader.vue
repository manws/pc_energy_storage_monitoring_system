<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useClock } from '@/composables/useClock';
import { useEnergy } from '@/composables/useEnergy';
import { EmsApi } from '@/core/api';
import { clearSession, currentUser } from '@/core/session';

const { time, date } = useClock();
const { state, soundOn, online, lastError, pollSec } = useEnergy();
const isFull = ref(false);

// 当前登录用户：字段以登录接口返回的 userInfo 为准
const user = computed(() => currentUser());
const userName = computed(() => user.value?.userName || user.value?.userCode || '未登录');
const userCode = computed(() => user.value?.userCode ?? '');
const signingOut = ref(false);

async function signOut() {
  if (signingOut.value) return;
  signingOut.value = true;
  try {
    await EmsApi.logout();
  } catch {
    // 后端不可达时也要完成本地登出
  } finally {
    signingOut.value = false;
  }
  clearSession();
  router.replace({ name: 'login' });
}

const alarm = computed(() => state.value.backflow.active);

// 数据链路状态：接口不可达时明确提示，避免值班员误以为画面是实时的。
const linkDown = computed(() => !!lastError.value);
const linkText = computed(() => (linkDown.value ? '接口异常' : online.value ? '数据实时' : '连接中'));
const linkCls = computed(() => (linkDown.value ? 'is-alarm' : online.value ? '' : 'is-wait'));
const linkHint = computed(() => {
  if (lastError.value) return `接口异常：${lastError.value}`;
  if (online.value) return '已接入后端实时数据';
  return '正在连接后端服务…';
});

function toggleFull() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
}

const onFs = () => { isFull.value = !!document.fullscreenElement; };
onMounted(() => document.addEventListener('fullscreenchange', onFs));
onBeforeUnmount(() => document.removeEventListener('fullscreenchange', onFs));

const router = useRouter();
</script>

<template>
  <header class="head">
    <div class="relative flex items-center gap-3 w-[600px]">
      <el-tooltip content="进入菜单" placement="bottom">
        <button type="button" class="logo" @click="router.push({ name: 'meters' })"><i class="ri-leaf-line" /></button>
      </el-tooltip>
      <div class="pill">
        <span class="stat">
          <span class="dot" :class="alarm ? 'is-alarm' : ''" />
          <span :class="alarm ? 'text-red-400 font-semibold' : 'text-emerald-400 font-medium'">{{ alarm ? '逆流告警' : '系统运行正常' }}</span>
        </span>
        <span class="sep" />
        <span class="stat"><span class="label">在线电表</span><span class="num text-slate-100 text-[16px]">5/5</span></span>
        <span class="sep" />
        <el-tooltip :content="linkHint" placement="bottom">
          <span class="stat">
            <span class="dot" :class="linkCls" />
            <span :class="linkDown ? 'text-red-400 font-semibold' : 'text-emerald-400 font-medium'">{{ linkText }}</span>
          </span>
        </el-tooltip>
        <span class="sep" />
        <span class="stat"><span class="label">刷新周期</span><span class="num text-slate-100 text-[16px]">{{ pollSec }}s</span></span>
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
      <div class="hbtn !cursor-default">
        <i :class="soundOn ? 'ri-volume-up-line text-cyan-300' : 'ri-volume-mute-line text-slate-400'" />
        <el-switch v-model="soundOn" size="small" />
      </div>
      <el-tooltip :content="isFull ? '退出全屏' : '全屏'" placement="bottom">
        <button class="hbtn !px-0 w-[38px] justify-center" @click="toggleFull"><i :class="isFull ? 'ri-fullscreen-exit-line' : 'ri-fullscreen-line'" /></button>
      </el-tooltip>
      <div class="pill !gap-2.5">
        <i class="ri-user-3-line text-cyan-300" />
        <span class="text-slate-100 font-medium">{{ userName }}</span>
        <span v-if="userCode" class="text-[12px] text-slate-400">{{ userCode }}</span>
      </div>
      <el-tooltip content="退出登录" placement="bottom">
        <button class="hbtn !px-0 w-[38px] justify-center" @click="signOut"><i class="ri-logout-box-r-line" /></button>
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
  padding: 0;
  border: 0;
  font-size: 18px;
  color: #e7f6ff;
  border-radius: 4px;
  background: linear-gradient(180deg, #1aa8e6, #0a4e8a);
  box-shadow: 0 0 14px rgba(58, 180, 255, 0.55);
  cursor: pointer;
  transition: transform 0.25s var(--ease), box-shadow 0.25s var(--ease);
}

.logo:hover {
  transform: translateY(-1px);
  box-shadow: 0 0 18px rgba(58, 212, 255, 0.75);
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

/* 连接中：琥珀色，区别于正常绿与告警红 */
.dot.is-wait {
  background: #f5c15a;
  box-shadow: 0 0 8px rgba(245, 193, 90, 0.8);
}

.dot.is-wait::after {
  color: rgba(245, 193, 90, 0.45);
  animation-duration: 1s;
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
