// scripts/seedMemoriesReact.mjs
import PocketBase from 'pocketbase';

// Cambia la URL si tu PocketBase no está en localhost:8090
const pb = new PocketBase('http://127.0.0.1:8090');

// Muchos datos de ejemplo
const initialItems = [
  { title: 'Cumpleaños de Cristina', date: '2026-08-18', location: 'Casa de Cristina' },
  { title: 'Quedada en el parque', date: '2025-02-03', location: 'Parque Central' },
  { title: 'Noche de pelis', date: '2025-02-10', location: 'Mi salón' },
  { title: 'Examen de ADI', date: '2025-02-18', location: 'Aula 1.2' },
  { title: 'Café con Laura', date: '2025-03-01', location: 'Cafetería Campus' },
  { title: 'Hackathon de la uni', date: '2025-03-08', location: 'Sala de actos' },
  { title: 'Partido de baloncesto', date: '2025-03-15', location: 'Pabellón municipal' },
  { title: 'Cena de clase', date: '2025-03-22', location: 'Restaurante La Plaza' },
  { title: 'Escapada a la playa', date: '2025-04-05', location: 'Playa de San Juan' },
  { title: 'Tarde de estudio', date: '2025-04-10', location: 'Biblioteca central' },
  { title: 'Concierto indie', date: '2025-04-18', location: 'Sala Stereo' },
  { title: 'Escape room', date: '2025-04-25', location: 'Escape Zone' },
  { title: 'Cumple de Sergio', date: '2025-05-02', location: 'Pub Irlanda' },
  { title: 'Partida de rol', date: '2025-05-09', location: 'Casa de Marcos' },
  { title: 'Visita al museo', date: '2025-05-16', location: 'Museo de Arte Contemporáneo' },
  { title: 'Picnic en el río', date: '2025-05-23', location: 'Zona verde del río' },
  { title: 'Torneo de Mario Kart', date: '2025-05-30', location: 'Sala común' },
  { title: 'Quedada React', date: '2025-06-06', location: 'Clase de ADI' },
  { title: 'Fiesta fin de exámenes', date: '2025-06-13', location: 'Terraza de Ana' },
  { title: 'Viaje a Madrid', date: '2025-06-20', location: 'Estación de autobuses' },
];

async function main() {
  try {
    console.log('Creando registros en la colección "memories_react"...');

    // Para vaciar la coleccion antes de hacer el seed
    const existing = await pb.collection('memories_react').getFullList();
    for (const record of existing) {
      await pb.collection('memories_react').delete(record.id);
    }
    console.log('Colección vaciada.');

    for (const item of initialItems) {
      const record = await pb.collection('memories_react').create(item);
      console.log('✔ Creado:', record.id, '-', record.title);
    }

    console.log('✅ Seed completado.');
  } catch (err) {
    console.error('❌ Error al hacer seed:');
    console.error(JSON.stringify(err.response ?? err, null, 2));
  }
}

main();
