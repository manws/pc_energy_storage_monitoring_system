<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useScreenScale } from '@/composables/useScreenScale';
import { deskMenus } from '@/router';

const route = useRoute();
const router = useRouter();
const { screenRef, screenStyle, frameStyle } = useScreenScale(1920);
const cycle = computed(() => (route.name === 'devices' ? '10s' : '2s'));
</script>

<template>
  <div class="viewport">
    <div class="frame" :style="frameStyle">
      <div ref="screenRef" class="screen" :style="screenStyle">
    <header class="bar">
      <button type="button" class="back" @click="router.push({ name: 'home' })">
        <i class="ri-arrow-left-line" />返回总览
      </button>
      <nav class="menus">
        <router-link
          v-for="item in deskMenus"
          :key="item.name"
          class="menu"
          :class="{ 'is-on': route.name === item.name }"
          :to="{ name: item.name }"
        >
          {{ item.label }}
        </router-link>
      </nav>
      <span class="cycle"><em>刷新周期</em><b class="num">{{ cycle }}</b></span>
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
  </div>
</template>

<style scoped>
.viewport {
  position: fixed;
  inset: 0;
  overflow: hidden;
  background: #04101c;
}

.frame { position: relative; margin: 0 auto; }

.screen {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #e7f6ff;
  background:
    radial-gradient(ellipse 50% 24% at 50% 0%, rgba(26, 168, 230, 0.16), transparent 70%),
    #04101c;
}

.bar {
  height: 64px;
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 0 22px;
  border-bottom: 1px solid rgba(90, 196, 255, 0.22);
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
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.menu {
  height: 36px;
  padding: 0 14px;
  color: #7eb4cc;
  letter-spacing: 0.06em;
  border-bottom: 2px solid transparent;
}

.menu.is-on {
  color: #f4fbff;
  border-bottom-color: #3ad4ff;
}

.menu:not(.is-on):hover { color: #c5e6f5; }

.cycle {
  margin-left: auto;
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  color: #7eb4cc;
  font-size: 13px;
}

.cycle b { color: #e7f6ff; font-size: 16px; font-weight: 500; }
.cycle em { font-style: normal; }

.stage {
  position: relative;
  flex: 1;
  min-height: 0;
}

.stage :deep(.page) { height: 100%; }

.pane-enter-active,
.pane-leave-active { transition: opacity 0.28s var(--ease), transform 0.28s var(--ease); }
.pane-enter-from { opacity: 0; transform: translateY(10px); }
.pane-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
