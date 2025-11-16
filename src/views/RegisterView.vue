<template>
  <div class="page" data-component="MainLayout">
    <!-- Cabecera pública -->
    <header class="header landing-header" data-component="AppHeader" data-variant="public">
      <div class="logo" data-part="logo">
        <!-- Logo always links to landing page -->
        <router-link to="/" data-part="home-link"><img src="/assets/img/logo_header.png" alt="Memories+" /></router-link>
      </div>
      <nav class="row cta-header" aria-label="Acciones" data-part="cta">
        <router-link class="btn ghost login-btn" to="/login" data-part="login">Iniciar sesión</router-link>
        <router-link class="btn primary signup-btn" :class="{ active: true }" to="/register" aria-current="page" data-part="signup">Crear cuenta</router-link>
      </nav>
    </header>

    <main class="container auth-page" data-component="AuthMain">
      <section class="card pad" style="width:min(420px,92%); margin-inline:auto;" data-component="AuthCard">
        <h1 class="h2" style="margin:0 0 6px; text-align:center;" data-part="title">Crear cuenta</h1>
        <p class="p" style="margin:0 0 16px; text-align:center; opacity:.9;" data-part="subtitle">
          Únete a Memories+ en unos segundos.
        </p>
        <form class="form" aria-label="Formulario de registro" @submit.prevent="handleRegister" data-component="RegisterForm">
          <div class="input" data-part="field">
            <label for="reg-username" data-part="label">Usuario</label>
            <input id="reg-username" v-model="username" name="username" type="text" placeholder="Tu nombre de usuario" autocomplete="username" required data-part="input" />
          </div>
          <div class="input" data-part="field">
            <label for="reg-email" data-part="label">Correo electrónico</label>
            <input id="reg-email" v-model="email" name="email" type="email" placeholder="tucorreo@ejemplo.com" autocomplete="email" required data-part="input" />
          </div>
          <div class="input" data-part="field">
            <label for="reg-password" data-part="label">Contraseña</label>
            <input id="reg-password" v-model="password" name="password" type="password" placeholder="••••••••" autocomplete="new-password" required minlength="8" data-part="input" />
          </div>
          <div class="input" data-part="field">
            <label for="reg-password2" data-part="label">Confirmar contraseña</label>
            <input id="reg-password2" v-model="passwordConfirm" name="passwordConfirm" type="password" placeholder="Repite la contraseña" autocomplete="new-password" required minlength="8" data-part="input" />
          </div>
          <div class="actions" data-part="actions" style="margin-top:12px;">
            <button class="btn primary" type="submit" style="width:100%; text-align:center;" :disabled="authStore.loading">
              {{ authStore.loading ? 'Creando…' : 'Crear cuenta' }}
            </button>
          </div>
          <p v-if="errorMessage" class="p" style="margin-top:8px; text-align:center; color: var(--error);">{{ errorMessage }}</p>
          <div class="p" style="margin-top:6px; text-align:center;" data-part="login-hint">
            ¿Ya tienes cuenta?
            <router-link to="/login" class="link" data-part="login-link"><strong>Inicia sesión aquí</strong></router-link>
          </div>
        </form>
      </section>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import AppFooter from '../components/AppFooter.vue';

import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

const router = useRouter();
const authStore = useAuthStore();

const username = ref('');
const email = ref('');
const password = ref('');
const passwordConfirm = ref('');
const errorMessage = ref('');

async function handleRegister() {
  errorMessage.value = '';
  // Basic client-side validation
  if (!username.value || !email.value || !password.value || !passwordConfirm.value) {
    errorMessage.value = 'Rellena todos los campos.';
    return;
  }
  if (password.value !== passwordConfirm.value) {
    errorMessage.value = 'Las contraseñas no coinciden.';
    return;
  }
  if (password.value.length < 8) {
    errorMessage.value = 'La contraseña debe tener al menos 8 caracteres.';
    return;
  }
  try {
    await authStore.register({
      username: username.value.trim(),
      email: email.value.trim(),
      password: password.value,
      passwordConfirm: passwordConfirm.value
    });
    // Login automatically after successful registration
    await authStore.login(username.value.trim() || email.value.trim(), password.value);
    // Redirect to home
    router.push({ name: 'home' });
  } catch (err) {
    // Display a generic error message; details are set in the store
    errorMessage.value = authStore.error || 'No se pudo crear la cuenta.';
  }
}
</script>
