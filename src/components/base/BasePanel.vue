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
  border-radius: 12px;
  animation: rise-in 0.7s var(--ease) both;
}

.shell.is-alarm .panel {
  box-shadow: inset 0 0 0 1.5px rgba(192, 48, 40, 0.7);
}

.panel {
  position: relative;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-radius: 12px;
  background: var(--c-card);
  box-shadow: var(--shadow-soft);
  border: 1px solid var(--c-line);
  overflow: hidden;
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
  background: var(--c-line);
}

.panel-index {
  min-width: 22px;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: #0c6b52;
}

.is-alarm .panel-index {
  color: #c03028;
}

.panel-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: #1a211e;
  white-space: nowrap;
}

.panel-sub {
  font-size: 10px;
  color: #a3b2ab;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  white-space: nowrap;
}

.panel-body {
  position: relative;
  flex: 1 1 auto;
}
</style>
