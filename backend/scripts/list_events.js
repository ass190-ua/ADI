import { login, logout } from '../services/auth.service.js';
import { listEvents } from '../services/events.service.js';

try {
  await login('ass190@gcloud.ua.es', 'a23102001A-01'); // El usuario normal (no admin)
  const page1 = await listEvents({ page: 1, perPage: 5, sort: '-created' });
  console.log('Página 1:', page1.items.map(e => ({ id: e.id, title: e.title })));

  // ejemplo de paginar a la página 2
  const page2 = await listEvents({ page: 2, perPage: 5, sort: '-created' });
  console.log('Página 2:', page2.items.map(e => ({ id: e.id, title: e.title })));
  
} catch (e) {
  console.error(e);
} finally {
  logout();
}
