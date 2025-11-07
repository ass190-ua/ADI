<template>
  <!--
    Vista principal de "Chats" en el área privada.
    Estructura general:
    - Cabecera y sidebar del layout privado.
    - Contenedor con dos paneles: lista de conversaciones (aside) y panel de mensajes.
    - Modal para crear grupos con amigos.
  -->
  <div class="page" data-component="MainLayout">
    <!-- Cabecera para sesión iniciada -->
    <AppHeader variant="private" />

    <main class="app-shell" data-component="AppShell">
      <!-- Navegación lateral -->
      <AppSidebar />

      <!-- Contenido principal: Chats -->
      <section class="app-main container" data-component="ChatsContent">
        <h1 class="h2" style="margin: 0; margin-bottom: 12px" data-part="title">Chats</h1>

        <!--
          Grid principal de la zona de chat.
          - Clase condicional 'chat-active' cuando hay conversación seleccionada (para ajustes responsivos/estéticos).
        -->
        <div class="chats-grid" :class="{'chat-active': currentConversation}" data-part="chat-container">
          
          <!-- ===================== LISTA DE CONVERSACIONES (ASIDE) ===================== -->
          <aside class="chats-list card" data-part="chat-list">
            <!-- Encabezado de la lista de hilos -->
            <div class="row" style="justify-content: space-between; align-items: center; margin-bottom: 8px; padding: 0 4px">
              <h2 class="h5" style="margin: 0">Conversaciones</h2>
              <!-- Mostrar/ocultar modal de creación de grupo -->
              <button class="btn btn-sm primary" @click="showGroupForm = !showGroupForm">Nuevo grupo</button>
            </div>

            <!-- Buscador local de conversaciones -->
            <div class="row" style="gap:8px; padding: 0 4px; margin-bottom: 8px">
              <input class="input" type="search" placeholder="Buscar chats…" v-model="threadSearch" style="background: var(--bg);"/>
            </div>

            <!-- Listado de hilos (conversaciones) -->
            <ul class="thread-list">
              <li
                v-for="convo in filteredConversations"
                :key="convo.id"
                class="thread"
                :aria-current="convo.id === chatStore.currentConversationId"
                @click="selectConversation(convo.id)"
              >
                <div class="avatar">
                  <!-- Avatar de la conversación (del amigo en chats 1:1 o placeholder en grupos) -->
                  <img v-if="getConversationAvatar(convo)" :src="getConversationAvatar(convo)" alt="Avatar" />
                  <span v-else class="avatar-initials" style="width: 44px; height: 44px; font-size: 1rem">
                    {{ (conversationName(convo) || 'G').substring(0, 2) }}
                  </span>
                </div>

                <div class="meta">
                  <span class="name">
                    {{ conversationName(convo) }}
                    <!-- Pin visual si la conversación está fijada -->
                    <template v-if="convo.pinned"> 📌</template>
                  </span>
                  <!-- Vista previa del último mensaje -->
                  <span v-if="lastPreview(convo)" class="preview">{{ lastPreview(convo) }}</span>
                </div>

                <!-- Contador de no leídos -->
                <span v-if="unreadCount(convo)" class="badge">{{ unreadCount(convo) }}</span>
              </li>
            </ul>
          </aside>

          <!-- ===================== PANEL DE MENSAJES ===================== -->
          <div class="chat-panel card" data-part="chat-messages">
            <template v-if="currentConversation">
              
              <!-- Encabezado del chat seleccionado -->
              <div class="chat-header">
                <div class="row" style="align-items:center; gap:10px; justify-content: space-between;">
                  <div class="row" style="align-items:center; gap:10px; min-width: 0;">
                    <div class="avatar">
                      <!-- Avatar del chat actual (amigo en 1:1; para grupo, se muestra inicial) -->
                      <img v-if="getConversationAvatar(currentConversation)" :src="getConversationAvatar(currentConversation)" :alt="currentConversationTitle" />
                      <div v-else class="avatar-initials">{{ (currentConversationTitle || '—').substring(0,2).toUpperCase() }}</div>
                    </div>
                    <!-- Título/Nombre de la conversación -->
                    <h3 class="h5" style="margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" data-part="conversation-title">
                      {{ currentConversationTitle }}
                    </h3>
                  </div>
                  <!-- Acciones rápidas (placeholder) -->
                  <div class="row" style="gap:6px; flex-wrap:nowrap">
                    <button class="chip mute" type="button" :disabled="!currentConversation">Silenciar</button>
                    <button class="chip archive" type="button" :disabled="!currentConversation">Archivar</button>
                  </div>
                </div>
                <!-- Buscador dentro de la conversación actual -->
                <div class="row" style="gap:8px">
                  <input
                    class="input"
                    type="search"
                    placeholder="Buscar en la conversación…"
                    v-model="messageSearch"
                    :disabled="!currentConversation"
                    ref="messageSearchInputRef"
                  />
                </div>
              </div>

              <!-- Timeline de mensajes con agrupaciones por día -->
              <div class="chat-timeline" ref="chatScrollRef">
                <template v-if="groupedMessages.length">
                  <template v-for="(group, gIdx) in groupedMessages" :key="'g'+gIdx">
                    <!-- Cabecera 'sticky' con la etiqueta del grupo (Hoy / Ayer / fecha) -->
                    <div class="chat-sticky-header" :aria-label="group.label"></div>
                    <ul class="msgs">
                      <li
                        v-for="(msg, index) in group.items"
                        :key="msg.id"
                        class="msg"
                        :class="[
                          msg.expand?.sender?.id === auth.user?.id ? 'out' : 'in',
                          isGroupedWith(group.items, index) ? 'grouped' : ''
                        ]"
                      >
                        <div class="bubble" :class="msg.expand?.sender?.id === auth.user?.id ? 'out' : 'in'">
                          <!-- En grupos: mostrar remitente si es otro y no está agrupado visualmente -->
                          <strong
                            v-if="currentConversation.isGroup && msg.expand?.sender?.id !== auth.user?.id && !isGroupedWith(group.items, index)"
                            class="sender-name"
                          >
                            {{ msg.expand?.sender?.username || msg.expand?.sender?.name || 'Usuario' }}
                          </strong>
                          <!-- Contenido del mensaje con resaltado de búsqueda -->
                          <span v-html="highlight(msg.content, messageSearch)"></span>
                          <!-- Metadatos del mensaje (hora y ticks de leído para el emisor) -->
                          <div class="meta">
                            <span>{{ toTime(msg.created) }}</span>
                            <span v-if="msg.expand?.sender?.id === auth.user?.id" class="ticks read">✓✓</span>
                          </div>
                        </div>
                      </li>
                    </ul>
                  </template>
                </template>

                <!-- Mensaje vacío cuando la conversación no tiene mensajes -->
                <div v-else class="empty-chat-messages">
                  <p>Inicia la conversación.</p>
                </div>
              </div>

              <!-- Composer de mensajes: input + botón enviar -->
              <form @submit.prevent="send" class="chat-compose" data-part="message-form">
                <div class="input">
                  <input v-model="newMessage" type="text" placeholder="Escribe un mensaje..." />
                </div>
                <button type="submit" class="btn primary send-btn" :disabled="!newMessage.trim()" aria-label="Enviar">
                  <svg class="icon-send" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" />
                  </svg>
                </button>
              </form>
            </template>

            <!-- Placeholder cuando no hay conversación seleccionada -->
            <div v-else class="empty-chat" style="display: grid; place-items: center; text-align: center; height: 100%; padding: 20px;">
              <div>
                <p class="p" style="font-size: 1.1rem; color: var(--muted)">Selecciona una conversación para comenzar.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
    <AppFooter />

    <!-- ===================== MODAL: CREAR GRUPO ===================== -->
    <div v-if="showGroupForm" class="modal" style="display: flex" data-part="group-modal">
      <div class="modal-dialog card pad" style="color: var(--text)">
        <h2 class="h5" style="margin-top: 0">Crear grupo</h2>
        <form @submit.prevent="createGroup" class="form" style="gap: 16px">
          <div class="input">
            <label for="group-name">Nombre del grupo</label>
            <input id="group-name" v-model="groupName" type="text" class="input" />
          </div>
          <div class="input">
            <label>Participantes</label>
            <!-- Lista de amigos marcables como participantes del grupo -->
            <div class="friends-checkbox-list">
              <div v-for="friend in chatStore.friends" :key="friend.id" class="checkbox-item">
                <label>
                  <input type="checkbox" :value="friend.id" v-model="selectedFriends" />
                  {{ friend.username || friend.name || friend.email }}
                </label>
              </div>
              <p v-if="chatStore.friends.length === 0" class="p" style="font-style: italic; opacity: 0.8">
                Aún no tienes amigos para añadir.
              </p>
            </div>
          </div>
          <div class="row" style="justify-content: flex-end; gap: 8px; margin-top: 8px">
            <button type="button" class="btn" @click="closeGroupForm" style="color: white;">Cancelar</button>
            <button type="submit" class="btn primary">Crear</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup>
