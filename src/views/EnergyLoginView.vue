<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ApiError, EmsApi } from '@/core/api';
import { signLogin } from '@/core/auth';
import { saveSession } from '@/core/session';
import energyScene from '@/assets/login/energy/scene.png';

const router = useRouter();
const login = ref('');
const password = ref('');
const remember = ref(true);
const showPassword = ref(false);
const notice = ref('');
const noticeError = ref(false);
const loading = ref(false);

function showNotice(message: string, error = false) {
  notice.value = message;
  noticeError.value = error;
}

function showHelp() {
  showNotice('请联系厂区系统管理员激活值班账号。');
}

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
  showNotice('');
  try {
    const { userInfo } = await EmsApi.login(signLogin(name, secret));
    if (!userInfo || !userInfo.userCode) {
      showNotice('登录失败：服务端未返回用户信息', true);
      return;
    }
    try {
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

const secureConnection = window.location.protocol === 'https:';
const features = [
  { title: '厂区监控', description: '全域能耗，一屏掌握' },
  { title: '储能控制', description: '智能调度，高效协同' },
  { title: '设备运行', description: '实时感知，及时预警' }
];
</script>

<template>
  <div class="energy-login">
    <div class="login-shell">
      <header class="login-header">
        <div class="brand">
          <span class="brand-mark" aria-hidden="true" />
          <div class="brand-text">
            <p class="company">北交新能</p>
            <p class="product">厂区智慧能源监控中心</p>
          </div>
        </div>
        <nav class="help-nav" aria-label="帮助导航">
          <button type="button" class="text-link" @click="showNotice('如需使用帮助，请联系企业管理员获取平台操作指南。')">帮助中心</button>
          <span aria-hidden="true">/</span>
          <button type="button" class="text-link" @click="showHelp">联系管理员</button>
        </nav>
      </header>

      <main class="login-main">
        <section class="energy-showcase" aria-labelledby="energy-title">
          <div class="intro">
            <p class="eyebrow">智慧能源 · 实时在线</p>
            <h1 id="energy-title">能源全域，一站洞察</h1>
            <p class="description">连接厂区、设备与储能，让每一度能源清晰可见。</p>
          </div>
          <div class="energy-scene">
            <img :src="energyScene" alt="全息能源球体与厂区、储能设备和变电设施融合为一座能源数字孪生园区" />
          </div>
          <div class="features">
            <div v-for="feature in features" :key="feature.title" class="feature">
              <h3>{{ feature.title }}</h3>
              <p>{{ feature.description }}</p>
            </div>
          </div>
        </section>

        <section class="login-region" aria-labelledby="login-title">
          <div class="login-card">
            <div class="card-top">
              <div class="secure">
                <span class="status-dot" aria-hidden="true" />
                <span>{{ secureConnection ? '安全连接已建立' : '请使用授权账号登录' }}</span>
              </div>
              <div class="welcome">
                <h2 id="login-title">欢迎登录</h2>
                <p>登录账号，开启智慧能源管理</p>
              </div>
            </div>

            <form class="login-form" novalidate :aria-busy="loading" @submit.prevent="submit">
              <div class="field">
                <label for="energy-username">登录账号</label>
                <div class="control">
                  <input
                    id="energy-username"
                    v-model="login"
                    name="username"
                    type="text"
                    placeholder="请输入登录账号"
                    autocomplete="username"
                    maxlength="20"
                    required
                    :aria-describedby="notice ? 'login-notice' : undefined"
                  />
                </div>
              </div>
              <div class="field">
                <label for="energy-password">登录密码</label>
                <div class="control">
                  <input
                    id="energy-password"
                    v-model="password"
                    name="password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="请输入登录密码"
                    autocomplete="current-password"
                    maxlength="20"
                    required
                    :aria-describedby="notice ? 'login-notice' : undefined"
                  />
                  <button
                    type="button"
                    class="text-link password-toggle"
                    :aria-label="showPassword ? '隐藏密码' : '显示密码'"
                    :aria-pressed="showPassword"
                    @click="showPassword = !showPassword"
                  >{{ showPassword ? '隐藏' : '显示' }}</button>
                </div>
              </div>
              <div class="options">
                <label class="remember">
                  <input v-model="remember" type="checkbox" />
                  <span>记住登录</span>
                </label>
                <button type="button" class="text-link" @click="showNotice('请联系企业管理员重置登录密码。')">忘记密码？</button>
              </div>
              <button class="submit-button" type="submit" :disabled="loading">
                {{ loading ? '登录中…' : '进入系统' }}
              </button>
              <p v-if="notice" id="login-notice" class="notice" :class="{ 'is-error': noticeError }" role="status" aria-live="polite">{{ notice }}</p>
            </form>

            <div class="account-hint">
              <p>还没有账号？</p>
              <p>请联系企业管理员开通访问权限</p>
            </div>
          </div>
        </section>
      </main>

      <footer class="login-footer">
        <div class="system-status">
          <span class="status-dot" aria-hidden="true" />
          <span>智慧能源管理平台</span>
        </div>
        <p>北交新能 · 厂区智慧能源监控中心 V3.2</p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.energy-login {
  --login-bg: #08111f;
  --login-card: #101e32;
  --login-input: #081422;
  --login-primary: #0052d9;
  --login-accent: #33e0ff;
  --login-success: #33d999;
  --login-text: #edf4ff;
  --login-secondary: #9ab0c8;
  --login-subtle: #80b8e0;
  --login-muted: #72879e;
  position: fixed;
  inset: 0;
  overflow: auto;
  background: var(--login-bg);
  color: var(--login-text);
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color-scheme: dark;
}

.login-shell {
  width: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: clamp(20px, 5.33dvh, 48px) clamp(20px, 3.33vw, 64px);
  box-sizing: border-box;
}

.login-shell p,
.login-shell h1,
.login-shell h2,
.login-shell h3 { margin: 0; }

.login-shell button,
.login-shell input { font: inherit; }

.login-header {
  flex: none;
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.brand { min-width: 0; display: flex; align-items: center; gap: 16px; }
.brand-mark { flex: 0 0 4px; height: 40px; background: var(--login-accent); border-radius: 2px; }
.brand-text { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.company { font-size: 12px; line-height: 20px; color: var(--login-subtle); }
.product { font-size: 20px; line-height: 28px; font-weight: 600; overflow-wrap: anywhere; }
.help-nav { display: flex; flex: none; gap: 10px; align-items: center; color: var(--login-secondary); }

.login-shell .text-link {
  padding: 0;
  border: 0;
  background: none;
  color: var(--login-subtle);
  font-size: 14px;
  line-height: 22px;
  white-space: nowrap;
  cursor: pointer;
}

.login-shell .text-link:hover { color: var(--login-accent); }
.help-nav .text-link { color: var(--login-secondary); }

.login-main {
  flex: 1 0 auto;
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(360px, 30.56vw, 520px);
  gap: clamp(24px, 3.33vw, 64px);
  align-items: stretch;
}

.energy-showcase {
  min-width: 0;
  min-height: 580px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  contain: size;
}

.intro { flex: none; display: flex; flex-direction: column; gap: 12px; }
.eyebrow { font-size: 12px; line-height: 20px; color: var(--login-accent); }
.intro h1 { font-size: 36px; line-height: 44px; font-weight: 600; color: #e6f2ff; }
.description { font-size: 14px; line-height: 22px; color: var(--login-secondary); }

.energy-scene {
  position: relative;
  flex: 1;
  min-height: 240px;
  overflow: hidden;
  border-radius: 6px;
  background: #031222;
}

.energy-scene img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: contain; }

.features {
  flex: none;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  padding: 16px;
  background: #0c192a;
  border: 1px solid #1b2c42;
  border-radius: 6px;
}

.feature { min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.feature h3 { font-size: 14px; line-height: 22px; font-weight: 600; color: #dcebfa; }
.feature p { font-size: 12px; line-height: 20px; color: var(--login-subtle); }

.login-region { min-width: 0; display: flex; flex-direction: column; justify-content: center; }
.login-card { width: 100%; padding: 40px; display: flex; flex-direction: column; gap: 32px; border: 1px solid #233850; background: var(--login-card); border-radius: 6px; }
.card-top { display: flex; flex-direction: column; gap: 20px; }
.secure { display: flex; align-items: center; gap: 8px; color: var(--login-success); font-size: 12px; line-height: 20px; }
.status-dot { flex: none; width: 6px; height: 6px; border-radius: 50%; background: var(--login-success); }
.welcome { display: flex; flex-direction: column; gap: 8px; }
.welcome h2 { font-size: 28px; line-height: 36px; font-weight: 600; }
.welcome p { font-size: 14px; line-height: 22px; color: var(--login-secondary); }

.login-form { display: flex; flex-direction: column; gap: 24px; }
.field { display: flex; flex-direction: column; gap: 8px; }
.field label { font-size: 14px; line-height: 22px; color: #dcebfa; }
.control { height: 48px; border: 1px solid #2a3e56; border-radius: 6px; background: var(--login-input); display: flex; align-items: center; padding: 0 16px; gap: 12px; }
.control:focus-within { border-color: var(--login-accent); }

.login-shell .control input {
  display: block;
  flex: 1;
  min-width: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  outline: none;
  color: var(--login-text);
  background: transparent;
  font-size: 14px;
  line-height: 22px;
}

.control input::placeholder { color: var(--login-muted); opacity: 1; }
.control input:-webkit-autofill { -webkit-text-fill-color: var(--login-text); caret-color: var(--login-text); box-shadow: inset 0 0 0 1000px var(--login-input); }
.login-shell .password-toggle { flex: none; font-size: 12px; line-height: 20px; }
.options { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 14px; line-height: 22px; }
.remember { display: flex; align-items: center; gap: 8px; color: var(--login-secondary); cursor: pointer; }
.login-shell .remember input { appearance: none; flex: none; width: 16px; height: 16px; margin: 0; border: 1px solid #627a95; border-radius: 3px; background: var(--login-input); cursor: pointer; }
.login-shell .remember input:checked { background-color: var(--login-primary); border-color: var(--login-primary); background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='m3 8 3 3 7-7' fill='none' stroke='white' stroke-width='2'/%3E%3C/svg%3E"); }

.login-shell .submit-button { height: 48px; width: 100%; border: 0; background: var(--login-primary); border-radius: 6px; color: #fff; font-size: 14px; line-height: 22px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.submit-button:hover:not(:disabled) { background: #366ef4; }
.submit-button:disabled { cursor: progress; opacity: 0.65; }
.login-shell button:focus-visible,
.login-shell .remember input:focus-visible { outline: 2px solid var(--login-accent); outline-offset: 4px; }
.login-shell .notice { color: var(--login-accent); font-size: 14px; line-height: 22px; overflow-wrap: anywhere; }
.login-shell .notice.is-error { color: #ffb1bd; }

.account-hint { padding: 16px; display: flex; flex-direction: column; gap: 8px; border-radius: 6px; background: #0b192b; font-size: 12px; line-height: 20px; }
.account-hint p:first-child { color: var(--login-secondary); }
.account-hint p:last-child { color: var(--login-subtle); }
.login-footer { flex: none; min-height: 20px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 24px; color: var(--login-muted); font-size: 12px; line-height: 20px; }
.system-status { display: flex; gap: 8px; align-items: center; }

@media (max-width: 1100px) {
  .login-shell { gap: 24px; }
  .login-card { padding: 28px; }
  .intro h1 { font-size: 30px; line-height: 40px; }
  .features { gap: 12px; }
}

@media (max-width: 900px) {
  .login-main { grid-template-columns: minmax(0, 1fr); justify-items: center; }
  .energy-showcase { display: none; }
  .login-region { width: min(100%, 440px); }
}

@media (max-width: 620px) {
  .login-header { flex-wrap: wrap; gap: 16px; }
  .help-nav { margin-left: 20px; }
  .product { font-size: 18px; line-height: 26px; }
  .login-footer { justify-content: center; text-align: center; }
  .login-shell .control input { font-size: 16px; }
}

@media (max-width: 380px) {
  .login-card { padding: 24px 20px; gap: 24px; }
  .welcome h2 { font-size: 26px; }
  .options { gap: 8px; }
  .login-shell .options .text-link { font-size: 12px; }
}

@media (max-height: 760px) {
  .login-shell { padding-block: 20px; gap: 20px; }
  .energy-showcase { min-height: 520px; gap: 16px; }
  .login-card { padding-block: 24px; gap: 24px; }
  .login-form { gap: 20px; }
  .card-top { gap: 16px; }
}

@media (max-height: 600px) {
  .account-hint { display: none; }
  .energy-showcase { min-height: 440px; }
}
</style>
