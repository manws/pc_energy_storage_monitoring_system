<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useClock } from '@/composables/useClock';
import core from '@/assets/login/monitor/core.png';
import corners from '@/assets/login/monitor/corners.svg';
import plantScene from '@/assets/login/monitor/plant.png';
import storageScene from '@/assets/login/monitor/storage.png';
import deviceScene from '@/assets/login/monitor/device.png';
import linkPlant from '@/assets/login/monitor/link-plant.svg';
import linkStorage from '@/assets/login/monitor/link-storage.svg';
import linkTest from '@/assets/login/monitor/link-test.svg';

const SEAT_KEY = 'manws-seat';

const SEATS = [
  { login: 'chief', name: '值班长', active: true },
  { login: 'monitor1', name: '监控一席', active: true },
  { login: 'monitor2', name: '监控二席', active: true },
  { login: '123456', name: '123456', active: true },
  { login: 'ops', name: '运维席', active: false }
];

const scenes = [
  { name: '厂区监控', image: plantScene, alt: '厂区监控' },
  { name: '储能控制', image: storageScene, alt: '储能控制' },
  { name: '设备运行', image: deviceScene, alt: '设备运行' }
];

const router = useRouter();
const { time, date } = useClock();

const login = ref('');
const password = ref('');
const remember = ref(true);
const showPassword = ref(false);
const notice = ref('');
const noticeError = ref(false);
const scale = ref(1);
const offsetX = ref(0);
const offsetY = ref(0);

const dateMain = computed(() => date.value.slice(0, 10));
const weekday = computed(() => date.value.slice(11));
const pageStyle = computed(() => ({
  transform: `scale(${scale.value})`,
  left: `${offsetX.value}px`,
  top: `${offsetY.value}px`
}));

function measure() {
  const next = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
  scale.value = next;
  offsetX.value = (window.innerWidth - 1920 * next) / 2;
  offsetY.value = (window.innerHeight - 1080 * next) / 2;
}

function showNotice(message: string, error: boolean) {
  notice.value = message;
  noticeError.value = error;
}

function showHelp() {
  showNotice('请联系厂区系统管理员激活值班账号。', false);
}

function inputValue(id: string, fallback: string) {
  const node = document.getElementById(id);
  if (node instanceof HTMLInputElement && node.value) return node.value;
  return fallback;
}

function submit() {
  const name = inputValue('username', login.value).trim();
  const secret = inputValue('password', password.value).trim();
  if (!name || !secret) {
    showNotice('请填写登录名称和密码', true);
    return;
  }
  const seat = SEATS.find((item) => item.login === name);
  if (!seat || secret !== name) {
    showNotice('登录名称或密码不正确', true);
    return;
  }
  if (!seat.active) {
    showNotice('该账号未激活', true);
    return;
  }
  try {
    sessionStorage.setItem(SEAT_KEY, seat.login);
    if (remember.value) localStorage.setItem(SEAT_KEY, seat.login);
    else localStorage.removeItem(SEAT_KEY);
  } catch {
    showNotice('浏览器阻止了登录状态保存', true);
    return;
  }
  router.replace({ name: 'home' });
}

onMounted(() => {
  measure();
  window.addEventListener('resize', measure);
});

onBeforeUnmount(() => window.removeEventListener('resize', measure));
</script>

