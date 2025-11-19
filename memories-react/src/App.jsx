import { useEffect, useState } from 'react';
import './App.css';
import pb from './pb';

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');

  const [form, setForm] = useState({
    title: '',
    date: '',
    location: '',
  });
  const [creating, setCreating] = useState(false);

  // Cargar eventos desde PocketBase al montar
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        setLoadError('');

        const records = await pb.collection('memories_react').getFullList({
          sort: '-date', // más recientes primero
        });

        setItems(records);
      } catch (err) {
        console.error(err);
        //setLoadError('No se han podido cargar los eventos :(');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Crear nuevo evento
  const handleCreate = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.date || !form.location.trim()) {
      setActionError('Todos los campos son obligatorios.');
      return;
    }

    try {
      setCreating(true);
      setActionError('');

      const record = await pb.collection('memories_react').create({
        title: form.title.trim(),
        date: form.date,
        location: form.location.trim(),
      });

      setItems((prev) => [record, ...prev]);
      setForm({ title: '', date: '', location: '' });
    } catch (err) {
      console.error(err);
      setActionError('No se ha podido crear el evento.');
    } finally {
      setCreating(false);
    }
  };

  // Eliminar evento
  const handleDelete = async (id) => {
    const ok = window.confirm('¿Seguro que quieres eliminar este evento?');
    if (!ok) return;

    try {
      setActionError('');
      await pb.collection('memories_react').delete(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error(err);
      setActionError('No se ha podido eliminar el evento.');
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Memories (React + PocketBase)</h1>
        <p className="app-subtitle">
          Listado, creación y eliminación de eventos usando backend real.
        </p>
      </header>

      <main className="app-main">
        {/* Formulario */}
        <section className="card">
          <h2>Nuevo evento</h2>
          <form className="form" onSubmit={handleCreate}>
            <div className="form-row">
              <label>
                Título
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="Cumpleaños de Alba"
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                Fecha
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                />
              </label>
            </div>

            <div className="form-row">
              <label>
                Lugar
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                  placeholder="Parque Central"
                />
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={creating}
            >
              {creating ? 'Guardando...' : 'Añadir evento'}
            </button>
          </form>

          {/* Errores de acciones (crear/borrar) */}
          {actionError && <p className="error-msg">{actionError}</p>}
        </section>

        {/* Error de carga inicial */}
        {loadError && <p className="error-msg">{loadError}</p>}

        {/* Listado */}
        <section className="card">
          <h2>Lista de eventos</h2>

          {loading ? (
            <p>Cargando eventos...</p>
          ) : items.length === 0 ? (
            <p>No hay eventos todavía.</p>
          ) : (
            <table className="events-table">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Fecha</th>
                  <th>Lugar</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.title}</td>
                    <td>
                      {item.date
                        ? new Date(item.date).toLocaleDateString('es-ES')
                        : '-'}
                    </td>
                    <td>{item.location}</td>
                    <td>
                      <button
                        className="btn btn-delete"
                        onClick={() => handleDelete(item.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
