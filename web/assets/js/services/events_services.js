// assets/js/services/events_services.js
import { pb } from "../pb.js";
const C = "events";

export async function listEvents({ page=1, perPage=8, sort="-created", filter="" } = {}) {
  return pb.collection(C).getList(page, perPage, { sort, filter });
}

export async function searchEvents(q, opts = {}) {
  const filter = q ? `title ~ "${q}" || description ~ "${q}"` : "";
  return listEvents({ ...opts, filter });
}

export async function getEvent(id, opts = {}) {
  return pb.collection(C).getOne(id, opts);
}

export async function createEvent(formData) {
  return pb.collection(C).create(formData);
}

export async function updateEvent(id, formDataOrObj, opts = {}) {
  return pb.collection(C).update(id, formDataOrObj, opts);
}

export async function deleteEvent(id) {
  return pb.collection(C).delete(id);
}

export function fileUrl(record, file, opts={}) {
  return pb.files.getUrl(record, file, { token: pb.authStore.token, ...opts });
}

export async function listMyRecentEvents(limit = 5) {
  const me = pb.authStore.model;
  if (!me) return { items: [] };
  return pb.collection("events").getList(1, limit, {
    filter: `user = "${me.id}"`,
    sort: "-updated,-created"
  });
}