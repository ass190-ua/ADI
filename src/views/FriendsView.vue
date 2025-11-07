<template>
  <!--
    Layout principal de la página privada de "Amigos". 
    Incluye cabecera, sidebar y el contenido principal con:
    1) Buscador de usuarios y envío de solicitudes de amistad.
    2) Gestión de solicitudes pendientes (aceptar / rechazar).
    3) Listado de amigos con filtros, búsqueda local y ordenaciones.
  -->
  <div class="page" data-component="MainLayout">
    <!-- Cabecera para usuarios autenticados -->
    <AppHeader variant="private" />

    <main class="app-shell" data-component="AppShell">
      <!-- Menú lateral de navegación -->
      <AppSidebar />

      <!-- Contenido principal de la sección de amigos -->
      <section class="app-main container friends-layout" data-component="FriendsContent">
        <h1 class="h2" style="margin: 0">Amigos</h1>

        <!-- ===================== ACCIONES: BUSCAR Y SOLICITUDES ===================== -->
        <div class="actions-grid">
          <!-- -------- Tarjeta: Buscador de usuarios -------- -->
          <div class="action-card">
            <h2 class="h5" style="margin-top: 0; margin-bottom: 12px">Buscar usuarios</h2>
            <div class="card pad">
              <!--
                Formulario de búsqueda
                - v-model="query": término a buscar (usuario o email)
                - @input="onInput": activa la búsqueda con debounce (300 ms)
                - @submit.prevent="onSubmit": búsqueda inmediata al enviar
              -->
              <form @submit.prevent="onSubmit" class="row" style="gap: 8px">
                <input
                  v-model="query"
                  @input="onInput"
                  type="text"
                  placeholder="Nombre de usuario o email"
                  class="input"
                  style="flex: 1"
                />
                <button type="submit" class="btn primary">Buscar</button>
              </form>
            </div>

            <!-- Estado de búsqueda -->
            <p v-if="searching" class="p" style="margin-top: 16px">Buscando…</p>
            <p v-if="searchError" class="p" style="margin-top: 16px; color: var(--error)">{{ searchError }}</p>
            
            <!-- Resultados de búsqueda -->
            <div v-if="!searching && searchResults.length" class="friend-grid search-results" style="margin-top: 16px">
              <!-- Cada resultado: tarjeta con avatar, datos y acción de solicitud -->
              <div v-for="u in searchResults" :key="u.id" class="friend-card">
                 <div class="avatar-container">
                  <!-- Avatar (si existe) o iniciales como fallback -->
                  <img v-if="getAvatarUrl(u)" :src="getAvatarUrl(u)" alt="Avatar" class="avatar-img-card" />
                  <span v-else class="avatar-initials">{{ (u.username || 'U').substring(0, 2) }}</span>
                </div>
                <div class="user-info">
                  <span class="name">{{ u.username || u.name }}</span>
                  <span class="detail">{{ u.email }}</span>
                </div>
                <div class="actions">
                  <!-- Enviar solicitud de amistad al usuario -->
                  <button class="btn btn-sm primary" @click="sendRequest(u.id)">Solicitar</button>
                </div>
              </div>
            </div>
            
            <!-- Mensaje cuando no hay resultados, pero sí término buscado y sin error -->
            <p v-else-if="!searching && query && !searchError" class="p" style="margin-top: 16px">
              No hay resultados para “{{ query }}”.
            </p>
          </div>
          
          <!-- -------- Tarjeta: Solicitudes de amistad pendientes -------- -->
          <div class="action-card" v-if="chatStore.friendRequests.length">
            <h2 class="h5" style="margin-top: 0; margin-bottom: 12px">Solicitudes pendientes</h2>
            <div class="friend-grid">
              <!-- Cada solicitud: info del remitente y botones aceptar/rechazar -->
              <div v-for="req in chatStore.friendRequests" :key="req.id" class="friend-card">
                <div class="avatar-container">
                  <img
                    v-if="getAvatarUrl(req.expand?.sender)"
                    :src="getAvatarUrl(req.expand?.sender)"
                    alt="Avatar"
                    class="avatar-img-card"
                  />
                  <span v-else class="avatar-initials">
                    {{ (req.expand?.sender?.username || 'U').substring(0, 2) }}
                  </span>
                  <!-- Indicador de presencia online del remitente -->
                  <span class="presence-dot" v-if="req.expand?.sender?.online" title="Online"></span>
                </div>
                <div class="user-info">
                  <span class="name">{{ req.expand?.sender?.username || req.expand?.sender?.name }}</span>
                  <span class="detail">{{ req.expand?.sender?.email }}</span>
                </div>
                <div class="actions">
                  <button class="btn btn-sm primary" @click="respond(req.id, true)">Aceptar</button>
                  <button class="btn btn-sm" @click="respond(req.id, false)">Rechazar</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ===================== LISTADO DE AMIGOS ===================== -->
        <div class="friends-list-container">
          <!-- Cabecera de filtros y chips -->
          <div class="row" style="align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 16px;">
            <h2 class="h5" style="margin: 0">Tus amigos</h2>
            <div class="row" style="gap:6px; flex-wrap:wrap">
              <!-- Filtros rápidos (chips) -->
              <button class="chip" :class="{active: activeFilter==='todos'}" @click="activeFilter='todos'">Todos</button>
              <button class="chip" :class="{active: activeFilter==='favoritos'}" @click="activeFilter='favoritos'">Favoritos</button>
              <button class="chip" :class="{active: activeFilter==='online'}" @click="activeFilter='online'">Online</button>
            </div>
          </div>
          
          <!-- Barra de búsqueda local y orden -->
          <div class="row" style="justify-content: flex-end; gap: 8px; margin-bottom: 12px;">
            <!-- Búsqueda local en la lista de amigos -->
            <input class="input" type="search" placeholder="Buscar en amigos…" v-model="q" style="max-width: 240px;"/>
            <!-- Menú de ordenación: relevantes / recientes / A–Z -->
            <div class="input">
              <select v-model="order">
                <option value="relevantes">Relevantes</option>
                <option value="recientes">Recientes</option>
                <option value="az">Nombre (A–Z)</option>
              </select>
            </div>
          </div>

          <!-- Grid de amigos, con avatar, nombre y acción de chatear -->
          <div class="friend-grid" v-if="orderedFriends.length > 0">
            <div v-for="friend in orderedFriends" :key="friend.id" class="friend-card">
              <div class="avatar-container">
                <img v-if="getAvatarUrl(friend)" :src="getAvatarUrl(friend)" alt="Avatar" class="avatar-img-card" />
                <span v-else class="avatar-initials">{{ (friend.username || 'A').substring(0, 2) }}</span>
                <!-- Punto de estado online -->
                <span v-if="friend.online" class="presence-dot" title="Online"></span>
              </div>
              <div class="user-info">
                <span class="name">
                  {{ friend.username || friend.name }}
                  <!-- Estrella para favoritos -->
                  <span v-if="friend.favorite" title="Favorito" style="color: var(--warning);"> ★</span>
                </span>
              </div>
              <div class="actions">
                <!-- Abre (o crea) conversación directa con el amigo -->
                <button class="btn btn-sm primary" @click="openChat(friend.id)">Chatear</button>
              </div>
            </div>
          </div>

          <!-- Mensaje cuando ningún amigo cumple los filtros -->
          <p v-else class="p card pad" style="font-style: italic; margin-top: 8px; text-align: center;">
            No se encontraron amigos que coincidan con tus filtros.
          </p>
        </div>

      </section>
    </main>

    <!-- Pie de página -->
    <AppFooter />
  </div>
