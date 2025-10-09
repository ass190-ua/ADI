import { login, logout } from '../services/auth.service.js';
import { searchEvents } from '../services/events.service.js';

const q = process.argv[2] || ''; // node scripts/search_events.js Demo
try {
  await login('ass190@gcloud.ua.es', 'a23102001A-01'); // El usuario normal (no admin)
  const res = await searchEvents(q, { page: 1, perPage: 10, sort: '-created' });
  console.log(`Resultados para "${q}":`, res.items.map(e => ({ id: e.id, title: e.title })));
} catch (e) {
  console.error(e);
} finally {
  logout();
}
