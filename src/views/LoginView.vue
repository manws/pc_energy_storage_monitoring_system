<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useClock } from '@/composables/useClock';
import { ApiError, EmsApi } from '@/core/api';
import { signLogin } from '@/core/auth';
import { saveSession } from '@/core/session';
import core from '@/assets/login/monitor/core.png';
import corners from '@/assets/login/monitor/corners.svg';
import plantScene from '@/assets/login/monitor/plant.png';
import storageScene from '@/assets/login/monitor/storage.png';
import deviceScene from '@/assets/login/monitor/device.png';
import linkPlant from '@/assets/login/monitor/link-plant.svg';
import linkStorage from '@/assets/login/monitor/link-storage.svg';
import linkTest from '@/assets/login/monitor/link-test.svg';

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
const loading = ref(false);

const dateMain = computed(() => date.value.slice(0, 10));
const weekday = computed(() => date.value.slice(11));

function showNotice(message: string, error: boolean) {
  notice.value = message;
  noticeError.value = error;
}

function showHelp() {
  showNotice('请联系厂区系统管理员激活值班账号。', false);
}

/** 把后端业务码翻译成页面提示。 */
function describeLoginError(err: unknown) {
  if (err instanceof ApiError) {
    if (err.code === 255) return '登录失败：签名校验不通过（key 与后端不一致）';
    if (err.code === 256) return '登录名称或密码不正确，或该账号已失效';
    return err.message || `登录失败（${err.code}）`;
  }
  return '无法连接后端服务，请检查网络后重试';
}

async function submit() {
  if (loading.value) return;
  const name = login.value.trim();
  const secret = password.value.trim();
  if (!name || !secret) {
    showNotice('请填写登录名称和密码', true);
    return;
  }

  loading.value = true;
  showNotice('', false);
  try {
    const { userInfo } = await EmsApi.login(signLogin(name, secret));
    // 登录接口只返回有效账号，且不含 enabled 字段，账号状态由后端校验，这里不再判断。
    if (!userInfo || !userInfo.userCode) {
      showNotice('登录失败：服务端未返回用户信息', true);
      return;
    }
    try {
      // 登录返回的 userInfo（含 token）整体落地，后续页面统一从会话读取
      saveSession(userInfo, remember.value);
    } catch {
      showNotice('浏览器阻止了登录状态保存', true);
      return;
    }
    router.replace({ name: 'home' });
  } catch (err) {
    showNotice(describeLoginError(err), true);
  } finally {
    loading.value = false;
  }
}

</script>

<template>
  <div class="viewport">
    <div class="backdrop" aria-hidden="true">
      <div class="bg-glow bg-glow-cyan" />
      <div class="bg-glow bg-glow-blue" />
      <div class="bg-grid" />
    </div>
    <main class="screen" aria-label="厂区智慧能源监控中心登录页">
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

      <div class="main-body">
        <section class="showcase" aria-labelledby="hero-title">
          <img class="corner-brackets" :src="corners" alt="" />

          <div class="hero">
            <div class="hero-eyebrow">
              <span class="live-dot" />
              <span class="eyebrow-text">ENERGY COMMAND CENTER · 实时在线</span>
            </div>
            <h1 id="hero-title" class="hero-headline">能源全域 · 一站洞察</h1>
            <p class="hero-subtitle">Unified visibility across grid, metering, storage and plant — in real time.</p>
          </div>

          <div class="scene-diagram">
            <img class="core-visual" :src="core" alt="能源核心" />
            <div class="visual-top-fade" />
            <div class="visual-fade" />
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
          </div>
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

          <button class="primary-btn" type="submit" :disabled="loading">
            {{ loading ? '登录中…' : '进入系统' }}
          </button>
          <p v-if="notice" class="notice" :class="{ error: noticeError }" role="status">{{ notice }}</p>
        </form>
      </section>
      </div>

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
  overflow: auto;
  background: #050a14;
}

