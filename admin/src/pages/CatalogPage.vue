<template>
  <div>
    <h1>Serien</h1>
    <div v-if="loading" class="loading">Lade Katalog...</div>
    <div v-else class="series-grid">
      <router-link
        v-for="s in catalog?.series" :key="s.id"
        :to="`/series/${s.id}`"
        class="series-card"
      >
        <img :src="coverUrl(s.cover)" :alt="s.title" class="series-cover" />
        <div class="series-info">
          <div class="series-title">{{ s.title }}</div>
          <div class="series-count">{{ s.episodes.length }} Folgen</div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { fetchCatalog } from '../api';

const catalog = ref<any>(null);
const loading = ref(true);
const s3Base = ref('');

onMounted(async () => {
  const data = await fetchCatalog();
  catalog.value = data;
  s3Base.value = data.s3BaseUrl;
  loading.value = false;
});

function coverUrl(key: string) {
  return `${s3Base.value}/${key}`;
}
</script>

<style scoped>
h1 { margin-bottom: 1.5rem; font-size: 1.5rem; font-weight: 600; }
.series-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.5rem; }
.series-card {
  background: #16213e; border-radius: 12px; overflow: hidden;
  text-decoration: none !important; color: #eee; transition: transform 0.15s;
}
.series-card:hover { transform: translateY(-4px); }
.series-cover { width: 100%; aspect-ratio: 1; object-fit: cover; }
.series-info { padding: 0.75rem 1rem; }
.series-title { font-weight: 600; font-size: 1rem; }
.series-count { font-size: 0.85rem; color: #999; margin-top: 0.25rem; }
.loading { text-align: center; padding: 3rem; color: #999; }
</style>
