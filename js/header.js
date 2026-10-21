import { $, pad } from './utils.js';

const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

export function initHeader({ onSimulate }) {
  const timeEl = $('#clockTime');
  const dateEl = $('#clockDate');
  const tick = () => {
    const d = new Date();
    timeEl.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    dateEl.textContent = `${d.getFullYear()}年${pad(d.getMonth() + 1)}月${pad(d.getDate())}日 星期${WEEK[d.getDay()]}`;
  };
  tick();
  setInterval(tick, 1000);

  $('#simulateBtn').addEventListener('click', () => {
    if (typeof onSimulate === 'function') onSimulate();
  });

  const fsBtn = $('#fullscreenBtn');
  fsBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  });
  document.addEventListener('fullscreenchange', () => {
    fsBtn.innerHTML = document.fullscreenElement ? '<i class="ri-fullscreen-exit-line"></i>' : '<i class="ri-fullscreen-line"></i>';
  });
}
