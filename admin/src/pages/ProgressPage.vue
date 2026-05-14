<template>
  <div>
    <h1>Wiedergabe-Fortschritt</h1>

    <div class="tabs">
      <button :class="{ active: tab === 'progress' }" @click="tab = 'progress'">Fortschritt</button>
      <button :class="{ active: tab === 'devices' }" @click="tab = 'devices'">Geräte</button>
    </div>

    <div v-if="loading" class="loading">Lade...</div>

    <table v-if="!loading && tab === 'progress'" class="data-table">
      <thead>
        <tr>
          <th>Episode</th>
          <th>Serie</th>
          <th>Status</th>
          <th>Position</th>
          <th>Zuletzt</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in progressItems" :key="item.episodeId">
          <td>{{ item.episodeId }}</td>
          <td>{{ item.seriesId }}</td>
          <td><span class="badge" :class="item.status">{{ item.status }}</span></td>
          <td>{{ formatMs(item.offsetMs) }}</td>
          <td>{{ formatDate(item.lastPlayed) }}</td>
        </tr>
      </tbody>
    </table>

    <table v-if="!loading && tab === 'devices'" class="data-table">
      <thead>
        <tr>
          <th>Gerät</th>
          <th>Episode</th>
          <th>Serie</th>
          <th>Position</th>
          <th>Zuletzt aktiv</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in deviceItems" :key="item.deviceId">
          <td class="truncate">{{ shortId(item.deviceId) }}</td>
          <td>{{ item.episodeId }}</td>
          <td>{{ item.seriesId }}</td>
          <td>{{ formatMs(item.offsetMs) }}</td>
          <td>{{ formatDate(item.lastActive) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { fetchProgress, fetchDevices } from '../api';

const tab = ref('progress');
const loading = ref(true);
const progressItems = ref<any[]>([]);
const deviceItems = ref<any[]>([]);

onMounted(async () => {
  const [p, d] = await Promise.all([fetchProgress(), fetchDevices()]);
  progressItems.value = p.items.sort((a: any, b: any) => (b.lastPlayed || '').localeCompare(a.lastPlayed || ''));
  deviceItems.value = d.items.sort((a: any, b: any) => (b.lastActive || '').localeCompare(a.lastActive || ''));
  loading.value = false;
});

function formatMs(ms: number): string {
  if (!ms) return '0:00';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function shortId(id: string): string {
  if (!id) return '-';
  return '...' + id.slice(-8);
}
</script>

<style scoped>
h1 { margin-bottom: 1rem; font-size: 1.5rem; }
.tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
.tabs button {
  padding: 0.5rem 1rem; border: 1px solid #333; border-radius: 6px;
  background: transparent; color: #ccc; cursor: pointer;
}
.tabs button.active { background: #0f3460; border-color: #0f3460; color: #fff; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th { text-align: left; padding: 0.5rem; border-bottom: 1px solid #333; color: #999; font-size: 0.8rem; }
.data-table td { padding: 0.5rem; border-bottom: 1px solid #222; font-size: 0.9rem; }
.badge { padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.8rem; }
.badge.playing { background: #1b4332; color: #95d5b2; }
.badge.played { background: #333; color: #999; }
.truncate { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.loading { text-align: center; padding: 3rem; color: #999; }
</style>