// ===================================================================== //
//  LÓGICA DE CHATS (Composition API con <script setup>)                 // 
// ===================================================================== //

import { onMounted, watch, ref, computed, nextTick } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import AppHeader from '../components/AppHeader.vue';
import AppSidebar from '../components/AppSidebar.vue';
import AppFooter from '../components/AppFooter.vue';
import { useChatStore } from '../stores/chat.js';
import { pb } from '../services/pb.js';

// Stores
const chatStore = useChatStore();
const auth = useAuthStore();

// Estado del composer y modal de grupo
const newMessage = ref('');       // Texto del mensaje a enviar
const groupName = ref('');        // Nombre del nuevo grupo
const selectedFriends = ref([]);  // IDs seleccionados para el grupo
const showGroupForm = ref(false); // Mostrar/ocultar modal de grupo

// Refs de DOM
const chatScrollRef = ref(null);         // Contenedor scrollable del timeline
const messageSearchInputRef = ref(null); // Input de búsqueda en conversación

// Búsquedas
const threadSearch = ref('');  // Filtro de conversaciones (lista)
const messageSearch = ref(''); // Filtro de mensajes en conversación actual

// ---------------------- Helpers de avatar ----------------------
// Devuelve URL del avatar de un usuario (PocketBase) o null si no existe
const getAvatarUrl = (user) => {
  if (user && user.avatar) {
    try {
      return pb.files.getUrl(user, user.avatar, { thumb: '100x100' });
    } catch (e) {
      return null;
    }
  }
  return null;
};
// En 1:1 devuelve avatar del otro participante; en grupo (por ahora) null
const getConversationAvatar = (convo) => {
  if (!convo) return null;
  if (convo.isGroup) return null; // Si más adelante hay avatar de grupo, ajustarlo aquí
  const participants = convo.expand?.participants || [];
  const meId = auth.user?.id;
  const friend = participants.find((p) => p.id !== meId);
  return getAvatarUrl(friend);
};

