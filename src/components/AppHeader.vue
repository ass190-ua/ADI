<template>
  <header
    class="app-header"
    data-component="AppHeader"
    :data-variant="resolvedVariant"
  >
    <!-- brand -->
    <div class="brand" data-part="brand">
      <RouterLink class="logo" :to="resolvedVariant==='public' ? '/' : '/home'" data-part="logo-link">
        <img src="/assets/img/logo_header.png" alt="Memories+" data-part="logo-img" />
        <span class="visually-hidden">Memories+</span>
      </RouterLink>
    </div>

    <!-- hamburguesa (si tu CSS la usa) -->
    <input type="checkbox" id="menu-toggle" class="menu-toggle" aria-label="Abrir menú" data-part="menu-toggle" />
    <label for="menu-toggle" class="menu-btn" aria-hidden="true" data-part="menu-btn">☰</label>

    <nav class="app-nav" aria-label="Secciones" data-part="nav"></nav>

    <div class="user-actions" data-part="user-actions">
      <!-- PÚBLICO: SOLO LOGO (nada más) -->
      <template v-if="resolvedVariant === 'public'"></template>

      <!-- PRIVADO: menú de usuario -->
      <details v-else class="user-menu" data-component="UserMenu">
        <summary aria-label="Abrir menú de usuario" data-part="summary">
          <img v-if="avatarUrl" class="avatar" :src="avatarUrl" alt="Tu avatar" data-part="avatar" />
          <div v-else class="avatar-initials">{{ initials }}</div>
        </summary>
        <nav class="menu" aria-label="Menú de usuario" data-part="menu">
          <RouterLink to="/profile" data-part="menu-item">👤 Perfil</RouterLink>
          <a href="#" @click.prevent="onLogout" data-part="menu-item">⏻ Cerrar sesión</a>
        </nav>
      </details>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { pb } from '../services/pb.js';
import { useAuthStore } from '../stores/auth.js';

const props = defineProps({
  // Si no pasas 'variant', se decide por sesión
  variant: { type: String, default: null } // 'public' | 'private' | null
});

const router = useRouter();
const auth = useAuthStore();

const resolvedVariant = computed(() =>
  props.variant ?? (auth.isAuthenticated ? 'private' : 'public')
);

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

function onLogout() {
  auth.logout();
  router.push('/login');
}
</script>

