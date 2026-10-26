<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { useScreenScale } from '@/composables/useScreenScale';
import { deskMenus } from '@/router';

const route = useRoute();
const router = useRouter();
const { screenRef, screenStyle, frameStyle } = useScreenScale(1920);
</script>

<template>
  <div class="viewport">
    <div class="frame" :style="frameStyle">
      <div ref="screenRef" class="screen" :style="screenStyle">
    <div class="bg" />
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
  background: var(--c-bg);
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
  background: var(--c-bg);
}

.bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(rgba(58, 160, 220, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(58, 160, 220, 0.05) 1px, transparent 1px),
    radial-gradient(ellipse 70% 42% at 50% 0%, rgba(20, 110, 190, 0.38), transparent 62%),
    radial-gradient(ellipse 40% 30% at 50% 100%, rgba(0, 70, 140, 0.28), transparent 70%),
    linear-gradient(180deg, #06203a, #03101c 42%, #020814);
  background-size: 48px 48px, 48px 48px, auto, auto, auto;
}

.bar,
.stage { position: relative; }

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
