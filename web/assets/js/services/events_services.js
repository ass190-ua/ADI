import { pb } from "../pb.js";
const C = "events";

// Helpers
const ensureFormData = (data) => {
  if (data instanceof FormData) return data;
  const fd = new FormData();
  Object.entries(data || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    fd.append(k, v);
  });
  return fd;
};
const safeLike = (s) => String(s ?? "").replace(/"/g, '\\"');

/**
 * Listado con opciones avanzadas.
 * @param {Object} opts
 * @param {number} opts.page
 * @param {number} opts.perPage
 * @param {string} opts.sort            e.g. "-created"
 * @param {string} opts.filter          filtro PocketBase
 * @param {string} opts.expand          relaciones, e.g. "user,cover"
 * @param {string} opts.fields          proyección de campos
 * @param {boolean} opts.skipTotal      acelera en listas grandes
 */
export async function listEvents({
  page = 1,
  perPage = 8,
  sort = "-created",
  filter = "",
  expand,
  fields,
  skipTotal,
} = {}) {
  const params = { sort, filter };
  if (expand) params.expand = expand;
  if (fields) params.fields = fields;
  if (typeof skipTotal === "boolean") params.skipTotal = skipTotal;
  return pb.collection(C).getList(page, perPage, params);
}

//Búsqueda por texto combinable con otros filtros.
export async function searchEvents(q, opts = {}) {
  const qPart = q ? `(title ~ "${safeLike(q)}" || description ~ "${safeLike(q)}")` : "";
  const base = opts.filter ? `(${opts.filter})` : "";
  const filter = [base, qPart].filter(Boolean).join(" && ");
  return listEvents({ ...opts, filter });
}

export async function getEvent(id, opts = {}) {
  return pb.collection(C).getOne(id, opts); // opts: { expand, fields }
}

//Acepta FormData o objeto plano
export async function createEvent(data) {
  return pb.collection(C).create(ensureFormData(data));
}

//Acepta FormData o objeto plano
export async function updateEvent(id, data, opts = {}) {
  return pb.collection(C).update(id, ensureFormData(data), opts);
}

export async function deleteEvent(id) {
  return pb.collection(C).delete(id);
}

export function fileUrl(record, file, opts = {}) {
  return pb.files.getUrl(record, file, { token: pb.authStore.token, ...opts });
}

export async function listMyRecentEvents(limit = 5) {
  const me = pb.authStore.model;
  if (!me) return { items: [] };
  return pb.collection(C).getList(1, limit, {
    filter: `user = "${me.id}"`,
    sort: "-updated,-created",
  });
}
