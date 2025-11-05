<template>
  <div class="page home" data-component="MainLayout">
    <AppHeader variant="private" />

    <main class="app-shell" data-component="AppShell">
      <AppSidebar />

      <!-- Contenido principal de inicio -->
      <section class="app-main container" aria-labelledby="home-title" data-component="HomeContent">
        <!-- Hero compacto con buscador y accesos rápidos -->
        <div class="card pad" style="margin-bottom:16px; overflow:hidden; position:relative;" data-component="HeroCard">
          <div style="position:absolute; inset:-20% -10% auto -10%; height:220px; z-index:0; background:
              radial-gradient(600px 280px at 15% 40%, rgba(122,162,247,.18), transparent 70%),
              radial-gradient(600px 280px at 85% 20%, rgba(166,218,149,.14), transparent 70%);
              filter: blur(2px);" data-part="background">
          </div>
          <div style="position:relative; z-index:1;" data-part="content">
            <h1 id="home-title" class="h2" style="margin:0 0 6px;" data-part="title">
              {{ greeting }}
            </h1>
            <p class="p" style="margin:0 0 12px;" data-part="subtitle">
              Organiza recuerdos, conversa con quien quieras y crea eventos únicos.
            </p>
            <!-- Buscador (no funcional) -->
            <form role="search" aria-label="Buscar" class="row" style="gap:10px; flex-wrap:wrap;" @submit.prevent="noop" data-component="SearchBar">
              <div class="input" style="flex:1; min-width:220px;" data-part="field">
                <label class="visually-hidden" for="searchAll">Buscar</label>
                <input id="searchAll" type="search" placeholder="Buscar fotos, chats o eventos…" data-part="input" v-model="searchText">
              </div>
              <button class="btn" style="color:white;" data-part="button" type="submit">Buscar</button>
            </form>
            <!-- Accesos rápidos -->
            <div class="row" style="gap:10px; margin-top:12px; flex-wrap:wrap;" data-component="QuickActions">
              <router-link class="chip" to="/photos" data-part="chip">📥 Subir fotos</router-link>
              <router-link class="chip" to="/chats" data-part="chip">➕ Nuevo chat</router-link>
              <router-link class="chip" to="/events/create" data-part="chip">🗓️ Crear evento</router-link>
            </div>
          </div>
        </div>
        <!-- Tarjetas principales -->
        <div class="grid grid-cards" style="margin-top:12px;" data-component="MainCards">
          <router-link class="card link pad" to="/photos" aria-label="Ir a Fotos y vídeos" data-component="MainCard">
            <div class="title" data-part="title">Tus fotos y vídeos</div>
            <div class="p" data-part="desc">Organiza por álbumes y momentos</div>
          </router-link>
          <router-link class="card link pad" to="/chats" aria-label="Ir a Chats" data-component="MainCard">
            <div class="title" data-part="title">Chats</div>
            <div class="p" data-part="desc">Privados y grupales</div>
          </router-link>
          <router-link class="card link pad" to="/events" aria-label="Ir a Eventos" data-component="MainCard">
            <div class="title" data-part="title">Eventos</div>
            <div class="p" data-part="desc">Cumples, viajes, bodas… con mini-juegos</div>
          </router-link>
          <router-link class="card link pad" to="/profile" aria-label="Ir a tu Perfil" data-component="MainCard">
            <div class="title" data-part="title">Tu perfil</div>
            <div class="p" data-part="desc">Amigos, ajustes e idioma</div>
          </router-link>
        </div>
        <!-- Actividad reciente -->
        <section v-if="recentEvents.length > 0" class="card pad" data-component="RecentActivity" style="margin-top:16px;">
          <div class="title">Actividad reciente</div>
          <div class="list" data-part="list">
            <div v-for="rec in recentEvents" :key="rec.id" class="list-item" data-component="ActivityItem">
              <div class="avatar" data-part="avatar">
                <img :src="userAvatarForActivity" alt="Avatar" />
              </div>
              <div data-part="content">
                <div data-part="text">
                  Has {{ rec.updated === rec.created ? 'creado' : 'actualizado' }} <strong>{{ rec.title || 'Evento' }}</strong>
                  <span v-if="rec.location"> — {{ rec.location }}</span>
                </div>
                <small class="p" data-part="time">{{ timeAgo(rec.updated || rec.created) }}</small>
              </div>
              <span class="meta" data-part="meta">{{ rec.location || 'Eventos' }}</span>
            </div>
          </div>
        </section>
      </section>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import AppHeader from '../components/AppHeader.vue';
import AppSidebar from '../components/AppSidebar.vue';
import AppFooter from '../components/AppFooter.vue';

import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { pb } from '../services/pb.js';

const router = useRouter();
const authStore = useAuthStore();

// Search text (unused yet, reserved for future search)
const searchText = ref('');

// Computed user details
const user = computed(() => authStore.user);
const avatarUrl = computed(() => {
  if (user.value?.avatar) {
    return pb.files.getUrl(user.value, user.value.avatar, { token: pb.authStore.token, thumb: '100x100' });
  }
  return null;
});
const userInitials = computed(() => {
  const name = user.value?.name || user.value?.username || '';
  return name
    .toString()
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
});

// Greeting based on user name
const greeting = computed(() => {
  const name = user.value?.name || user.value?.username;
  return name ? `¡Hola, ${name}!` : '¡Bienvenido a tu espacio!';
});

// Recent events
const recentEvents = ref([]);
const loadingRecent = ref(false);

// Derive avatar for activity list; fallback to default perfil.jpg in assets
const userAvatarForActivity = computed(() => {
  if (user.value?.avatar) {
    return pb.files.getUrl(user.value, user.value.avatar, { token: pb.authStore.token, thumb: '100x100' });
  }
  return '/assets/img/perfil.jpg';
});

function timeAgo(dateStr) {
  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
  const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  const map = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1]
  ];
  for (const [unit, sec] of map) {
    const val = Math.floor(diffSec / sec);
    if (Math.abs(val) >= 1) return rtf.format(-val, unit);
  }
  return rtf.format(0, 'second');
}

// Load recent events on mount
onMounted(async () => {
  if (!authStore.isAuthenticated) return;
  loadingRecent.value = true;
  try {
    const res = await pb.collection('events').getList(1, 5, { sort: '-updated' });
    recentEvents.value = res.items;
  } catch (err) {
    console.error('Error loading recent events', err);
  } finally {
    loadingRecent.value = false;
  }
});

function logout() {
  authStore.logout();
  router.push({ name: 'login' });
}

function noop() {
  /* intentionally empty: search feature not implemented */
}
</script>

<style scoped>
/* Avatar initials circle styling to match original */
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