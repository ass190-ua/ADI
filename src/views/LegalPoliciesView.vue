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
      
      <!-- Contenido legal -->
      <section class="app-main container" aria-labelledby="legal-title" data-component="LegalContent">
        <article class="card pad legal" data-component="LegalDocument">
          <h1 class="h2" id="legal-title" data-part="title">Políticas Legales, Condiciones de Uso y Privacidad</h1>
          <!-- Introducción -->
          <section data-component="LegalSection" data-part="section">
            <h2 data-part="subtitle">1. Introducción</h2>
            <p>Al acceder y utilizar la plataforma <strong>Memories+</strong> aceptas cumplir con las condiciones de uso, políticas legales y de privacidad descritas en este documento. Si no estás de acuerdo con alguno de estos términos, por favor no utilices nuestra plataforma.</p>
          </section>
          <!-- Condiciones Generales de Uso -->
          <section data-component="LegalSection" data-part="section">
            <h2 data-part="subtitle">2. Condiciones Generales de Uso</h2>
            <p>El acceso a la plataforma es gratuito y está condicionado a la aceptación de las condiciones descritas aquí. <strong>Memories+</strong> se reserva el derecho de modificar unilateralmente, en cualquier momento y sin previo aviso, la presentación, configuración y contenido del servicio, así como las condiciones requeridas para utilizarlo.</p>
            <p>Los usuarios se comprometen a utilizar la plataforma de manera lícita, conforme a la buena fe, la ética y el orden público.</p>
          </section>
          <!-- Políticas de Privacidad -->
          <section data-component="LegalSection" data-part="section">
            <h2 data-part="subtitle">3. Políticas de Privacidad</h2>
            <p><strong>Memories+</strong> está comprometido con la protección de tus datos personales. La información recopilada durante el registro, como nombre, correo electrónico y datos adicionales, será utilizada exclusivamente para los propósitos relacionados con la gestión del servicio.</p>
            <p>No se compartirá tu información personal con terceros sin tu consentimiento explícito, salvo por obligación legal o requerimiento judicial.</p>
          </section>
          <!-- Uso de Cookies -->
          <section data-component="LegalSection" data-part="section">
            <h2 data-part="subtitle">4. Uso de Cookies</h2>
            <p>Esta plataforma utiliza cookies para mejorar la experiencia del usuario, analizar la navegación y ofrecer publicidad personalizada. Al usar nuestro sitio aceptas nuestra política de cookies. Puedes gestionarlas o desactivarlas mediante la configuración de tu navegador.</p>
          </section>
          <!-- Responsabilidades del Usuario -->
          <section data-component="LegalSection" data-part="section">
            <h2 data-part="subtitle">5. Responsabilidades del Usuario</h2>
            <p>Los usuarios son responsables de proporcionar información veraz y actualizada, así como de mantener la confidencialidad de sus credenciales de acceso. Además, se comprometen a realizar un uso responsable y legal de la plataforma.</p>
            <p>Cualquier uso indebido o ilegal resultará en la suspensión inmediata del acceso a <strong>Memories+</strong>.</p>
          </section>
          <!-- Limitación de Responsabilidad -->
          <section data-component="LegalSection" data-part="section">
            <h2 data-part="subtitle">6. Limitación de Responsabilidad</h2>
            <p><strong>Memories+</strong> actúa como intermediario y no se responsabiliza por los contenidos subidos por los usuarios, ni por disputas derivadas entre ellos.</p>
            <p>Tampoco será responsable por fallos técnicos en la plataforma o interrupciones temporales del servicio.</p>
          </section>
          <!-- Propiedad Intelectual -->
          <section data-component="LegalSection" data-part="section">
            <h2 data-part="subtitle">7. Propiedad Intelectual</h2>
            <p>Todos los contenidos, diseños, logos, textos e imágenes presentes en <strong>Memories+</strong> están protegidos por derechos de propiedad intelectual. Queda prohibida su reproducción, distribución o uso sin autorización expresa.</p>
          </section>
          <!-- Legislación y Jurisdicción -->
          <section data-component="LegalSection" data-part="section">
            <h2 data-part="subtitle">8. Legislación y Jurisdicción Aplicable</h2>
            <p>Estas condiciones se rigen por la legislación vigente. Cualquier controversia relacionada con <strong>Memories+</strong> se someterá exclusivamente a los tribunales correspondientes al domicilio legal de la entidad responsable.</p>
          </section>
          <!-- Modificaciones en las Políticas -->
          <section data-component="LegalSection" data-part="section">
            <h2 data-part="subtitle">9. Modificaciones en las Políticas</h2>
            <p><strong>Memories+</strong> se reserva el derecho a modificar o actualizar estas condiciones en cualquier momento, notificando a los usuarios mediante publicación en esta página o comunicación directa.</p>
          </section>
          <!-- Contacto -->
          <section data-component="LegalSection" data-part="section">
            <h2 data-part="subtitle">10. Contacto</h2>
            <p>Si tienes dudas acerca de estas políticas, puedes contactar con nosotros en la dirección electrónica:
              <a href="mailto:memoriesplus.soporte@gmail.com">memoriesplus.soporte@gmail.com</a>.
            </p>
            <p>Estas políticas entran en vigor desde su publicación y son válidas hasta nuevo aviso.</p>
          </section>
        </article>
      </section>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import AppSidebar from '../components/AppSidebar.vue';
import AppFooter from '../components/AppFooter.vue';

import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { pb } from '../services/pb.js';

const router = useRouter();
const authStore = useAuthStore();

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
</style>