.screen {
  --panel: #081729;
  --cyan: #5cd0ff;
  --text-strong: #eaf6ff;
  --text-mid: #8fa9c4;
  --text-dim: #5a7290;
  --text-sub: #9ebad6;
  --green: #33d98c;
  --green-dot: #3ddc97;
  --page-inline: clamp(16px, 3.33vw, 64px);
  --page-block: clamp(16px, 2.5dvh, 28px);
  --section-gap: clamp(16px, 2.5dvh, 28px);
  position: relative;
  width: 100%;
  min-height: 100%;
  box-sizing: border-box;
  padding: var(--page-block) var(--page-inline);
  display: flex;
  flex-direction: column;
  color: var(--text-strong);
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.backdrop {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  background: linear-gradient(135deg, #081426 0%, #050a14 100%);
}
.bg-glow { position: absolute; border-radius: 50%; }
.bg-glow-cyan {
  left: 8%;
  top: 12%;
  width: 65%;
  height: 80%;
  background: radial-gradient(closest-side, rgba(92, 209, 255, 0.16) 0%, rgba(92, 209, 255, 0) 100%);
}
.bg-glow-blue {
  right: -8%;
  top: -18%;
  width: 50%;
  height: 70%;
  background: radial-gradient(closest-side, rgba(46, 156, 255, 0.12) 0%, rgba(46, 156, 255, 0) 100%);
}
.bg-grid {
  position: absolute;
  inset: 0;
  opacity: 0.45;
  background-image:
    linear-gradient(rgba(92, 208, 255, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(92, 208, 255, 0.08) 1px, transparent 1px);
  background-size: 64px 64px;
}

.top-bar {
  flex: 0 0 auto;
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}
.brand { min-width: 0; display: flex; align-items: center; gap: 20px; }
.logo-mark {
  flex: 0 0 52px;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #5bd1ff 0%, #2d9bff 100%);
  box-shadow: 0 6px 24px rgba(92, 209, 255, 0.4);
}
.brand-text { min-width: 0; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; }
.breadcrumb { font-size: 14px; color: var(--text-mid); letter-spacing: 2px; }
.brand-title { font-size: 24px; font-weight: 700; letter-spacing: 2px; overflow-wrap: anywhere; }
.clock-group { flex: none; display: flex; align-items: center; gap: 24px; }
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
  font-size: 40px;
  letter-spacing: 3px;
  line-height: 1;
  text-shadow: 0 0 18px rgba(92, 209, 255, 0.45);
  font-variant-numeric: tabular-nums;
}

.top-divider {
  flex: 0 0 auto;
  height: 1px;
  margin-top: 12px;
  background: rgba(255, 255, 255, 0.06);
}

.main-body {
  flex: 1 0 auto;
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(340px, 34%, 600px);
  align-items: stretch;
  gap: clamp(16px, 2vw, 32px);
  padding: var(--section-gap) 0;
}

.showcase {
  position: relative;
  min-width: 0;
  min-height: 420px;
  contain: size;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  border-radius: 24px;
  overflow: hidden;
  background: var(--panel);
  box-shadow: inset 0 0 0 1px rgba(64, 184, 255, 0.2);
}
.scene-diagram { position: relative; min-width: 0; min-height: 0; }
.core-visual {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 56.36%;
  object-fit: contain;
  object-position: center;
  display: block;
}
.visual-top-fade {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 13.87%;
  background: linear-gradient(to bottom, #081729 0%, rgba(8, 23, 41, 0) 100%);
}
.visual-fade {
  position: absolute;
  left: 0;
  top: 39.02%;
  width: 100%;
  height: 17.34%;
  background: linear-gradient(to bottom, rgba(8, 23, 41, 0) 0%, #081729 100%);
}
.corner-brackets {
  position: absolute;
  inset: 16px;
  width: calc(100% - 32px);
  height: calc(100% - 32px);
  object-fit: fill;
  pointer-events: none;
  z-index: 1;
}

.hero {
  position: relative;
  padding: clamp(24px, 3dvh, 48px) clamp(24px, 2.5vw, 48px) 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
}
.hero-eyebrow { display: flex; align-items: center; gap: 10px; }
.live-dot {
  flex: 0 0 8px;
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
  letter-spacing: 2px;
}
.hero-headline {
  margin: 0;
  width: 100%;
  font-size: 44px;
  font-weight: 700;
  letter-spacing: 4px;
  line-height: 1.3;
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
  font-size: 16px;
  color: var(--text-sub);
  letter-spacing: 0.5px;
}

.scene-ground-glow {
  position: absolute;
  left: 6.9%;
  top: 74.57%;
  width: 86.2%;
  height: 24.57%;
  border-radius: 50%;
  pointer-events: none;
  background: radial-gradient(closest-side, rgba(92, 209, 255, 0.16) 0%, rgba(92, 209, 255, 0) 100%);
}
.energy-modules {
  position: absolute;
  left: 4.14%;
  top: 58.09%;
  width: 91.72%;
  height: 36%;
  display: flex;
  align-items: stretch;
  gap: clamp(8px, 1.2vw, 20px);
}
.scene-card {
  flex: 1 1 0;
  min-width: 0;
  min-height: 0;
  padding: clamp(4px, 1vw, 12px);
}
.scene-card img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.link-line { position: absolute; display: block; object-fit: fill; pointer-events: none; }
.link-plant { left: 18.71%; top: 42.92%; width: 18.62%; height: 34.1%; }
.link-storage { left: 49.83%; top: 49.13%; width: 4px; height: 27.89%; }
.link-test { left: 63.45%; top: 42.2%; width: 17.84%; height: 34.83%; }

.anchor {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
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
.anchor-plant { left: 37.16%; top: 43.21%; }
.anchor-storage { left: 50%; top: 49.42%; }
.anchor-test { left: 63.62%; top: 42.49%; }

.endpoint { position: absolute; width: 10px; height: 10px; transform: translate(-50%, -50%); }
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
.endpoint-plant { left: 18.88%; top: 76.73%; }
.endpoint-storage { left: 50%; top: 76.73%; }
.endpoint-test { left: 81.12%; top: 76.73%; }

.scene-label {
  position: absolute;
  line-height: 1.5;
  font-size: 18px;
  font-weight: 500;
  color: #fff;
  text-shadow: 0 0 12px rgba(92, 209, 255, 0.55);
  white-space: nowrap;
}
.label-plant {
  left: 35.17%;
  top: 40.9%;
  width: max-content;
  transform: translateX(-100%);
}
.label-storage {
  left: 51.98%;
  top: 47.11%;
  width: max-content;
}
.label-test {
  left: 65.6%;
  top: 40.17%;
  width: max-content;
}

.login-card {
  position: relative;
  min-width: 0;
  border-radius: 24px;
  padding: clamp(24px, 4dvh, 56px) clamp(24px, 2.5vw, 48px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 24px;
  background: linear-gradient(to bottom, rgba(15, 36, 61, 0.85) 0%, rgba(10, 23, 41, 0.85) 100%);
  box-shadow: inset 0 0 0 1px rgba(64, 184, 255, 0.25), 0 24px 64px rgba(0, 0, 0, 0.45);
}
.card-brand-row {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.system-version { font-size: 12px; font-weight: 500; color: var(--text-dim); letter-spacing: 2px; overflow-wrap: anywhere; }
.secure-chip {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  border-radius: 100px;
  background: rgba(51, 217, 140, 0.1);
}
.secure-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); }
.secure-label { font-size: 12px; font-weight: 500; color: var(--green); }
.card-header { width: 100%; }
.card-title { margin: 0; font-size: 40px; font-weight: 700; letter-spacing: 4px; line-height: 1.3; }
.card-subtitle:empty { display: none; }

.form { width: 100%; display: flex; flex-direction: column; gap: 20px; }
.field { width: 100%; display: flex; flex-direction: column; gap: 10px; }
.field-label { font-size: 14px; font-weight: 500; color: var(--text-mid); letter-spacing: 1px; }
.input {
  width: 100%;
  min-height: 52px;
  box-sizing: border-box;
  border-radius: 11px;
  padding: 14px 16px;
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
  font-size: 16px;
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
  min-height: 52px;
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
.primary-btn:disabled { cursor: progress; filter: saturate(0.55) brightness(0.9); }
.primary-btn:focus-visible,
.eye-btn:focus-visible,
.help-link:focus-visible { outline: 2px solid var(--cyan); outline-offset: 4px; }
.remember:has(.remember-input:focus-visible) .checkbox { outline: 2px solid var(--cyan); outline-offset: 4px; }
.notice { margin: 0; font-size: 14px; line-height: 22px; color: var(--cyan); overflow-wrap: anywhere; }
.notice.error { color: #ffb1bd; }

.footer-status {
  flex: 0 0 auto;
  min-height: 24px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 24px;
}
.status-left { min-width: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 8px 24px; }
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
.copyright { font-size: 13px; color: var(--text-dim); overflow-wrap: anywhere; }

@media (min-width: 1600px) {
  .brand-title { font-size: 28px; }
  .hero-headline { font-size: 56px; }
  .scene-label { font-size: 22px; }
}

@media (max-width: 1100px) {
  .hero-headline { font-size: 36px; }
  .hero-subtitle { display: none; }
  .scene-label { font-size: 16px; }
  .clock-group { gap: 16px; }
  .digital-clock { font-size: 32px; }
  .update-text { display: none; }
}

@media (max-width: 900px) {
  .showcase { display: none; }
  .main-body { grid-template-columns: minmax(0, 1fr); justify-items: center; align-items: center; }
  .login-card { width: min(100%, 520px); }
}

@media (max-width: 720px) {
  .clock-group { display: none; }
  .brand { gap: 12px; }
  .brand-title { font-size: 20px; }
  .footer-status { justify-content: center; }
  .copyright { display: none; }
}

@media (max-width: 400px) {
  .login-card { padding-inline: 20px; }
  .card-title { font-size: 32px; }
  .system-version { display: none; }
}

@media (max-height: 700px) {
  .screen { --page-block: 12px; --section-gap: 12px; }
  .top-bar { min-height: 52px; }
  .login-card { padding-block: 20px; gap: 16px; }
  .form { gap: 16px; }
  .field { gap: 8px; }
  .card-title { font-size: 32px; }
  .hero { padding-top: 24px; gap: 10px; }
  .hero-subtitle { display: none; }
}
</style>