<template>
  <div class="viewport">
    <main class="screen" :style="pageStyle" aria-label="厂区智慧能源监控中心登录页">
      <div class="bg-glow bg-glow-cyan" />
      <div class="bg-glow bg-glow-blue" />
      <div class="bg-grid" />

      <header class="top-bar">
        <div class="brand">
          <div class="logo-mark">
            <svg width="17" height="22" viewBox="0 0 16.25 21.6667" fill="none" aria-hidden="true">
              <path d="M9.75 0L0 13L7.5833 13L6.5 21.6667L16.25 8.6667L8.6667 8.6667L9.75 0Z" fill="#04101E" />
            </svg>
          </div>
          <div class="brand-text">
            <span class="breadcrumb">北交新能</span>
            <span class="brand-title">厂区智慧能源监控中心</span>
          </div>
        </div>
        <div class="clock-group">
          <div class="date-block">
            <span class="date-text">{{ dateMain }}</span>
            <span class="weekday">{{ weekday }}</span>
          </div>
          <div class="clock-sep" />
          <span class="digital-clock">{{ time }}</span>
        </div>
      </header>
      <div class="top-divider" />

      <section class="showcase" aria-labelledby="hero-title">
        <img class="core-visual" :src="core" alt="能源核心" />
        <div class="visual-top-fade" />
        <div class="visual-fade" />
        <img class="corner-brackets" :src="corners" alt="" />

        <div class="hero">
          <div class="hero-eyebrow">
            <span class="live-dot" />
            <span class="eyebrow-text">ENERGY COMMAND CENTER · 实时在线</span>
          </div>
          <h1 id="hero-title" class="hero-headline">能源全域 · 一站洞察</h1>
          <p class="hero-subtitle">Unified visibility across grid, metering, storage and plant — in real time.</p>
        </div>

        <div class="scene-ground-glow" />

        <div class="energy-modules">
          <div v-for="item in scenes" :key="item.name" class="scene-card">
            <img :src="item.image" :alt="item.alt" />
          </div>
        </div>

        <img class="link-line link-plant" :src="linkPlant" alt="" />
        <img class="link-line link-storage" :src="linkStorage" alt="" />
        <img class="link-line link-test" :src="linkTest" alt="" />

        <div class="anchor anchor-plant" />
        <div class="anchor anchor-storage" />
        <div class="anchor anchor-test" />
        <div class="endpoint endpoint-plant" />
        <div class="endpoint endpoint-storage" />
        <div class="endpoint endpoint-test" />

        <span class="scene-label label-plant">厂区监控</span>
        <span class="scene-label label-storage">储能控制</span>
        <span class="scene-label label-test">设备运行</span>
      </section>

      <section class="login-card" aria-labelledby="login-title">
        <div class="card-brand-row">
          <span class="system-version">ENERGY OPS · 储能系统 v3.2</span>
          <div class="secure-chip">
            <span class="secure-dot" />
            <span class="secure-label">安全加密连接</span>
          </div>
        </div>

        <div class="card-header">
          <h2 id="login-title" class="card-title">登录</h2>
          <p class="card-subtitle"></p>
        </div>

        <form class="form" @submit.prevent="submit">
          <div class="field">
            <label class="field-label" for="username">登录名称</label>
            <div class="input input-user">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="10" cy="7.5" r="3.3333" stroke="#8EA8C4" stroke-width="1.5" />
                <path d="M4 17.5C4 14.7386 6.68629 13 10 13C13.3137 13 16 14.7386 16 17.5" stroke="#8EA8C4" stroke-width="1.5" stroke-linecap="round" />
              </svg>
              <input id="username" v-model="login" type="text" placeholder="请输入登录名称" autocomplete="username" maxlength="20" />
            </div>
          </div>

          <div class="field">
            <label class="field-label" for="password">密码</label>
            <div class="input input-pass">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <rect x="3.3333" y="8.3333" width="13.3333" height="9.1667" rx="2.0833" stroke="#8FA9C4" stroke-width="1.5" />
                <path d="M6.6667 8.3333V5.4167C6.6667 3.5757 8.1591 2.0833 10 2.0833C11.8409 2.0833 13.3333 3.5757 13.3333 5.4167V8.3333" stroke="#8FA9C4" stroke-width="1.5" stroke-linecap="round" />
              </svg>
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码"
                autocomplete="current-password"
                maxlength="20"
              />
              <button class="eye-btn" type="button" :aria-label="showPassword ? '隐藏密码' : '显示密码'" @click="showPassword = !showPassword">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M2.5 2.5L17.5 17.5" stroke="#5A7290" stroke-width="1.5" stroke-linecap="round" />
                  <path d="M7.9 7.95C7.56 8.5 7.5 8.95 7.5 9.6C7.5 10.98 8.62 12.1 10 12.1C10.6 12.1 11.1 11.95 11.55 11.65" stroke="#5A7290" stroke-width="1.5" stroke-linecap="round" />
                  <path d="M5.1 5.45C3.55 6.5 2.3 8 1.6 9.6C3.2 13.2 6.3 15.6 10 15.6C11.35 15.6 12.6 15.3 13.75 14.75M16.1 12.75C17.1 11.85 17.9 10.8 18.4 9.6C16.8 6 13.7 3.6 10 3.6C9.2 3.6 8.45 3.7 7.7 3.9" stroke="#5A7290" stroke-width="1.5" stroke-linecap="round" />
                </svg>
              </button>
            </div>
          </div>

          <div class="options-row">
            <label class="remember">
              <input v-model="remember" class="remember-input" type="checkbox" />
              <span class="checkbox" :class="{ off: !remember }">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2.5 6.2L4.8 8.5L9.5 3.8" stroke="#04101E" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
              <span class="remember-text">记住登录</span>
            </label>
            <a class="help-link" href="#help" @click.prevent="showHelp"></a>
          </div>

          <button class="primary-btn" type="submit">进入系统</button>
          <p v-if="notice" class="notice" :class="{ error: noticeError }" role="status">{{ notice }}</p>
        </form>
      </section>

      <footer class="footer-status">
        <div class="status-left">
          <div class="status-ok">
            <span class="ok-dot" />
            <span class="status-text">系统运行正常</span>
          </div>
          <span class="update-text">数据更新16:46:30 · 接入站点12 · 通信延迟28ms</span>
        </div>
        <span class="copyright">北交新能 · 厂区智慧能源监控中心 v3.2</span>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.viewport {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: #050a14;
}

