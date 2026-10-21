import { computed, onBeforeUnmount, onMounted, ref, type Ref } from 'vue';

export function useScreenScale(designW = 1920) {
  const scale = ref(1);
  const contentH = ref(1400);
  const screenRef = ref<HTMLElement | null>(null);
  let ro: ResizeObserver | null = null;

  const measure = () => {
    scale.value = Math.min(1, window.innerWidth / designW);
    const el = screenRef.value;
    if (el) contentH.value = el.offsetHeight;
  };

  onMounted(() => {
    measure();
    window.addEventListener('resize', measure);
    ro = new ResizeObserver(measure);
    if (screenRef.value) ro.observe(screenRef.value);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', measure);
    ro?.disconnect();
  });

  const screenStyle = computed(() => ({
    width: `${designW}px`,
    transform: `scale(${scale.value})`,
    transformOrigin: 'top left'
  }));

  const frameStyle = computed(() => ({
    width: `${designW * scale.value}px`,
    height: `${contentH.value * scale.value}px`
  }));

  return { screenRef: screenRef as Ref<HTMLElement | null>, screenStyle, frameStyle };
}
