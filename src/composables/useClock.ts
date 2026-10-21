import { onBeforeUnmount, onMounted, ref } from 'vue';
import { pad } from '@/core/utils';

const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

export function useClock() {
  const time = ref('--:--:--');
  const date = ref('');
  let timer: number | undefined;

  const tick = () => {
    const d = new Date();
    time.value = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    date.value = `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} 星期${WEEK[d.getDay()]}`;
  };

  onMounted(() => {
    tick();
    timer = window.setInterval(tick, 1000);
  });
  onBeforeUnmount(() => window.clearInterval(timer));

  return { time, date };
}