.screen {
  --bg-start: #081426;
  --bg-end: #050a14;
  --panel: #081729;
  --cyan: #5cd0ff;
  --text-strong: #eaf6ff;
  --text-mid: #8fa9c4;
  --text-dim: #5a7290;
  --text-sub: #9ebad6;
  --green: #33d98c;
  --green-dot: #3ddc97;
  position: absolute;
  width: 1920px;
  height: 1080px;
  overflow: hidden;
  transform-origin: top left;
  color: var(--text-strong);
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: linear-gradient(135deg, var(--bg-start) 0%, var(--bg-end) 100%);
}

.bg-glow { position: absolute; border-radius: 50%; pointer-events: none; }
.bg-glow-cyan {
  left: 180px;
  top: 180px;
  width: 1100px;
  height: 800px;
  background: radial-gradient(closest-side, rgba(92, 209, 255, 0.16) 0%, rgba(92, 209, 255, 0) 100%);
}
.bg-glow-blue {
  left: 1200px;
  top: -200px;
  width: 900px;
  height: 700px;
  background: radial-gradient(closest-side, rgba(46, 156, 255, 0.12) 0%, rgba(46, 156, 255, 0) 100%);
}
.bg-grid {
  position: absolute;
  inset: 0;
  opacity: 0.45;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(92, 208, 255, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(92, 208, 255, 0.08) 1px, transparent 1px);
  background-size: 64px 64px;
}

