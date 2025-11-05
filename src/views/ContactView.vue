<template>
  <div class="page" data-component="MainLayout">
    <!-- Header dinámico: privado si logueado, público en caso contrario -->
    <header v-if="isAuthenticated" class="app-header" data-component="AppHeader" data-variant="private">
      <div class="brand" data-part="brand">
        <router-link class="logo" to="/home" data-part="logo-link">
          <img src="/assets/img/logo_header.png" alt="Memories+" data-part="logo-img" />
          <span class="visually-hidden">Memories+</span>
        </router-link>
      </div>
      <input type="checkbox" id="legal-menu-toggle" class="menu-toggle" aria-label="Abrir menú" data-part="menu-toggle" />
      <label for="legal-menu-toggle" class="menu-btn" data-part="menu-btn">☰</label>
      <nav class="app-nav" aria-label="Secciones" data-part="nav"></nav>
      <div class="user-actions" data-part="user-actions">
        <details class="user-menu" data-component="UserMenu">
          <summary aria-label="Abrir menú de usuario" data-part="summary">
            <img v-if="avatarUrl" class="avatar" :src="avatarUrl" alt="Tu avatar" data-part="avatar" style="display:block;" />
            <div v-else class="avatar-initials">{{ userInitials }}</div>
          </summary>
          <nav class="menu" aria-label="Menú de usuario" data-part="menu">
            <router-link to="/profile" data-part="menu-item">👤 Perfil</router-link>
            <a href="#" @click.prevent="logout" data-part="menu-item">⏻ Cerrar sesión</a>
          </nav>
        </details>
      </div>
    </header>
    <!-- Header público -->
    <header v-else class="header landing-header" data-component="AppHeader" data-variant="public">
      <div class="logo" data-part="logo">
        <router-link to="/" data-part="home-link"><img src="/assets/img/logo_header.png" alt="Memories+" /></router-link>
      </div>
      <nav class="row cta-header" aria-label="Acciones" data-part="cta">
        <router-link class="btn ghost login-btn" to="/login" data-part="login">Iniciar sesión</router-link>
        <router-link class="btn primary signup-btn" to="/register" data-part="signup">Crear cuenta</router-link>
      </nav>
    </header>

    <main class="app-shell" data-component="AppShell">
      <AppSidebar />

      <!-- Contenido principal -->
      <section class="app-main container" data-component="ContactContent">
        <div class="card pad contact-hero" data-component="ContactHero">
          <div data-part="intro">
            <h1 class="h2" style="margin:0;" data-part="title">Contacto</h1>
            <p class="p" style="margin:4px 0 0; opacity:.9" data-part="subtitle">
              ¿Dudas, propuestas o soporte? Escríbenos y te respondemos en menos de 24h laborales.
            </p>
          </div>
          <a
            class="btn"
            :href="gmailComposeUrl"
            target="_blank"
            rel="noopener"
            data-part="cta"
          >✉️ Enviar email directo</a>
        </div>

        <div class="grid contact-grid" data-component="ContactGrid">
          <form class="card pad form contact-form" autocomplete="on" novalidate
                data-component="ContactForm" aria-labelledby="contact-form-title"
                @submit.prevent="onSubmit" @reset="onResetForm">
            <div class="title" id="contact-form-title" data-part="title">Envíanos un mensaje</div>

            <div class="input" data-part="field">
              <label for="c-name" data-part="label">Nombre</label>
              <input id="c-name" name="name" type="text" placeholder="Tu nombre" v-model.trim="form.name" required data-part="input" />
            </div>

            <div class="input" data-part="field">
              <label for="c-email" data-part="label">Email</label>
              <input id="c-email" name="email" type="email" placeholder="tucorreo@ejemplo.com" v-model.trim="form.email" required data-part="input" />
            </div>

            <div class="input" data-part="field">
              <label for="c-subject" data-part="label">Asunto</label>
              <input id="c-subject" name="subject" type="text" placeholder="¿Sobre qué va tu mensaje?" v-model.trim="form.subject" required data-part="input" />
            </div>

            <div class="input" data-part="field">
              <label for="c-message" data-part="label">Mensaje</label>
              <textarea id="c-message" name="message" rows="7" placeholder="Escribe aquí tu mensaje…" v-model.trim="form.message" required data-part="textarea"></textarea>
            </div>

            <div class="input consent" data-part="consent">
              <input id="c-consent" name="consent" type="checkbox" v-model="consent" required data-part="checkbox" />
              <label for="c-consent" data-part="consent-text">
                Acepto el tratamiento de mis datos según <RouterLink to="/legalpolitics">las políticas</RouterLink>.
              </label>
            </div>

            <div class="actions contact-actions" data-part="actions">
              <button class="btn" type="submit" style="color: white;" :disabled="sending" data-part="submit">
                {{ sending ? 'Enviando...' : '✉️ Enviar mensaje' }}
              </button>
              <button class="btn ghost" type="reset" style="color: white;" :disabled="sending" data-part="reset">Limpiar</button>
            </div>

            <!-- Mensaje de estado igual que antes -->
            <p id="contact-msg" class="p" style="margin-top:8px; text-align:right;" :style="{ color: statusColor }">
              {{ statusMsg }}
            </p>
          </form>

          <aside class="card pad" data-component="SupportPanel" aria-labelledby="support-title">
            <div class="title" id="support-title" data-part="title">Soporte</div>
            <div class="list" data-part="list">
              <div class="list-item"><span class="meta">Correo</span><div><a class="chip" href="mailto:memoriesplus.soporte@gmail.com">memoriesplus.soporte@gmail.com</a></div></div>
              <div class="list-item"><span class="meta">Respuesta</span><div>24h laborables · Prioridad a incidencias</div></div>
              <div class="list-item"><span class="meta">Estado del servicio</span><div><a class="chip" href="#">🔔 Suscribirme a avisos</a></div></div>
              <div class="list-item"><span class="meta">Redes</span><div class="row" style="gap:8px; flex-wrap:wrap;"><a href="#" class="chip">Instagram</a><a href="#" class="chip">Twitter</a><a href="#" class="chip">Facebook</a></div></div>
              <div class="list-item"><span class="meta">FAQ</span><div><ul class="p" style="margin:6px 0 0 16px;"><li>¿Cómo recupero mi contraseña?</li><li>¿Cómo reporto contenido?</li><li>¿Cómo elimino mi cuenta?</li></ul></div></div>
            </div>
          </aside>
        </div>
      </section>
    </main>

    <!-- Toast por hash, igual que antes -->
    <div id="enviado" class="toast success" data-component="Toast" data-state="success" aria-live="polite" aria-atomic="true">
      <div class="toast-body" data-part="body">
        <strong data-part="title">¡Mensaje enviado!</strong> Te responderemos en menos de 24h laborables.
        <a class="toast-close" href="#" aria-label="Cerrar" data-part="close">✕</a>
      </div>
    </div>

    <AppFooter />
  </div>
