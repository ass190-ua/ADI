<template>
  <div class="page landing" data-component="LandingPage">
    <!-- Header público -->
    <header class="header landing-header" data-component="AppHeader" data-variant="public">
      <div class="logo" data-part="logo">
        <router-link to="/" data-part="home-link"><img src="/assets/img/logo_header.png" alt="Memories+" /></router-link>
      </div>
      <nav class="row cta-header" aria-label="Acciones" data-part="cta">
        <router-link class="btn ghost login-btn" to="/login" data-part="login">Iniciar sesión</router-link>
        <router-link class="btn primary signup-btn" to="/register" data-part="signup">Crear cuenta</router-link>
      </nav>
    </header>

    <!-- Main -->
    <main class="hero-full" data-component="HeroSection">
      <div class="hero-center" data-part="center">
        <h1 class="h1" data-part="title">
          Tus recuerdos, <span class="grad">tus reglas</span>
        </h1>
        <p class="p lead" data-part="subtitle">
          Fotos y vídeos organizados, chats privados y eventos únicos con mini-juegos.
        </p>

        <div class="cta" data-part="cta-buttons">
          <RouterLink class="btn primary" to="/register" data-part="primary">Empieza gratis</RouterLink>
          <RouterLink class="btn" to="/login" data-part="secondary">Inicia sesión</RouterLink>
        </div>

        <!-- Vista previa -->
        <figure class="preview-large card" data-component="LandingPreview">
          <img
            src="/assets/img/landing-preview.png"
            alt="Vista previa de Memories+"
            data-part="image"
            @error="onPreviewError"
            ref="previewImg"
          >
          <div class="preview-fallback" data-part="fallback" ref="previewFallback" style="display:none;"></div>
        </figure>

        <!-- Beneficios -->
        <div class="benefits" data-component="BenefitList">
          <div class="card pad" data-component="BenefitItem">🔒 Privacidad</div>
          <div class="card pad" data-component="BenefitItem">💬 Chats rápidos</div>
          <div class="card pad" data-component="BenefitItem">🎉 Eventos únicos</div>
        </div>
      </div>
    </main>

    <AppFooter />
  </div>
</template>

<script setup>
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';

import { ref } from 'vue';

const previewImg = ref(null);
const previewFallback = ref(null);

// Mimic the old onerror inline handler: si la imagen falla, ocultarla y mostrar el fallback
function onPreviewError() {
  if (previewImg.value) previewImg.value.style.display = 'none';
  if (previewFallback.value) previewFallback.value.style.display = 'grid';
}
</script>
