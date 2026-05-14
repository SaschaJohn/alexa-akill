<template>
  <div class="mp3-upload">
    <label class="upload-btn btn">
      <input type="file" accept=".mp3" @change="onFile" hidden :disabled="uploading" />
      {{ uploading ? `${progress}%` : 'MP3 hochladen' }}
    </label>
    <div v-if="uploading" class="progress-bar">
      <div class="progress-fill" :style="{ width: progress + '%' }"></div>
    </div>
    <span v-if="fileName" class="file-name">{{ fileName }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue';
import { uploadMp3, regenerateCatalog } from '../api';

const props = defineProps<{ seriesFolder: string }>();
const emit = defineEmits(['uploaded']);
const showToast = inject<(msg: string, type?: string) => void>('showToast');

const uploading = ref(false);
const progress = ref(0);
const fileName = ref('');

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  fileName.value = file.name;
  uploading.value = true;
  progress.value = 0;
  try {
    await uploadMp3(props.seriesFolder, file, (pct) => progress.value = pct);
    await regenerateCatalog();
    emit('uploaded');
    showToast?.(`${file.name} hochgeladen`);
  } catch {
    showToast?.('Upload fehlgeschlagen', 'error');
  } finally {
    uploading.value = false;
    fileName.value = '';
  }
}
</script>

<style scoped>
.mp3-upload { display: flex; align-items: center; gap: 0.75rem; }
.upload-btn { display: inline-block; }
.progress-bar { width: 120px; height: 6px; background: #333; border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; background: #e94560; transition: width 0.2s; }
.file-name { font-size: 0.8rem; color: #999; }
</style>
