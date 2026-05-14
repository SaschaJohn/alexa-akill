import { createRouter, createWebHistory } from 'vue-router';
import CatalogPage from './pages/CatalogPage.vue';
import SeriesDetailPage from './pages/SeriesDetailPage.vue';
import ProgressPage from './pages/ProgressPage.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: CatalogPage },
    { path: '/series/:id', component: SeriesDetailPage, props: true },
    { path: '/progress', component: ProgressPage },
  ],
});
