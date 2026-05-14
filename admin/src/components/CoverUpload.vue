<template>
  <label class="cover-upload" :class="{ uploading }">
    <input type="file" accept="image/*" @change="onFile" hidden />
    <span v-if="uploading">...</span>
    <span v-else class="upload-icon">&#x1F4F7;</span>
  </label>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue';
import { uploadCover } from '../api';

const props = defineProps<{ entityId: string }>();
const emit = defineEmits(['updated']);
const showToast = inject<(msg: string, type?: string) => void>('showToast');

const uploading = ref(false);

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  uploading.value = true;
  try {
    await uploadCover(props.entityId, file);
    emit('updated');
    showToast?.('Cover hochgeladen');
  } catch {
    showToast?.('Cover-Upload fehlgeschlagen', 'error');
  } finally {
    uploading.value = false;
  }
}
</script>

<style scoped>
.cover-upload {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 6px; cursor: pointer;
  background: #0f3460; font-size: 0.9rem; transition: background 0.15s;
}
.cover-upload:hover { background: #1a4a8a; }
.cover-upload.uploading { opacity: 0.5; pointer-events: none; }
.upload-icon { filter: grayscale(1); }
</style>
