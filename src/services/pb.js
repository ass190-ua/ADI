import PocketBase from 'pocketbase';

/**
 * Singleton instance of PocketBase used throughout the application.
 *
 * The URL defaults to the local PocketBase server specified by the
 * practice requirements (running on port 8090). You can override
 * this by defining a Vite environment variable named VITE_PB_URL in
 * an .env file at the project root.
 */
const baseUrl = import.meta.env.VITE_PB_URL || 'http://127.0.0.1:8090';

export const pb = new PocketBase(baseUrl);