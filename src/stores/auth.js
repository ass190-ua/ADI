import { defineStore } from 'pinia';
import { pb } from '../services/pb.js';

/**
 * Authentication store
 *
 * Keeps track of the current authenticated user and token. Provides actions
 * to log in, log out and register new users. Uses PocketBase's authStore
 * under the hood.
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: pb.authStore.model || null,
    token: pb.authStore.token || null,
    loading: false,
    error: null
  }),
  getters: {
    isAuthenticated(state) {
      return !!state.token;
    }
  },
  actions: {
    /**
     * Attempt to authenticate a user with the given identity and password.
     * Stores the returned token and user on success. Throws the error up
     * on failure for the caller to handle.
     * @param {string} identity Email or username used for login
     * @param {string} password User password
     */
    async login(identity, password) {
      this.loading = true;
      this.error = null;
      try {
        await pb.collection('users').authWithPassword(identity, password);
        // Persist the authenticated user and token in the store.
        this.user = pb.authStore.model;
        this.token = pb.authStore.token;
      } catch (err) {
        this.error = err?.message || 'Error de autenticación';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Clear the current session and remove stored credentials.
     */
    logout() {
      pb.authStore.clear();
      this.user = null;
      this.token = null;
    },

    /**
     * Register a new user. PocketBase requires password confirmation.
     * You might want to call login() afterwards.
     * @param {Object} data Registration fields { username, email, password, passwordConfirm }
     */
    async register(data) {
      this.loading = true;
      this.error = null;
      try {
        await pb.collection('users').create(data);
      } catch (err) {
        this.error = err?.message || 'Error de registro';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Request a password reset email to be sent to the given email address.
     * @param {string} email User's email address
     */
    async requestPasswordReset(email) {
      // PocketBase: envía email con enlace de reseteo (según template del servidor)
      await pb.collection('users').requestPasswordReset(email);
      return true;
    }
  }
});