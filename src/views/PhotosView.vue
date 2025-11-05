<template>
  <div class="page" data-component="MainLayout">
    <AppHeader variant="private" />

    <main class="app-shell" data-component="AppShell">
      <AppSidebar />

      <section class="app-main container" data-component="PhotosContent">
        <!-- Título + chips -->
        <div class="row" style="justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap;">
          <h1 class="h2" style="margin:0;">Tu galería</h1>
          <div class="row" style="gap:8px; flex-wrap:wrap;">
            <button class="chip todos" :class="{active: state.filter === ''}" type="button" @click="setFilter('')">Todos</button>
            <button class="chip favoritos" :class="{active: state.filter === 'favourite = true'}" type="button" @click="setFilter('favourite = true')">Favoritos</button>
            <button class="chip videos" type="button" disabled>Vídeos</button>
            <button class="chip albumnes" type="button" disabled>Álbumes</button>
          </div>
        </div>

        <!-- Toolbar -->
        <div class="row" style="gap:10px; margin-top:10px; flex-wrap:wrap;">
          <div class="input" style="flex:1; min-width:220px;">
            <label class="visually-hidden" for="q">Buscar en galería</label>
            <input id="q" type="search" placeholder="Buscar por título, lugar o etiqueta… 🔍" v-model="state.q" @input="onSearchInput" />
          </div>
          <button class="btn" style="color: white;" data-part="upload" @click="openFile">⬆️ Subir</button>
          <button class="btn ghost" style="color: white;" data-part="sort" @click="toggleSort">{{ sortLabel }}</button>
          <button class="btn ghost" style="color: white;" data-part="select" :class="{active: state.selecting}" @click="toggleSelecting">✅ Seleccionar</button>
          <button class="btn ghost" style="color: white;" data-part="delete" :disabled="!state.selected.size" @click="bulkDelete">🗑️ Eliminar</button>

          <!-- input de subida (oculto) -->
          <input ref="fileInput" id="photo-file" type="file" accept="image/*" multiple style="display:none;" @change="onFilesPicked" />
        </div>

        <!-- Galería -->
        <section class="gallery" style="margin-top:16px;" data-component="PhotoGrid" aria-live="polite">
          <template v-if="loading">
            <p class="p">Cargando…</p>
          </template>

          <template v-else-if="items.length === 0">
            <p class="p">No se encontraron fotos con los filtros actuales.</p>
          </template>

          <template v-else>
            <article v-for="rec in items" :key="rec.id" class="photo-card card" :data-id="rec.id">
              <div class="cover">
                <img :src="coverUrl(rec)" :alt="rec.title || 'Foto'" loading="lazy" />
                <input v-if="state.selecting" class="sel" type="checkbox" :checked="state.selected.has(rec.id)" @change="toggleSelected(rec.id, $event.target.checked)" />
                <button class="fav" title="Favorito" :disabled="favLoading === rec.id" @click="toggleFav(rec)">
                  {{ rec.favourite ? '★' : '☆' }}
                </button>
              </div>
              <div v-if="rec.title" class="pad"><div class="p">{{ rec.title }}</div></div>
            </article>
          </template>
        </section>

        <p id="photos-msg" class="p" style="margin-top:8px; color:var(--error);" v-if="errorMsg">{{ errorMsg }}</p>
      </section>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import AppHeader from '../components/AppHeader.vue';
import AppSidebar from '../components/AppSidebar.vue';
import AppFooter from '../components/AppFooter.vue';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { pb } from '../services/pb.js';
import { fileUrl, listPhotos, uploadPhoto, deletePhoto, toggleFavorite } from '../services/photos_services.js';
import { useAuthStore } from '../stores/auth.js';

const router = useRouter();
const auth = useAuthStore();

const me = computed(() => auth.user);
const avatarUrl = computed(() => {
  const u = me.value;
  if (u?.avatar) {
    try { return pb.files.getUrl(u, u.avatar, { token: pb.authStore.token, thumb: '100x100' }); }
    catch { return null; }
  }
  return null;
});
const initials = computed(() => {
  const name = me.value?.name || me.value?.username || '?';
  return name.toString().trim().split(/\s+/).map(w => w[0]).slice(0,2).join('').toUpperCase();
});
function logout() { auth.logout(); router.push('/login'); }

// -------- Estado galería --------
const state = reactive({
  page: 1,
  perPage: 24,
  sort: '-created',
  q: '',
  selecting: false,
  selected: new Set(),
  filter: ''
});
const loading = ref(false);
const errorMsg = ref('');
const items = ref([]);
const favLoading = ref(''); // id de foto en la que se está pulsando fav

const fileInput = ref(null);

// etiqueta sort del botón
const sortLabel = computed(() => state.sort.startsWith('-') ? '↕ Ordenar (recientes)' : '↕ Ordenar (antiguas)');

function coverUrl(rec) {
  // Igual que en el HTML viejo: thumb ancho 600
  return fileUrl(rec, 'field', '600x0') || fileUrl(rec, undefined, '600x0');
}

function setFilter(f) {
  state.filter = f;
  state.page = 1;
  load();
}

function toggleSort() {
  state.sort = state.sort.startsWith('-') ? 'created' : '-created';
  state.page = 1;
  load();
}

function toggleSelecting() {
  state.selecting = !state.selecting;
  state.selected.clear();
}

function toggleSelected(id, checked) {
  if (checked) state.selected.add(id);
  else state.selected.delete(id);
}

function openFile() {
  fileInput.value?.click();
}

async function onFilesPicked(e) {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;
  try {
    for (const f of files) await uploadPhoto({ file: f });
  } catch (err) {
    console.error('Falló subida', err);
  } finally {
    e.target.value = '';
    load();
  }
}

async function bulkDelete() {
  if (!state.selected.size) return;
  if (!confirm(`¿Borrar ${state.selected.size} foto(s)?`)) return;
  try {
    for (const id of state.selected) {
      try { await deletePhoto(id); } catch (err) { console.error(err); }
    }
  } finally {
    state.selected.clear();
    load();
  }
}

async function toggleFav(rec) {
  try {
    favLoading.value = rec.id;
    const updated = await toggleFavorite(rec.id, !!rec.favourite);
    rec.favourite = updated.favourite;
  } catch (err) {
    console.error(err);
  } finally {
    favLoading.value = '';
  }
}

const onSearchInput = debounce(() => {
  state.page = 1;
  load();
}, 300);

async function load() {
  loading.value = true;
  errorMsg.value = '';
  items.value = [];
  try {
    const searchFilter = state.q
      ? `(title ~ "${state.q}" || location ~ "${state.q}" || tags ~ "${state.q}")`
      : '';
    const finalFilter = [state.filter, searchFilter].filter(Boolean).join(' && ');
    const res = await listPhotos({
      page: state.page,
      perPage: state.perPage,
      sort: state.sort,
      filter: finalFilter
    });
    items.value = res.items || [];
  } catch (err) {
    console.error(err);
    errorMsg.value = 'Error al cargar las fotos.';
  } finally {
    loading.value = false;
  }
}

onMounted(load);

// util
function debounce(fn, ms = 300) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}
</script>
