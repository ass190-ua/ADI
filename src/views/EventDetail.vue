<template>
  <div class="page" data-component="MainLayout" v-if="loaded">
    <AppHeader variant="private" />

    <main class="app-shell" data-component="AppShell">
      <AppSidebar />

      <!-- Contenido principal -->
      <section class="app-main container" data-component="EventDetail" aria-labelledby="event-title">
        <!-- Hero con imagen y título -->
        <figure class="event-hero card" data-component="EventHero">
          <img :src="coverUrl" alt="Portada del evento" data-part="image" />
          <figcaption class="pad" data-part="caption">
            <h1 class="h2" id="event-title" style="margin:0;" data-part="title">{{ event.title || 'Evento sin título' }}</h1>
            <p class="p" style="margin:.25rem 0 0; opacity:.9;" data-part="meta">{{ metaInfo }}</p>
          </figcaption>
        </figure>

        <!-- Barra de acciones: editar y borrar -->
        <div class="row" id="actions-bar" style="gap:8px; margin:12px 0 0;" v-if="isOwner && !editing">
          <button class="btn ghost" style="color: white;" @click="showEdit">✏️ Editar</button>
          <button class="btn ghost" style="color: white;" @click="confirmDelete">🗑️ Borrar</button>
        </div>

        <!-- Formulario de edición -->
        <form v-if="editing" class="form card pad" style="margin-top:12px;" @submit.prevent="saveChanges">
          <div class="title" style="margin-bottom:8px;">Editar evento</div>
          <div class="grid" style="gap:10px;">
            <div class="input"><label for="etitle">Título</label><input id="etitle" v-model="editForm.title" name="title" required /></div>
            <div class="input"><label for="edate">Fecha</label><input id="edate" v-model="editForm.date" name="date" type="datetime-local" required /></div>
            <div class="input"><label for="elocation">Ubicación</label><input id="elocation" v-model="editForm.location" name="location" /></div>
            <div class="input" style="grid-column:1/-1;"><label for="edescription">Descripción</label><textarea id="edescription" v-model="editForm.description" name="description" rows="5"></textarea></div>
            <div class="input" style="grid-column:1/-1;"><label for="ecover">Nueva portada (opcional)</label><input id="ecover" ref="editCoverInput" name="cover" type="file" accept="image/*" @change="onEditCoverChange" /></div>
          </div>
          <div class="row" style="gap:8px; margin-top:10px; justify-content: flex-end;">
            <button class="btn ghost" style="color: white;" type="button" @click="cancelEdit">Cancelar</button>
            <button class="btn" style="color: white;" type="submit" :disabled="submitting">{{ submitting ? 'Guardando...' : 'Guardar cambios' }}</button>
          </div>
          <p class="p" id="evt-msg" style="margin-top:8px;" v-if="message">{{ message }}</p>
        </form>

        <!-- Información del evento y organizador -->
        <div class="grid grid-2" style="margin-top:12px;" data-component="EventBody" v-if="!editing">
          <article class="card pad" data-component="EventInfo">
            <div class="title" data-part="block-title">Descripción</div>
            <p class="p" data-part="desc">{{ event.description || 'Este evento no tiene descripción.' }}</p>
            <div class="title" style="margin-top:12px;" data-part="block-title">Organizador</div>
            <div class="row" style="align-items:center; gap:10px;" data-part="organizer">
              <span class="avatar" style="width:36px; height:36px;">
                <img v-if="organizerAvatar" :src="organizerAvatar" alt="" />
                <div v-else class="avatar-initials">{{ organizerInitials }}</div>
              </span>
              <span data-part="organizer-name">{{ organizerName }}</span>
            </div>
          </article>
          <aside class="card pad" data-component="EventAside">
            <div class="title" data-part="block-title">Asistencia</div>
            <p class="p" style="margin-top:6px;" data-part="rsvp-copy">Confirma si vas a asistir.</p>
            <div class="row" style="gap:8px; flex-wrap:wrap;" data-part="rsvp-actions">
              <!-- RSVP actions not implemented; placeholder links -->
              <button class="btn" @click="alert('Funcionalidad no implementada')" data-part="rsvp-yes">✅ Asistiré</button>
              <button class="btn ghost" @click="alert('Funcionalidad no implementada')" data-part="rsvp-no">❌ No podré</button>
            </div>
            <div class="title" style="margin-top:12px;" data-part="block-title">Asistentes</div>
            <div class="row" style="gap:8px; flex-wrap:wrap;" data-part="attendees">
              <!-- Se podrían listar asistentes aquí. -->
            </div>
            <div class="title" style="margin-top:12px;" data-part="block-title">Etiquetas</div>
            <div class="row" style="gap:6px; flex-wrap:wrap;" data-part="tags">
              <!-- Etiquetas del evento si existieran -->
            </div>
          </aside>
        </div>
      </section>
    </main>

    <AppFooter />
  </div>
  <div v-else class="loading" style="text-align:center; margin-top:2rem;">Cargando evento…</div>
