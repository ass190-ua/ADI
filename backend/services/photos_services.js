// assets/js/services/photos_services.js
import { pb } from "../pb.js";

// Nombre de la colección
const COLL = "photos";

// Soportamos distintos nombres para el campo file
const FILE_FIELDS = ["image", "file", "field", "photo", "picture"];

/** Devuelve el nombre del campo file en un registro (o el preferido por orden). */
function fileFieldName(rec) {
  if (rec) for (const k of FILE_FIELDS) if (rec[k]) return k;
  return FILE_FIELDS[0];
}

/** URL del fichero con thumb opcional (string "600x0" o {thumb:"600x0"}) */
export function fileUrl(rec, fileOrField, thumb) {
  if (!rec) return "";
  let filename = "";

  if (typeof fileOrField === "string") {
    // si es un nombre de campo (image/file/field) o ya es el nombre del fichero
    filename = rec[fileOrField] || fileOrField;
  } else {
    const k = fileFieldName(rec);
    filename = rec?.[k];
  }
  if (!filename) return "";

  const opts = typeof thumb === "string" ? { thumb } : (thumb || {});
  return pb.files.getUrl(rec, filename, opts);
}

/** Lista paginada de fotos del usuario (las reglas de PB ya filtran por user). */
export async function listPhotos({ page = 1, perPage = 24, sort = "-created" } = {}) {
  return pb.collection(COLL).getList(page, perPage, { sort });
}

/** Búsqueda por texto simple (ajusta campos si añades más metadatos). */
export async function searchPhotos(q, { page = 1, perPage = 24, sort = "-created" } = {}) {
  const safe = (q || "").replace(/"/g, '\\"');
  const filter = safe
    ? `(title ~ "${safe}" || location ~ "${safe}" || tags ~ "${safe}")`
    : "";
  return pb.collection(COLL).getList(page, perPage, { sort, filter });
}

/** Sube una foto (pone automáticamente el relation user = usuario logueado). */
export async function uploadPhoto({ file, title = "", extra = {} }) {
  if (!file) throw new Error("Falta el archivo");
  const fd = new FormData();
  // Campo file (usamos el primero de FILE_FIELDS para crear)
  fd.append(FILE_FIELDS[0], file, file.name);
  if (title) fd.append("title", title);
  // Si tu colección exige relation user, lo rellenamos
  const uid = pb?.authStore?.model?.id;
  if (uid) fd.append("user", uid);
  // Campos extra opcionales
  for (const [k, v] of Object.entries(extra)) if (v != null) fd.append(k, v);

  return pb.collection(COLL).create(fd);
}

/** Borra una foto por id. */
export async function deletePhoto(id) {
  return pb.collection(COLL).delete(id);
}

/** Alterna favorito (bool). Pasa el estado actual para invertirlo. */
export async function toggleFavorite(id, isCurrentlyFavorite = false) {
  return pb.collection(COLL).update(id, { favorite: !isCurrentlyFavorite });
}
