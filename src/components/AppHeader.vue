<template>
  <!-- 
    Componente de cabecera (Header) para toda la aplicación.
    - Muestra la barra superior de la aplicación.
    - Cambia su comportamiento y contenido según el tipo de usuario:
      - 'public': usuarios no autenticados → solo logo visible.
      - 'private': usuarios autenticados → menú de usuario y logout.
  -->
  <header
    class="app-header"
    data-component="AppHeader"
    :data-variant="resolvedVariant"
  >
    <!-- ============ LOGO / MARCA ============ -->
    <div class="brand" data-part="brand">
      <!-- Enlace al inicio:
           - Si es público → lleva a "/"
           - Si es privado → lleva a "/home" -->
      <RouterLink
        class="logo"
        :to="resolvedVariant === 'public' ? '/' : '/home'"
        data-part="logo-link"
      >
        <img
          src="/assets/img/logo_header.png"
          alt="Memories+"
          data-part="logo-img"
        />
        <span class="visually-hidden">Memories+</span>
      </RouterLink>
    </div>

    <!-- ============ MENÚ HAMBURGUESA ============ -->
    <!-- Visible en pantallas pequeñas (si el CSS lo soporta). -->
    <input
      type="checkbox"
      id="menu-toggle"
      class="menu-toggle"
      aria-label="Abrir menú"
      data-part="menu-toggle"
    />
    <label
      for="menu-toggle"
      class="menu-btn"
      aria-hidden="true"
      data-part="menu-btn"
    >
      ☰
    </label>

    <!-- 
      Espacio reservado para la navegación principal.
      Actualmente vacío, pero puede incluir enlaces como:
      Inicio, Amigos, Mensajes, Configuración...
    -->
    <nav
      class="app-nav"
      aria-label="Secciones"
      data-part="nav"
    ></nav>

    <!-- ============ ACCIONES DEL USUARIO ============ -->
    <div class="user-actions" data-part="user-actions">

      <!-- Caso 1: Variante PÚBLICA → sin menú de usuario -->
      <template v-if="resolvedVariant === 'public'"></template>

      <!-- Caso 2: Variante PRIVADA → muestra menú de usuario -->
      <details class="user-menu" data-component="UserMenu" v-else>
        <summary aria-label="Abrir menú de usuario" data-part="summary">
          <!-- Avatar del usuario (imagen o iniciales) -->
          <img
            v-if="avatarUrl"
            class="avatar"
            :src="avatarUrl"
            alt="Tu avatar"
            data-part="avatar"
          />
          <div v-else class="avatar-initials">
            {{ initials }}
          </div>
        </summary>

        <!-- Menú desplegable con acciones -->
        <nav class="menu" aria-label="Menú de usuario" data-part="menu">
          <RouterLink to="/profile" data-part="menu-item">👤 Perfil</RouterLink>
          <a href="#" @click.prevent="onLogout" data-part="menu-item">⏻ Cerrar sesión</a>
        </nav>
      </details>
    </div>
  </header>
</template>

<script setup>
/* 
  ==========================
   SCRIPT LÓGICO DEL HEADER
  ==========================
   - Controla el estado del usuario (autenticado o no).
   - Muestra avatar e iniciales.
   - Gestiona la acción de cierre de sesión.
*/
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { pb } from '../services/pb.js';       // PocketBase (gestiona archivos y sesión)
import { useAuthStore } from '../stores/auth.js'; // Estado global de autenticación

// Props: permite forzar una variante (public/private) manualmente
const props = defineProps({
  variant: { type: String, default: null } // 'public' | 'private' | null
});

const router = useRouter();
const auth = useAuthStore();

/* 
  Determina el modo actual del header:
  - Si se pasa explícitamente como prop, la usa.
  - Si no, se basa en si el usuario está autenticado.
*/
const resolvedVariant = computed(() =>
  props.variant ?? (auth.isAuthenticated ? 'private' : 'public')
);

// Datos del usuario autenticado
const me = computed(() => auth.user);

/* 
  Obtiene la URL del avatar del usuario desde PocketBase.
  Si el usuario no tiene avatar o falla la carga → devuelve null.
*/
const avatarUrl = computed(() => {
  const u = me.value;
  if (u?.avatar) {
    try {
      return pb.files.getUrl(u, u.avatar, { token: pb.authStore.token, thumb: '100x100' });
    } catch {
      return null;
    }
  }
  return null;
});

/* 
  Si no hay imagen de avatar, genera iniciales a partir del nombre o username.
  Ejemplo: “María López” → “ML”
*/
const initials = computed(() => {
  const name = me.value?.name || me.value?.username || '?';
  return name
    .toString()
    .trim()
    .split(/\s+/)
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
});

/* 
  Cierra sesión:
  - Llama al método logout del store.
  - Redirige al usuario al login.
*/
function onLogout() {
  auth.logout();
  router.push('/login');
}
</script>
