<template>
  <div class="page" data-component="MainLayout">
    <AppHeader variant="private" />

    <main class="app-shell" data-component="AppShell">
      <AppSidebar />

      <!-- Contenido principal de eventos -->
      <section class="app-main container" data-component="EventsContent">
        <!-- Título y chips de filtro -->
        <div class="row" style="justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap;" data-component="SectionHeader">
          <h1 class="h2" style="margin:0;" data-part="title">Eventos</h1>
          <div class="row" style="gap:8px; flex-wrap:wrap;" data-part="chips">
            <button class="chip todos" :class="{ active: when === 'today' }" type="button" @click="setWhen('today')">Hoy</button>
            <button class="chip favoritos" :class="{ active: when === 'week' }" type="button" @click="setWhen('week')">Esta semana</button>
            <button class="chip videos" :class="{ active: when === 'upcoming' }" type="button" @click="setWhen('upcoming')">Próximos</button>
            <button class="chip albumnes" :class="{ active: when === 'past' }" type="button" @click="setWhen('past')">Pasados</button>
            <router-link class="btn" to="/events/create" data-part="create">➕ Crear evento</router-link>
          </div>
        </div>

        <!-- Barra de herramientas -->
        <div class="row" style="gap:10px; margin-top:10px; flex-wrap:wrap;" data-component="Toolbar">
          <div class="input" style="flex:1; min-width:220px;" data-part="search">
            <label class="visually-hidden" for="q">Buscar eventos</label>
            <input id="q" type="search" placeholder="Buscar por nombre, lugar o fecha… 🔍" v-model="q" />
          </div>
          <button class="btn ghost" type="button" style="color: white;" @click="toggleSort">{{ sortLabel }}</button>
          <button class="btn ghost" type="button" style="color: white;" @click="toggleSelect">✅ Seleccionar</button>
          <button class="btn ghost" type="button" style="color: white;" @click="toggleManage">⚙️ Gestionar eventos</button>
          <button class="btn ghost" type="button" style="color: white;" disabled>🎟️ Mis invitaciones</button>
          <button class="btn ghost" type="button" style="color: white;" :disabled="selectedIds.size === 0" @click="deleteSelected">🗑️ Eliminar</button>
        </div>

        <!-- Grid de eventos -->
        <section class="events-grid" data-component="EventsGrid" aria-label="Listado de eventos">
          <p v-if="loading" class="p">Cargando eventos…</p>
          <p v-else-if="events.length === 0" class="p">No hay eventos que coincidan.</p>
          <template v-else>
            <article v-for="ev in events" :key="ev.id" class="card event-card" data-component="EventCard" :data-id="ev.id" style="position:relative;">
              <input v-if="selecting" class="sel" type="checkbox" :checked="selectedIds.has(ev.id)" @change="toggleSelected(ev.id)" style="position:absolute; left:8px; top:8px; width:18px; height:18px; z-index: 5;" />
              <router-link class="event-cover" :to="`/events/${ev.id}`" :aria-label="`Ver evento: ${ev.title}`" data-part="cover">
                <img :src="coverUrl(ev)" :alt="ev.title" loading="lazy" data-part="image" />
              </router-link>
              <div class="pad" data-part="body">
                <div class="row" style="justify-content:space-between; align-items:center;" data-part="header">
                  <h2 class="h4" style="margin:0;" data-part="name">
                    <router-link class="link" :to="`/events/${ev.id}`">{{ ev.title || 'Evento' }}</router-link>
                  </h2>
                  <span class="badge soft" data-part="date">{{ formatDate(ev.date) }}</span>
                </div>
                <p class="p" style="opacity:.9; margin:6px 0 8px;" data-part="subtitle">{{ ev.location }}</p>
              </div>
            </article>
          </template>
        </section>

        <!-- Paginador -->
        <div class="row" id="events-pager" style="gap:8px; justify-content:center; margin:12px 0;">
          <button class="btn ghost" style="color: white;" :disabled="page <= 1" @click="prevPage">‹ Anteriores</button>
          <span class="p">Página {{ page }} / {{ totalPages }}</span>
          <button class="btn ghost" style="color: white;" :disabled="page >= totalPages" @click="nextPage">Siguientes ›</button>
        </div>
      </section>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import AppHeader from '../components/AppHeader.vue';
import AppSidebar from '../components/AppSidebar.vue';
import AppFooter from '../components/AppFooter.vue';

