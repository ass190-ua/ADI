# Memories+ — Práctica evaluable 3 (Frameworks Javascript / ADI 25–26)

Este repositorio contiene la práctica evaluable 3 de la asignatura *Frameworks JavaScript* (ADI, curso 2025–2026).

El proyecto principal está desarrollado con **Vue 3 + Vite**, **Pinia** para el estado global y **PocketBase** como backend (API + base de datos + autenticación).  
Además se incluye un proyecto extra muy sencillo en **React** para cumplir el punto optativo de “otro framework con listado y eliminación de items”.

---

## 1. Proyecto principal (Vue + PocketBase)

### 1.1. Arquitectura general

- SPA en **Vue 3** con **Vue Router** (`src/router/index.js`).
- **Pinia** como gestor de estado:
  - `auth` store: autenticación y usuario actual.
  - `events` store: gestión de eventos (listado + CRUD).
  - Stores adicionales para fotos, chat, amigos, etc.
- Backend en **PocketBase**:
  - Colección `users` para cuentas de usuario.
  - Colección `events` para los eventos del módulo principal.
  - Colecciones adicionales para fotos/galería, mensajes de chat, contactos, etc.
- Rutas privadas protegidas mediante `meta.requiresAuth` y un **guard global** `beforeEach` que redirige a `/login` cuando no hay sesión.

---

### 1.2. Requisitos obligatorios implementados

A continuación se detallan los puntos del enunciado y cómo se han resuelto.

#### ✅ Autenticación (login, logout, registro)

- **Login** (`LoginView.vue`):
  - Formulario de usuario/contraseña con validación básica en cliente.
  - Uso del `authStore` para llamar a PocketBase (`authWithPassword`).
  - Redirección a la zona privada al iniciar sesión correctamente.
- **Registro** (`RegisterView.vue`):
  - Alta de nuevos usuarios (usuario, email, contraseña + confirmación).
  - Validación en cliente: campos obligatorios, longitud mínima, coincidencia de contraseñas.
  - Tras registrar, login automático y redirección a la zona privada.
- **Logout**:
  - Botones de “cerrar sesión” en la interfaz privada que llaman a `authStore.logout()`, limpian token y usuario en Pinia y redirigen a `/login`.

#### ✅ Listado de items (eventos)

- **EventsView** (`EventsView.vue`):
  - Listado de eventos desde PocketBase usando el `eventsStore`.
  - Soporta:
    - Filtro por periodo: hoy, esta semana, próximos, pasados.
    - Búsqueda por texto en título / descripción / ubicación.
    - Orden ascendente/descendente por fecha.
    - Paginación (página actual, total de páginas, anterior/siguiente).
    - Filtro “Gestionar” para ver sólo eventos creados por el usuario autenticado.

#### ✅ Creación de items

- **EventCreate** (`EventCreate.vue`):
  - Formulario para crear un nuevo evento:
    - Campos: título (obligatorio), fecha, ubicación, descripción, portada (imagen).
    - Envío mediante `FormData` a la colección `events` de PocketBase.
  - Manejo de estados de carga y mensajes de error desde el `eventsStore`.

#### ✅ Ver detalles y editar items

- **EventDetail** (`EventDetail.vue`):
  - Carga un evento por `id` e incluye `expand:user` para mostrar datos del organizador.
  - Muestra:
    - Portada (imagen).
    - Título, fecha formateada, ubicación y descripción.
    - Datos del usuario organizador (nombre/avatar).
  - Si el usuario actual es el propietario del evento:
    - Modo **edición inline** con formulario para modificar título, fecha, ubicación, descripción y portada.
    - Guardado mediante `update` en PocketBase y refresco del evento en el estado global.

#### ✅ Eliminación de items

- Desde **EventDetail**:
  - Botón de “Eliminar evento” con confirmación (`confirm(...)`).
  - Se elimina el registro en PocketBase y se redirige al listado de eventos.
- Desde **EventsView**:
  - Modo de selección múltiple: se pueden marcar varios eventos y borrarlos masivamente desde el propio listado.

