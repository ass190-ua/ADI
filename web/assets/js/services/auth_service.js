import { pb } from "../pb.js";

export async function login(email, password) {
  return pb.collection("users").authWithPassword(email, password);
}

export function logout() { 
  pb.authStore.clear(); 
}
export function currentUser() {
  return pb.authStore.model;
}
export function isLoggedIn() {
  return !!pb.authStore.token;
}

export async function registerUser({ username, email, password, passwordConfirm }) {
  return pb.collection("users").create({ username, email, password, passwordConfirm });
}

export function requireAuth(redirectTo = "login.html") {
  if (!isLoggedIn()) { location.href = redirectTo; throw new Error("Unauthenticated"); }
}

export function logoutAndGo(url = "login.html") {
  logout();
  location.href = url;
}
