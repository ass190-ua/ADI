import { defineStore } from 'pinia';
import { pb } from '../services/pb.js';

/**
 * Store managing CRUD operations for Events.
 *
 * Uses the PocketBase SDK to interact with the `events` collection. The
 * store keeps a list of events, the currently viewed or edited event,
 * and exposes actions to load, create, update and delete events.
 */
export const useEventsStore = defineStore('events', {
  state: () => ({
    events: [],
    currentEvent: null,
    loading: false,
    error: null,
    totalPages: 0,
    currentPage: 1
  }),
  actions: {
    /**
     * Load a page of events from the backend. Defaults to the first page
     * with 10 items per page. Sorting is descending by creation date.
     *
     * @param {number} page Page number to fetch
     * @param {number} perPage Number of events per page
     */
    /**
     * Load a page of events from the backend.  Supports optional
     * sorting and filtering parameters.  When no sort is provided
     * events are returned by creation date descending.
     *
     * @param {number} page Page number to fetch
     * @param {number} perPage Number of events per page
     * @param {Object} options Optional options: { sort, filter }
     */
    async fetchEvents(page = 1, perPage = 10, options = {}) {
      this.loading = true;
      this.error = null;
      try {
        const params = {};
        if (options.sort) params.sort = options.sort;
        if (options.filter) params.filter = options.filter;
        const res = await pb.collection('events').getList(page, perPage, params);
        this.events = res.items;
        this.totalPages = res.totalPages || 1;
        this.currentPage = page;
      } catch (err) {
        this.error = err?.message || 'Error al cargar eventos';
      } finally {
        this.loading = false;
      }
    },

    /**
     * Fetch a single event by its ID and set it as the current event.
     *
     * @param {string} id The event ID
     */
    /**
     * Fetch a single event by its ID and set it as the current event.  You
     * can optionally pass query params such as expand or fields.
     *
     * @param {string} id The event ID
     * @param {Object} query Optional parameters for the request
     */
    async fetchEvent(id, query = {}) {
      if (!id) return;
      this.loading = true;
      this.error = null;
      try {
        this.currentEvent = await pb.collection('events').getOne(id, query);
      } catch (err) {
        this.error = err?.message || 'Error al cargar el evento';
      } finally {
        this.loading = false;
      }
    },

    /**
     * Create a new event. Accepts either a plain object or FormData. When
     * creating with files (e.g. cover images) you should use FormData.
     *
     * @param {Object|FormData} data The event data to create
     */
    async createEvent(data) {
      this.loading = true;
      this.error = null;
      try {
        const created = await pb.collection('events').create(data);
        // Prepend new events for visibility on top of the list.
        this.events.unshift(created);
      } catch (err) {
        this.error = err?.message || 'Error al crear el evento';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Update an existing event by ID. Accepts either a plain object or
     * FormData. On success the local list is updated accordingly.
     *
     * @param {string} id Event ID to update
     * @param {Object|FormData} data The fields to update
     */
    async updateEvent(id, data) {
      if (!id) return;
      this.loading = true;
      this.error = null;
      try {
        const updated = await pb.collection('events').update(id, data);
        // Update the current event and list if needed.
        if (this.currentEvent && this.currentEvent.id === id) {
          this.currentEvent = updated;
        }
        const idx = this.events.findIndex(e => e.id === id);
        if (idx !== -1) this.events[idx] = updated;
      } catch (err) {
        this.error = err?.message || 'Error al actualizar el evento';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Delete an event. Removes it from the local list on success.
     *
     * @param {string} id Event ID
     */
    async deleteEvent(id) {
      if (!id) return;
      this.loading = true;
      this.error = null;
      try {
        await pb.collection('events').delete(id);
        // Remove from local store
        this.events = this.events.filter(e => e.id !== id);
        if (this.currentEvent && this.currentEvent.id === id) {
          this.currentEvent = null;
        }
      } catch (err) {
        this.error = err?.message || 'Error al borrar el evento';
        throw err;
      } finally {
        this.loading = false;
      }
    }
  }
});