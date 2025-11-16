import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router/index.js';
import App from './App.vue';

// Create the Vue application and mount it to #app.
const app = createApp(App);

// Install Pinia for state management.
const pinia = createPinia();
app.use(pinia);

// Install the router.
app.use(router);

// Mount the app.
app.mount('#app');
