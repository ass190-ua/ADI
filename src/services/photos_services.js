// src/services/photos.js
import { pb } from './pb.js';

const COLL = 'photos';
const FILE_FIELDS = ['field', 'image', 'file', 'photo', 'picture'];

function fileFieldName(rec) {
  if (rec) for (const k of FILE_FIELDS) if (rec[k]) return k;
  return FILE_FIELDS[0];
}

export function fileUrl(rec, fileOrField, thumb) {
  if (!rec) return '';
  let filename = '';
  if (typeof fileOrField === 'string') {
    filename = rec[fileOrField] || fileOrField;
  } else {
    const k = fileFieldName(rec);
    filename = rec?.[k];
  }
  if (!filename) return '';
  const opts = typeof thumb === 'string' ? { thumb } : (thumb || {});
  return pb.files.getUrl(rec, filename, opts);
}

export async function listPhotos({ page = 1, perPage = 24, sort = '-created', filter = '' } = {}) {
  return pb.collection(COLL).getList(page, perPage, { sort, filter });
}

export async function uploadPhoto({ file, title = '', extra = {} }) {
  const fd = new FormData();
  fd.append(FILE_FIELDS[0], file, file.name);
  if (title) fd.append('title', title);
  const uid = pb?.authStore?.model?.id;
  if (uid) fd.append('user', uid);
  for (const [k, v] of Object.entries(extra)) if (v != null) fd.append(k, v);
  return pb.collection(COLL).create(fd);
}

export async function deletePhoto(id) {
  return pb.collection(COLL).delete(id);
}

export async function toggleFavorite(id, isCurrentlyFavorite = false) {
  return pb.collection(COLL).update(id, { favourite: !isCurrentlyFavorite });
}
