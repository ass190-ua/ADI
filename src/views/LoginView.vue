<template>
  <div class="page" data-component="MainLayout">
    <!-- Header público idéntico -->
    <header class="header landing-header" data-component="AppHeader" data-variant="public">
      <div class="logo" data-part="logo">
        <RouterLink to="/" data-part="home-link"><img src="/assets/img/logo_header.png" alt="Memories+"></RouterLink>
      </div>
      <nav class="row cta-header" aria-label="Acciones" data-part="cta">
        <RouterLink class="btn ghost login-btn" to="/login" aria-current="page" data-part="login">Iniciar sesión</RouterLink>
        <RouterLink class="btn primary signup-btn" to="/register" aria-label="Crear cuenta gratis" data-part="signup">Crear cuenta</RouterLink>
      </nav>
    </header>

    <!-- Contenido principal idéntico -->
    <main class="container auth-page" data-component="AuthMain">
      <section class="card pad" style="width:min(380px,92%); margin-inline:auto;" data-component="AuthCard">
        <h1 class="h2" style="margin:0 0 6px; text-align:center;" data-part="title">Iniciar sesión</h1>
        <p class="p" style="margin:0 0 16px; text-align:center; opacity:.9;" data-part="subtitle">
          Accede para ver tus recuerdos.
        </p>

        <form class="form" aria-label="Formulario de acceso" @submit.prevent="onSubmit" data-component="AuthForm">
          <div class="input" data-part="field">
            <label for="loginId" data-part="label">Correo o usuario</label>
            <input id="loginId" v-model.trim="identity" type="text" placeholder="correo@dominio.com / tuUsuario" autocomplete="username" required data-part="input" />
          </div>
          <div class="input" data-part="field">
            <label for="loginPass" data-part="label">Contraseña</label>
            <input id="loginPass" v-model="password" type="password" placeholder="••••••••" autocomplete="current-password" required data-part="input" />
          </div>

          <p v-if="errorMsg" class="p" style="margin-top:8px; text-align:center; color: var(--error);">{{ errorMsg }}</p>

          <div class="actions" data-part="actions" style="margin-top:12px;">
            <button class="btn primary" type="submit" style="width:100%; text-align:center;" :disabled="submitting">
              {{ submitting ? 'Entrando…' : 'Iniciar sesión' }}
            </button>
          </div>

          <div class="p" style="margin-top:14px; text-align:center;" data-part="help">
            <!-- Enlace con hash (CSS :target) como en el HTML original -->
            <a href="#reset-modal" class="link" data-part="forgot">¿Olvidaste tu contraseña?</a>
          </div>

          <div class="p" style="margin-top:6px; text-align:center;" data-part="signup-hint">
            ¿No tienes cuenta?
            <RouterLink to="/register" class="link" data-part="signup-link"><strong>Regístrate aquí</strong></RouterLink>
          </div>
        </form>
      </section>
    </main>

    <!-- Modal por :target (mismo id y estructura) -->
    <div id="reset-modal" class="modal" aria-hidden="true" data-component="ResetPasswordModal">
      <div class="modal-dialog card pad" role="dialog" aria-modal="true" aria-labelledby="reset-title">
        <h2 id="reset-title" class="h3" data-part="title">Recuperar contraseña</h2>
        <p class="p" style="margin-bottom:12px;" data-part="subtitle">Introduce tu correo y te enviaremos un enlace.</p>
        <form class="form" @submit.prevent="onReset" data-component="ResetForm">
          <div class="input" data-part="field">
            <label for="reset-email" data-part="label">Correo electrónico</label>
            <input id="reset-email" v-model.trim="resetEmail" type="email" name="email" placeholder="tucorreo@ejemplo.com" required data-part="input" />
          </div>
          <div class="actions row" style="margin-top:12px; gap:8px;" data-part="actions">
            <button type="submit" class="btn primary" :disabled="resetSubmitting" data-part="submit">
              {{ resetSubmitting ? 'Enviando…' : 'Enviar' }}
            </button>
            <!-- Cierra limpiando el hash (como antes) -->
            <a href="#" class="btn ghost" data-part="close">Cerrar</a>
          </div>
        </form>
      </div>
    </div>

    <!-- Toast por :target (mismo id) -->
    <div id="reset-sent" class="toast success" aria-live="polite" aria-atomic="true" data-component="Toast" data-state="success">
      <div class="toast-body" data-part="body">
        <strong data-part="title">¡Solicitud recibida!</strong>
        Si existe una cuenta con ese correo, te enviaremos un enlace para restablecer la contraseña.
        <a class="toast-close" href="#" aria-label="Cerrar" data-part="close">✕</a>
      </div>
    </div>

    <AppFooter />
  </div>
</template>

<script setup>
import AppFooter from '../components/AppFooter.vue';

import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

const router = useRouter();
const auth = useAuthStore();

const identity = ref('');
const password = ref('');
const submitting = ref(false);
const errorMsg = ref('');

// Reset
const resetEmail = ref('');
const resetSubmitting = ref(false);

onMounted(() => {
  // Mismo comportamiento: si ya hay sesión, fuera de /login
  if (auth.isAuthenticated) router.replace('/home');
});

async function onSubmit() {
  errorMsg.value = '';
  submitting.value = true;
  try {
    await auth.login(identity.value, password.value);
    router.push('/home');
  } catch {
    errorMsg.value = 'Credenciales incorrectas.';
  } finally {
    submitting.value = false;
  }
}

async function onReset() {
  if (!resetEmail.value) return;
  resetSubmitting.value = true;
  try {
    await auth.requestPasswordReset(resetEmail.value);
    // Igual que en el HTML original: mostrar toast por hash
    window.location.hash = 'reset-sent';
    // Cerrar modal limpiando el hash si el CSS lo requiere:
    setTimeout(() => { if (window.location.hash === '#reset-modal') window.location.hash = 'reset-sent'; }, 0);
  } catch {
    // Por seguridad, mismo mensaje aunque falle
    window.location.hash = 'reset-sent';
  } finally {
    resetSubmitting.value = false;
  }
}
</script>
