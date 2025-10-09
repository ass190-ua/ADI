// scripts/create_event_with_cover.js
import { login, logout } from '../services/auth.service.js';
import { pb } from '../services/pb.js';
import fs from 'node:fs/promises';
import path from 'node:path';

try {
  await login('ass190@gcloud.ua.es', 'a23102001A-01');

  const filePath = path.resolve('../web/assets/img/p1.jpg');
  const fileBuf = await fs.readFile(filePath);              // <-- leemos a Buffer
  const blob = new Blob([fileBuf], { type: 'image/jpeg' }); // <-- lo convertimos a Blob

  const fd = new FormData();
  fd.append('title', 'Evento con imagen de ejemplo');
  fd.append('date', new Date().toISOString());
  fd.append('location', 'Alicante');
  fd.append('description', 'Evento con la imagen p1.jpg');
  fd.append('cover', blob, 'p1.jpg');                       // <-- Blob + nombre

  const evt = await pb.collection('events').create(fd);     // multipart/form-data
  console.log('Evento creado con cover, ID:', evt.id);
} catch (e) {
  console.error('Error creando evento con cover:', e);
} finally {
  logout();
}
