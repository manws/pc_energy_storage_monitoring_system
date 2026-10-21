<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { startEnergyLoop, stopEnergyLoop } from '@/composables/useEnergy';
import { useScreenScale } from '@/composables/useScreenScale';
import type { MeterId } from '@/core/types';
import ScreenHeader from './components/ScreenHeader.vue';
import KpiBar from './components/KpiBar.vue';
import MeterList from './components/MeterList.vue';
import MeterDetail from './components/MeterDetail.vue';
import BackflowGuard from './components/BackflowGuard.vue';
import EnergyTopology from './components/EnergyTopology.vue';
import PsTrendChart from './components/PsTrendChart.vue';
import AlarmTicker from './components/AlarmTicker.vue';
import PcsPanel from './components/PcsPanel.vue';
import BmsPanel from './components/BmsPanel.vue';
import AlarmOverlay from './components/AlarmOverlay.vue';

const { screenRef, screenStyle, frameStyle } = useScreenScale(1920);
const selected = ref<MeterId>('grid');

onMounted(startEnergyLoop);
onBeforeUnmount(stopEnergyLoop);
</script>

<template>
  <div class="viewport">
    <div class="frame" :style="frameStyle">
      <div ref="screenRef" class="screen" :style="screenStyle">
        <div class="bg" />
        <ScreenHeader />
        <main class="flex flex-col gap-3 px-4 pb-2">
          <KpiBar />
          <div class="board">
            <MeterList class="g-meters" v-model:selected="selected" />
            <EnergyTopology class="g-flow" />
            <PcsPanel class="g-pcs" />
            <MeterDetail class="g-detail" v-model:selected="selected" />
            <PsTrendChart class="g-trend" />
            <BackflowGuard class="g-guard" />
            <AlarmTicker class="g-alarm" />
            <BmsPanel class="g-bms" />
          </div>
        </main>
        <AlarmOverlay />
      </div>
    </div>
  </div>
</template>

<style scoped>
.viewport {
  position: fixed;
  inset: 0;
  overflow: auto;
  background: var(--c-bg);
}

.frame {
  position: relative;
  margin: 0 auto;
}

.screen {
  position: absolute;
  left: 0;
  top: 0;
  background: var(--c-bg);
}

.screen::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #0c6b52;
  z-index: 5;
}

.bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(180deg, rgba(255, 252, 247, 0.7), transparent 220px),
    radial-gradient(ellipse 36% 28% at 0% 0%, rgba(12, 107, 82, 0.07), transparent 70%),
    radial-gradient(ellipse 28% 24% at 100% 100%, rgba(168, 132, 78, 0.06), transparent 70%);
}

main,
:deep(header) {
  position: relative;
}

.board {
  display: grid;
  grid-template-columns: 452px minmax(0, 1fr) 470px;
  grid-template-areas:
    "meters flow pcs"
    "detail trend pcs"
    "guard alarm bms";
  gap: 12px;
  align-items: stretch;
}

.g-meters { grid-area: meters; }
.g-flow { grid-area: flow; }
.g-pcs { grid-area: pcs; }
.g-detail { grid-area: detail; }
.g-trend { grid-area: trend; }
.g-guard { grid-area: guard; }
.g-alarm { grid-area: alarm; }

.board :deep(.shell.g-alarm) {
  min-height: 0;
}

.board :deep(.shell.g-alarm > .panel) {
  position: absolute;
  inset: 0;
  height: auto;
}
.g-bms { grid-area: bms; }

.board :deep(.shell) {
  height: 100%;
}

.board :deep(.panel) {
  height: 100%;
}

.g-flow :deep(.panel-body),
.g-trend :deep(.panel-body) {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.g-flow :deep(.panel-body > *),
.g-trend :deep(.panel-body > *) {
  flex: 1 1 auto;
  min-height: 260px;
}

.g-alarm :deep(.panel-body) {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.g-guard :deep(.panel-body),
.g-detail :deep(.panel-body) {
  display: flex;
  flex-direction: column;
}

.g-guard :deep(.panel-body > *),
.g-detail :deep(.panel-body > *) {
  flex: 1 1 auto;
  min-height: 0;
}

</style>
