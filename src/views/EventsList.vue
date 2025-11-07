<template>
  <div class="events-list-view">
    <!-- Header local de la vista: título + acciones rápidas -->
    <header class="header">
      <h1>Eventos</h1>
      <div class="actions">
        <!-- Crea un nuevo evento: navega a /events/create -->
        <button @click="goToCreate">Crear evento</button>
        <!-- Cierra sesión (usa el store de auth) -->
        <button @click="logout">Cerrar sesión</button>
      </div>
    </header>

    <!-- Estado de carga mientras el store trae los datos -->
    <div v-if="eventsStore.loading" class="loading">Cargando eventos…</div>

    <!-- Contenido principal cuando terminó de cargar -->
    <div v-else>
      <!-- Mensaje de “sin resultados” si no hay eventos -->
      <p v-if="eventsStore.events.length === 0">No hay eventos disponibles.</p>

      <!-- Listado simple de eventos. Cada item:
           - Enlace al detalle (/events/:id)
           - Botón para eliminar -->
      <ul class="event-list">
        <li
          v-for="event in eventsStore.events"
          :key="event.id"
          class="event-item"
        >
          <!-- Enlace al detalle del evento -->
          <router-link :to="`/events/${event.id}`">
            {{ event.title }}
          </router-link>

          <!-- Eliminar evento (pide confirmación) -->
          <button @click="remove(event.id)">Eliminar</button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
// Ciclo de vida y router
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';

// Stores: eventos (CRUD) + auth (sesión)
import { useEventsStore } from '../stores/events.js';
import { useAuthStore } from '../stores/auth.js';

const router = useRouter();
const eventsStore = useEventsStore();
const authStore  = useAuthStore();

/**
 * onMounted:
 * Carga inicial del listado de eventos.
 * - fetchEvents() trae la primera página (por defecto 10) ordenados por fecha de creación desc.
 * - Si necesitas filtros/paginación, pásalos aquí o añade controles en UI.
 */
onMounted(() => {
  eventsStore.fetchEvents();
});

/**
 * Navegación a la vista de creación.
 */
function goToCreate() {
  router.push('/events/create');
}

/**
 * Eliminar evento:
 * - Pide confirmación al usuario.
 * - Llama a deleteEvent(id) del store (borra en backend y limpia el estado local).
 */
async function remove(id) {
  if (confirm('¿Seguro que desea borrar este evento?')) {
    await eventsStore.deleteEvent(id);
  }
}

/**
 * Cerrar sesión:
 * - Limpia la sesión en el store y devuelve al login.
 */
function logout() {
  authStore.logout();
  router.push('/login');
}
</script>

<style scoped>
/* Contenedor con anchura cómoda tipo “tarjeta” */
.events-list-view {
  max-width: 600px;
  margin: 2rem auto;
  padding: 1rem;
  background-color: #fff; /* TIP: en tu tema oscuro cambia por var(--panel) */
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Header local: título + acciones a la derecha */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

/* Separación entre botones de acción */
.actions button {
  margin-left: 0.5rem;
}

/* Lista limpia sin bullets */
.event-list {
  list-style: none;
  padding: 0;
}

/* Cada fila del listado: título a la izquierda, acciones a la derecha */
.event-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee; /* TIP: usa var(--border) si integras con tu tema */
}
.event-item:last-child {
  border-bottom: none;
}

/* Botón “Eliminar” con estilo de peligro */
.event-item button {
  background: #e53e3e; /* TIP: var(--error) en tu sistema de diseño */
  color: #fff;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
}

/* Estado de carga simple centrado */
.loading {
  text-align: center;
  color: #666; /* TIP: var(--muted) */
}
</style>
