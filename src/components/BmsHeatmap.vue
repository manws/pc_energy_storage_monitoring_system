<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';

const props = defineProps<{
  values: number[];
  cols: number;
  maxNo: number;
  minNo: number;
  unit: string;
  decimals: number;
}>();

const wrap = ref<HTMLDivElement | null>(null);
const canvas = ref<HTMLCanvasElement | null>(null);
const tip = reactive({ show: false, x: 0, y: 0, text: '' });
let ro: ResizeObserver | null = null;
let layout = { cell: 0, gap: 2, w: 0 };

const STOPS: [number, number, number][] = [
  [232, 246, 238],
  [150, 214, 178],
  [226, 205, 120],
  [232, 146, 92],
  [220, 38, 38]
];
const heat = (t: number) => {
  const k = Math.min(1, Math.max(0, t)) * (STOPS.length - 1);
  const i = Math.min(STOPS.length - 2, Math.floor(k));
  const f = k - i;
  const a = STOPS[i];
  const b = STOPS[i + 1];
  return `rgb(${a.map((v, j) => Math.round(v + (b[j] - v) * f)).join(',')})`;
};

function draw() {
  const c = canvas.value;
  const w = wrap.value;
  const vals = props.values;
  if (!c || !w || !Array.isArray(vals) || !vals.length) return;
  const width = w.clientWidth;
  const rows = Math.ceil(vals.length / props.cols);
  const gap = 2;
  const cell = Math.max(2, (width - gap * (props.cols - 1)) / props.cols);
  const height = Math.round(rows * cell + gap * (rows - 1));
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  if (c.width !== Math.round(width * dpr) || c.height !== Math.round(height * dpr)) {
    c.width = Math.round(width * dpr);
    c.height = Math.round(height * dpr);
    c.style.width = `${width}px`;
    c.style.height = `${height}px`;
  }
  layout = { cell, gap, w: width };
  const ctx = c.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  let min = Infinity;
  let max = -Infinity;
  for (const v of vals) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const span = max - min || 1;
  for (let i = 0; i < vals.length; i++) {
    const x = (i % props.cols) * (cell + gap);
    const y = Math.floor(i / props.cols) * (cell + gap);
    ctx.fillStyle = heat((vals[i] - min) / span);
    ctx.fillRect(x, y, cell, cell);
  }
  const mark = (no: number, color: string) => {
    const i = no - 1;
    if (i < 0 || i >= vals.length) return;
    const x = (i % props.cols) * (cell + gap);
    const y = Math.floor(i / props.cols) * (cell + gap);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 1, y - 1, cell + 2, cell + 2);
  };
  mark(props.maxNo, '#e7f6ff');
  mark(props.minNo, '#2380c4');
}

function onMove(e: MouseEvent) {
  const c = canvas.value;
  if (!c || !layout.cell) return;
  const rect = c.getBoundingClientRect();
  const sx = rect.width / layout.w;
  const x = (e.clientX - rect.left) / sx;
  const y = (e.clientY - rect.top) / sx;
  const col = Math.floor(x / (layout.cell + layout.gap));
  const row = Math.floor(y / (layout.cell + layout.gap));
  const i = row * props.cols + col;
  if (col < 0 || col >= props.cols || i < 0 || i >= props.values.length) {
    tip.show = false;
    return;
  }
  tip.show = true;
  tip.x = x;
  tip.y = y;
  tip.text = `#${i + 1}  ${props.values[i].toFixed(props.decimals)}${props.unit}`;
}

watch(() => [props.values, props.cols, props.maxNo, props.minNo], draw);

onMounted(() => {
  draw();
  ro = new ResizeObserver(draw);
  if (wrap.value) ro.observe(wrap.value);
});
onBeforeUnmount(() => ro?.disconnect());
</script>

<template>
  <div ref="wrap" class="relative w-full">
    <canvas ref="canvas" class="block cursor-crosshair" @mousemove="onMove" @mouseleave="tip.show = false" />
    <div v-if="tip.show" class="tip num" :style="{ left: `${tip.x + 10}px`, top: `${tip.y - 26}px` }">{{ tip.text }}</div>
  </div>
</template>

<style scoped>
.tip {
  position: absolute;
  pointer-events: none;
  white-space: nowrap;
  font-size: 13px;
  padding: 2px 10px;
  color: #e7f6ff;
  border-radius: 4px;
  background: rgba(6, 24, 44, 0.94);
  box-shadow: 0 10px 24px -10px rgba(20, 90, 60, 0.4), inset 0 0 0 1px rgba(16, 163, 107, 0.18);
  z-index: 5;
}
</style>
