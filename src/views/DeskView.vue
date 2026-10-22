<script setup lang="ts">
import { useDesk } from '@/composables/useDesk';
import SoonView from '@/views/SoonView.vue';

const emit = defineEmits<{ back: [] }>();
const { current, go, deskMenus } = useDesk();
</script>

<template>
  <div class="desk">
    <header class="bar">
      <button type="button" class="back" @click="emit('back')">
        <i class="ri-arrow-left-line" />返回总览
      </button>
      <nav class="menus">
        <button
          v-for="item in deskMenus"
          :key="item.id"
          type="button"
          class="menu"
          :class="{ 'is-on': current.id === item.id }"
          @click="go(item.id)"
        >
          {{ item.label }}
        </button>
      </nav>
      <span class="cycle"><em>刷新周期</em><b class="num">2s</b></span>
    </header>
    <div class="stage">
      <Transition name="pane" mode="out-in">
        <component :is="current.view" v-if="current.view" :key="current.id" />
        <SoonView v-else :key="current.id" :note="current.label" />
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.desk {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(ellipse 50% 24% at 50% 0%, rgba(26, 168, 230, 0.16), transparent 70%),
    #04101c;
  color: #e7f6ff;
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

.pane-enter-active,
.pane-leave-active { transition: opacity 0.28s var(--ease), transform 0.28s var(--ease); }
.pane-enter-from { opacity: 0; transform: translateY(10px); }
.pane-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
