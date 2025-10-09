// services/auth.service.js
import { pb } from './pb.js';

// Login con email y password
export async function login(email, password) {
  return pb.collection('users').authWithPassword(email, password);
}

// Logout: borra las credenciales del cliente
export function logout() {
  pb.authStore.clear();
}

// Usuario actual (si hay sesión)
export function currentUser() {
  return pb.authStore.model;
}