#### ✅ Validación de formularios

- **Login / Registro**:
  - Uso de atributos HTML (`required`, `type="email"`, `minlength`) y validación manual en JS para casos como contraseñas que no coinciden o longitud insuficiente.
- **Creación / edición de eventos**:
  - Validación mínima de campos obligatorios (por ejemplo, título y fecha) antes de enviar.
  - Mensajes de error mostrados en la UI ante respuestas erróneas del backend.

#### ✅ Estado centralizado con Pinia

- `auth` store:
  - Guarda `user`, `token` y `isAuthenticated`.
  - Expone acciones para login, logout, registro y recuperación de contraseña.
- `events` store:
  - Guarda el listado de eventos, la página actual, el total de páginas y el evento seleccionado.
  - Expone acciones para listar con filtros, crear, actualizar y borrar.

---

## 2. Funcionalidades adicionales / Optativas

### 2.1. Búsqueda y paginación (0,5 pt)

**Implementado.**

- En `EventsView.vue`:
  - Búsqueda por texto que filtra eventos por título, descripción o ubicación.
  - Paginación completa: estado `page`, `totalPages`, botones de navegación.
  - Filtro de periodo (`when`: hoy, semana, próximos, pasados).
  - Opción “Gestionar” para mostrar sólo eventos creados por el usuario.
- La galería de fotos también incorpora paginación y búsqueda, aunque no se contabiliza específicamente para la nota, demuestra reutilización del patrón.

---

### 2.2. Transiciones/animaciones y efecto “temblor” en errores (0,5 pt)

**Implementado.**

- Se han añadido **clases globales de transición CSS** (`.fade`, `.fade-slide`) para suavizar la aparición/desaparición de algunos elementos (por ejemplo, mensajes).
- En la vista de **Login**:
  - Efecto de **“temblor”** sobre la tarjeta de login cuando el usuario introduce credenciales incorrectas:
    - Clase CSS `.shake` con `@keyframes` propia.
    - Lógica en el componente para activar/desactivar la clase al producirse un error de autenticación.
  - El efecto es visible pero se ha ajustado para que no resulte exagerado.

---

### 2.3. Listado de otro recurso con operaciones básicas

**Parcialmente implementado (más allá de lo exigido).**

- Módulo de **fotos/galería** (`PhotosView.vue` + `photos_services.js`):
  - Listado de fotos en modo galería.
  - Subida de nuevas imágenes asociadas al usuario autenticado.
  - Marcado/desmarcado de favoritos.
  - Eliminación de fotos.
- No se ha creado una vista de detalle / edición avanzada para cada foto, pero sí se ofrece:
  - Alta, visualización básica, favoritos y borrado sobre este recurso adicional.

---

### 2.4. Proyecto extra en otro framework (hasta 1 punto)

**Implementado.**

Se ha creado un proyecto adicional muy sencillo en **React + Vite**, separado del proyecto principal en Vue, para cumplir el punto optativo:

> “Implementar el listado y eliminación de ítems con otro framework cualquiera (Svelte, Angular, React, …). No es necesario implementar editar y ver detalles en este caso.”

En esta versión final, el mini-proyecto **no trabaja con datos en memoria**, sino que está **conectado al mismo backend PocketBase** utilizado en el resto de la práctica.

#### Características del mini-proyecto React

- Framework: **React + Vite**.
- Backend: **PocketBase**, colección `memories_react`.
- El componente principal (`App.jsx`) permite:
  - **Listar** eventos en una tabla, obteniéndolos de PocketBase mediante el SDK oficial.
  - **Crear** nuevos eventos a través de un pequeño formulario (campo título, fecha y lugar).
  - **Eliminar** eventos usando un botón “Eliminar” que borra el registro tanto en la interfaz como en PocketBase.
- El estado se gestiona con `useState` y las operaciones contra PocketBase se realizan de forma asíncrona con `useEffect` y el cliente definido en `pb.js`.

Aunque el enunciado solo exige **listado y eliminación** en el framework extra, se ha añadido también la **creación** de eventos como funcionalidad adicional.

