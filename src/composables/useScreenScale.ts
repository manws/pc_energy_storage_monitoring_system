import { computed, onBeforeUnmount, onMounted, ref, type Ref } from 'vue';

export function useScreenScale(designW = 1920) {
  const scale = ref(1);
  const fillH = ref(1080);
  const screenRef = ref<HTMLElement | null>(null);

  const measure = () => {
    const next = window.innerWidth / designW;
    scale.value = next;
    fillH.value = Math.max(1, Math.round(window.innerHeight / next));
  };

  onMounted(() => {
    measure();
    window.addEventListener('resize', measure);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', measure);
  });

  const screenStyle = computed(() => ({
    width: `${designW}px`,
    height: `${fillH.value}px`,
    transform: `scale(${scale.value})`,
    transformOrigin: 'top left'
  }));

  const frameStyle = computed(() => ({
    width: `${designW * scale.value}px`,
    height: `${fillH.value * scale.value}px`
  }));

  return { screenRef: screenRef as Ref<HTMLElement | null>, screenStyle, frameStyle, fillH };
}