</template>

<script setup>
// ========================================================= //
//  LÓGICA DE LA VISTA (Composition API con <script setup>)  //
// ========================================================= // 

import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import AppHeader from '../components/AppHeader.vue';
import AppSidebar from '../components/AppSidebar.vue';
import AppFooter from '../components/AppFooter.vue';
import { useChatStore } from '../stores/chat.js';
import { pb } from '../services/pb.js';

// Store central del chat (amigos, solicitudes, conversaciones)
const chatStore = useChatStore();
// Router para navegación programática (abrir pantalla de chats)
const router = useRouter();

// ---------------------- Estado: buscador de usuarios ----------------------
const query = ref('');         // Término de búsqueda (input)
const searchResults = ref([]); // Resultados devueltos por el servidor
const searching = ref(false);  // Flag de carga mientras se busca
const searchError = ref('');   // Mensaje de error en búsqueda
let debounceTimer = null;      // Timer para debounce de la búsqueda

// ---------------------- Estado: filtros de "Tus amigos" -------------------
const q = ref('');                 // Búsqueda local en la lista de amigos
const activeFilter = ref('todos'); // Filtro activo: 'todos' | 'favoritos' | 'online'
const order = ref('relevantes');   // Orden: 'relevantes' | 'recientes' | 'az'

