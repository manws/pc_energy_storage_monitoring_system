<script setup lang="ts">
import { computed } from 'vue';

const SIZES = [20, 50, 100];

const props = defineProps<{ page: number; pages: number; size: number }>();
const emit = defineEmits<{
  (e: 'update:page', value: number): void;
  (e: 'update:size', value: number): void;
}>();

const nums = computed(() => {
  const total = Math.max(1, props.pages);
  const span = 5;
  let start = Math.max(1, props.page - 2);
  let end = Math.min(total, start + span - 1);
  start = Math.max(1, end - span + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
});

function go(n: number) {
  if (n < 1 || n > props.pages || n === props.page) return;
  emit('update:page', n);
}

function setSize(e: Event) {
  const next = Number((e.target as HTMLSelectElement).value);
  if (next === props.size) return;
  emit('update:size', next);
  emit('update:page', 1);
}
</script>

<template>
  <nav class="pager" aria-label="分页">
    <label class="size">
      每页
      <select :value="size" @change="setSize">
        <option v-for="n in SIZES" :key="n" :value="n">{{ n }}</option>
      </select>
      条
    </label>
    <button type="button" :disabled="page <= 1" @click="go(page - 1)">上一页</button>
    <button
      v-for="n in nums"
      :key="n"
      type="button"
      :class="{ on: n === page }"
      :aria-current="n === page ? 'page' : undefined"
      @click="go(n)"
    >{{ n }}</button>
    <button type="button" :disabled="page >= pages" @click="go(page + 1)">下一页</button>
  </nav>
</template>

<style scoped>
.pager { display: flex; align-items: center; gap: 6px; }

.size {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-right: 8px;
  color: #9fd0e6;
  font-size: 13px;
}

.size select {
  height: 32px;
  padding: 0 26px 0 8px;
  border: 1px solid rgba(90, 196, 255, 0.35);
  background: rgba(6, 28, 52, 0.72) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath fill='%237ee7ff' d='M1 1l4 4 4-4'/%3E%3C/svg%3E") right 8px center no-repeat;
  color: #e7f6ff;
  font: inherit;
  appearance: none;
  cursor: pointer;
}

button {
  min-width: 32px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid rgba(90, 196, 255, 0.35);
  background: rgba(6, 28, 52, 0.55);
  color: #c5e6f5;
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}

button.on {
  color: #04101c;
  background: #3ad4ff;
  border-color: #7ee7ff;
}

button:disabled {
  opacity: 0.35;
  cursor: default;
}
</style>
