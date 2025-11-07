<template>
  <!--
    ContactView — Página de contacto
    -------------------------------------------------------------------------------------
      - Header dinámico: muestra versión privada si hay sesión, pública si no.
      - Lateral: usa AppSidebar (navegación de la app).
      - Contenido principal: tarjeta con CTA de email directo + formulario con validación.
      - Panel lateral de soporte: información y accesos rápidos.
      - Toast de confirmación vía hash (#enviado).
    -->
  <div class="page" data-component="MainLayout">
    <!-- Header privado (usuario autenticado) -->
    <header v-if="isAuthenticated" class="app-header" data-component="AppHeader" data-variant="private">
      <!-- Marca / Logo a Home -->
      <div class="brand" data-part="brand">
        <router-link class="logo" to="/home" data-part="logo-link">
          <img src="/assets/img/logo_header.png" alt="Memories+" data-part="logo-img" />
          <span class="visually-hidden">Memories+</span>
        </router-link>
      </div>
      <!-- Toggle de menú para responsive (si tu CSS lo aprovecha) -->
      <input type="checkbox" id="legal-menu-toggle" class="menu-toggle" aria-label="Abrir menú" data-part="menu-toggle" />
      <label for="legal-menu-toggle" class="menu-btn" data-part="menu-btn">☰</label>
      <!-- Placeholder de navegación superior (no se usa aquí) -->
      <nav class="app-nav" aria-label="Secciones" data-part="nav"></nav>

      <!-- Acciones de usuario: avatar + menú Perfil/Logout -->
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

    <!-- Header público (sin sesión) -->
    <header v-else class="header landing-header" data-component="AppHeader" data-variant="public">
      <!-- Logo a la landing -->
      <div class="logo" data-part="logo">
        <router-link to="/" data-part="home-link"><img src="/assets/img/logo_header.png" alt="Memories+" /></router-link>
      </div>
      <!-- CTA principales: Login / Registro -->
      <nav class="row cta-header" aria-label="Acciones" data-part="cta">
        <router-link class="btn ghost login-btn" to="/login" data-part="login">Iniciar sesión</router-link>
        <router-link class="btn primary signup-btn" to="/register" data-part="signup">Crear cuenta</router-link>
      </nav>
    </header>

    <!-- Shell de aplicación con sidebar a la izquierda -->
    <main class="app-shell" data-component="AppShell">
      <AppSidebar />

      <!-- Contenido principal de Contacto -->
      <section class="app-main container" data-component="ContactContent">
        <!-- Hero con CTA de email directo (abre Gmail compose con datos pre-rellenados) -->
        <div class="card pad contact-hero" data-component="ContactHero">
          <div data-part="intro">
            <h1 class="h2" style="margin:0;" data-part="title">Contacto</h1>
            <p class="p" style="margin:4px 0 0; opacity:.9" data-part="subtitle">
              ¿Dudas, propuestas o soporte? Escríbenos y te respondemos en menos de 24h laborales.
            </p>
          </div>
          <!-- Enlace a Gmail compose con subject/body generados dinámicamente -->
          <a
            class="btn"
            :href="gmailComposeUrl"
            target="_blank"
            rel="noopener"
            data-part="cta"
          >✉️ Enviar email directo</a>
        </div>

        <!-- Grid: formulario + panel de soporte lateral -->
        <div class="grid contact-grid" data-component="ContactGrid">
          <!-- Formulario de contacto (con validación básica en cliente) -->
          <form class="card pad form contact-form" autocomplete="on" novalidate
                data-component="ContactForm" aria-labelledby="contact-form-title"
                @submit.prevent="onSubmit" @reset="onResetForm">
            <div class="title" id="contact-form-title" data-part="title">Envíanos un mensaje</div>

            <!-- Campo: nombre -->
            <div class="input" data-part="field">
              <label for="c-name" data-part="label">Nombre</label>
              <input id="c-name" name="name" type="text" placeholder="Tu nombre" v-model.trim="form.name" required data-part="input" />
            </div>

            <!-- Campo: email -->
            <div class="input" data-part="field">
              <label for="c-email" data-part="label">Email</label>
              <input id="c-email" name="email" type="email" placeholder="tucorreo@ejemplo.com" v-model.trim="form.email" required data-part="input" />
            </div>

            <!-- Campo: asunto -->
            <div class="input" data-part="field">
              <label for="c-subject" data-part="label">Asunto</label>
              <input id="c-subject" name="subject" type="text" placeholder="¿Sobre qué va tu mensaje?" v-model.trim="form.subject" required data-part="input" />
            </div>

            <!-- Campo: mensaje -->
            <div class="input" data-part="field">
              <label for="c-message" data-part="label">Mensaje</label>
              <textarea id="c-message" name="message" rows="7" placeholder="Escribe aquí tu mensaje…" v-model.trim="form.message" required data-part="textarea"></textarea>
            </div>

            <!-- Consentimiento RGPD: requerido para poder enviar -->
            <div class="input consent" data-part="consent">
              <input id="c-consent" name="consent" type="checkbox" v-model="consent" required data-part="checkbox" />
              <label for="c-consent" data-part="consent-text">
                Acepto el tratamiento de mis datos según <RouterLink to="/legalpolitics">las políticas</RouterLink>.
              </label>
            </div>

            <!-- Acciones de formulario: enviar / limpiar (deshabilitados si sending) -->
            <div class="actions contact-actions" data-part="actions">
              <button class="btn" type="submit" style="color: white;" :disabled="sending" data-part="submit">
                {{ sending ? 'Enviando...' : '✉️ Enviar mensaje' }}
              </button>
              <button class="btn ghost" type="reset" style="color: white;" :disabled="sending" data-part="reset">Limpiar</button>
            </div>

            <!-- Mensaje de estado (validación/envío) con color dinámico -->
            <p id="contact-msg" class="p" style="margin-top:8px; text-align:right;" :style="{ color: statusColor }">
              {{ statusMsg }}
            </p>
          </form>

          <!-- Panel de soporte con datos rápidos -->
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

    <!-- Toast de éxito: se muestra al navegar a #enviado -->
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
// ===================================================================
// ContactView — Lógica
// -------------------------------------------------------------------
// - Renderiza header público/privado según sesión.
// - Pre-rellena datos del usuario en el formulario si existe.
// - Valida consentimiento y campos obligatorios antes de enviar.
// - Envía el mensaje a la colección 'contact_messages' en PocketBase.
// - Expone un enlace a Gmail compose con subject/body generados.
// ===================================================================

import AppSidebar from '../components/AppSidebar.vue';
import AppFooter from '../components/AppFooter.vue';

import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { pb } from '../services/pb.js';
import { useAuthStore } from '../stores/auth.js';

const router = useRouter();
const authStore = useAuthStore();
const supportEmail = 'memoriesplus.soporte@gmail.com';

// -------------------------
// Header / Avatar (simple)
// -------------------------
const isAuthenticated = computed(() => authStore.isAuthenticated);
const user = computed(() => authStore.user);

// URL del avatar (si el usuario tiene imagen subida en PB)
const avatarUrl = computed(() => {
  if (user.value?.avatar) {
    return pb.files.getUrl(user.value, user.value.avatar, { token: pb.authStore.token, thumb: '100x100' });
  }
  return null;
});

// Iniciales del usuario como fallback de avatar
const userInitials = computed(() => {
  const n = user.value?.name || user.value?.username || '';
  return n.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
});

function logout() {
  authStore.logout();
  router.push('/login');
}

// --------------------
// Formulario reactivo
// --------------------
const form = reactive({
  name: '',
  email: '',
  subject: '',
  message: '',
});
const consent = ref(false);             // Casilla RGPD obligatoria
const sending = ref(false);             // Flag de envío (deshabilita botones)
const statusMsg = ref('');              // Texto de estado (errores/ok)
const statusColor = ref('var(--text)'); // Color del mensaje de estado

// Enlace de redacción directa en Gmail con datos del usuario y del entorno
const gmailComposeUrl = computed(() => {
  const name = user.value?.name || user.value?.username || '';
  const email = user.value?.email || '';

  // Datos del entorno del usuario (útiles para soporte)
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
    body,
  });

  return `https://mail.google.com/mail/?${params.toString()}`;
});

// Prefill de nombre/email si hay usuario en sesión
onMounted(() => {
  if (user.value) {
    form.name = user.value.name || '';
    form.email = user.value.email || '';
  }
});

// Validación mínima en cliente
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

// Envío del formulario a la colección 'contact_messages'
async function onSubmit() {
  if (!validate()) return;
  sending.value = true;
  try {
    await pb.collection('contact_messages').create({
      name: form.name,
      email: form.email,
      subject: form.subject,
      message: form.message,
    });
    // Mostrar toast de éxito (usa hash en la URL)
    window.location.hash = 'enviado';
    // Limpiar campos sensibles
    onResetForm();
  } catch (err) {
    console.error(err);
    statusMsg.value = 'Hubo un error al enviar el mensaje. Inténtalo de nuevo.';
    statusColor.value = 'var(--error)';
  } finally {
    sending.value = false;
  }
}

// Reset parcial del formulario (se mantienen nombre/email si quieres)
function onResetForm() {
  form.subject = '';
  form.message = '';
  consent.value = false;
  statusMsg.value = '';
  statusColor.value = 'var(--text)';
}
</script>
