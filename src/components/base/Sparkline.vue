<script setup lang="ts">
import { computed } from 'vue';
import { sparkPath } from '@/core/utils';

const props = withDefaults(defineProps<{ values: number[]; color: string; width?: number; height?: number; zero?: boolean }>(), {
  width: 120,
  height: 32,
  zero: false
});

const gid = `sp-${Math.random().toString(36).slice(2, 9)}`;
const path = computed(() => sparkPath(props.values, props.width, props.height, props.zero));
</script>

<template>
  <svg :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`" class="block overflow-visible">
    <defs>
      <linearGradient :id="gid" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" :stop-color="color" stop-opacity="0.35" />
        <stop offset="1" :stop-color="color" stop-opacity="0" />
      </linearGradient>
    </defs>
    <line v-if="zero" x1="0" :x2="width" :y1="path.zeroY" :y2="path.zeroY" stroke="#ef4444" stroke-opacity="0.6" stroke-dasharray="3 3" />
    <path :d="path.area" :fill="`url(#${gid})`" />
    <path :d="path.line" fill="none" :stroke="color" stroke-width="1.5" stroke-linejoin="round" />
  </svg>
</template>
