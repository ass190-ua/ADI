import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';

// Lazy‑loaded routes to improve initial load time.
const LoginView = () => import('../views/LoginView.vue');
const RegisterView = () => import('../views/RegisterView.vue');
const LandingView = () => import('../views/LandingView.vue');
const HomeView = () => import('../views/HomeView.vue');
const ContactView = () => import('../views/ContactView.vue');
const PhotosView = () => import('../views/PhotosView.vue');
const FriendsView = () => import('../views/FriendsView.vue');
const ChatsView = () => import('../views/ChatsView.vue');
const ProfileView = () => import('../views/ProfileView.vue');
const LegalPoliciesView = () => import('../views/LegalPoliciesView.vue');
const EventsView = () => import('../views/EventsView.vue');
const EventCreate = () => import('../views/EventCreate.vue');
const EventDetail = () => import('../views/EventDetail.vue');

// Define application routes.  The root path redirects to the events
// listing.  All event routes require authentication via the route
// guard defined below.
const routes = [
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
    path: '/home',
    name: 'home',
    component: HomeView,
    meta: { requiresAuth: true }
  },
  {
    path: '/contact',
    name: 'contact',
    component: ContactView
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
  {
    path: '/legalpolitics',
    name: 'legalpolitics',
    component: LegalPoliciesView
  },
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
    component: EventDetail,
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Route guard to ensure authenticated users before accessing private pages.
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login' });
  } else if (to.name === 'login' && authStore.isAuthenticated) {
    // Redirect authenticated users away from login.
    next({ name: 'events' });
  } else {
    next();
  }
});

export default router;