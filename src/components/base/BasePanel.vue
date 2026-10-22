<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  title: string;
  sub?: string;
  index?: string;
  alarm?: boolean;
}>();

const delay = computed(() => `${(Number(props.index) || 0) * 70}ms`);
</script>

<template>
  <section class="shell" :class="{ 'is-alarm': alarm }" :style="{ animationDelay: delay }">
    <div class="panel">
      <header class="panel-head">
        <span v-if="index" class="panel-index num">{{ index }}</span>
        <h3 class="panel-title">{{ title }}</h3>
        <span v-if="sub" class="panel-sub">{{ sub }}</span>
        <div class="ml-auto flex items-center gap-1.5">
          <slot name="extra" />
        </div>
      </header>
      <div class="panel-body">
        <slot />
      </div>
    </div>
  </section>
</template>

<style scoped>
.shell {
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: 2px;
  animation: rise-in 0.7s var(--ease) both;
}

.shell.is-alarm .panel {
  border-color: rgba(255, 90, 90, 0.85);
  box-shadow: inset 0 0 24px rgba(220, 40, 40, 0.18), 0 0 16px rgba(220, 40, 40, 0.28);
}

.panel {
  position: relative;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-radius: 2px;
  background:
    linear-gradient(180deg, rgba(12, 48, 86, 0.55), rgba(4, 18, 38, 0.88));
  box-shadow: var(--shadow-soft);
  border: 1px solid rgba(90, 196, 255, 0.45);
  overflow: hidden;
}

.panel::before,
.panel::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  border: 2px solid #7ee7ff;
  z-index: 2;
  pointer-events: none;
}

.panel::before {
  top: -1px;
  left: -1px;
  border-right: 0;
  border-bottom: 0;
}

.panel::after {
  right: -1px;
  bottom: -1px;
  border-left: 0;
  border-top: 0;
}

.panel-head {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 42px;
  padding: 0 14px;
  flex-shrink: 0;
}

.panel-head::after {
  content: '';
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(90, 210, 255, 0.55), transparent);
}

.panel-index {
  min-width: 22px;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: #3ad4ff;
}

.is-alarm .panel-index {
  color: #ff6b6b;
}

.panel-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: #e7f6ff;
  text-shadow: 0 0 12px rgba(58, 212, 255, 0.35);
  white-space: nowrap;
}

.panel-sub {
  font-size: 10px;
  color: #5d8eaa;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  white-space: nowrap;
}

.panel-body {
  position: relative;
  flex: 1 1 auto;
}
</style>