// Genera la URL del avatar (PocketBase) o null si no hay/si falla
const getAvatarUrl = (user) => {
  if (user && user.avatar) {
    try {
      return pb.files.getUrl(user, user.avatar, { thumb: '100x100' });
    } catch (e) {
      console.warn('Error al generar URL de avatar:', e);
      return null;
    }
  }
  return null;
};

// Al montar la vista: cargar solicitudes de amistad y amigos existentes
onMounted(async () => {
  await chatStore.fetchFriendRequests();
  await chatStore.fetchFriends();
});

// ---------------------- Búsqueda remota (usuarios) -----------------------
// Dispara la búsqueda con un retardo (debounce) para evitar peticiones por cada pulsación
function onInput() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(runSearch, 300);
}
// Envío directo del formulario: ejecuta la búsqueda inmediatamente
function onSubmit(e) {
  e?.preventDefault?.();
  clearTimeout(debounceTimer);
  runSearch();
}
// Lógica principal de búsqueda contra la colección 'users' (PocketBase)
async function runSearch() {
  searchError.value = '';
  searchResults.value = [];
  const term = (query.value || '').trim();

  // Requiere sesión iniciada para poder buscar
  if (!pb.authStore.model?.id) {
    searchError.value = 'Debes iniciar sesión para buscar usuarios.';
    return;
  }
  if (!term) return; // Si no hay término, no se busca

  searching.value = true;
  try {
    // Filtro básico por username o email que contengan el término
    const filter = `(username~'${term}' || email~'${term}')`;

    // Petición paginada: página 1, 20 elementos
    const { items } = await pb.collection('users').getList(1, 20, {
      filter: filter,
      fields: 'id,collectionId,collectionName,username,name,email,avatar'
    });

    // Filtrar del resultado: excluirme, amigos ya agregados y solicitudes pendientes
    const me = pb.authStore.model;
    const filtered = items.filter((u) => {
      if (u.id === me.id) return false; // no me muestro a mí
      const isFriend = chatStore.friends.some((f) => f?.id === u.id);
      if (isFriend) return false;      // ya es amigo
      const hasPending = chatStore.friendRequests.some((fr) => fr.sender === u.id || fr.recipient === u.id);
      return !hasPending;              // excluir si ya hay una solicitud abierta
    });

    searchResults.value = filtered;
  } catch (err) {
    console.error('[Friends] error buscando:', err);
    searchError.value = err?.message || 'No se pudieron cargar resultados.';
  } finally {
    searching.value = false; // liberar estado de carga siempre
  }
}

// Envía una solicitud de amistad y, al éxito, oculta al usuario de los resultados
async function sendRequest(userId) {
  // await chatStore.sendRequest(userId); // <- el archivo original tenía un typo; el método correcto es sendFriendRequest
  await chatStore.sendFriendRequest(userId);
  searchResults.value = searchResults.value.filter((u) => u.id !== userId);
}

// Responder a una solicitud de amistad (aceptar/rechazar)
async function respond(requestId, accept) {
  await chatStore.respondFriendRequest(requestId, accept);
}