// ---------------------- Carga inicial ----------------------
onMounted(async () => {
  await chatStore.fetchFriends();       // Asegura lista de amigos (para modal de grupo)
  await chatStore.fetchConversations(); // Carga conversaciones disponibles
});

// ---------------------- Suscripción y scroll ----------------------
// Al cambiar la conversación actual: desuscribirse de la anterior, cargar mensajes y suscribirse a la nueva.
watch(
  () => chatStore.currentConversationId,
  async (newId, oldId) => {
    if (oldId) await chatStore.unsubscribeFromConversation();
    if (newId) {
      messageSearch.value = ''; // Limpiar búsqueda al cambiar de chat
      await chatStore.fetchMessages(newId);
      await chatStore.subscribeToConversation(newId);
      scrollToBottom('auto');   // Colocar el scroll al final
    }
  }
);

// Al recibir nuevos mensajes en la conversación actual: hacer autoscroll
watch(
  () => (chatStore.currentConversationId ? chatStore.messages[chatStore.currentConversationId]?.length : 0),
  () => scrollToBottom('smooth')
);

// Scroll helper (espera a pintar con nextTick)
async function scrollToBottom(behavior = 'smooth') {
  await nextTick();
  const el = chatScrollRef.value;
  if (el) el.scrollTo({ top: el.scrollHeight, behavior });
}

// ---------------------- Datos derivados (computed) ----------------------
// Mensajes de la conversación actual filtrados por búsqueda local
const currentMessages = computed(() => {
  if (!chatStore.currentConversationId) return [];
  const all = chatStore.messages[chatStore.currentConversationId] || [];
  const q = messageSearch.value.trim().toLowerCase();
  return q ? all.filter(m => (m.content || '').toLowerCase().includes(q)) : all;
});

// Conversación seleccionada y su título legible
const currentConversation = computed(() => {
  return chatStore.conversations.find((c) => c.id === chatStore.currentConversationId);
});
const currentConversationTitle = computed(() => {
  if (!currentConversation.value) return '';
  return conversationName(currentConversation.value);
});

// Nombre a mostrar: en 1:1 usa el otro participante; en grupo, el nombre del grupo
function conversationName(convo) {
  if (!convo) return '';
  if (!convo.isGroup) {
    const participants = convo.expand?.participants || [];
    const meId = auth.user?.id;
    const friend = participants.find((p) => p.id !== meId);
    return friend?.username || friend?.name || friend?.email || 'Chat privado';
  }
  return convo.name || 'Grupo';
}

// Selecciona conversación y limpia el composer
function selectConversation(id) {
  chatStore.currentConversationId = id;
  newMessage.value = '';
}

