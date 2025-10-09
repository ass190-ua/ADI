/// main.pb.js
onRecordCreateRequest((e) => {
  // Si no es superusuario, forzamos el owner del registro al usuario autenticado
  if (!e.hasSuperuserAuth()) {
    e.record.set("user", e.auth?.id || "");
  }
  e.next();
}, "events");
