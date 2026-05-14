<template>
  <div v-if="series">
    <div class="series-header">
      <div class="cover-wrapper">
        <img :src="coverUrl(series.cover)" :alt="series.title" class="series-cover" />
        <CoverUpload :entityId="series.id" @updated="reload" />
      </div>
      <div>
        <h1>{{ series.title }}</h1>
        <p class="subtitle">{{ series.episodes.length }} Folgen</p>
        <Mp3Upload :seriesFolder="series.title" @uploaded="reload" />
      </div>
    </div>

    <table class="episode-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Cover</th>
          <th>Titel</th>
          <th>Datei</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <EpisodeRow
          v-for="ep in series.episodes" :key="ep.id"
          :episode="ep" :s3Base="s3Base" :seriesCover="series.cover"
          @updated="reload"
        />
      </tbody>
    </table>
  </div>
  <div v-else class="loading">Lade...</div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { fetchCatalog } from '../api';
import EpisodeRow from '../components/EpisodeRow.vue';
import CoverUpload from '../components/CoverUpload.vue';
import Mp3Upload from '../components/Mp3Upload.vue';

const props = defineProps<{ id: string }>();
const route = useRoute();
const series = ref<any>(null);
const s3Base = ref('');

async function reload() {
  const data = await fetchCatalog();
  s3Base.value = data.s3BaseUrl;
  series.value = data.series.find((s: any) => s.id === (route.params.id || props.id));
}

onMounted(reload);
watch(() => route.params.id, reload);

function coverUrl(key: string) {
  return `${s3Base.value}/${key}`;
}
</script>

<style scoped>
.series-header { display: flex; gap: 2rem; margin-bottom: 2rem; align-items: flex-start; }
.cover-wrapper { position: relative; width: 200px; flex-shrink: 0; }
.series-cover { width: 200px; height: 200px; object-fit: cover; border-radius: 12px; }
h1 { font-size: 1.75rem; margin-bottom: 0.25rem; }
.subtitle { color: #999; margin-bottom: 1rem; }
.episode-table { width: 100%; border-collapse: collapse; }
.episode-table th { text-align: left; padding: 0.5rem; border-bottom: 1px solid #333; color: #999; font-size: 0.8rem; }
.loading { text-align: center; padding: 3rem; color: #999; }
</style>
