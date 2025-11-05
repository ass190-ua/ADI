<template>
  <div class="page" data-component="MainLayout">
    <AppHeader variant="private" />

    <main class="app-shell" data-component="AppShell">
      <AppSidebar />

      <!-- Contenido principal del perfil -->
      <section class="app-main container" data-component="ProfileContent">
        <h1 class="h2" style="margin:0 0 12px;">Perfil</h1>
        <!-- Datos básicos -->
        <div class="card pad" style="margin-bottom:16px;">
          <h2 class="h4" style="margin:0 0 8px;">Datos básicos</h2>
          <form @submit.prevent="saveBasic" class="form" data-component="BasicForm">
            <div class="input" style="margin-bottom:8px;">
              <label for="name" data-part="label">Nombre</label>
              <input id="name" v-model="editName" type="text" placeholder="Tu nombre completo" data-part="input" />
            </div>
            <div class="input" style="margin-bottom:8px;">
              <label for="username" data-part="label">Usuario</label>
              <input id="username" v-model="editUsername" type="text" placeholder="Nombre de usuario" data-part="input" />
            </div>
            <div class="input" style="margin-bottom:8px;">
              <label for="email" data-part="label">Correo electrónico</label>
              <input id="email" v-model="editEmail" type="email" placeholder="tucorreo@ejemplo.com" data-part="input" />
            </div>
            <div class="actions" style="margin-top:12px;">
              <button class="btn primary" type="submit" :disabled="savingBasic">{{ savingBasic ? 'Guardando…' : 'Guardar' }}</button>
            </div>
            <p v-if="basicError" class="p" style="margin-top:8px; color: var(--error);">{{ basicError }}</p>
          </form>
        </div>
        <!-- Cambiar contraseña -->
        <div class="card pad" style="margin-bottom:16px;">
          <h2 class="h4" style="margin:0 0 8px;">Cambiar contraseña</h2>
          <form @submit.prevent="savePassword" class="form" data-component="PasswordForm">
            <div class="input" style="margin-bottom:8px;">
              <label for="new-pass" data-part="label">Nueva contraseña</label>
              <input id="new-pass" v-model="newPassword" type="password" placeholder="••••••••" data-part="input" />
            </div>
            <div class="input" style="margin-bottom:8px;">
              <label for="new-pass2" data-part="label">Confirmar contraseña</label>
              <input id="new-pass2" v-model="newPasswordConfirm" type="password" placeholder="Repite la contraseña" data-part="input" />
            </div>
            <div class="actions" style="margin-top:12px;">
              <button class="btn primary" type="submit" :disabled="savingPassword">{{ savingPassword ? 'Guardando…' : 'Actualizar contraseña' }}</button>
            </div>
            <p v-if="passwordError" class="p" style="margin-top:8px; color: var(--error);">{{ passwordError }}</p>
          </form>
        </div>
        <!-- Cambiar avatar -->
        <div class="card pad" style="margin-bottom:16px;">
          <h2 class="h4" style="margin:0 0 8px;">Avatar</h2>
          <div class="row" style="align-items:center; gap:12px; flex-wrap:wrap;">
            <div>
              <img v-if="avatarUrl" :src="avatarUrl" alt="Avatar" style="width:64px; height:64px; border-radius:50%; object-fit:cover;" />
              <div v-else class="avatar-initials" style="width:64px; height:64px; font-size:24px;">{{ userInitials }}</div>
            </div>
            <div>
              <button class="btn ghost" type="button" @click="triggerAvatarUpload" style="color: white;">Cambiar avatar</button>
              <input ref="avatarInput" type="file" accept="image/*" style="display:none;" @change="handleAvatarUpload" />
            </div>
          </div>
          <p v-if="avatarError" class="p" style="margin-top:8px; color: var(--error);">{{ avatarError }}</p>
        </div>
        <!-- Zona de peligro -->
        <div class="card pad" style="margin-bottom:16px; border-color: var(--error);">
          <h2 class="h4" style="margin:0 0 8px;">Zona peligrosa</h2>
          <p class="p" style="margin:0 0 8px;">Elimina tu cuenta de forma permanente.</p>
          <button class="btn danger" type="button" @click="deleteAccount">Eliminar cuenta</button>
        </div>
      </section>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import AppHeader from '../components/AppHeader.vue';
