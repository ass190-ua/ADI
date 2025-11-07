<template>
  <div class="event-form-view">
    <!-- Título dinámico según estemos creando o editando -->
    <h1>{{ isEditing ? 'Editar evento' : 'Crear evento' }}</h1>

    <!-- Formulario principal. Evitamos recarga con @submit.prevent -->
    <form @submit.prevent="handleSubmit" class="event-form">
      <!-- Campo: Título (obligatorio por required) -->
      <div class="form-row">
        <label for="title">Título</label>
        <input id="title" v-model="form.title" type="text" required />
      </div>

      <!-- Campo: Descripción (opcional) -->
      <div class="form-row">
        <label for="description">Descripción</label>
        <textarea id="description" v-model="form.description"></textarea>
      </div>

      <!-- Campo: Ubicación (texto libre: dirección, enlace Meet, etc.) -->
      <div class="form-row">
        <label for="location">Ubicación</label>
        <input id="location" v-model="form.location" type="text" />
      </div>

      <!-- Campo: Fecha y hora (datetime-local usa hora local del navegador) -->
      <div class="form-row">
        <label for="date">Fecha y hora</label>
        <input id="date" v-model="form.date" type="datetime-local" />
      </div>

      <!-- Campo: Portada (archivo). Se gestiona en onFileChange -->
      <div class="form-row">
        <label for="cover">Imagen de portada</label>
        <input id="cover" type="file" @change="onFileChange" />
      </div>

      <!-- Errores del store, si los hubiera -->
      <p v-if="eventsStore.error" class="error">{{ eventsStore.error }}</p>

      <!-- Botones de acción. Desactivamos submit si el store está cargando -->
      <button type="submit" :disabled="eventsStore.loading">
        {{ isEditing ? 'Guardar cambios' : 'Crear evento' }}
      </button>
      <button type="button" @click="cancel" class="secondary">Cancelar</button>
    </form>
  </div>
</template>