#### Datos de ejemplo

Para poblar la colección `memories_react` se incluye el script `scripts/seedMemoriesReact.mjs`, que inserta varios eventos de prueba en PocketBase.  
De esta forma, al arrancar el proyecto React se puede comprobar directamente el listado, la creación y la eliminación sobre datos reales persistidos en el backend.

---

### 2.5. Módulo de amigos y chat funcional

**Funcionalidad extra (no exigida, pero implementada).**

Además del núcleo de eventos y fotos, la aplicación incluye un sistema básico de **amigos** y un **chat funcional**, ambos integrados con PocketBase:

#### Amigos (`FriendsView.vue` y store asociado)

- Listado de usuarios/amigos con tarjetas visuales.
- Búsqueda de otros usuarios para poder interactuar con ellos.
- Gestión de relaciones de amistad:
  - Enviar solicitudes.
  - Aceptar / rechazar solicitudes (según reglas definidas).
- Uso del backend (PocketBase) para almacenar y recuperar la información de amistades y/o solicitudes, manteniendo coherencia con el usuario autenticado.

#### Chat (`ChatsView.vue` y store de chat)

- Interfaz de chat donde el usuario autenticado puede intercambiar mensajes con otros usuarios.
- Los mensajes se almacenan en una colección específica en PocketBase, de forma que:
  - Cada conversación queda persistida.
  - Los mensajes se asocian a emisor, receptor y marcas de tiempo.
- El store de chat se encarga de:
  - Cargar el historial de mensajes de una conversación.
  - Enviar nuevos mensajes al backend.
  - Mantener el estado de la conversación activa en el cliente.

Este módulo añade una capa social a la aplicación (contactos + mensajería) que va más allá de los mínimos de la práctica, mostrando:

- Uso de colecciones adicionales en PocketBase.
- Gestión de estados más complejos (amigos, conversaciones).
- Componentes de interfaz adaptados a estas funcionalidades.

---

### 2.6. Módulo de contacto (funcionalidad extra)

Aunque el enunciado no lo exigía explícitamente como requisito mínimo u optativo, se ha desarrollado un **módulo de contacto** en la aplicación principal que aporta funcionalidad real y compleja:

- **Formulario de contacto**:
  - Vista específica donde el usuario puede enviar un mensaje (nombre, email, asunto, contenido).
  - Validación básica en cliente.

- **Integración con PocketBase**:
  - Colección específica para almacenar los mensajes de contacto.
  - Envío desde la app mediante la API de PocketBase, utilizando un **token de autenticación** adecuado para garantizar seguridad y permisos.

- **Gestión de emails automáticos**:
  - Configuración de PocketBase para que, al recibir un mensaje desde el formulario de contacto:
    - Se envíe un correo electrónico automático (por ejemplo, confirmación al usuario o notificación al administrador).
  - Esto ha requerido:
    - Configurar el servidor SMTP en PocketBase.
    - Ajustar reglas y opciones para que el envío se haga desde la propia app/backend de forma segura.

En conjunto, el módulo de contacto combina:

- Persistencia de mensajes.
- Envío de emails automáticos gestionados desde la app.
- Uso de autenticación/token en la API.

---

## 3. Notas finales y cómo probar

1. **Proyecto principal (Vue)**  
   - Instalar dependencias:
     ```bash
     npm install
     ```
   - Arrancar PocketBase (configurado previamente con las colecciones `users`, `events`, fotos, chat, contacto, etc.).
   - Levantar el frontend:
     ```bash
     npm run dev
     ```

2. **Proyecto extra (React)**  
   - Situado en una carpeta independiente (por ejemplo `memories-react/`).
   - Instalación y ejecución:
     ```bash
     npm install
     npm run dev
     ```

3. **Cuenta de prueba**  
   - Se puede crear un usuario desde la propia vista de registro o desde el panel de PocketBase.

Este README resume las partes **obligatorias** implementadas y las **optativas/extra** añadidas sobre la base del enunciado de la práctica.

