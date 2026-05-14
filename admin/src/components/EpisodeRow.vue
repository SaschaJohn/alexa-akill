<template>
  <tr class="episode-row">
    <td class="ep-num">{{ episode.number }}</td>
    <td>
      <img :src="coverSrc" class="ep-cover" />
    </td>
    <td class="ep-title">
      <template v-if="editing">
        <input
          v-model="editTitle"
          @keyup.enter="save"
          @keyup.escape="cancel"
          @blur="save"
          ref="inputEl"
          class="title-input"
        />
      </template>
      <template v-else>
        <span @click="startEdit" class="editable">{{ episode.title }}</span>
      </template>
    </td>
    <td class="ep-file">{{ episode.file.split('/').pop() }}</td>
    <td>
      <CoverUpload :entityId="episode.id" @updated="$emit('updated')" />
    </td>
  </tr>
</template>

<script setup lang="ts">
import { ref, nextTick, computed, inject } from 'vue';
import { updateEpisodeTitle } from '../api';
import CoverUpload from './CoverUpload.vue';

const props = defineProps<{
  episode: any;
  s3Base: string;
  seriesCover: string;
}>();

const emit = defineEmits(['updated']);
const showToast = inject<(msg: string, type?: string) => void>('showToast');

const editing = ref(false);
const editTitle = ref('');
const inputEl = ref<HTMLInputElement | null>(null);

const coverSrc = computed(() => {
  const key = props.episode.cover || props.seriesCover;
  return `${props.s3Base}/${key}`;
});

function startEdit() {
  editTitle.value = props.episode.title;
  editing.value = true;
  nextTick(() => inputEl.value?.focus());
}

async function save() {
  if (!editing.value) return;
  editing.value = false;
  if (editTitle.value === props.episode.title) return;
  try {
    await updateEpisodeTitle(props.episode.id, editTitle.value);
    emit('updated');
    showToast?.('Titel gespeichert');
  } catch {
    showToast?.('Fehler beim Speichern', 'error');
  }
}

function cancel() {
  editing.value = false;
}
</script>

<style scoped>
.episode-row td { padding: 0.5rem; border-bottom: 1px solid #222; vertical-align: middle; }
.ep-num { width: 3rem; color: #999; font-weight: 600; }
.ep-cover { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; }
.ep-file { color: #666; font-size: 0.8rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.editable { cursor: pointer; border-bottom: 1px dashed #555; }
.editable:hover { color: #7b8cde; }
.title-input {
  background: #0f3460; border: 1px solid #7b8cde; color: #eee;
  padding: 0.25rem 0.5rem; border-radius: 4px; width: 100%; font-size: 0.9rem;
}
</style>