import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useEventsStore } from '../stores/events.js';
import { useAuthStore } from '../stores/auth.js';
import { pb } from '../services/pb.js';

const router = useRouter();
const eventsStore = useEventsStore();
const authStore = useAuthStore();

// Reactive state for filters and pagination
const page = ref(1);
const perPage = 8;
const q = ref('');
const when = ref('upcoming');
// true => '-date,-created'; false => 'date,created'
const sortDesc = ref(true);
const managing = ref(false);
const selecting = ref(false);
const selectedIds = ref(new Set());

// Helper to escape quotes in filters
const esc = (str = '') => String(str).replace(/"/g, '\\"');

const sortLabel = computed(() => sortDesc.value ? '↕ Ordenar (próximos)' : '↕ Ordenar (antiguos)');

// Derived data
const events = computed(() => eventsStore.events);
const loading = computed(() => eventsStore.loading);
const totalPages = computed(() => eventsStore.totalPages || 1);

// Avatar and initials for current user
const avatarUrl = computed(() => {
  const user = authStore.user;
  if (user && user.avatar) {
    return pb.files.getUrl(user, user.avatar, { token: authStore.token, thumb: '100x100' });
  }
  return null;
});
const userInitials = computed(() => {
  const user = authStore.user;
  if (!user) return '?';
  const name = user.name || user.username || '';
  return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
});

// Load events whenever relevant state changes
async function loadEvents() {
  const filterParts = [];
  // When filter
  const now = new Date();
  const toISO = (d) => new Date(d).toISOString();
  switch (when.value) {
    case 'today': {
      const start = new Date(now); start.setHours(0, 0, 0, 0);
      const end = new Date(now); end.setHours(23, 59, 59, 999);
      filterParts.push(`(date >= "${toISO(start)}" && date <= "${toISO(end)}")`);
      break;
    }
    case 'week': {
      const weekTo = new Date(now); weekTo.setDate(weekTo.getDate() + 7);
      filterParts.push(`(date >= "${toISO(now)}" && date < "${toISO(weekTo)}")`);
      break;
    }
    case 'upcoming': {
      filterParts.push(`(date >= "${toISO(now)}")`);
      break;
    }
    case 'past': {
      filterParts.push(`(date < "${toISO(now)}")`);
      break;
    }
  }
  // Search filter
  if (q.value) {
    const term = esc(q.value.trim());
    filterParts.push(`(title ~ "${term}" || description ~ "${term}" || location ~ "${term}")`);
  }
  // Managing filter: only user's events
  if (managing.value && authStore.user?.id) {
    filterParts.push(`(user = "${authStore.user.id}")`);
  }
  const filter = filterParts.join(' && ');
  const sort = sortDesc.value ? '-date,-created' : 'date,created';
  await eventsStore.fetchEvents(page.value, perPage, { sort, filter });
}

// Initial load
onMounted(() => {
  loadEvents();
});

// Watchers to reload when filters change
watch([page, q, when, sortDesc, managing], () => {
  loadEvents();
});

// Methods to update UI state
function setWhen(value) {
  when.value = value;
  page.value = 1;
}
function toggleSort() {
  sortDesc.value = !sortDesc.value;
  page.value = 1;
}
function toggleSelect() {
  selecting.value = !selecting.value;
  selectedIds.value.clear();
}
function toggleManage() {
  managing.value = !managing.value;
  page.value = 1;
}
function toggleSelected(id) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id);
  } else {
    selectedIds.value.add(id);
  }
  // Reassign to trigger reactivity
  selectedIds.value = new Set(selectedIds.value);
}
async function deleteSelected() {
  if (selectedIds.value.size === 0) return;
  if (!confirm(`¿Seguro que quieres eliminar ${selectedIds.value.size} evento(s)?`)) return;
  for (const id of selectedIds.value) {
    await eventsStore.deleteEvent(id);
  }
  selectedIds.value.clear();
  selecting.value = false;
  loadEvents();
}
function formatDate(isoStr) {
  return isoStr ? new Date(isoStr).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }) : 'Sin fecha';
}
function coverUrl(ev) {
  return ev.cover ? pb.files.getUrl(ev, ev.cover, '300x200') : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" />';
}
function prevPage() {
  if (page.value > 1) {
    page.value--;
  }
}
function nextPage() {
  if (page.value < totalPages.value) {
    page.value++;
  }
}
function logout() {
  authStore.logout();
  router.push('/login');
}
</script>
