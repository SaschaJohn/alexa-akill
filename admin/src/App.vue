<template>
  <div class="app">
    <nav class="navbar">
      <router-link to="/" class="brand">Hörspiel Admin</router-link>
      <div class="nav-links">
        <router-link to="/">Katalog</router-link>
        <router-link to="/progress">Fortschritt</router-link>
      </div>
      <button class="btn btn-sm" @click="regen" :disabled="regenerating">
        {{ regenerating ? 'Scanne...' : 'Katalog neu generieren' }}
      </button>
    </nav>
    <main class="content">
      <router-view :key="regenKey" />
    </main>
    <div v-if="toast" class="toast" :class="toast.type">{{ toast.msg }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, provide } from 'vue';
import { regenerateCatalog } from './api';

const regenerating = ref(false);
const regenKey = ref(0);
const toast = ref<{ msg: string; type: string } | null>(null);

function showToast(msg: string, type = 'success') {
  toast.value = { msg, type };
  setTimeout(() => toast.value = null, 3000);
}

provide('showToast', showToast);
provide('regenKey', regenKey);

async function regen() {
  if (!confirm('Katalog neu generieren? Manuelle Titel-Änderungen werden überschrieben.')) return;
  regenerating.value = true;
  try {
    await regenerateCatalog();
    regenKey.value++;
    showToast('Katalog neu generiert');
  } catch {
    showToast('Fehler beim Regenerieren', 'error');
  } finally {
    regenerating.value = false;
  }
}
</script>

<style>
.app { min-height: 100vh; }
.navbar {
  display: flex; align-items: center; gap: 1.5rem;
  padding: 0.75rem 1.5rem; background: #16213e; border-bottom: 1px solid #0f3460;
}
.brand { font-weight: 700; font-size: 1.2rem; color: #e94560 !important; text-decoration: none !important; }
.nav-links { display: flex; gap: 1rem; flex: 1; }
.nav-links a { padding: 0.25rem 0.5rem; border-radius: 4px; }
.nav-links a.router-link-exact-active { background: #0f3460; color: #fff; }
.content { max-width: 1200px; margin: 0 auto; padding: 1.5rem; }
.btn {
  padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer;
  background: #e94560; color: #fff; font-size: 0.875rem; font-weight: 500;
}
.btn:hover { background: #c73e54; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-sm { padding: 0.375rem 0.75rem; font-size: 0.8rem; }
.toast {
  position: fixed; bottom: 1.5rem; right: 1.5rem; padding: 0.75rem 1.25rem;
  border-radius: 8px; background: #1b4332; color: #d8f3dc; font-size: 0.9rem;
  animation: slideIn 0.2s ease;
}
.toast.error { background: #641220; color: #fcd5ce; }
@keyframes slideIn { from { transform: translateY(1rem); opacity: 0; } }
</style>
