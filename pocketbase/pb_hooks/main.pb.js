// ====================================================================
// HOOK 1: Asignar el usuario actual al crear un registro en 'events'
// ====================================================================
onRecordCreateRequest((e) => {
  // Solo se ejecuta para la colección 'events'
  if (e.collection?.name !== "events") return;
  
  // El admin puede asignar el usuario manualmente
  if (e.hasSuperuserAuth()) return;
  
  // Lanza un error si el usuario no está autenticado
  if (!e.auth) throw new Error("Auth requerida");
  
  // Asigna el ID del usuario autenticado al campo 'user' del nuevo evento
  e.record.set("user", e.auth.id);
  
  // Continúa con la operación de crear el registro
  e.next();
}, "events");

// ====================================================================
// CONTACT MESSAGES → guarda y envía correos (admin + acuse al usuario)
// - Plantilla HTML con branding
// - Reply-To al remitente
// - Versiones HTML + Texto
// - CC / BCC opcionales
// - Escapado de contenido para evitar inyecciones
// ====================================================================

onRecordCreateRequest((e) => {
  if (e.collection?.name !== "contact_messages") return;

  // 1) Crear el registro primero (no bloquear la escritura)
  e.next();

  // ---------- Config rápida ----------
  const ADMIN_TO   = ["memoriesplus.soporte@gmail.com"]; // Se pueden añadir más
  const ADMIN_CC   = [];                                  // opcional, p.ej. para auditoría
  const ADMIN_BCC  = ["memoriesplus@gmail.com"]; // opcional, p.ej. para archivo silencioso
  const BRAND_NAME = "Memories+";
  const BRAND_URL  = "Memories+"; // Cuando esté disponible y hosteado se puede poner la URL
  const ACCUSE_SUBJECT = "✅ Hemos recibido tu mensaje · " + BRAND_NAME;

  // ---------- Helpers ----------
  const looksLikeEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((s||"").trim());
  const esc = (s) => String(s ?? "")
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
  const nowISO = () => new Date().toISOString();

  // Plantilla HTML común (header/footer + contenido)
  const layout = (title, innerHTML) => `
  <div style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.6;background:#f7f7f8;padding:24px">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 14px rgba(0,0,0,.06)">
      <thead>
        <tr>
          <td style="background:linear-gradient(135deg,#6b8cff,#7ad4ff);padding:18px 22px;color:#0b1220">
            <div style="font-weight:700;font-size:18px">${esc(BRAND_NAME)}</div>
            <div style="opacity:.9;font-size:13px">${esc(title)}</div>
          </td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:22px">${innerHTML}</td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td style="background:#fafafa;border-top:1px solid #eee;padding:16px 22px;font-size:12px;color:#666">
            Este es un mensaje automático de ${esc(BRAND_NAME)}.
            ${BRAND_URL ? ` • <a href="${esc(BRAND_URL)}" target="_blank" style="color:#3b82f6;text-decoration:none">${esc(BRAND_URL)}</a>` : ""}
          </td>
        </tr>
      </tfoot>
    </table>
  </div>`.trim();

  try {
    // Datos del registro
    const name    = (e.record.get("name")    || "Usuario").toString();
    const email   = (e.record.get("email")   || "").toString().trim();
    const subject = (e.record.get("subject") || "(Sin asunto)").toString();
    const message = (e.record.get("message") || "(Sin mensaje)").toString();
    const recId   = e.record.id;

    // From según Settings → Mail settings
    const fromAddress = $app.settings().meta.senderAddress;
    const fromName    = $app.settings().meta.senderName || `${BRAND_NAME} · Soporte`;

    const mailClient = $app.newMailClient();

    // ------------------------------------------------------------
    // A) Correo a soporte (con Reply-To del usuario)
    // ------------------------------------------------------------
    const htmlAdmin = layout("Nuevo mensaje de contacto", `
      <h2 style="margin:0 0 8px">Nuevo mensaje</h2>
      <p style="margin:0 0 10px;color:#555">ID de referencia: <code>${esc(recId)}</code></p>
      <table cellspacing="0" cellpadding="6" style="background:#fbfdff;border:1px solid #e8eefc;border-radius:10px;width:100%;margin:0 0 14px">
        <tr><td style="width:140px;color:#666">Nombre</td><td><strong>${esc(name)}</strong></td></tr>
        <tr><td style="color:#666">Email</td><td>${email ? `<a href="mailto:${esc(email)}">${esc(email)}</a>` : "—"}</td></tr>
        <tr><td style="color:#666">Asunto</td><td>${esc(subject)}</td></tr>
        <tr><td style="color:#666;vertical-align:top">Mensaje</td>
            <td><pre style="white-space:pre-wrap;margin:0;font:inherit">${esc(message)}</pre></td></tr>
        <tr><td style="color:#666">Fecha</td><td>${esc(nowISO())}</td></tr>
      </table>
      <p style="font-size:12px;color:#777">Puedes responder directamente a este correo (usa Reply-To del remitente).</p>
    `);

    const textAdmin =
`Nuevo mensaje de contacto (${BRAND_NAME})
ID: ${recId}
Nombre: ${name}
Email: ${email || "—"}
Asunto: ${subject}
Fecha: ${nowISO()}
Mensaje:
${message}
`;

    const mailToAdmin = new MailerMessage({
      from:    { address: fromAddress, name: fromName },
      to:      ADMIN_TO.map(a => ({ address: a })),
      cc:      ADMIN_CC.map(a => ({ address: a })),
      bcc:     ADMIN_BCC.map(a => ({ address: a })),
      subject: `📩 Nuevo contacto: ${subject}`,
      replyTo: looksLikeEmail(email) ? [{ address: email, name }] : [],
      html:    htmlAdmin,
      text:    textAdmin,
    });

    mailClient.send(mailToAdmin);

    // ------------------------------------------------------------
    // B) Acuse al usuario (si hay email válido)
    // ------------------------------------------------------------
    if (looksLikeEmail(email)) {
      const htmlUser = layout("Confirmación de recepción", `
        <h2 style="margin:0 0 8px">¡Gracias por contactarnos, ${esc(name)}!</h2>
        <p>Hemos recibido tu mensaje y te responderemos lo antes posible.</p>
        <p><strong>Resumen:</strong></p>
        <ul style="margin:0 0 12px 18px">
          <li><strong>Asunto:</strong> ${esc(subject)}</li>
          <li><strong>Fecha:</strong> ${esc(nowISO())}</li>
          <li><strong>ID de referencia:</strong> ${esc(recId)}</li>
        </ul>
        <p><strong>Tu mensaje:</strong></p>
        <blockquote style="margin:8px 0 0;border-left:3px solid #e5e7eb;padding-left:12px;color:#444">
          <pre style="white-space:pre-wrap;margin:0;font:inherit">${esc(message)}</pre>
        </blockquote>
        <p style="margin-top:14px">Si no fuiste tú, ignora este correo.</p>
      `);

      const textUser =
`Gracias por contactarnos, ${name}.
Hemos recibido tu mensaje y te responderemos lo antes posible.

Resumen:
- Asunto: ${subject}
- Fecha: ${nowISO()}
- ID: ${recId}

Tu mensaje:
${message}

${BRAND_NAME} · Soporte
`;

      const mailToUser = new MailerMessage({
        from:    { address: fromAddress, name: fromName },
        to:      [{ address: email }],
        subject: ACCUSE_SUBJECT,
        html:    htmlUser,
        text:    textUser,
      });

      mailClient.send(mailToUser);
    } else {
      console.log("ℹ️ No se envía acuse: email del usuario vacío o inválido.");
    }

    console.log("✅ Emails de contacto enviados correctamente.");
  } catch (err) {
    console.error("❌ Error al enviar correos de contacto:", err);
  }
}, "contact_messages");