import AppSidebar from '../components/AppSidebar.vue';
import AppFooter from '../components/AppFooter.vue';

import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { pb } from '../services/pb.js';

const router = useRouter();
const authStore = useAuthStore();

const user = computed(() => authStore.user);
const avatarUrl = computed(() => {
  if (user.value?.avatar) {
    return pb.files.getUrl(user.value, user.value.avatar, { token: pb.authStore.token, thumb: '100x100' });
  }
  return null;
});
const userInitials = computed(() => {
  const n = user.value?.name || user.value?.username || '';
  return n.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
});

// Editable fields for basic info
const editName = ref('');
const editUsername = ref('');
const editEmail = ref('');
const savingBasic = ref(false);
const basicError = ref('');

// Password change fields
const newPassword = ref('');
const newPasswordConfirm = ref('');
const savingPassword = ref(false);
const passwordError = ref('');

// Avatar change state
const avatarInput = ref(null);
const avatarError = ref('');

onMounted(() => {
  // Populate editable fields with current user info
  if (user.value) {
    editName.value = user.value.name || '';
    editUsername.value = user.value.username || '';
    editEmail.value = user.value.email || '';
  }
});

async function saveBasic() {
  basicError.value = '';
  savingBasic.value = true;
  try {
    await pb.collection('users').update(user.value.id, {
      name: editName.value.trim(),
      username: editUsername.value.trim(),
      email: editEmail.value.trim()
    });
    // Refresh user in auth store
    await pb.collection('users').authRefresh();
    authStore.user = pb.authStore.model;
  } catch (err) {
    console.error('Error updating user', err);
    basicError.value = 'No se pudieron guardar los cambios.';
  } finally {
    savingBasic.value = false;
  }
}

async function savePassword() {
  passwordError.value = '';
  if (!newPassword.value || !newPasswordConfirm.value) {
    passwordError.value = 'Introduce la nueva contraseña dos veces.';
    return;
  }
  if (newPassword.value !== newPasswordConfirm.value) {
    passwordError.value = 'Las contraseñas no coinciden.';
    return;
  }
  if (newPassword.value.length < 8) {
    passwordError.value = 'La contraseña debe tener al menos 8 caracteres.';
    return;
  }
  savingPassword.value = true;
  try {
    await pb.collection('users').update(user.value.id, {
      password: newPassword.value,
      passwordConfirm: newPasswordConfirm.value
    });
    // Clear password fields
    newPassword.value = '';
    newPasswordConfirm.value = '';
  } catch (err) {
    console.error('Error changing password', err);
    passwordError.value = 'No se pudo cambiar la contraseña.';
  } finally {
    savingPassword.value = false;
  }
}

function triggerAvatarUpload() {
  if (avatarInput.value) avatarInput.value.click();
}

async function handleAvatarUpload(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;
  const file = files[0];
  const fd = new FormData();
  fd.append('avatar', file, file.name);
  try {
    await pb.collection('users').update(user.value.id, fd);
    // Refresh user
    await pb.collection('users').authRefresh();
    authStore.user = pb.authStore.model;
    avatarError.value = '';
  } catch (err) {
    console.error('Error updating avatar', err);
    avatarError.value = 'No se pudo actualizar el avatar.';
  } finally {
    event.target.value = '';
  }
}

async function deleteAccount() {
  if (!confirm('¿Estás seguro de eliminar tu cuenta? Esta acción no se puede deshacer.')) return;
  try {
    await pb.collection('users').delete(user.value.id);
    authStore.logout();
    router.push({ name: 'login' });
  } catch (err) {
    console.error('Error deleting account', err);
    alert('No se pudo eliminar la cuenta.');
  }
}

function logout() {
  authStore.logout();
  router.push({ name: 'login' });
}
</script>

<style scoped>
.avatar-initials {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: #334155;
  color: #e5e7eb;
  font-weight: 600;
  font-size: 14px;
}

.btn.danger {
  background-color: var(--error);
  color: white;
}
</style>