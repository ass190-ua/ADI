import { jest } from '@jest/globals';
jest.unstable_mockModule("../../pb.js", () => import("./__mocks__/pb.js"));

describe("contact_messages_service", () => {
  let svc;
  let pbMock;

  beforeAll(async () => {
    svc = await import("../contact_messages_service.js");
    pbMock = await import("./__mocks__/pb.js");
  });

  beforeEach(() => {
    // limpia el store y las trazas en cada test
    pbMock.__stores.contact_messages ||= [];
    pbMock.__stores.contact_messages.length = 0;

    pbMock.__calls.contact_messages = pbMock.__calls.contact_messages || {};
    pbMock.__calls.contact_messages.create = [];
  });

  test("sendContactMessage crea el registro con los campos enviados", async () => {
    const payload = {
      name: "Ana",
      email: "ana@ex.com",
      subject: "Hola",
      message: "Probando el formulario",
    };

    const rec = await svc.sendContactMessage(payload);

    // 1) Devuelve un objeto con id y los campos
    expect(rec.id).toBeTruthy();
    expect(rec).toMatchObject(payload);

    // 2) Se llamó a create con el payload exacto
    const call = pbMock.__calls.contact_messages.create[0];
    expect(call).toBeTruthy();
    expect(call.data).toMatchObject(payload);

    // 3) El registro quedó guardado en el mock store
    expect(pbMock.__stores.contact_messages.length).toBe(1);
    expect(pbMock.__stores.contact_messages[0]).toMatchObject(payload);
  });
});
