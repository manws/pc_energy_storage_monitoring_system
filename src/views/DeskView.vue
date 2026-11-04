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
const signingOut = ref(false);

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
      <header class="bar">
        <button type="button" class="back" @click="router.push({ name: 'home' })">
          <i class="ri-arrow-left-line" />返回总览
        </button>
        <nav class="menus">
          <router-link
            v-for="item in menus"
            :key="item.name"
            class="menu"
            :class="{ 'is-on': route.name === item.name }"
            :to="{ name: item.name }"
          >
            {{ item.label }}
          </router-link>
        </nav>
        <div class="session-actions">
          <div class="user-pill" :title="userCode ? `${userName}（${userCode}）` : userName">
            <i class="ri-user-3-line" aria-hidden="true" />
            <span class="user-name">{{ userName }}</span>
            <span v-if="userCode" class="user-code">{{ userCode }}</span>
          </div>
          <el-tooltip :content="signingOut ? '正在退出…' : '退出登录'" placement="bottom">
            <button
              type="button"
              class="logout"
              aria-label="退出登录"
              :disabled="signingOut"
              :aria-busy="signingOut"
              @click="signOut"
            >
              <i :class="signingOut ? 'ri-loader-4-line is-loading' : 'ri-logout-box-r-line'" aria-hidden="true" />
            </button>
          </el-tooltip>
        </div>
      </header>
      <div class="stage">
        <router-view v-slot="{ Component }">
          <Transition name="pane" mode="out-in">
            <component :is="Component" :key="String(route.name)" />
          </Transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<style scoped>
.viewport {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: #04101c;
}

.screen {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #e7f6ff;
  background: #04101c;
}

.bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(rgba(58, 160, 220, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(58, 160, 220, 0.03) 1px, transparent 1px),
    #04101c;
  background-size: 48px 48px, 48px 48px, auto;
}

.bar,
.stage { position: relative; }

.bar {
  height: 64px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 0 22px;
  border-bottom: 1px solid rgba(90, 196, 255, 0.16);
}

.back,
.menu {
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
  height: 34px;
  padding: 0 12px;
  border-radius: 2px;
  color: #c5e6f5;
  border: 1px solid rgba(90, 196, 255, 0.35);
  background: rgba(6, 28, 52, 0.72);
}

.back:hover { color: #f4fbff; border-color: #7ee7ff; }

.menus {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow-x: auto;
}

.menu {
  flex-shrink: 0;
  height: 36px;
  padding: 0 14px;
  color: #7eb4cc;
  letter-spacing: 0.06em;
  white-space: nowrap;
  border-bottom: 2px solid transparent;
}

.session-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.user-pill,
.logout {
  display: inline-flex;
  align-items: center;
  height: 38px;
  font-size: 13px;
  color: #c5e6f5;
  border-radius: 2px;
  background: rgba(6, 28, 52, 0.72);
  border: 1px solid rgba(90, 196, 255, 0.35);
  box-shadow: inset 0 0 12px rgba(40, 140, 220, 0.12);
}

.user-pill {
  gap: 10px;
  max-width: 280px;
  padding: 0 14px;
}

.user-pill > i { flex-shrink: 0; color: #67e8f9; }

.user-name,
.user-code {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.user-name { color: #f1f5f9; font-weight: 500; }
.user-code { font-size: 12px; color: #94a3b8; }

.logout {
  flex-shrink: 0;
  justify-content: center;
  width: 38px;
  padding: 0;
  cursor: pointer;
  transition: background 0.25s var(--ease), color 0.25s, border-color 0.25s;
}

.logout:hover:not(:disabled) {
  background: rgba(20, 70, 110, 0.8);
  color: #e7f6ff;
  border-color: #7ee7ff;
}

.logout:focus-visible { outline: 2px solid #7ee7ff; outline-offset: 3px; }
.logout:disabled { cursor: wait; opacity: 0.6; }
.logout .is-loading { animation: logout-spin 1s linear infinite; }

@keyframes logout-spin {
  to { transform: rotate(360deg); }
}

.menu.is-on {
  color: #f4fbff;
  border-bottom-color: #3ad4ff;
}

.menu:not(.is-on):hover { color: #c5e6f5; }

.stage {
  flex: 1;
  min-height: 0;
}

.stage :deep(.page) { height: 100%; }

.pane-enter-active,
.pane-leave-active { transition: opacity 0.28s var(--ease), transform 0.28s var(--ease); }
.pane-enter-from { opacity: 0; transform: translateY(10px); }
.pane-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
