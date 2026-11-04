<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { EmsApi } from '@/core/api';
import { menusFor } from '@/core/deskNav';
import { clearSession, useSessionUser } from '@/core/session';

const route = useRoute();
const router = useRouter();
const user = useSessionUser();
const menus = computed(() => menusFor(user.value));
const userName = computed(() => user.value?.userName || user.value?.userCode || '未登录');
const userCode = computed(() => user.value?.userCode ?? '');
const userInitial = computed(() => {
  const name = userName.value.trim();
  return name ? name.slice(0, 1) : '未';
});
const signingOut = ref(false);

const pageLabel = computed(() => String(route.meta.label ?? ''));
const pageHint = computed(() => {
  const hints: Record<string, string> = {
    meters: '五路有功功率实时对照',
    devices: '储能通道与电池状态',
    stats: '告警与事件记录',
    config: '工作单元参数与通信配置',
    users: '账号与权限管理'
  };
  return hints[String(route.name ?? '')] || String(route.meta.title ?? '');
});

function goHome() {
  router.push({ name: 'home' });
}

async function signOut() {
  if (signingOut.value) return;
  signingOut.value = true;
  try {
    await EmsApi.logout();
  } catch {
  } finally {
    clearSession();
    try {
      await router.replace({ name: 'login' });
    } finally {
      signingOut.value = false;
    }
  }
}
</script>

<template>
  <div class="viewport">
    <div class="screen">
      <div class="bg" />
      <header class="nav">
        <div class="nav-top-line" />
        <div class="nav-main">
          <div class="brand">
            <span class="brand-badge" aria-hidden="true"><i class="ri-leaf-line" /></span>
            <span class="brand-text">
              <span class="brand-name">北交新能</span>
              <span class="brand-sub">能源监控中心</span>
            </span>
          </div>

          <button type="button" class="back" @click="goHome">
            <i class="ri-arrow-left-line" aria-hidden="true" />
            返回总览
          </button>

          <span class="nav-divider" aria-hidden="true" />

          <nav class="nav-menu" aria-label="主导航">
            <router-link
              v-for="item in menus"
              :key="item.name"
              class="nav-item"
              :class="{ active: route.name === item.name }"
              :to="{ name: item.name }"
            >
              {{ item.label }}
            </router-link>
          </nav>

          <div class="nav-user">
            <div class="account" :title="userCode ? `${userName}（${userCode}）` : userName">
              <span class="account-avatar">{{ userInitial }}</span>
              <span class="account-name">{{ userName }}</span>
              <span v-if="userCode" class="account-code">{{ userCode }}</span>
            </div>
            <el-tooltip :content="signingOut ? '正在退出…' : '退出登录'" placement="bottom">
              <button
                type="button"
                class="icon-btn"
                aria-label="退出登录"
                :disabled="signingOut"
                :aria-busy="signingOut"
                @click="signOut"
              >
                <i :class="signingOut ? 'ri-loader-4-line is-loading' : 'ri-logout-box-r-line'" aria-hidden="true" />
              </button>
            </el-tooltip>
          </div>
        </div>
        <div class="nav-bottom-line" />
      </header>
      <div class="stage">
        <div class="content">
          <div class="page-head">
            <div>
              <h1 class="page-title">{{ pageLabel }}</h1>
              <p class="page-sub">{{ pageHint }}</p>
            </div>
          </div>
          <div class="page-body">
            <router-view v-slot="{ Component }">
              <Transition name="pane" mode="out-in">
                <component :is="Component" :key="String(route.name)" />
              </Transition>
            </router-view>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.viewport {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: #030814;
}