<script setup>
// Composition API y router
import { reactive, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
// Store de eventos (CRUD PocketBase)
import { useEventsStore } from '../stores/events.js';

const route = useRoute();
const router = useRouter();
const eventsStore = useEventsStore();

/**
 * Estado reactivo del formulario.
 * - 'date' sigue el formato que espera <input type="datetime-local">: "YYYY-MM-DDTHH:mm"
 * - 'cover' guarda el File seleccionado (o null si no se seleccionó)
 */
const form = reactive({
  title: '',
  description: '',
  location: '',
  date: '',
  cover: null
});

/**
 * Modo edición vs creación
 * Si existe :id en la ruta → edición; en caso contrario → creación.
 */
const isEditing = computed(() => !!route.params.id);

/**
 * Al montar el componente:
 * - Si estamos en edición, pedimos el evento actual al store.
 * - Rellenamos el formulario con los datos recuperados.
 *   Nota: PocketBase guarda fechas en ISO 8601 (UTC normalmente).
 *   Aquí se usa substring(0,16) como aproximación rápida para <datetime-local>.
 *   Si necesitas exactitud de zona horaria, convierte a local con TZ offset.
 */
onMounted(async () => {
  if (isEditing.value) {
    await eventsStore.fetchEvent(route.params.id);
    const event = eventsStore.currentEvent;
    if (event) {
      form.title = event.title || '';
      form.description = event.description || '';
      form.location = event.location || '';
      // Para <input datetime-local> usamos "YYYY-MM-DDTHH:mm".
      // Esto asume que event.date viene en ISO (ej: "2025-01-01T12:30:00.000Z").
      // substring(0,16) corta hasta los minutos: "YYYY-MM-DDTHH:mm".
      form.date = event.date ? event.date.substring(0, 16) : '';
    }
  }
});

/**
 * Maneja el cambio de archivo en el input de portada:
 * - Guarda el File en form.cover o lo pone en null si se limpia.
 */
function onFileChange(event) {
  const file = event.target.files[0];
  form.cover = file || null;
}

/**
 * Cancelar: vuelve al listado de eventos sin guardar cambios.
 */
function cancel() {
  router.push('/events');
}

/**
 * Envío del formulario:
 * - Construye un FormData con todos los campos.
 * - Si hay 'cover', se adjunta (soporta upload de archivos en PocketBase).
 * - Decide entre update o create según isEditing.
 * - Al finalizar, navega a /events.
 *
 * NOTA sobre fechas:
 * - Aquí se envía form.date tal cual (formato "YYYY-MM-DDTHH:mm").
 * - Si el backend requiere ISO UTC, puedes convertir:
 *     new Date(form.date).toISOString()
 *   y enviar ese valor en lugar del local.
 */
async function handleSubmit() {
  const data = new FormData();
  data.append('title', form.title);
  data.append('description', form.description);
  data.append('location', form.location);
  if (form.date) data.append('date', form.date); // ← cambiar a toISOString() si el backend lo exige
  if (form.cover) data.append('cover', form.cover);

  if (isEditing.value) {
    await eventsStore.updateEvent(route.params.id, data);
  } else {
    await eventsStore.createEvent(data);
  }
  router.push('/events');
}
</script>

<style scoped>
/* Contenedor visual del formulario (ancho máximo y tarjeta sencilla) */
.event-form-view {
  max-width: 600px;
  margin: 2rem auto;
  padding: 1rem;
  background-color: #fff; /* En tu tema oscuro podrías usar var(--panel) aquí */
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Distribución de cada fila del formulario */
.event-form .form-row {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}

/* Etiquetas más separadas del control */
.event-form label {
  margin-bottom: 0.25rem;
}

/* Inputs y textarea con borde simple y padding estándar */
.event-form input,
.event-form textarea {
  padding: 0.5rem;
  border: 1px solid #ccc; /* En tema: usar var(--border) */
  border-radius: 4px;
}

/* Botones: primario y secundario */
.event-form button {
  margin-right: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* Botón primario (submit) */
.event-form button:not(.secondary) {
  background-color: #3182ce; /* En tema: var(--primary) */
  color: white;
}

/* Botón secundario (cancelar) */
.event-form button.secondary {
  background-color: #e2e8f0;
  color: #2d3748;
}

/* Texto de error proveniente del store */
.error {
  color: #b00020; /* En tema: var(--error) */
}
</style>
<template>
  <div class="event-form-view">
    <!-- Título dinámico según estemos creando o editando -->
    <h1>{{ isEditing ? 'Editar evento' : 'Crear evento' }}</h1>

    <!-- Formulario principal. Evitamos recarga con @submit.prevent -->
    <form @submit.prevent="handleSubmit" class="event-form">
      <!-- Campo: Título (obligatorio por required) -->
      <div class="form-row">
        <label for="title">Título</label>
        <input id="title" v-model="form.title" type="text" required />
      </div>

      <!-- Campo: Descripción (opcional) -->
      <div class="form-row">
        <label for="description">Descripción</label>
        <textarea id="description" v-model="form.description"></textarea>
      </div>

      <!-- Campo: Ubicación (texto libre: dirección, enlace Meet, etc.) -->
      <div class="form-row">
        <label for="location">Ubicación</label>
        <input id="location" v-model="form.location" type="text" />
      </div>

      <!-- Campo: Fecha y hora (datetime-local usa hora local del navegador) -->
      <div class="form-row">
        <label for="date">Fecha y hora</label>
        <input id="date" v-model="form.date" type="datetime-local" />
      </div>

      <!-- Campo: Portada (archivo). Se gestiona en onFileChange -->
      <div class="form-row">
        <label for="cover">Imagen de portada</label>
        <input id="cover" type="file" @change="onFileChange" />
      </div>

      <!-- Errores del store, si los hubiera -->
      <p v-if="eventsStore.error" class="error">{{ eventsStore.error }}</p>

      <!-- Botones de acción. Desactivamos submit si el store está cargando -->
      <button type="submit" :disabled="eventsStore.loading">
        {{ isEditing ? 'Guardar cambios' : 'Crear evento' }}
      </button>
      <button type="button" @click="cancel" class="secondary">Cancelar</button>
    </form>
  </div>
</template>

<script setup>
// Composition API y router
import { reactive, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
// Store de eventos (CRUD PocketBase)
import { useEventsStore } from '../stores/events.js';

const route = useRoute();
const router = useRouter();
const eventsStore = useEventsStore();

/**
 * Estado reactivo del formulario.
 * - 'date' sigue el formato que espera <input type="datetime-local">: "YYYY-MM-DDTHH:mm"
 * - 'cover' guarda el File seleccionado (o null si no se seleccionó)
 */
const form = reactive({
  title: '',
  description: '',
  location: '',
  date: '',
  cover: null
});

/**
 * Modo edición vs creación
 * Si existe :id en la ruta → edición; en caso contrario → creación.
 */
const isEditing = computed(() => !!route.params.id);

/**
 * Al montar el componente:
 * - Si estamos en edición, pedimos el evento actual al store.
 * - Rellenamos el formulario con los datos recuperados.
 *   Nota: PocketBase guarda fechas en ISO 8601 (UTC normalmente).
 *   Aquí se usa substring(0,16) como aproximación rápida para <datetime-local>.
 *   Si necesitas exactitud de zona horaria, convierte a local con TZ offset.
 */
onMounted(async () => {
  if (isEditing.value) {
    await eventsStore.fetchEvent(route.params.id);
    const event = eventsStore.currentEvent;
    if (event) {
      form.title = event.title || '';
      form.description = event.description || '';
      form.location = event.location || '';
      // Para <input datetime-local> usamos "YYYY-MM-DDTHH:mm".
      // Esto asume que event.date viene en ISO (ej: "2025-01-01T12:30:00.000Z").
      // substring(0,16) corta hasta los minutos: "YYYY-MM-DDTHH:mm".
      form.date = event.date ? event.date.substring(0, 16) : '';
    }
  }
});

/**
 * Maneja el cambio de archivo en el input de portada:
 * - Guarda el File en form.cover o lo pone en null si se limpia.
 */
function onFileChange(event) {
  const file = event.target.files[0];
  form.cover = file || null;
}

/**
 * Cancelar: vuelve al listado de eventos sin guardar cambios.
 */
function cancel() {
  router.push('/events');
}

/**
 * Envío del formulario:
 * - Construye un FormData con todos los campos.
 * - Si hay 'cover', se adjunta (soporta upload de archivos en PocketBase).
 * - Decide entre update o create según isEditing.
 * - Al finalizar, navega a /events.
 *
 * NOTA sobre fechas:
 * - Aquí se envía form.date tal cual (formato "YYYY-MM-DDTHH:mm").
 * - Si el backend requiere ISO UTC, puedes convertir:
 *     new Date(form.date).toISOString()
 *   y enviar ese valor en lugar del local.
 */
async function handleSubmit() {
  const data = new FormData();
  data.append('title', form.title);
  data.append('description', form.description);
  data.append('location', form.location);
  if (form.date) data.append('date', form.date); // ← cambiar a toISOString() si el backend lo exige
  if (form.cover) data.append('cover', form.cover);

  if (isEditing.value) {
    await eventsStore.updateEvent(route.params.id, data);
  } else {
    await eventsStore.createEvent(data);
  }
  router.push('/events');
}
</script>

<style scoped>
/* Contenedor visual del formulario (ancho máximo y tarjeta sencilla) */
.event-form-view {
  max-width: 600px;
  margin: 2rem auto;
  padding: 1rem;
  background-color: #fff; /* En tu tema oscuro podrías usar var(--panel) aquí */
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Distribución de cada fila del formulario */
.event-form .form-row {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}

/* Etiquetas más separadas del control */
.event-form label {
  margin-bottom: 0.25rem;
}

/* Inputs y textarea con borde simple y padding estándar */
.event-form input,
.event-form textarea {
  padding: 0.5rem;
  border: 1px solid #ccc; /* En tema: usar var(--border) */
  border-radius: 4px;
}

/* Botones: primario y secundario */
.event-form button {
  margin-right: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* Botón primario (submit) */
.event-form button:not(.secondary) {
  background-color: #3182ce; /* En tema: var(--primary) */
  color: white;
}

/* Botón secundario (cancelar) */
.event-form button.secondary {
  background-color: #e2e8f0;
  color: #2d3748;
}

/* Texto de error proveniente del store */
.error {
  color: #b00020; /* En tema: var(--error) */
}
</style>
