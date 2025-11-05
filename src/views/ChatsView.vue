<template>
  <div class="page" data-component="MainLayout">
    <AppHeader variant="private" />
    <main class="app-shell" data-component="AppShell">
      <AppSidebar />
      <section class="app-main container" data-component="ChatsContent">
        <h1 class="h2" style="margin: 0 0 12px" data-part="title">Chats</h1>
        <div class="row" style="gap: 16px" data-part="chat-container">
          <!-- Lista de conversaciones -->
          <aside class="chat-list" style="flex: 1; max-width: 280px" data-part="chat-list">
            <div class="row" style="justify-content: space-between; align-items: center; margin-bottom: 8px">
              <h2 class="h5" style="margin: 0">Conversaciones</h2>
              <button class="btn btn-sm primary" @click="showGroupForm = !showGroupForm">Nuevo grupo</button>
            </div>
            <ul class="list" style="margin-top: 4px; list-style: none; padding: 0">
              <li
                v-for="convo in chatStore.conversations"
                :key="convo.id"
                :class="{ selected: convo.id === chatStore.currentConversationId }"
                @click="selectConversation(convo.id)"
                style="padding: 8px; border-radius: 4px; cursor: pointer"
              >
                <strong>{{ conversationName(convo) }}</strong>
              </li>
            </ul>
          </aside>
          <!-- Panel de mensajes -->
          <div class="chat-messages" style="flex: 3; border-left: 1px solid #ddd; padding-left: 16px" data-part="chat-messages">
            <div v-if="chatStore.currentConversationId">
              <h3 class="h5" style="margin-top: 0" data-part="conversation-title">{{ currentConversationTitle }}</h3>
              <div class="messages-list" style="max-height: 360px; overflow-y: auto; border: 1px solid #eee; padding: 8px; margin-top: 8px">
                <div v-for="msg in chatStore.messages[chatStore.currentConversationId]" :key="msg.id" style="margin-bottom: 6px">
                  <strong>{{ msg.expand?.sender?.username || msg.expand?.sender?.name || 'Usuario' }}</strong>:
                  <span>{{ msg.content }}</span>
                </div>
              </div>
              <form @submit.prevent="send" class="row" style="margin-top: 8px" data-part="message-form">
                <input v-model="newMessage" type="text" placeholder="Escribe un mensaje" class="input" style="flex: 1; margin-right: 8px" />
                <button type="submit" class="btn primary">Enviar</button>
              </form>
            </div>
            <div v-else>
              <p>Selecciona una conversación para comenzar.</p>
            </div>
          </div>
        </div>
        <!-- Modal para crear grupos -->
        <div v-if="showGroupForm" class="group-modal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.4); display: flex; align-items: center; justify-content: center" data-part="group-modal">
          <div style="background: white; padding: 16px; border-radius: 8px; width: 90%; max-width: 400px">
            <h2 class="h5" style="margin-top: 0">Crear grupo</h2>
            <form @submit.prevent="createGroup">
              <div class="form-control" style="margin-bottom: 8px">
                <label for="group-name">Nombre del grupo</label>
                <input id="group-name" v-model="groupName" type="text" class="input" />
              </div>
              <div class="form-control" style="margin-bottom: 8px">
                <label>Participantes</label>
                <div v-for="friend in chatStore.friends" :key="friend.id" style="margin-bottom: 4px">
                  <label>
                    <input type="checkbox" :value="friend.id" v-model="selectedFriends" />
                    {{ friend.username || friend.name || friend.email }}
                  </label>
                </div>
                <p v-if="chatStore.friends.length === 0" style="font-style: italic; opacity: 0.8">Aún no tienes amigos disponibles para añadir.</p>
              </div>
              <div class="row" style="justify-content: flex-end; gap: 8px">
                <button type="button" class="btn" @click="closeGroupForm">Cancelar</button>
                <button type="submit" class="btn primary">Crear</button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
    <AppFooter />
  </div>
</template>

<script setup>
import { onMounted, watch, ref, computed } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import AppHeader from '../components/AppHeader.vue';
import AppSidebar from '../components/AppSidebar.vue';
import AppFooter from '../components/AppFooter.vue';
import { useChatStore } from '../stores/chat.js';

const chatStore = useChatStore();
const auth = useAuthStore();

const newMessage = ref('');
const groupName = ref('');
const selectedFriends = ref([]);
const showGroupForm = ref(false);

// Cargar conversaciones y amigos al montar
onMounted(async () => {
  await chatStore.fetchFriends();
  await chatStore.fetchConversations();
});

// Observa cambios en la conversación actual para cargar mensajes y suscribirse a actualizaciones
watch(
  () => chatStore.currentConversationId,
  async (newId, oldId) => {
    if (oldId) {
      await chatStore.unsubscribeFromConversation();
    }
    if (newId) {
      await chatStore.fetchMessages(newId);
      await chatStore.subscribeToConversation(newId);
    }
  }
);

// Computados para obtener la conversación actual y su título
const currentConversation = computed(() => {
  return chatStore.conversations.find((c) => c.id === chatStore.currentConversationId);
});

const currentConversationTitle = computed(() => {
  if (!currentConversation.value) return '';
  return conversationName(currentConversation.value);
});

// Obtiene un nombre amigable para una conversación (privada o grupal)
function conversationName(convo) {
  if (!convo) return '';
  if (!convo.isGroup) {
    // En conversaciones privadas, muestra el nombre del otro participante
    const participants = convo.expand?.participants || [];
    // Excluye al usuario actual
    const meId = auth.user?.id;
    const friend = participants.find((p) => p.id !== meId);
    return friend?.username || friend?.name || friend?.email || 'Chat privado';
  }
  return convo.name || 'Grupo';
}

// Selecciona una conversación del listado
function selectConversation(id) {
  chatStore.currentConversationId = id;
  newMessage.value = '';
}

// Envía un mensaje en la conversación actual
async function send() {
  const content = newMessage.value?.trim();
  if (!content) return;
  await chatStore.sendMessage(chatStore.currentConversationId, content);
  newMessage.value = '';
}

// Cerrar el formulario de creación de grupos y limpiar campos
function closeGroupForm() {
  showGroupForm.value = false;
  groupName.value = '';
  selectedFriends.value = [];
}

// Crear un nuevo grupo con el nombre y participantes seleccionados
async function createGroup() {
  if (!groupName.value || selectedFriends.value.length === 0) return;
  await chatStore.createGroupConversation(groupName.value, selectedFriends.value);
  closeGroupForm();
}
</script>

<style scoped>
.chat-list li.selected {
  background: #e5e7eb;
}
.messages-list {
  height: 360px;
  overflow-y: auto;
}
.group-modal input[type='checkbox'] {
  margin-right: 6px;
}
</style>