<template>
  <el-switch
    v-model="soundEnabled"
    active-text="音效"
    @change="toggleSound"
    style="--el-switch-on-color: #67C23A"
  />
</template>

<script setup>
import { ref } from 'vue';
import SoundEffects from '@/utils/soundEffects';

const soundEnabled = ref(SoundEffects.enabled);

const toggleSound = (value) => {
  SoundEffects.toggle(value);
  if (value) {
    SoundEffects.playSuccess();
  }
};
</script>

<style scoped>
</style>
