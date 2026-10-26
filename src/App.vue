<script setup lang="ts">
import { onBeforeUnmount } from 'vue';
import { stopEnergyLoop } from '@/composables/useEnergy';

onBeforeUnmount(stopEnergyLoop);
</script>

<template>
  <router-view />
</template>
