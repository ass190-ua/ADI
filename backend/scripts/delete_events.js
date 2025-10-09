import { login, logout } from '../services/auth.service.js';
import { deleteEvent } from '../services/events.service.js';

const id = process.argv[2];              // node scripts/delete_event.js <id>
if (!id) { console.error('Falta id'); process.exit(1); }

try {
  await login('ass190@gcloud.ua.es', 'a23102001A-01'); // El usuario normal (no admin)
  await deleteEvent(id);
  console.log('Borrado:', id);
} catch (e) {
  console.error(e);
} finally {
  logout();
}
