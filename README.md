# Memories+

Aplicación prototipo tipo red social de recuerdos (*Memories+*), desarrollada para la **Práctica 1 – Parte I** de ADI.  
La app permite a los usuarios registrarse, subir fotos, crear eventos, y comunicarse mediante chats.

---

## 📌 Idea principal

Memories+ es una plataforma donde los usuarios pueden:

- Autenticarse (registro/login).
- Subir y gestionar fotos.
- Crear y participar en eventos.
- Comunicarse en chats privados o de grupo.
- Consultar su perfil.

---

## 🎯 Casos de uso principales

1. **Usuario** se registra e inicia sesión.  
2. **Usuario** sube una foto y gestiona sus imágenes.  
3. **Usuario** crea un evento e invita a otros.  
4. **Usuario** participa en un evento creado por otro.  
5. **Usuario** abre un chat (individual o grupal) y envía mensajes.  
6. **Usuario** edita su perfil (nombre, foto).  

---

## 🗄️ Modelo de datos (Memories+)

El siguiente diagrama muestra las entidades principales de la aplicación y sus relaciones.

```mermaid
erDiagram
  Usuario {
    string uid PK
    string username
    string email
    string passwordHash
    string nombre
    string fotoUrl
    date   fechaRegistro
  }

  Foto {
    string id PK
    string ownerUid FK
    string titulo
    string descripcion
    string url
    string miniaturaUrl
    string visibilidad   "publica|privada"
    date   createdAt
  }

  Evento {
    string id PK
    string organizadorUid FK
    string titulo
    string descripcion
    datetime fechaHora
    string ubicacion
    bool   privado
  }

  ParticipacionEvento {
    string eventoId  PK, FK
    string usuarioUid PK, FK
    string rol       "organizador|invitado"
    string estado    "pendiente|aceptado|rechazado"
  }

  Chat {
    string id PK
    string titulo
    string tipo     "privado|grupo"
    date   createdAt
  }

  MiembroChat {
    string chatId PK, FK
    string usuarioUid PK, FK
    string rol   "admin|miembro"
  }

  Mensaje {
    string id PK
    string chatId  FK
    string autorUid FK
    string contenido
    date   createdAt
    bool   leido
  }

  %% Relaciones
  Usuario ||--o{ Foto : "tiene"
  Usuario ||--o{ Evento : "organiza"
  Evento  ||--o{ ParticipacionEvento : "incluye"
  Usuario ||--o{ ParticipacionEvento : "participa"
  Chat    ||--o{ MiembroChat : "incluye"
  Usuario ||--o{ MiembroChat : "pertenece"
  Chat    ||--o{ Mensaje : "contiene"
  Usuario ||--o{ Mensaje : "autor"