// Abre un chat directo con un amigo: reutiliza conversación si existe, si no la crea
async function openChat(friendId) {
  await chatStore.fetchConversations();
  const me = pb.authStore.model;

  // Buscar conversación 1 a 1 existente con ese amigo
  let existing = chatStore.conversations.find((c) => {
    if (c.isGroup) return false;
    return c.participants.includes(friendId) && c.participants.includes(me.id);
  });

  // Si existe, seleccionarla; en caso contrario, crear una nueva
  if (existing) chatStore.currentConversationId = existing.id;
  else await chatStore.createConversationWith(friendId);

  // Navegar a la vista de chats
  router.push('/chats');
}

// ---------------------- Filtros y orden locales (amigos) ------------------
// Aplica búsqueda por texto + chips de filtro sobre la lista en memoria
const filteredFriends = computed(() => {
  let arr = chatStore.friends || [];
  const term = q.value.trim().toLowerCase();

  if (term) arr = arr.filter(f =>
    (f.username || f.name || '').toLowerCase().includes(term) || (f.email || '').toLowerCase().includes(term)
  );

  if (activeFilter.value === 'favoritos') arr = arr.filter(f => f.favorite);
  if (activeFilter.value === 'online')    arr = arr.filter(f => f.online);
  return arr;
});

// Ordena la lista ya filtrada según el criterio seleccionado
const orderedFriends = computed(() => {
  const arr = [...filteredFriends.value];

  if (order.value === 'az') {
    // Orden alfabético por username/name
    arr.sort((a, b) => (a.username || a.name || '').localeCompare(b.username || b.name || ''));
  } else if (order.value === 'recientes') {
    // Demo de "recientes": prioriza online como ejemplo (sustituible por fecha real)
    arr.sort((a, b) => Number(b.online) - Number(a.online));
  } else {
    // "Relevantes": primero favoritos y, a igualdad, online
    arr.sort((a, b) => Number(b.favorite) - Number(a.favorite) || Number(b.online) - Number(a.online));
  }

  return arr;
});
</script>

<style scoped>
/* ===================== LAYOUT GENERAL ===================== */
.friends-layout {
  display: grid;
  gap: var(--gap, 24px);
  margin-top: 12px;
}

/* Grid superior con dos columnas: buscador y solicitudes */
.actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--gap, 24px);
  align-items: start;
}
.action-card {
  display: grid;
  gap: 16px;
  align-content: start;
}

/* ===================== GRID DE TARJETAS ===================== */
.friend-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

/* En resultados de búsqueda mostramos 1 por fila (leer mejor) */
.search-results.friend-grid {
  grid-template-columns: 1fr;
}

/* Tarjeta de amigo/usuario */
.friend-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px;
  border-radius: 12px;
  background: var(--panel);
  border: 1px solid var(--border);
  transition: all 0.2s ease;
}
.friend-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow);
  border-color: rgba(122, 162, 247, 0.4);
}

/* ===================== AVATAR ===================== */
.avatar-container {
  position: relative;
  margin-bottom: 12px;
}

.avatar-img-card {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid var(--border);
}
/* Fallback de iniciales cuando no hay imagen */
.avatar-container .avatar-initials {
  width: 64px;
  height: 64px;
  font-size: 1.5rem;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

/* ===================== INFO DE USUARIO ===================== */
.user-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  margin-bottom: 16px;
}
.user-info .name {
  font-weight: 600;
  font-size: 1.1rem;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}
.user-info .detail {
  font-size: 0.9rem;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

/* ===================== ACCIONES ===================== */
.actions {
  display: flex;
  gap: 8px;
  width: 100%;
}
.actions .btn {
  flex: 1;
  justify-content: center;
}

/* Indicador de presencia online */
.presence-dot {
  position: absolute;
  right: 2px;
  bottom: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid var(--panel);
  box-shadow: 0 0 5px var(--accent);
}

/* ===================== CHIPS DE FILTRO ===================== */
.chip {
  background: var(--panel);
  border: 1px solid var(--border);
  color: var(--muted);
}
.chip.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}
.chip.favoritos.active { background: #eab308; color: #111; border-color: #eab308; }

/* ===================== RESPONSIVE ===================== */
@media (max-width: 980px) {
  .actions-grid { grid-template-columns: 1fr; }
}
</style>
