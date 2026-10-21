import { onBeforeUnmount, onMounted, shallowRef, type Ref } from 'vue';
import { echarts } from '@/core/echarts';

type ECharts = ReturnType<typeof echarts.init>;

export function useChart(el: Ref<HTMLElement | null>, onReady: (chart: ECharts) => void) {
  const chart = shallowRef<ECharts | null>(null);
  let ro: ResizeObserver | null = null;
  let raf = 0;

  onMounted(() => {
    if (!el.value) return;
    const c = echarts.init(el.value, undefined, { renderer: 'canvas', devicePixelRatio: Math.min(2, window.devicePixelRatio || 1) });
    chart.value = c;
    onReady(c);
    ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => c.resize());
    });
    ro.observe(el.value);
  });

  onBeforeUnmount(() => {
    cancelAnimationFrame(raf);
    ro?.disconnect();
    chart.value?.dispose();
    chart.value = null;
  });

  return chart;
}
