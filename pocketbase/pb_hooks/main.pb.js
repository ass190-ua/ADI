onRecordCreateRequest((e) => {
  if (e.collection?.name !== "events") return;
  if (e.hasSuperuserAuth()) return;   // admin puede fijarlo a mano si quiere
  if (!e.auth) throw new Error("Auth requerida");
  e.record.set("user", e.auth.id);    // asigna el dueño
  e.next();
}, "events");
