<template>
  <!-- 
    Componente de barra lateral (Sidebar) para toda la aplicación.
    - Representa la barra lateral de navegación de la aplicación.
    - Muestra los enlaces principales (Inicio, Fotos, Amigos, etc.)
      según si el usuario está autenticado o no.
    - También incluye enlaces contextuales dependiendo de la ruta actual.
  -->
  <aside class="sidebar" data-component="Sidebar">
    <!-- Navegación principal -->
    <nav class="sidebar-nav" aria-label="Principal" data-component="SiteNav">
      <!-- Recorre la lista total de enlaces combinados -->
      <RouterLink
        v-for="link in allLinks"
        :key="link.to"
        :to="link.to"
        data-part="nav-link"
      >
        {{ link.label }}
      </RouterLink>
    </nav>
  </aside>
</template>

<script setup>
/* 
  ==========================
   SCRIPT LÓGICO DE SIDEBAR
  ==========================
   - Determina qué enlaces mostrar según el estado de sesión.
   - Añade enlaces adicionales en función de la página actual.
   - Evita duplicados combinando enlaces base + contextuales.
*/
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth.js'; // Estado global de autenticación

const route = useRoute();
const auth = useAuthStore();

/* 
  Determina si el usuario está autenticado
  → Se usa para decidir qué enlaces base mostrar.
*/
const isAuthed = computed(() => auth.isAuthenticated);

/* 
  ============================
   ENLACES PRINCIPALES (base)
  ============================
   - Si el usuario ha iniciado sesión → menú completo.
   - Si no → solo la página de Inicio (pública).
*/
const baseLinks = computed(() => {
  if (isAuthed.value) {
    return [
      { to: '/home',    label: '🏠 Inicio' },
      { to: '/photos',  label: '🖼️ Fotos' },
      { to: '/friends', label: '👥 Amigos' },
      { to: '/chats',   label: '💬 Chats' },
      { to: '/events',  label: '🎉 Eventos' },
    ];
  }
  // Usuario sin sesión → solo acceso a la landing principal
  return [{ to: '/', label: '🏠 Inicio' }];
});

/* 
  ======================
   ENLACES CONTEXTUALES
  ======================
   - Añade enlaces específicos según la página actual.
   - Ejemplo: si estás en /contact → añade “✉️ Contacto” al menú.
   - Esto mejora la accesibilidad y consistencia de navegación.
*/
const contextualLinks = computed(() => {
  const extras = [];
  const { name, path } = route;

  if (name === 'contact' || path === '/contact') {
    extras.push({ to: '/contact', label: '✉️ Contacto' });
  }
  if (name === 'legalpolitics' || path === '/legalpolitics') {
    extras.push({ to: '/legalpolitics', label: '⚖️ Políticas' });
  }
  if (name === 'profile' || path === '/profile') {
    extras.push({ to: '/profile', label: '👤 Perfil' });
  }
  if (name === 'friends' || path === '/friends') {
    extras.push({ to: '/friends', label: '👥 Amigos' });
  }

  return extras;
});

/* 
  ============================
   ENLACES COMBINADOS (final)
  ============================
   - Une los enlaces base y los contextuales.
   - Usa un Map() para eliminar duplicados según su “to”.
   - Resultado → lista final `allLinks` usada en el template.
*/
const allLinks = computed(() => {
  const map = new Map();
  [...baseLinks.value, ...contextualLinks.value].forEach(l => map.set(l.to, l));
  return [...map.values()];
});
</script>
