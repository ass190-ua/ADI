<template>
  <aside class="sidebar" data-component="Sidebar">
    <nav class="sidebar-nav" aria-label="Principal" data-component="SiteNav">
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
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

const route = useRoute();
const auth = useAuthStore();

const isAuthed = computed(() => auth.isAuthenticated);

// Base de enlaces según sesión
const baseLinks = computed(() => {
  if (isAuthed.value) {
    return [
      { to: '/home',   label: '🏠 Inicio' },
      { to: '/photos', label: '🖼️ Fotos' },
      { to: '/chats',  label: '💬 Chats' },
      { to: '/events', label: '🎉 Eventos' },
    ];
  }
  // Sin sesión → solo Inicio (landing)
  return [{ to: '/', label: '🏠 Inicio' }];
});

// Enlaces contextuales (añadir Contacto/Políticas si estás en esas páginas)
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

  
  return extras;
});

// Unimos base + contextuales sin duplicados
const allLinks = computed(() => {
  const map = new Map();
  [...baseLinks.value, ...contextualLinks.value].forEach(l => map.set(l.to, l));
  return [...map.values()];
});
</script>

