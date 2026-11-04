<script setup lang="ts">
import { computed } from 'vue';
import { useEnergy } from '@/composables/useEnergy';
import { fmt, isFaultStatus, isWorkingStatus } from '@/core/utils';
import BasePanel from './base/BasePanel.vue';

const RANGE = 300;
const { state } = useEnergy();

const channels = computed(() => state.value.pcs.map((ch, i) => {
  const power = ch.power;
  const step = ch.step || '';
  return {
    no: ch.no,
    workspace: ch.workspace || '--',
    channelText: ch.channelId ? `${ch.no}[${ch.channelId}]` : String(ch.no),
    accent: i === 0 ? '#3ad4ff' : '#7dffc3',
    power,
    status: ch.status,
    step,
    voltage: ch.voltage,
    current: ch.current,
    height: Math.min(100, (Math.abs(power) / RANGE) * 100),
    up: power >= 0,
    modeCls: step.includes('放电') ? 'dis' : step.includes('充电') ? 'chg' : step.includes('限功率') ? 'limit' : 'rest',
    statusCls: isFaultStatus(ch.status) ? 'bad' : isWorkingStatus(ch.status) ? 'ok' : ''
  };
}));

const anyFault = computed(() => state.value.pcs.some((c) => isFaultStatus(c.status)));
</script>

<template>
  <BasePanel title="储能设备运行" sub="量程 300 kW · 单通道量程 300 kW" index="03" :alarm="anyFault">
    <div class="pcs">
      <article v-for="ch in channels" :key="ch.no" class="card" :class="{ bad: ch.statusCls === 'bad' }" :style="{ '--accent': ch.accent }">
        <div class="main">
          <div class="rail">
            <p class="mark">
              <em>工作单元</em>
              <strong>{{ ch.workspace }}</strong>
            </p>
            <i class="sep" />
            <p class="mark channel">
              <em>通道</em>
              <strong class="num">{{ ch.channelText }}</strong>
            </p>
            <span class="st" :class="ch.statusCls">{{ ch.status }}</span>
          </div>
          <div class="power">
            <span class="num">{{ fmt(ch.power, 2) }}</span>
            <span>kW</span>
          </div>
          <div class="meta">{{ fmt(ch.voltage, 1) }} V · {{ fmt(ch.current, 1) }} A</div>
          <div class="mode" :class="ch.modeCls">{{ ch.step }}</div>
        </div>
        <div class="gauge">
          <span>300</span>
          <div class="track">
            <i :style="{ height: `${ch.height}%` }" :class="ch.up ? 'up' : 'down'" />
          </div>
          <span>0</span>
        </div>
      </article>
    </div>
  </BasePanel>
</template>

<style scoped>
.pcs {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
}

.card {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 12px;
  padding: 12px;
  border: 1px solid rgba(90, 196, 255, 0.28);
  background: rgba(8, 36, 64, 0.55);
}

.card.bad { border-color: rgba(255, 107, 107, 0.7); }
.main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.rail {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.mark {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 0;
  min-width: 0;
}
.mark em {
  flex: none;
  font-style: normal;
  font-size: 12px;
  letter-spacing: 0.12em;
  color: #7eb4cc;
}
.mark strong {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
  white-space: nowrap;
}
.mark.channel { flex: none; }
.mark.channel strong {
  font-size: 22px;
  line-height: 1;
  color: var(--accent, #3ad4ff);
}
.sep { flex: none; width: 1px; height: 14px; background: rgba(90, 196, 255, 0.4); }
.power { display: flex; align-items: baseline; justify-content: space-between; }
.st { margin-left: auto; flex: none; font-size: 13px; }
.st.ok { color: #2ee59a; }
.st.bad, .bad { color: #ff8a8a; }
.power { margin-top: 8px; }
.power .num { font-size: 28px; line-height: 1; }
.meta { margin-top: 4px; color: #7eb4cc; font-size: 12px; }
.mode {
  align-self: flex-start;
  margin-top: 10px;
  padding: 3px 10px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.06em;
  border: 1px solid currentColor;
  background: color-mix(in srgb, currentColor 14%, transparent);
}
.mode.chg { color: #7dffc3; }
.mode.dis { color: #8aecff; }
.mode.limit { color: #ffd27a; }
.mode.rest { color: #d5e8f2; }

.gauge {
  width: 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #7eb4cc;
  font-size: 11px;
}

.track {
  flex: 1;
  width: 14px;
  border: 1px solid rgba(90, 196, 255, 0.35);
  background: rgba(4, 16, 28, 0.65);
  display: flex;
  align-items: flex-end;
}

.track i { width: 100%; }
.track i.up { background: linear-gradient(180deg, #7dffc3, #1ed98a); }
.track i.down { background: linear-gradient(180deg, #7ee7ff, #1494d6); }
</style>