</template>

<script setup>
import AppHeader from '../components/AppHeader.vue';
import AppSidebar from '../components/AppSidebar.vue';
import AppFooter from '../components/AppFooter.vue';

import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { useEventsStore } from '../stores/events.js';
import { pb } from '../services/pb.js';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const eventsStore = useEventsStore();

// Data
const loaded = ref(false);
const event = reactive({});
const organizer = ref(null);
const editing = ref(false);
const submitting = ref(false);
const message = ref('');
const editForm = reactive({ title: '', date: '', location: '', description: '' });
const editCoverFile = ref(null);
const editCoverInput = ref(null);

// Load event on mount
onMounted(async () => {
  const id = route.params.id;
  if (!id) {
    router.push({ name: 'events' });
    return;
  }
  try {
    // Request event with expanded user
    const rec = await pb.collection('events').getOne(id, { expand: 'user' });
    Object.assign(event, rec);
    organizer.value = rec.expand?.user || null;
    // Prefill edit form
    editForm.title = rec.title || '';
    editForm.location = rec.location || '';
    editForm.description = rec.description || '';
    if (rec.date) {
      const d = new Date(rec.date);
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      editForm.date = local;
    } else {
      editForm.date = '';
    }
    loaded.value = true;
  } catch (err) {
    console.error('Error al cargar el evento:', err);
    message.value = 'Evento no encontrado.';
    loaded.value = true;
  }
});

// Helpers for meta info
const metaInfo = computed(() => {
  const when = event.date ? new Date(event.date).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }) : 'Sin fecha';
  const where = event.location ? ` — ${event.location}` : '';
  return when + where;
});
const coverUrl = computed(() => {
  if (event.cover) {
    return pb.files.getUrl(event, event.cover, '800x600');
  }
  // Fallback blank image
  return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"></svg>';
});

// Organizer info
const organizerName = computed(() => organizer.value?.name || organizer.value?.username || 'Usuario');
const organizerAvatar = computed(() => {
  if (organizer.value?.avatar) {
    return pb.files.getUrl(organizer.value, organizer.value.avatar, { token: authStore.token, thumb: '100x100' });
  }
  return null;
});
const organizerInitials = computed(() => {
  const name = organizer.value?.name || organizer.value?.username || '';
  return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
});

// Determine ownership
const isOwner = computed(() => {
  return authStore.user?.id && event.user === authStore.user.id;
});

// Avatar and initials for current user (header)
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

function showEdit() {
  editing.value = true;
  message.value = '';
}

function cancelEdit() {
  editing.value = false;
  message.value = '';
  // Reset form values from event
  editForm.title = event.title || '';
  editForm.location = event.location || '';
  editForm.description = event.description || '';
  if (event.date) {
    const d = new Date(event.date);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    editForm.date = local;
  } else {
    editForm.date = '';
  }
  editCoverFile.value = null;
  if (editCoverInput.value) editCoverInput.value.value = null;
}

function onEditCoverChange() {
  const file = editCoverInput.value?.files?.[0];
  editCoverFile.value = file || null;
}

async function saveChanges() {
  submitting.value = true;
  message.value = '';
  const fd = new FormData();
  fd.append('title', editForm.title.trim());
  // Convert local datetime to ISO
  if (editForm.date) {
    const d = new Date(editForm.date);
    fd.append('date', d.toISOString());
  }
  if (editForm.location) fd.append('location', editForm.location.trim());
  if (editForm.description) fd.append('description', editForm.description.trim());
  if (editCoverFile.value) {
    fd.append('cover', editCoverFile.value);
  }
  try {
    const updated = await pb.collection('events').update(event.id, fd);
    // Refresh event and organizer info
    const refreshed = await pb.collection('events').getOne(event.id, { expand: 'user' });
    Object.assign(event, refreshed);
    organizer.value = refreshed.expand?.user || null;
    message.value = 'Cambios guardados ✔';
    // Hide form after delay
    setTimeout(() => {
      editing.value = false;
      message.value = '';
    }, 1200);
  } catch (err) {
    console.error(err);
    message.value = err?.message || 'Error al guardar';
  } finally {
    submitting.value = false;
  }
}

async function confirmDelete() {
  if (!confirm('¿Seguro que quieres borrar este evento? Esta acción no se puede deshacer.')) return;
  try {
    await pb.collection('events').delete(event.id);
    alert('Evento borrado correctamente.');
    router.push({ name: 'events' });
  } catch (err) {
    console.error(err);
    alert('No se pudo borrar el evento.');
  }
}
</script>

<style scoped>
/* Use original CSS for layout and styling; no scoped overrides needed. */
</style>