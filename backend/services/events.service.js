// services/events.service.js
import { pb } from './pb.js';

const COLLECTION = 'events';

// Utilidades
function esc(str = '') {
  return String(str).replace(/"/g, '\\"');
}

export function fileUrl(record, fileName, thumb) {
  const opts = thumb ? { thumb } : undefined;
  return pb.files.getUrl(record, fileName, opts);
}

// CRUD
export async function createEvent(data) {
  return pb.collection(COLLECTION).create(data);
}

export async function getEvent(id, opts = {}) {
  return pb.collection(COLLECTION).getOne(id, opts);
}

// Listado con paginación, filtros, orden, expansión y selección de campos
export async function listEvents({
  page = 1,
  perPage = 10,
  filter = '',
  sort = '-created',
  expand,
  fields,
  skipTotal
} = {}) {
  const params = { filter, sort };
  if (expand) params.expand = expand;
  if (fields) params.fields = fields;
  if (typeof skipTotal === 'boolean') params.skipTotal = skipTotal;

  return pb.collection(COLLECTION).getList(page, perPage, params);
}

// Búsqueda por texto (title/description/location)
export async function searchEvents(q, opts = {}) {
  const part = q ? `(title ~ "${esc(q)}" || description ~ "${esc(q)}" || location ~ "${esc(q)}")` : '';
  // Si el caller ya pasó filter, lo combinamos con AND
  const baseFilter = opts.filter ? `(${opts.filter})` : '';
  const filter = [baseFilter, part].filter(Boolean).join(' && ');
  return listEvents({ ...opts, filter });
}

export async function updateEvent(id, data) {
  return pb.collection(COLLECTION).update(id, data);
}

export async function deleteEvent(id) {
  return pb.collection(COLLECTION).delete(id);
}
