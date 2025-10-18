# Log de uso de LLM (Memories+ – Práctica 1 Parte II)

Este documento recoge un resumen de las interacciones realizadas con ChatGPT durante el desarrollo del backend y frontend de la aplicación **Memories+**, conforme a lo solicitado en la práctica.

---

## 📅 Registro de consultas

### 🧱 Estructura inicial del proyecto
**Fecha:** 5 de octubre de 2025  
**Prompt:**  
> Cómo debería organizar las carpetas `backend`, `web` y `pocketbase` para la práctica 1 de ADI.  
> ¿Dónde coloco los servicios y las migraciones?

---

### 🔐 Autenticación y PocketBase
**Fecha:** 7 de octubre de 2025  
**Prompt:**  
> Cómo implementar la autenticación de usuarios en PocketBase usando el SDK JS.  
> Ejemplo de función `login(email, password)` y `logout()` con un singleton `pb`.

---

### 🧩 Capa de servicios
**Fecha:** 9 de octubre de 2025  
**Prompt:**  
> Cómo aislar el uso de PocketBase detrás de una capa de servicios tipo RPC.  
> Ejemplo para `events.service.js` con CRUD, búsqueda y paginación.

---

### 📸 CRUD de fotos
**Fecha:** 10 de octubre de 2025  
**Prompt:**  
> Cómo subir imágenes a PocketBase usando `FormData` desde el frontend.  
> Quiero incluir título, descripción y archivo de imagen en `photos_services.js`.

---

### 📬 Contact form con email automático
**Fecha:** 12 de octubre de 2025  
**Prompt:**  
> Cómo enviar un correo automático cuando un usuario usa el formulario de contacto en PocketBase.  
> Explicación de hooks (`pb_hooks/main.pb.js`) para `contact_messages`.

---

### 🧪 Pruebas unitarias con Jest
**Fecha:** 14 de octubre de 2025  
**Prompt:**  
> Cómo configurar Jest para probar mis servicios JS del frontend (`auth_service.js`, `events_services.js`, etc.).  
> Cómo simular un usuario logueado y probar `uploadPhoto()`.

---

### 🧾 Documentación de entrega
**Fecha:** 18 de octubre de 2025  
**Prompt:**  
> ¿Puedes generarme un ejemplo de `llm_logs.md` con las principales preguntas que te he hecho?

---

## ✍️ Notas finales
Durante el desarrollo se usó ChatGPT como herramienta de apoyo para:
- Resolver dudas técnicas sobre PocketBase y Node.js.  
- Mejorar la estructura y documentación del proyecto.  
- Preparar los tests unitarios y ejemplos de CRUD.  
No se utilizó para generar código íntegro sin comprensión ni para sustituir el razonamiento propio.
