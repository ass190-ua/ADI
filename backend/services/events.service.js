// services/events.service.js
import { pb } from './pb.js';

const COLLECTION = 'events';

// Crear un evento
export async function createEvent(data) {
  return pb.collection(COLLECTION).create(data);
}

// Obtener un evento por ID
export async function getEvent(id) {
  return pb.collection(COLLECTION).getOne(id);
}

// Listar eventos (con paginación y filtros)
export async function listEvents({ page = 1, perPage = 10, filter = '', sort = '-created' } = {}) {
  return pb.collection(COLLECTION).getList(page, perPage, { filter, sort });
}

// Buscar eventos por texto
export async function searchEvents(q, opts = {}) {
  const filter = q ? `title ~ "${q}" || description ~ "${q}"` : '';
  return listEvents({ ...opts, filter });
}

// Actualizar evento
export async function updateEvent(id, data) {
  return pb.collection(COLLECTION).update(id, data);
}

// Borrar evento
export async function deleteEvent(id) {
  return pb.collection(COLLECTION).delete(id);
}
