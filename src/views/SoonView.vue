<script setup lang="ts">
defineProps<{ note: string }>();
</script>

<template>
  <section class="soon">
    <h2>{{ note }}</h2>
    <p>这一页后续再做，菜单先留在这里。</p>
  </section>
</template>

<style scoped>
.soon {
  height: 100%;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 8px;
  color: #9fd0e6;
}

h2 {
  margin: 0;
  font-size: 28px;
  letter-spacing: 0.16em;
  color: #e7f6ff;
}

p { margin: 0; font-size: 14px; }
</style>
