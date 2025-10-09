import { pb } from "../pb.js";

const C = "events";

export async function listEvents({ page=1, perPage=12, filter="", sort="-created" } = {}) {
  return pb.collection(C).getList(page, perPage, { filter, sort });
}
export async function getEvent(id) {
  return pb.collection(C).getOne(id);
}
export function fileUrl(record, filename, opts={}) {
  // Para colecciones protegidas pasamos el token
  return pb.files.getUrl(record, filename, { token: pb.authStore.token, ...opts });
}
