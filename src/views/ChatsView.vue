<template>
  <div class="page" data-component="MainLayout">
   <AppHeader variant="private" />

    <main class="app-shell" data-component="AppShell">
      <AppSidebar />
      
      <!-- Contenido de chats -->
      <section class="app-main container" data-component="ChatsContent">
        <h1 class="h2" style="margin:0 0 12px;" data-part="title">Chats</h1>
        <p class="p" style="margin-bottom:16px; opacity:.9;">Pronto podrás chatear con tus amigos y crear conversaciones grupales. Esta sección está en construcción.</p>
        <!-- Lista de chats simulada -->
        <div class="grid" style="gap:12px; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));" data-component="ChatList">
          <div v-for="n in 4" :key="n" class="card pad" data-component="ChatCard">
            <div class="row" style="justify-content:space-between; align-items:center;">
              <strong class="h5">Chat {{ n }}</strong>
              <span class="badge soft">Próximamente</span>
            </div>
            <p class="p" style="margin-top:6px; opacity:.8;">Funcionalidad de chat no implementada.</p>
          </div>
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

import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { pb } from '../services/pb.js';

const router = useRouter();
const authStore = useAuthStore();

const user = computed(() => authStore.user);
const avatarUrl = computed(() => {
  if (user.value?.avatar) {
    return pb.files.getUrl(user.value, user.value.avatar, { token: pb.authStore.token, thumb: '100x100' });
  }
  return null;
});
const userInitials = computed(() => {
  const n = user.value?.name || user.value?.username || '';
  return n.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
});

function logout() {
  authStore.logout();
  router.push({ name: 'login' });
}
</script>

<style scoped>
.avatar-initials {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: #334155;
  color: #e5e7eb;
  font-weight: 600;
  font-size: 14px;
}
</style>