<script setup lang="ts">
import { ref } from 'vue';
import { useScreenScale } from '@/composables/useScreenScale';
import type { MeterId } from '@/core/types';
import ScreenHeader from '@/components/ScreenHeader.vue';
import KpiBar from '@/components/KpiBar.vue';
import MeterBoard from '@/components/MeterBoard.vue';
import EnergyTopology from '@/components/EnergyTopology.vue';
import AlarmTicker from '@/components/AlarmTicker.vue';
import PcsPanel from '@/components/PcsPanel.vue';
import PackSocPanel from '@/components/PackSocPanel.vue';
import AlarmOverlay from '@/components/AlarmOverlay.vue';

const { screenRef, screenStyle, frameStyle } = useScreenScale(1920);
const selected = ref<MeterId>('grid');
</script>

<template>
  <div class="viewport">
    <div class="frame" :style="frameStyle">
      <div ref="screenRef" class="screen" :style="screenStyle">
        <div class="bg" />
        <ScreenHeader />
        <main class="stage">
          <KpiBar />
          <div class="board">
            <MeterBoard class="g-meters" v-model:selected="selected" />
            <EnergyTopology class="g-flow" />
            <PcsPanel class="g-pcs" />
            <AlarmTicker class="g-alarm" />
            <PackSocPanel class="g-soc" />
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
  overflow: hidden;
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
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--c-bg);
}

.screen::before {
  content: '';
  position: absolute;
  inset: 8px;
  border: 1px solid rgba(80, 190, 255, 0.35);
  box-shadow: inset 0 0 40px rgba(10, 80, 160, 0.25), 0 0 24px rgba(20, 120, 210, 0.15);
  pointer-events: none;
  z-index: 4;
}

.bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(rgba(58, 160, 220, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(58, 160, 220, 0.05) 1px, transparent 1px),
    radial-gradient(ellipse 70% 42% at 50% 0%, rgba(20, 110, 190, 0.38), transparent 62%),
    radial-gradient(ellipse 40% 30% at 50% 100%, rgba(0, 70, 140, 0.28), transparent 70%),
    linear-gradient(180deg, #06203a, #03101c 42%, #020814);
  background-size: 48px 48px, 48px 48px, auto, auto, auto;
}

main,
:deep(header) {
  position: relative;
}

.stage {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 16px 12px;
  min-height: 0;
}

.board {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  grid-template-rows: minmax(0, 1.55fr) minmax(0, 0.72fr);
  grid-template-areas:
    "meters flow flow pcs"
    "alarm alarm soc soc";
  gap: 12px;
}

.g-meters { grid-area: meters; }
.g-flow { grid-area: flow; }
.g-pcs { grid-area: pcs; }
.g-alarm { grid-area: alarm; }
.g-soc { grid-area: soc; }

.board :deep(.shell),
.board :deep(.panel),
.board :deep(.panel-body) {
  height: 100%;
  min-height: 0;
}

.board :deep(.panel) {
  display: flex;
  flex-direction: column;
}

.board :deep(.panel-body) {
  flex: 1;
  overflow: hidden;
}

.g-flow :deep(.panel-body) {
  display: flex;
  flex-direction: column;
}

.g-flow :deep(.panel-body > *) {
  flex: 1 1 auto;
  min-height: 0;
}

.g-alarm :deep(.panel-body) {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
