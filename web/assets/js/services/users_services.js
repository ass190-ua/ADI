import { pb } from "../pb.js";

export function me() {
  return pb.authStore.model; 
}

export async function refreshMe() {
  const id = pb.authStore.model?.id;
  if (!id) throw new Error("No hay sesión");
  return pb.collection("users").getOne(id);
}

export function userAvatarUrl(user, thumb="100x100") {
  if (!user?.avatar) return null;
  return pb.files.getUrl(user, user.avatar, { token: pb.authStore.token, thumb });
}

export async function updateMe(data) {
  const id = pb.authStore.model?.id;
  if (!id) throw new Error("No hay sesión");
  return pb.collection("users").update(id, data);
}

export async function deleteMe() {
  const id = pb.authStore.model?.id;
  if (!id) throw new Error("No hay sesión");
  await pb.collection("users").delete(id);
  pb.authStore.clear();
}
