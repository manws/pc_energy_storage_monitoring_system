<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import { isNum } from '@/core/utils';

const props = withDefaults(defineProps<{ value: number; decimals?: number; duration?: number }>(), {
  decimals: 1,
  duration: 600
});

const display = ref(isNum(props.value) ? props.value : 0);
let raf = 0;

watch(
  () => props.value,
  (to) => {
    if (!isNum(to)) return;
    cancelAnimationFrame(raf);
    const from = display.value;
    if (Math.abs(to - from) < Math.pow(10, -props.decimals)) {
      display.value = to;
      return;
    }
    const start = performance.now();
    const run = (now: number) => {
      const t = Math.min(1, (now - start) / props.duration);
      const e = 1 - Math.pow(1 - t, 3);
      display.value = from + (to - from) * e;
      if (t < 1) raf = requestAnimationFrame(run);
    };
    raf = requestAnimationFrame(run);
  }
);

onBeforeUnmount(() => cancelAnimationFrame(raf));
</script>

<template>
  <span class="num">{{ isNum(value) ? display.toFixed(decimals) : '--' }}</span>
</template>
