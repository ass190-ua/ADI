// services/events.service.js
import { pb } from './pb.js';

const COLLECTION = 'events';

// ─────────────────────────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────────────────────────
function esc(str = '') {
  // PocketBase filter usa "…", escapamos comillas dobles
  return String(str).replace(/"/g, '\\"');
}

/**
 * Construye la URL del fichero (soporta thumbs).
 * - thumb ejemplo: '300x200' (debe existir en el campo cover.thumbs)
 */
export function fileUrl(record, fileName, thumb) {
  // Si usas el SDK oficial en el front:
  // - record puede ser un objeto de PB con collectionId/collectionName
  const opts = thumb ? { thumb } : undefined;
  return pb.files.getUrl(record, fileName, opts);
}

// ─────────────────────────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────────────────────────
export async function createEvent(data) {
  return pb.collection(COLLECTION).create(data);
}

export async function getEvent(id, opts = {}) {
  // opts: { expand, fields }
  return pb.collection(COLLECTION).getOne(id, opts);
}

/**
 * Lista con paginación y filtros.
 * Opciones soportadas en opts:
 *  - filter (string PB)
 *  - sort (string, ej: "-date,-created")
 *  - expand (string)
 *  - fields (string)
 *  - skipTotal (boolean) → mejora rendimiento si no necesitas totalPages
 */
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
