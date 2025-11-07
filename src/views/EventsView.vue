<template>
  <div class="page" data-component="MainLayout">
    <!-- Header privado de la app -->
    <AppHeader variant="private" />

    <main class="app-shell" data-component="AppShell">
      <!-- Sidebar con navegación contextual -->
      <AppSidebar />

      <!-- ============================
           CONTENIDO PRINCIPAL: EVENTOS
           ============================ -->
      <section class="app-main container" data-component="EventsContent">
        <!-- Encabezado de sección: título + chips de filtro 'when' -->
        <div
          class="row"
          style="justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap;"
          data-component="SectionHeader"
        >
          <h1 class="h2" style="margin:0;" data-part="title">Eventos</h1>

          <!-- Chips de periodo: hoy / semana / próximos / pasados + CTA crear -->
          <div class="row" style="gap:8px; flex-wrap:wrap;" data-part="chips">
            <!-- Cada chip activa un valor de 'when' y resetea la página a 1 en setWhen() -->
            <button class="chip todos"      :class="{ active: when === 'today' }"    type="button" @click="setWhen('today')">Hoy</button>
            <button class="chip favoritos"  :class="{ active: when === 'week' }"     type="button" @click="setWhen('week')">Esta semana</button>
            <button class="chip videos"     :class="{ active: when === 'upcoming' }" type="button" @click="setWhen('upcoming')">Próximos</button>
            <button class="chip albumnes"   :class="{ active: when === 'past' }"     type="button" @click="setWhen('past')">Pasados</button>

            <!-- Crear evento: navega a la vista de creación -->
            <router-link class="btn" to="/events/create" data-part="create">➕ Crear evento</router-link>
          </div>
        </div>

        <!-- Barra de herramientas: búsqueda, orden, selección múltiple, gestión (solo mis eventos),
             invitaciones (placeholder), y eliminación de seleccionados -->
        <div class="row" style="gap:10px; margin-top:10px; flex-wrap:wrap;" data-component="Toolbar">
          <!-- Buscador por título / descripción / ubicación -->
          <div class="input" style="flex:1; min-width:220px;" data-part="search">
            <label class="visually-hidden" for="q">Buscar eventos</label>
            <input id="q" type="search" placeholder="Buscar por nombre, lugar o fecha… 🔍" v-model="q" />
          </div>

          <!-- Orden asc/desc por fecha (y created como desempate) -->
          <button class="btn ghost" type="button" style="color: white;" @click="toggleSort">{{ sortLabel }}</button>

          <!-- Modo selección múltiple (muestra checkboxes en tarjetas) -->
          <button class="btn ghost" type="button" style="color: white;" @click="toggleSelect">✅ Seleccionar</button>

          <!-- Modo gestión: filtra solo eventos del usuario actual -->
          <button class="btn ghost" type="button" style="color: white;" @click="toggleManage">⚙️ Gestionar eventos</button>

          <!-- Placeholder (aún sin lógica) -->
          <button class="btn ghost" type="button" style="color: white;" disabled>🎟️ Mis invitaciones</button>

          <!-- Delete masivo (habilitado solo si hay seleccionados) -->
          <button
            class="btn ghost"
            type="button"
            style="color: white;"
            :disabled="selectedIds.size === 0"
            @click="deleteSelected"
          >
            🗑️ Eliminar
          </button>
        </div>

        <!-- Grid de tarjetas de evento (responsive en CSS global) -->
        <section class="events-grid" data-component="EventsGrid" aria-label="Listado de eventos">
          <!-- Estado de carga -->
          <p v-if="loading" class="p">Cargando eventos…</p>

          <!-- Estado sin resultados -->
          <p v-else-if="events.length === 0" class="p">No hay eventos que coincidan.</p>

          <!-- Tarjetas -->
          <template v-else>
            <article
              v-for="ev in events"
              :key="ev.id"
              class="card event-card"
              data-component="EventCard"
              :data-id="ev.id"
              style="position:relative;"
            >
              <!-- Checkbox de selección (solo visible si 'selecting' = true) -->
              <input
                v-if="selecting"
                class="sel"
                type="checkbox"
                :checked="selectedIds.has(ev.id)"
                @change="toggleSelected(ev.id)"
                style="position:absolute; left:8px; top:8px; width:18px; height:18px; z-index: 5;"
              />

              <!-- Cover clickable → navega al detalle -->
              <router-link
                class="event-cover"
                :to="`/events/${ev.id}`"
                :aria-label="`Ver evento: ${ev.title}`"
                data-part="cover"
              >
                <img :src="coverUrl(ev)" :alt="ev.title" loading="lazy" data-part="image" />
              </router-link>

              <!-- Cuerpo de tarjeta: título + fecha (badge) + ubicación -->
              <div class="pad" data-part="body">
                <div class="row" style="justify-content:space-between; align-items:center;" data-part="header">
                  <h2 class="h4" style="margin:0;" data-part="name">
                    <router-link class="link" :to="`/events/${ev.id}`">
                      {{ ev.title || 'Evento' }}
                    </router-link>
                  </h2>
                  <span class="badge soft" data-part="date">{{ formatDate(ev.date) }}</span>
                </div>
                <p class="p" style="opacity:.9; margin:6px 0 8px;" data-part="subtitle">
                  {{ ev.location }}
                </p>
              </div>
            </article>
          </template>
        </section>

        <!-- Paginación simple: anterior/siguiente + etiqueta de estado -->
        <div class="row" id="events-pager" style="gap:8px; justify-content:center; margin:12px 0;">
          <button class="btn ghost" style="color: white;" :disabled="page <= 1" @click="prevPage">‹ Anteriores</button>
          <span class="p">Página {{ page }} / {{ totalPages }}</span>
          <button class="btn ghost" style="color: white;" :disabled="page >= totalPages" @click="nextPage">Siguientes ›</button>
        </div>
      </section>
    </main>

    <!-- Footer global -->
    <AppFooter />
  </div>