// Envía el mensaje actual (si hay contenido)
async function send() {
  const content = newMessage.value?.trim();
  if (!content) return;
  await chatStore.sendMessage(chatStore.currentConversationId, content);
  newMessage.value = '';
}

// ---------------------- Modal de creación de grupo ----------------------
function closeGroupForm() {
  showGroupForm.value = false;
  groupName.value = '';
  selectedFriends.value = [];
}
async function createGroup() {
  if (!groupName.value || selectedFriends.value.length === 0) return;
  await chatStore.createGroupConversation(groupName.value, selectedFriends.value);
  closeGroupForm();
}

// ---------------------- Lista de hilos: búsqueda/orden ----------------------
// Filtra por nombre visible y ordena dejando fijadas (pinned) primero
const filteredConversations = computed(() => {
  const q = threadSearch.value.trim().toLowerCase();
  const base = chatStore.conversations || [];
  const filtered = q
    ? base.filter(c => (conversationName(c) || '').toLowerCase().includes(q))
    : base;
  return [...filtered].sort((a,b) => Number(b.pinned) - Number(a.pinned));
});

// ---------------------- Preview y no leídos ----------------------
function lastPreview(convo) {
  const list = chatStore.messages[convo.id] || [];
  const last = list[list.length - 1];
  return last?.content || '';
}
function unreadCount(convo) {
  return convo.unread || 0;
}

// ---------------------- Agrupación visual por fecha ----------------------
const groupedMessages = computed(() => {
  const items = currentMessages.value;
  if (!items.length) return [];
  const groups = [];
  let currentDay = '';
  let bucket = [];
  for (const m of items) {
    const day = isoDay(m.created);
    if (!currentDay) currentDay = day;
    if (day !== currentDay) {
      groups.push({ label: humanDay(currentDay), items: bucket });
      bucket = [];
      currentDay = day;
    }
    bucket.push(m);
  }
  if (bucket.length) groups.push({ label: humanDay(currentDay), items: bucket });
  return groups;
});
function isoDay(dateStr) {
  const d = new Date(dateStr);
  return d.toISOString().slice(0,10);
}
function humanDay(iso) {
  const today = new Date().toISOString().slice(0,10);
  const diff = (Date.parse(today) - Date.parse(iso)) / (24*3600*1000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  return new Date(iso+'T00:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
}
function toTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit' });
}
// Agrupa burbujas consecutivas del mismo remitente si están cerca en el tiempo (<=5 min)
function isGroupedWith(list, index) {
  if (index === 0) return false;
  const prev = list[index - 1];
  const cur = list[index];
  const sameSender = prev.expand?.sender?.id === cur.expand?.sender?.id;
  if (sameSender) {
    const prevDate = new Date(prev.created);
    const currDate = new Date(cur.created);
    const diffMin = (currDate - prevDate) / (1000 * 60);
    if (diffMin > 5) return false;
  }
  return sameSender;
}

// ---------------------- Resaltado de búsqueda en mensajes ----------------------
function highlight(text = '', q = '') {
  const safeText = escapeHtml(text);
  if (!q) return safeText;
  const safeQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return safeText.replace(new RegExp(`(${safeQ})`, 'ig'), '<mark>$1</mark>');
}
function escapeHtml(s) {
  return (s || '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}
// Utilidad para enfocar el buscador interno
function focusSearch() {
  messageSearchInputRef.value?.focus();
}
</script>

<style scoped>
/* ===================== ESTILOS ESPECÍFICOS DE LA VISTA ===================== */
/* Nombre del remitente en mensajes de grupo */
.sender-name {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--accent);
}

/* Lista de amigos en el modal de grupo */
.friends-checkbox-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px;
  display: grid;
  gap: 6px;
  background: var(--bg);
}
.checkbox-item label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
}
.checkbox-item label:hover { background: rgba(255, 255, 255, 0.05); }
.checkbox-item input[type='checkbox'] { margin: 0; width: 16px; height: 16px; }

/* Estado vacío del timeline */
.empty-chat-messages {
  padding: 40px 20px;
  text-align: center;
  color: var(--muted);
}

/* Icono del botón enviar */
.icon-send { display: block }

/* Chips reutilizados (consistencia con FriendsView) */
.chip {
  background: var(--panel);
  border: 1px solid var(--border);
  color: var(--muted);
  cursor: pointer;
}
.chip.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
  font-weight: 600;
}
.chip.favoritos.active { background: #eab308; color: #111; border-color: #eab308; }
.chip.creador.active { background: #10b981; color: #fff; border-color: #10b981; }
.chip.online.active { background: var(--accent); color: #fff; border-color: var(--accent); }
</style>