.top-bar {
  position: absolute;
  left: 64px;
  top: 28px;
  width: 1792px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand { display: flex; align-items: center; gap: 20px; }
.logo-mark {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #5bd1ff 0%, #2d9bff 100%);
  box-shadow: 0 6px 24px rgba(92, 209, 255, 0.4);
}
.brand-text { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
.breadcrumb { font-size: 14px; color: var(--text-mid); letter-spacing: 2px; }
.brand-title { font-size: 28px; font-weight: 700; letter-spacing: 4px; }
.clock-group { display: flex; align-items: center; gap: 24px; }
.date-block { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.date-text {
  font-family: 'Rajdhani', 'IBM Plex Mono', sans-serif;
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 1px;
}
.weekday { font-size: 13px; color: var(--text-mid); letter-spacing: 2px; }
.clock-sep { width: 1px; height: 40px; background: #3fb8ff; }
.digital-clock {
  font-family: 'Rajdhani', 'IBM Plex Mono', sans-serif;
  font-weight: 600;
  font-size: 48px;
  letter-spacing: 3px;
  line-height: 1;
  text-shadow: 0 0 18px rgba(92, 209, 255, 0.45);
  font-variant-numeric: tabular-nums;
}

.top-divider {
  position: absolute;
  left: 64px;
  top: 120px;
  width: 1792px;
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
}

.showcase {
  position: absolute;
  left: 64px;
  top: 148px;
  width: 1160px;
  height: 856px;
  border-radius: 24px;
  overflow: hidden;
  background: var(--panel);
  box-shadow: inset 0 0 0 1px rgba(64, 184, 255, 0.2);
}
.core-visual {
  position: absolute;
  left: 0;
  top: 164px;
  width: 1160px;
  height: 390px;
  object-fit: cover;
  object-position: center;
  display: block;
}
.visual-top-fade {
  position: absolute;
  left: 0;
  top: 164px;
  width: 1160px;
  height: 96px;
  background: linear-gradient(to bottom, #081729 0%, rgba(8, 23, 41, 0) 100%);
}
.visual-fade {
  position: absolute;
  left: 0;
  top: 434px;
  width: 1160px;
  height: 120px;
  background: linear-gradient(to bottom, rgba(8, 23, 41, 0) 0%, #081729 100%);
}
.corner-brackets {
  position: absolute;
  left: 16px;
  top: 16px;
  width: 1128px;
  height: 824px;
  pointer-events: none;
}

.hero {
  position: absolute;
  left: 48px;
  top: 48px;
  width: 1064px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
}
.hero-eyebrow { display: flex; align-items: center; gap: 10px; }
.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cyan);
  box-shadow: 0 0 8px rgba(92, 209, 255, 0.8);
}
.eyebrow-text {
  font-family: Inter, 'PingFang SC', sans-serif;
  font-weight: 600;
  font-size: 13px;
  color: var(--cyan);
  letter-spacing: 3px;
}
.hero-headline {
  margin: 0;
  width: 100%;
  font-size: 60px;
  font-weight: 700;
  letter-spacing: 6px;
  line-height: normal;
  background: linear-gradient(to right, #ebf5ff 0%, #5cd1ff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}
.hero-subtitle {
  margin: 0;
  width: 100%;
  font-family: Inter, 'PingFang SC', sans-serif;
  font-size: 18px;
  color: var(--text-sub);
  letter-spacing: 0.5px;
}

.scene-ground-glow {
  position: absolute;
  left: 80px;
  top: 680px;
  width: 1000px;
  height: 170px;
  border-radius: 50%;
  pointer-events: none;
  background: radial-gradient(closest-side, rgba(92, 209, 255, 0.16) 0%, rgba(92, 209, 255, 0) 100%);
}
.energy-modules {
  position: absolute;
  left: 48px;
  top: 566px;
  width: 1064px;
  display: flex;
  align-items: flex-start;
  gap: 20px;
}
.scene-card {
  flex: 1 1 0;
  min-width: 0;
  padding: 12px;
}
.scene-card img {
  width: 100%;
  height: auto;
  aspect-ratio: 317 / 237;
  object-fit: contain;
  display: block;
}

.link-line { position: absolute; display: block; pointer-events: none; }
.link-plant { left: 217px; top: 461px; width: 216px; height: 236px; }
.link-storage { left: 578px; top: 504px; width: 4px; height: 193px; }
.link-test { left: 736px; top: 456px; width: 207px; height: 241px; }

.anchor {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
}
.anchor::before {
  content: '';
  position: absolute;
  left: 1.5px;
  top: 1.5px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  border: 1px solid var(--cyan);
}
.anchor::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 5px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--cyan);
}
.anchor-plant { left: 424px; top: 456px; }
.anchor-storage { left: 573px; top: 499px; }
.anchor-test { left: 731px; top: 451px; }

.endpoint { position: absolute; width: 10px; height: 10px; }
.endpoint::before {
  content: '';
  position: absolute;
  left: 1.5px;
  top: 1.5px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: 1px solid var(--cyan);
}
.endpoint::after {
  content: '';
  position: absolute;
  left: 3.5px;
  top: 3.5px;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--cyan);
}
.endpoint-plant { left: 214px; top: 690px; }
.endpoint-storage { left: 575px; top: 690px; }
.endpoint-test { left: 936px; top: 690px; }

.scene-label {
  position: absolute;
  height: 32px;
  line-height: 32px;
  font-size: 22px;
  font-weight: 500;
  color: #fff;
  text-shadow: 0 0 12px rgba(92, 209, 255, 0.55);
  white-space: nowrap;
}
.label-plant {
  left: 408px;
  top: 447px;
  width: max-content;
  transform: translateX(-100%);
}
.label-storage {
  left: 603px;
  top: 490px;
  width: max-content;
}
.label-test {
  left: 761px;
  top: 442px;
  width: max-content;
}

.login-card {
  position: absolute;
  left: 1256px;
  top: 148px;
  width: 600px;
  height: 856px;
  border-radius: 24px;
  padding: 56px 48px 48px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 36px;
  background: linear-gradient(to bottom, rgba(15, 36, 61, 0.85) 0%, rgba(10, 23, 41, 0.85) 100%);
  box-shadow: inset 0 0 0 1px rgba(64, 184, 255, 0.25), 0 24px 64px rgba(0, 0, 0, 0.45);
}
.card-brand-row {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.system-version { font-size: 12px; font-weight: 500; color: var(--text-dim); letter-spacing: 2px; }
.secure-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  border-radius: 100px;
  background: rgba(51, 217, 140, 0.1);
}
.secure-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); }
.secure-label { font-size: 12px; font-weight: 500; color: var(--green); }
.card-header { width: 100%; display: flex; flex-direction: column; gap: 12px; }
.card-title { margin: 0; font-size: 44px; font-weight: 700; letter-spacing: 4px; }
.card-subtitle { margin: 0; font-size: 15px; color: var(--text-mid); }

.form { width: 100%; display: flex; flex-direction: column; gap: 24px; }
.field { width: 100%; display: flex; flex-direction: column; gap: 12px; }
.field-label { font-size: 14px; font-weight: 500; color: var(--text-mid); letter-spacing: 1px; }
.input {
  width: 100%;
  height: 52px;
  box-sizing: border-box;
  border-radius: 11px;
  padding: 15px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(5, 15, 31, 0.8);
  border: 1px solid rgba(64, 184, 255, 0.28);
}
.input:focus-within { border-color: #5cd1ff; }
.input svg { display: block; flex: 0 0 auto; }
.input input {
  flex: 1 1 auto;
  align-self: center;
  min-width: 0;
  height: 22px;
  padding: 0;
  margin: 0;
  appearance: none;
  color-scheme: dark;
  background: transparent;
  border: none;
  outline: none;
  box-shadow: none;
  font: inherit;
  font-size: 15px;
  line-height: 22px;
  color: var(--text-strong);
}
.input input:-webkit-autofill,
.input input:-webkit-autofill:hover,
.input input:-webkit-autofill:focus,
.input input:-webkit-autofill:active {
  -webkit-text-fill-color: var(--text-strong);
  caret-color: var(--text-strong);
  border-radius: 0;
  box-shadow: inset 0 0 0 1000px rgba(5, 15, 31, 0.01);
  transition: background-color 99999s ease-out 0s;
}
.input input::placeholder { color: var(--text-dim); opacity: 1; }
.eye-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.options-row { width: 100%; display: flex; align-items: center; justify-content: space-between; }
.remember { display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; }
.remember-input {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
}
.checkbox {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  background: var(--cyan);
  display: flex;
  align-items: center;
  justify-content: center;
}
.checkbox.off { background: transparent; box-shadow: inset 0 0 0 1px rgba(143, 169, 196, 0.45); }
.checkbox.off svg { opacity: 0; }
.remember-text { font-size: 14px; color: var(--text-strong); }
.help-link { font-size: 14px; color: var(--cyan); text-decoration: none; }
.help-link:hover { text-decoration: underline; }

.primary-btn {
  width: 100%;
  height: 52px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(to right, #5cd1ff 0%, #2e9cff 100%);
  box-shadow: 0 8px 32px rgba(92, 209, 255, 0.35);
  font-family: inherit;
  font-size: 17px;
  font-weight: 700;
  color: #0a0a0a;
  letter-spacing: 4px;
  cursor: pointer;
}
.primary-btn:hover { filter: brightness(1.06); }
.primary-btn:active { transform: translateY(1px); }
.notice { margin: -8px 0 0; font-size: 14px; line-height: 22px; color: var(--cyan); }
.notice.error { color: #ffb1bd; }

.footer-status {
  position: absolute;
  left: 64px;
  top: 1024px;
  width: 1792px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.status-left { display: flex; align-items: center; gap: 24px; }
.status-ok { display: flex; align-items: center; gap: 8px; }
.ok-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--green-dot);
  box-shadow: 0 0 8px rgba(61, 220, 151, 0.7);
}
.status-text { font-size: 13px; color: var(--text-mid); }
.update-text,
.copyright { font-size: 13px; color: var(--text-dim); }

</style>