</template>

<script setup>
import AppSidebar from '../components/AppSidebar.vue';
import AppFooter from '../components/AppFooter.vue';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { pb } from '../services/pb.js';
import { useAuthStore } from '../stores/auth.js';

const router = useRouter();
const authStore = useAuthStore();
const supportEmail = 'memoriesplus.soporte@gmail.com';

// ==== Header/avatar (simple) ====
const isAuthenticated = computed(() => authStore.isAuthenticated);
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

function logout() {
  authStore.logout();
  router.push('/login');
}

// ==== Form ====
const form = reactive({
  name: '',
  email: '',
  subject: '',
  message: '',
});
const consent = ref(false);
const sending = ref(false);
const statusMsg = ref('');
const statusColor = ref('var(--text)');

const gmailComposeUrl = computed(() => {
  const name = user.value?.name || user.value?.username || '';
  const email = user.value?.email || '';

  // Datos del entorno del usuario
  const title = document.title || 'Memories+';
  const userAgent = navigator.userAgent || '';
  const platform = navigator.platform || '';

  const su = `[Memories+] Consulta de ${name || 'usuario'}`;
  const body =
    `Hola equipo de soporte,\n\n` +
    `Quería consultar lo siguiente:\n\n` +
    `---\n\n` +
    `Mis datos:\n` +
    `Nombre: ${name || '(no especificado)'}\n` +
    `Email: ${email || '(no especificado)'}\n` +
    `Página: ${title}\n` +
    `Navegador: ${userAgent}\n` +
    `Sistema: ${platform}\n\n` +
    `Gracias y un saludo.\n`;

  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: supportEmail,
    su,
    body
  });

  return `https://mail.google.com/mail/?${params.toString()}`;
});

onMounted(() => {
  // Prefill como en el HTML antiguo
  if (user.value) {
    form.name = user.value.name || '';
    form.email = user.value.email || '';
  }
});

function validate() {
  statusMsg.value = '';
  statusColor.value = 'var(--text)';
  if (!consent.value) {
    statusMsg.value = 'Debes aceptar las políticas de tratamiento de datos.';
    statusColor.value = 'var(--error)';
    return false;
  }
  if (!form.name || !form.email || !form.subject || !form.message) {
    statusMsg.value = 'Por favor, rellena todos los campos obligatorios.';
    statusColor.value = 'var(--error)';
    return false;
  }
  return true;
}

async function onSubmit() {
  if (!validate()) return;
  sending.value = true;
  try {
    // Mismo envío que en contact_messages_service.js antiguo
    await pb.collection('contact_messages').create({
      name: form.name,
      email: form.email,
      subject: form.subject,
      message: form.message,
    });
    // Toast por hash, igual que antes
    window.location.hash = 'enviado';
    // Reset del formulario
    onResetForm();
  } catch (err) {
    console.error(err);
    statusMsg.value = 'Hubo un error al enviar el mensaje. Inténtalo de nuevo.';
    statusColor.value = 'var(--error)';
  } finally {
    sending.value = false;
  }
}

function onResetForm() {
  form.subject = '';
  form.message = '';
  consent.value = false;
  statusMsg.value = '';
  statusColor.value = 'var(--text)';
}
</script>
