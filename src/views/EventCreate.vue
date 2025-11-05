<template>
  <div class="page" data-component="MainLayout">
    <AppHeader variant="private" />

    <main class="app-shell" data-component="AppShell">
      <AppSidebar />

      <!-- Contenido principal -->
      <section class="app-main container" data-component="EventCreateContent">
        <h1 class="h2" style="margin:0 0 10px;" data-part="title">Crear evento</h1>
        <form class="card pad form" autocomplete="off" novalidate @submit.prevent="handleSubmit" @reset="resetForm" data-component="EventForm">
          <!-- Uploader de portada -->
          <figure class="cover-uploader card" data-component="CoverUploader">
            <img :src="coverPreview" alt="Portada del evento (opcional)" data-part="preview" />
            <input id="cover-file" ref="coverInput" name="cover" type="file" accept="image/*" aria-label="Subir portada" data-part="input" @change="onCoverChange" />
            <label for="cover-file" class="cover-badge" title="Subir portada" aria-label="Subir portada" data-part="button">📷 Subir portada</label>
          </figure>

          <div class="grid grid-2" style="margin-top:12px;" data-part="grid">
            <div class="input" data-part="field" style="grid-column: 1 / -1;">
              <label for="e-title" data-part="label">Título del evento</label>
              <input id="e-title" name="title" type="text" placeholder="Ej. Cumple de Alba" required v-model="form.title" data-part="input" />
            </div>
            <div class="input" data-part="field">
              <label for="e-date" data-part="label">Fecha y hora</label>
              <input id="e-date" name="date" type="datetime-local" required v-model="form.date" data-part="input" />
            </div>
            <div class="input" data-part="field">
              <label for="e-location" data-part="label">Ubicación</label>
              <input id="e-location" name="location" type="text" placeholder="Parque Central / https://meet..." v-model="form.location" data-part="input" />
            </div>
          </div>
          <div class="input" data-part="field">
            <label for="e-desc" data-part="label">Descripción</label>
            <textarea id="e-desc" name="description" rows="6" placeholder="Cuéntales a los invitados qué habrá, dress code, qué traer…" v-model="form.description" data-part="textarea"></textarea>
          </div>
          <div class="actions" style="justify-content:flex-end; gap:8px; margin-top:8px;" data-part="actions">
            <router-link class="btn ghost" :to="{ name: 'events' }" data-part="cancel">Cancelar</router-link>
            <button class="btn" type="reset" style="color: white;" data-part="reset">Limpiar</button>
            <button class="btn" type="submit" style="color: white;" :disabled="submitting" data-part="submit">
              {{ submitting ? 'Creando…' : '✅ Crear evento' }}
            </button>
          </div>
        </form>
        <p v-if="message" id="create-msg" class="p" style="margin-top:8px;">{{ message }}</p>
      </section>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import AppHeader from '../components/AppHeader.vue';
import AppSidebar from '../components/AppSidebar.vue';
import AppFooter from '../components/AppFooter.vue';

import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { useEventsStore } from '../stores/events.js';
import { pb } from '../services/pb.js';

const router = useRouter();
const authStore = useAuthStore();
const eventsStore = useEventsStore();

// Reactive form state
const form = reactive({
  title: '',
  date: '',
  location: '',
  description: ''
});

const submitting = ref(false);
const message = ref('');

// Cover file and preview handling
const coverInput = ref(null);
const coverFile = ref(null);
const coverPreview = ref('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"></svg>');

function onCoverChange() {
  const f = coverInput.value?.files?.[0];
  coverFile.value = f || null;
  if (!f) {
    coverPreview.value = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"></svg>';
    return;
  }
  const url = URL.createObjectURL(f);
  coverPreview.value = url;
  // Revoke after load
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function resetForm() {
  form.title = '';
  form.date = '';
  form.location = '';
  form.description = '';
  coverFile.value = null;
  coverPreview.value = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200"></svg>';
  message.value = '';
}

async function handleSubmit() {
  if (!form.title || !form.date) {
    message.value = 'El título y la fecha son obligatorios.';
    return;
  }
  submitting.value = true;
  message.value = '';
  // Construct FormData
  const fd = new FormData();
  fd.append('title', form.title.trim());
  // Convert local datetime to ISO
  if (form.date) {
    const d = new Date(form.date);
    fd.append('date', d.toISOString());
  }
  if (form.location) fd.append('location', form.location.trim());
  if (form.description) fd.append('description', form.description.trim());
  if (coverFile.value) fd.append('cover', coverFile.value);
  // Include current user id as organizer
  if (authStore.user?.id) fd.append('user', authStore.user.id);
  try {
    await eventsStore.createEvent(fd);
    message.value = 'Evento creado correctamente ✅';
    // Redirect to detail of the new event if eventsStore returns created id
    // In our store, createEvent does not return the created record, so
    // reload events and redirect to list.
    setTimeout(() => {
      router.push({ name: 'events' });
    }, 800);
  } catch (err) {
    message.value = err?.message || 'Error al crear el evento';
  } finally {
    submitting.value = false;
  }
}

// Avatar and initials for current user
const avatarUrl = computed(() => {
  const user = authStore.user;
  if (user && user.avatar) {
    return pb.files.getUrl(user, user.avatar, { token: authStore.token, thumb: '100x100' });
  }
  return null;
});
const userInitials = computed(() => {
  const user = authStore.user;
  if (!user) return '?';
  const name = user.name || user.username || '';
  return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
});

function logout() {
  authStore.logout();
  router.push('/login');
}
</script>

<style scoped>
/* No scoped styles here; rely on imported CSS files for styling. */
</style>