.screen {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #eaf9ff;
  background: linear-gradient(to bottom, #05213b 0%, #030f1c 42%, #030814 100%);
}

.bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(rgba(58, 160, 220, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(58, 160, 220, 0.03) 1px, transparent 1px);
  background-size: 48px 48px;
}

.nav,
.stage { position: relative; }

.nav { flex: none; z-index: 6; }

.nav-top-line,
.nav-bottom-line {
  height: 1px;
  background: linear-gradient(to right, rgba(79, 191, 255, 0) 0%, rgba(125, 232, 255, 0.58) 50%, rgba(79, 191, 255, 0) 100%);
}

.nav-main {
  height: 64px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 22px;
  background: linear-gradient(to bottom, #0a2440 0%, #051221 100%);
}

.brand {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 10px;
}

.brand-badge {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  font-size: 16px;
  color: #f2fbff;
  background: linear-gradient(135deg, #7ce8ff 0%, #196bad 100%);
  box-shadow: inset 0 0 0 1px rgba(124, 232, 255, 0.45), 0 0 14px rgba(58, 180, 255, 0.35);
}

.brand-text { display: flex; flex-direction: column; gap: 1px; }
.brand-name { font-size: 16px; font-weight: 700; line-height: 20px; letter-spacing: 0.04em; color: #eaf9ff; }
.brand-sub { font-size: 10px; line-height: 13px; color: #7fb2d6; }

.back,
.nav-item,
.icon-btn {
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
  text-decoration: none;
}

.back {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px 0 12px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #d7f0ff;
  background: rgba(5, 28, 51, 0.72);
  border: 1px solid rgba(125, 232, 255, 0.42);
  box-shadow: inset 0 1px 0 rgba(125, 232, 255, 0.16);
  transition: color 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.back i { font-size: 16px; color: #7ee7ff; }

.back:hover {
  color: #f4fbff;
  border-color: #7ee7ff;
  background: rgba(20, 70, 110, 0.8);
}

.nav-divider {
  width: 1px;
  height: 22px;
  flex-shrink: 0;
  background: rgba(89, 196, 255, 0.28);
}

.nav-menu {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 2px;
  min-width: 0;
  overflow-x: auto;
}

.nav-item {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  height: 36px;
  padding: 0 15px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  color: #8fb4d4;
  white-space: nowrap;
  transition: color 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease;
}

.nav-item:hover { color: #c6e4fa; }

.nav-item.active {
  font-weight: 600;
  color: #eaf9ff;
  background: linear-gradient(to bottom, rgba(23, 92, 153, 0.85) 0%, rgba(13, 51, 97, 0.7) 100%);
  box-shadow:
    inset 0 0 0 1px rgba(125, 232, 255, 0.55),
    inset 0 1px 0 rgba(125, 232, 255, 0.18),
    0 6px 18px -2px rgba(51, 158, 240, 0.32);
}

.back:focus-visible,
.nav-item:focus-visible,
.icon-btn:focus-visible {
  outline: 2px solid #7ee7ff;
  outline-offset: 3px;
}

.nav-user {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.account {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 260px;
  height: 36px;
  padding: 0 10px 0 4px;
  border-radius: 18px;
  background: rgba(5, 28, 51, 0.72);
  border: 1px solid rgba(89, 196, 255, 0.3);
}

.account-avatar {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 13px;
  font-size: 12px;
  font-weight: 600;
  color: #cfe9f7;
  background: linear-gradient(135deg, #3f7cea 0%, #1e4a99 100%);
}

.account-name,
.account-code {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.account-name { font-size: 12px; font-weight: 500; color: #e8f7ff; }
.account-code { font-size: 11px; color: #8fafc6; }

.icon-btn {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 11px;
  color: #9dc4e6;
  background: rgba(5, 28, 51, 0.72);
  border: 1px solid rgba(89, 196, 255, 0.3);
  transition: color 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.icon-btn:hover:not(:disabled) {
  color: #e7f6ff;
  border-color: rgba(125, 232, 255, 0.65);
  background: rgba(20, 70, 110, 0.8);
}

.icon-btn:disabled { cursor: wait; opacity: 0.6; }
.icon-btn .is-loading { animation: logout-spin 1s linear infinite; }

@keyframes logout-spin {
  to { transform: rotate(360deg); }
}

.stage {
  flex: 1;
  min-height: 0;
}

.content {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 20px 16px;
}

.page-head { flex: none; min-height: 30px; }

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 500;
  line-height: 30px;
  color: #eaf5fe;
}

.page-sub {
  margin: 2px 0 0;
  font-size: 13px;
  line-height: 20px;
  color: #6c8da1;
}

.page-body {
  flex: 1;
  min-height: 0;
}

.page-body :deep(.page) { height: 100%; }

.pane-enter-active,
.pane-leave-active { transition: opacity 0.28s var(--ease), transform 0.28s var(--ease); }
.pane-enter-from { opacity: 0; transform: translateY(10px); }
.pane-leave-to { opacity: 0; transform: translateY(-8px); }

@media (prefers-reduced-motion: reduce) {
  .nav-item,
  .back,
  .icon-btn,
  .pane-enter-active,
  .pane-leave-active { transition: none; }
}
</style>
