import { pb } from "../pb.js";

export async function login(email, password) {
  return pb.collection("users").authWithPassword(email, password);
}
export function logout() { pb.authStore.clear(); }
export function currentUser() { return pb.authStore.model; }
export function isLoggedIn() { return !!pb.authStore.token; }
