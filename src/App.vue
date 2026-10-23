<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import { startEnergyLoop, stopEnergyLoop } from '@/composables/useEnergy';

onMounted(startEnergyLoop);
onBeforeUnmount(stopEnergyLoop);
</script>

<template>
  <router-view />
</template>
