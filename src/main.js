import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router/index.js';
import App from './App.vue';

import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import '@mdi/font/css/materialdesignicons.css';

// Create the Vue application and mount it to #app.
const app = createApp(App);

// Install Pinia for state management.
const pinia = createPinia();
app.use(pinia);

// Install the router.
app.use(router);

// Vuetify
const vuetify = createVuetify({});
app.use(vuetify);

// Mount the app.
app.mount('#app');
