// scripts/create_event.js
import { login, logout } from '../services/auth.service.js';
import { createEvent } from '../services/events.service.js';

try {
  // Cambia esto por tu usuario normal (no admin)
  await login('ass190@gcloud.ua.es', 'a23102001A-01');

  const evt = await createEvent({
    title: 'Demo PocketBase',
    date: new Date().toISOString(),
    location: 'Alicante',
    description: 'Evento de prueba desde Node.js'
  });

  console.log('Evento creado con ID:', evt.id);
} catch (e) {
  console.error('Error:', e);
} finally {
  logout();
}