</template>

<script setup>
/**
 * Vista: EventsView (listado con controles)
 * - Filtros: periodo (when), búsqueda (q), solo mis eventos (managing)
 * - Orden: descendente/ascendente por fecha
 * - Selección múltiple y borrado masivo
 * - Paginación contra PocketBase usando el store de 'events'
 */

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

/* ----------------------------
   ESTADO REACTIVO DE LA VISTA
-------------------------------*/
const page = ref(1);          // página actual
const perPage = 8;            // items por página (constante local)
const q = ref('');            // término de búsqueda (title/description/location)
const when = ref('upcoming'); // filtro de periodo: 'today' | 'week' | 'upcoming' | 'past'

// Orden: si true => '-date,-created' (próximos primero); si false => 'date,created'
const sortDesc = ref(true);

// Modos de la UI
const managing = ref(false);  // si activo, filtra solo eventos del usuario
const selecting = ref(false); // activa checkboxes para selección múltiple
const selectedIds = ref(new Set()); // conjunto de IDs seleccionados

// Utilidad para escapar comillas en filtros PB (evita romper el query)
const esc = (str = '') => String(str).replace(/"/g, '\\"');

/* --------------------
   DERIVADOS DEL STORE
-----------------------*/
const sortLabel = computed(() => sortDesc.value ? '↕ Ordenar (próximos)' : '↕ Ordenar (antiguos)');

const events = computed(() => eventsStore.events);              // lista actual
const loading = computed(() => eventsStore.loading);            // bandera de carga
const totalPages = computed(() => eventsStore.totalPages || 1); // total de páginas

/* ---------------------------
   HEADER (AVATAR) – OPCIONAL
------------------------------*/
const avatarUrl = computed(() => {
  const user = authStore.user;
  if (user && user.avatar) {
    // Thumb + token para recursos protegidos
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

/* --------------------------------------------------
   CARGA DE EVENTOS (bloque central)
   - Construye 'filter' en función de when/q/managing
   - Construye 'sort' según sortDesc
   - Llama al store con paginación
-----------------------------------------------------*/
async function loadEvents() {
  const filterParts = [];

  // Utilidad para ISO consistente
  const now = new Date();
  const toISO = (d) => new Date(d).toISOString();

  // Filtro por periodo (when)
  switch (when.value) {
    case 'today': {
      const start = new Date(now); start.setHours(0, 0, 0, 0);
      const end   = new Date(now); end.setHours(23, 59, 59, 999);
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

  // Filtro de búsqueda por título, descripción o ubicación (coincidencia parcial)
  if (q.value) {
    const term = esc(q.value.trim());
    // NOTE: Usa ~ (contiene). Si quieres case-insensitive, PocketBase soporta ?~ (depende de la versión)
    filterParts.push(`(title ~ "${term}" || description ~ "${term}" || location ~ "${term}")`);
  }

  // Filtro “Gestionar”: solo eventos del usuario autenticado
  if (managing.value && authStore.user?.id) {
    filterParts.push(`(user = "${authStore.user.id}")`);
  }

  // Ensambla filtro y sort para la consulta
  const filter = filterParts.join(' && ');
  const sort   = sortDesc.value ? '-date,-created' : 'date,created';

  // Llama al store (maneja loading/error interno)
  await eventsStore.fetchEvents(page.value, perPage, { sort, filter });
}

/* ---------------------------
   CICLO DE VIDA + REACCIONES
------------------------------*/
// Carga inicial
onMounted(() => {
  loadEvents();
});

// Re-carga cuando cambian los inputs de consulta
watch([page, q, when, sortDesc, managing], () => {
  loadEvents();
});

/* ---------------
   ACCIONES DE UI
------------------*/
function setWhen(value) {
  when.value = value;
  page.value = 1; // reset de paginación
}
function toggleSort() {
  sortDesc.value = !sortDesc.value;
  page.value = 1;
}
function toggleSelect() {
  selecting.value = !selecting.value;
  selectedIds.value.clear(); // limpiar selección al salir/entrar
}
function toggleManage() {
  managing.value = !managing.value;
  page.value = 1; // la query cambia → volver a la primera página
}
function toggleSelected(id) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id);
  } else {
    selectedIds.value.add(id);
  }
  // Reasignación para forzar reactividad en Set
  selectedIds.value = new Set(selectedIds.value);
}

// Borrado masivo: pide confirmación, elimina y refresca
async function deleteSelected() {
  if (selectedIds.value.size === 0) return;
  if (!confirm(`¿Seguro que quieres eliminar ${selectedIds.value.size} evento(s)?`)) return;

  // NOTE: podrías envolver en try/catch y mostrar un toast por error individual
  for (const id of selectedIds.value) {
    await eventsStore.deleteEvent(id);
  }
  selectedIds.value.clear();
  selecting.value = false;
  loadEvents(); // refresca la página actual
}

/* ------------------------
   HELPERS DE PRESENTACIÓN
---------------------------*/
function formatDate(isoStr) {
  return isoStr
    ? new Date(isoStr).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Sin fecha';
}
function coverUrl(ev) {
  // Miniatura 300x200 si hay 'cover', si no un SVG transparente
  return ev.cover
    ? pb.files.getUrl(ev, ev.cover, '300x200')
    : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" />';
}

/* ------------
   PAGINACIÓN
--------------*/
function prevPage() {
  if (page.value > 1) page.value--;
}
function nextPage() {
  if (page.value < totalPages.value) page.value++;
}

/* -------
   SESIÓN
---------*/
function logout() {
  authStore.logout();
  router.push('/login');
}
</script>
