// ==================================================================
// index.js — Enrutador principal de la app (Vue Router)
// ------------------------------------------------------------------
// Objetivo de este archivo
// - Declarar las rutas de la SPA (páginas/vistas).
// - Cargar vistas de forma perezosa (lazy‑load) para mejorar el TTI.
// - Proteger rutas privadas mediante un guard global (beforeEach).
// - Redirigir usuarios autenticados/leads donde corresponde.
//
// Notas
// - Las rutas privadas usan meta.requiresAuth = true.
// - El guard usa el auth store (Pinia) para decidir accesos.
// ==================================================================

import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

// ----------------------------------------------
// Carga perezosa (code-splitting) de vistas
// ----------------------------------------------
// Cada import() genera un chunk separado que se descarga
// cuando se navega a esa ruta por primera vez.
const LoginView         = () => import('../views/LoginView.vue');
const RegisterView      = () => import('../views/RegisterView.vue');
const LandingView       = () => import('../views/LandingView.vue');
const HomeView          = () => import('../views/HomeView.vue');
const ContactView       = () => import('../views/ContactView.vue');
const PhotosView        = () => import('../views/PhotosView.vue');
const FriendsView       = () => import('../views/FriendsView.vue');
const ChatsView         = () => import('../views/ChatsView.vue');
const ProfileView       = () => import('../views/ProfileView.vue');
const LegalPoliciesView = () => import('../views/LegalPoliciesView.vue');
const EventsView        = () => import('../views/EventsView.vue');
const EventCreate       = () => import('../views/EventCreate.vue');
const EventDetail       = () => import('../views/EventDetail.vue');

// -------------------------------------
// Definición de rutas de la aplicación
// -------------------------------------
// - La landing ("/") es pública.
// - Las rutas con meta.requiresAuth: requieren sesión.
// - Las rutas de eventos forman un pequeño submódulo.
const routes = [
  // Público
  {
    path: '/',
    name: 'landing',
    component: LandingView
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView
  },
  {
    path: '/contact',
    name: 'contact',
    component: ContactView
  },
  {
    path: '/legalpolitics',
    name: 'legalpolitics',
    component: LegalPoliciesView
  },

  // Privado (requiere autenticación)
  {
    path: '/home',
    name: 'home',
    component: HomeView,
    meta: { requiresAuth: true }
  },
  {
    path: '/photos',
    name: 'photos',
    component: PhotosView,
    meta: { requiresAuth: true }
  },
  {
    path: '/friends',
    name: 'friends',
    component: FriendsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/chats',
    name: 'chats',
    component: ChatsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: { requiresAuth: true }
  },

  // Módulo Events (listado, crear, detalle, edición)
  {
    path: '/events',
    name: 'events',
    component: EventsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/events/create',
    name: 'event-create',
    component: EventCreate,
    meta: { requiresAuth: true }
  },
  {
    path: '/events/:id',
    name: 'event-detail',
    component: EventDetail,
    meta: { requiresAuth: true }
  },
  {
    path: '/events/:id/edit',
    name: 'event-edit',
    component: EventDetail, // Reutiliza EventDetail (edición in‑place)
    meta: { requiresAuth: true }
  }
  // Sugerencia (opcional): añadir una ruta catch‑all 404 si procede.
  // { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView }
];

// ----------------------------------------------
// Instancia de router (historial HTML5)
// ----------------------------------------------
const router = createRouter({
  history: createWebHistory(), // Usa base por defecto del servidor
  routes
});

// ----------------------------------------------
// Guard global de navegación
// ----------------------------------------------
// - Si la ruta requiere auth y no hay sesión → redirige a login.
// - Si el usuario ya está logueado e intenta ir a login → llévalo a events.
// - En otro caso → continúa.
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  // Caso 1: Ruta privada sin autenticación → login
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login' });
    return;
  }

  // Caso 2: Usuario autenticado entrando a /login → redirige al área privada
  if (to.name === 'login' && authStore.isAuthenticated) {
    next({ name: 'events' });
    return;
  }

  // Caso por defecto: permitir navegación
  next();
});

export default router;