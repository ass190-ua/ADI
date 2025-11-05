<template>
  <div class="page" data-component="MainLayout">
    <AppHeader variant="private" />
    <main class="app-shell" data-component="AppShell">
      <AppSidebar />
      <section class="app-main container" data-component="FriendsContent">
        <h1 class="h2" style="margin: 0 0 12px">Amigos</h1>

        <!-- Sección de solicitudes pendientes -->
        <div v-if="chatStore.friendRequests.length" style="margin-bottom: 24px">
          <h2 class="h5" style="margin-bottom: 8px">Solicitudes pendientes</h2>
          <ul class="list" style="list-style: none; padding: 0">
            <li v-for="req in chatStore.friendRequests" :key="req.id" style="margin-bottom: 8px">
              <span>{{ req.expand?.sender?.username || req.expand?.sender?.name || req.expand?.sender?.email }}</span>
              <button class="btn btn-sm primary" style="margin-left: 8px" @click="respond(req.id, true)">Aceptar</button>
              <button class="btn btn-sm" style="margin-left: 4px" @click="respond(req.id, false)">Rechazar</button>
            </li>
          </ul>
        </div>

        <!-- Sección para buscar nuevos amigos -->
        <div style="margin-bottom: 24px">
          <h2 class="h5" style="margin-bottom: 8px">Buscar usuarios</h2>
          <form @submit="search" class="row" style="align-items: center; gap: 8px">
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

          <p v-if="searching" style="margin-top:8px; opacity:.8">Buscando…</p>
          <p v-if="searchError" style="margin-top:8px; color:#f66">{{ searchError }}</p>

          <ul v-if="!searching && searchResults.length" class="list" style="list-style: none; padding: 0; margin-top: 12px">
            <li v-for="u in searchResults" :key="u.id" style="margin-bottom: 8px">
              <span>{{ u.username || u.name || (u.emailVisibility ? u.email : '') }}</span>
              <button class="btn btn-sm primary" style="margin-left: 8px" @click="sendRequest(u.id)">Solicitar amistad</button>
            </li>
          </ul>
          <p v-else-if="!searching && query && !searchError" style="margin-top:8px; opacity:.8">
            No hay resultados para “{{ query }}”.
          </p>
          
          <ul v-if="searchResults.length" class="list" style="list-style: none; padding: 0; margin-top: 12px">
            <li v-for="u in searchResults" :key="u.id" style="margin-bottom: 8px">
              <span>{{ u.username || u.name || u.email }}</span>
              <button class="btn btn-sm primary" style="margin-left: 8px" @click="sendRequest(u.id)">Solicitar amistad</button>
            </li>
          </ul>
        </div>

        <!-- Listado de amigos actuales -->
        <div>
          <h2 class="h5" style="margin-bottom: 8px">Tus amigos</h2>
          <ul class="list" style="list-style: none; padding: 0">
            <li v-for="friend in chatStore.friends" :key="friend.id" style="margin-bottom: 8px">
              <span>{{ friend.username || friend.name || friend.email }}</span>
              <button class="btn btn-sm primary" style="margin-left: 8px" @click="openChat(friend.id)">Chatear</button>
            </li>
          </ul>
          <p v-if="chatStore.friends.length === 0" style="font-style: italic; opacity: 0.8">Aún no tienes amigos.</p>
        </div>
      </section>
    </main>
    <AppFooter />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppHeader from '../components/AppHeader.vue';
import AppSidebar from '../components/AppSidebar.vue';
import AppFooter from '../components/AppFooter.vue';
import { useChatStore } from '../stores/chat.js';
import { pb } from '../services/pb.js';

const chatStore = useChatStore();
const router = useRouter();

const query = ref('');
const searchResults = ref([]);
const searching = ref(false);
const searchError = ref('');
let debounceTimer = null;

onMounted(async () => {
  await chatStore.fetchFriendRequests();
  await chatStore.fetchFriends();
  console.log('[Friends] mounted. user=', pb.authStore.model?.id);
});

// Debounce mientras teclean
function onInput() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(runSearch, 300);
}

// Submit manual (botón / Enter)
function onSubmit(e) {
  e?.preventDefault?.();
  clearTimeout(debounceTimer);
  runSearch();
}

async function runSearch() {
  searchError.value = '';
  searchResults.value = [];

  const term = (query.value || '').trim();
  if (!pb.authStore.model?.id) {
    searchError.value = 'Debes iniciar sesión para buscar usuarios.';
    console.warn('[Friends] No auth; abort search');
    return;
  }
  if (!term) {
    console.log('[Friends] vacío, no busco');
    return;
  }

  searching.value = true;
  console.log('[Friends] buscando:', term);
  try {
    // usa SIEMPRE el store
    const { items, totalItems } = await chatStore.searchUsers(term, 1, 20);
    console.log('[Friends] resultados crudos:', totalItems, items);

    const me = pb.authStore.model;
    const filtered = items.filter((u) => {
      if (u.id === me.id) return false;
      const isFriend = chatStore.friends.some((f) => f?.id === u.id);
      if (isFriend) return false;
      const hasPending = chatStore.friendRequests.some(
        (fr) => fr.sender === u.id || fr.recipient === u.id
      );
      return !hasPending;
    });

    console.log('[Friends] resultados filtrados:', filtered);
    searchResults.value = filtered;
  } catch (err) {
    console.error('[Friends] error buscando:', err);
    searchError.value = err?.message || 'No se pudieron cargar resultados.';
  } finally {
    searching.value = false;
  }
}

// Acciones existentes
async function sendRequest(userId) {
  await chatStore.sendFriendRequest(userId);
  searchResults.value = searchResults.value.filter((u) => u.id !== userId);
}
async function respond(requestId, accept) {
  await chatStore.respondFriendRequest(requestId, accept);
}
async function openChat(friendId) {
  await chatStore.fetchConversations();
  const me = pb.authStore.model;
  let existing = chatStore.conversations.find((c) => {
    if (c.isGroup) return false;
    return c.participants.includes(friendId) && c.participants.includes(me.id);
  });
  if (existing) chatStore.currentConversationId = existing.id;
  else await chatStore.createConversationWith(friendId);
  router.push('/chats');
}

// Para compatibilidad con tu template actual
const search = onSubmit;

</script>