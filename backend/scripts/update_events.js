import { login, logout } from '../services/auth.service.js';
import { updateEvent } from '../services/events.service.js';

const id = process.argv[2];              // node scripts/update_event.js <id>
if (!id) { console.error('Falta id'); process.exit(1); }

try {
  await login('ass190@gcloud.ua.es', 'a23102001A-01'); // El usuario normal (no admin)
  const updated = await updateEvent(id, {
    title: 'Título modificado',
    location: 'Valencia',
  });
  console.log('Actualizado:', { id: updated.id, title: updated.title, location: updated.location });
} catch (e) {
  console.error(e);
} finally {
  logout();
}
