<template>
  <footer class="footer book-footer" data-component="AppFooter">
    <div class="container" data-part="container">
      <nav class="navline" aria-label="Enlaces del pie" data-part="nav">
        <RouterLink to="/contact" class="footer-link" data-part="link">Contacto</RouterLink>
        <span class="sep" data-part="sep">•</span>
        <div class="social" aria-label="Redes sociales" data-part="social">
          <a href="#" aria-label="Facebook" class="icon" data-part="social-link">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path fill="currentColor" d="M22 12.06C22 6.48 17.52 2 11.94 2S2 6.48 2 12.06c0 5.01 3.66 9.17 8.44 9.94v-7.03H7.9v-2.9h2.54V9.41c0-2.5 1.49-3.88 3.77-3.88 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.9h-2.34V22c4.78-.77 8.44-4.93 8.44-9.94Z"/>
            </svg>
          </a>
          <a href="#" aria-label="X/Twitter" class="icon" data-part="social-link">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path fill="currentColor" d="M3 3h4.6l4.1 6.1L16.8 3H21l-7.3 9.4L21 21h-4.6l-4.5-6.7L7.2 21H3l7.7-9.9L3 3Z"/>
            </svg>
          </a>
          <a href="#" aria-label="Instagram" class="icon" data-part="social-link">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path fill="currentColor" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 0 5-5Zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3Zm-5 3.8a5.2 5.2 0 1 1 0 10.4A5.2 5.2 0 0 1 12 7.8Zm0 2a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z"/>
            </svg>
          </a>
        </div>
        <span class="sep" data-part="sep">•</span>
        <RouterLink to="/legalpolitics" class="footer-link" data-part="link">Políticas legales</RouterLink>
      </nav>
      <div class="copy" data-part="copy"><small>© 2025 — <strong>Memories+</strong></small></div>
    </div>
  </footer>
</template>

<script setup>
// sin lógica por ahora
</script>
