<template>
  <div class="events-list-view">
    <header class="header">
      <h1>Eventos</h1>
      <div class="actions">
        <button @click="goToCreate">Crear evento</button>
        <button @click="logout">Cerrar sesión</button>
      </div>
    </header>
    <div v-if="eventsStore.loading" class="loading">Cargando eventos…</div>
    <div v-else>
      <p v-if="eventsStore.events.length === 0">No hay eventos disponibles.</p>
      <ul class="event-list">
        <li v-for="event in eventsStore.events" :key="event.id" class="event-item">
          <router-link :to="`/events/${event.id}`">{{ event.title }}</router-link>
          <button @click="remove(event.id)">Eliminar</button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useEventsStore } from '../stores/events.js';
import { useAuthStore } from '../stores/auth.js';

const router = useRouter();
const eventsStore = useEventsStore();
const authStore = useAuthStore();

onMounted(() => {
  eventsStore.fetchEvents();
});

function goToCreate() {
  router.push('/events/create');
}

async function remove(id) {
  if (confirm('¿Seguro que desea borrar este evento?')) {
    await eventsStore.deleteEvent(id);
  }
}

function logout() {
  authStore.logout();
  router.push('/login');
}
</script>

<style scoped>
.events-list-view {
  max-width: 600px;
  margin: 2rem auto;
  padding: 1rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.actions button {
  margin-left: 0.5rem;
}
.event-list {
  list-style: none;
  padding: 0;
}
.event-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}
.event-item:last-child {
  border-bottom: none;
}
.event-item button {
  background: #e53e3e;
  color: #fff;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
}
.loading {
  text-align: center;
  color: #666;
}
</style>