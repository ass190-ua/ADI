import { useState } from 'react';
import './App.css';

// Lista inicial de items (podemos imaginar que son eventos o tareas)
const initialItems = [
  { id: 1, title: 'Cumpleaños de Alba', date: '2025-01-20', location: 'Casa de Alba' },
  { id: 2, title: 'Quedada en el parque', date: '2025-02-03', location: 'Parque Central' },
  { id: 3, title: 'Noche de pelis', date: '2025-02-10', location: 'Mi salón' },
];

function App() {
  const [items, setItems] = useState(initialItems);

  // Eliminar item por id
  const handleDelete = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Listado de eventos (React)</h1>
        <p>Mini proyecto extra para ADI — listado y eliminación con otro framework.</p>
      </header>

      <main className="app-main">
        {items.length === 0 ? (
          <p className="empty">No quedan eventos en la lista.</p>
        ) : (
          <table className="items-table">
            <thead>
              <tr>
                <th>Evento</th>
                <th>Fecha</th>
                <th>Ubicación</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((ev) => (
                <tr key={ev.id}>
                  <td>{ev.title}</td>
                  <td>{ev.date}</td>
                  <td>{ev.location}</td>
                  <td>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(ev.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}

export default App;
