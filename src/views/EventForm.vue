<template>
  <div class="event-form-view">
    <h1>{{ isEditing ? 'Editar evento' : 'Crear evento' }}</h1>
    <form @submit.prevent="handleSubmit" class="event-form">
      <div class="form-row">
        <label for="title">Título</label>
        <input id="title" v-model="form.title" type="text" required />
      </div>
      <div class="form-row">
        <label for="description">Descripción</label>
        <textarea id="description" v-model="form.description"></textarea>
      </div>
      <div class="form-row">
        <label for="location">Ubicación</label>
        <input id="location" v-model="form.location" type="text" />
      </div>
      <div class="form-row">
        <label for="date">Fecha y hora</label>
        <input id="date" v-model="form.date" type="datetime-local" />
      </div>
      <div class="form-row">
        <label for="cover">Imagen de portada</label>
        <input id="cover" type="file" @change="onFileChange" />
      </div>
      <p v-if="eventsStore.error" class="error">{{ eventsStore.error }}</p>
      <button type="submit" :disabled="eventsStore.loading">
        {{ isEditing ? 'Guardar cambios' : 'Crear evento' }}
      </button>
      <button type="button" @click="cancel" class="secondary">Cancelar</button>
    </form>
  </div>
</template>

<script setup>
import { reactive, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEventsStore } from '../stores/events.js';

const route = useRoute();
const router = useRouter();
const eventsStore = useEventsStore();

// Reactive form state
const form = reactive({
  title: '',
  description: '',
  location: '',
  date: '',
  cover: null
});

// Determine if we are editing an existing event
const isEditing = computed(() => !!route.params.id);

// On mount: if editing, load the existing event and prefill the form
onMounted(async () => {
  if (isEditing.value) {
    await eventsStore.fetchEvent(route.params.id);
    const event = eventsStore.currentEvent;
    if (event) {
      form.title = event.title || '';
      form.description = event.description || '';
      form.location = event.location || '';
      // PocketBase stores date/time in ISO 8601; convert to local value for datetime-local input
      form.date = event.date ? event.date.substring(0, 16) : '';
    }
  }
});

// Handle file input changes
function onFileChange(event) {
  const file = event.target.files[0];
  form.cover = file || null;
}

// Cancel navigation back to events list
function cancel() {
  router.push('/events');
}

// Submit form to create or update event
async function handleSubmit() {
  const data = new FormData();
  data.append('title', form.title);
  data.append('description', form.description);
  data.append('location', form.location);
  if (form.date) data.append('date', form.date);
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
.event-form-view {
  max-width: 600px;
  margin: 2rem auto;
  padding: 1rem;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.event-form .form-row {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}
.event-form label {
  margin-bottom: 0.25rem;
}
.event-form input,
.event-form textarea {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.event-form button {
  margin-right: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.event-form button:not(.secondary) {
  background-color: #3182ce;
  color: white;
}
.event-form button.secondary {
  background-color: #e2e8f0;
  color: #2d3748;
}
.error {
  color: #b00020;
}
</style>