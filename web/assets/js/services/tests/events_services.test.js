import { jest } from '@jest/globals';
jest.unstable_mockModule("../../pb.js", () => import("./__mocks__/pb.js"));

describe("events_services", () => {
  let svc;
  let pbMock;
  let calls;

  beforeAll(async () => {
    svc = await import("../events_services.js");
    pbMock = await import("./__mocks__/pb.js");
    calls = pbMock.__calls;
  });

  beforeEach(() => {
    // Limpia estado entre tests
    pbMock.__stores.events.length = 0;
    calls.events.getList.length = 0;
    calls.events.getOne.length  = 0;
    calls.events.create.length  = 0;
    calls.events.update.length  = 0;
    calls.events.delete.length  = 0;
    pbMock.pb.authStore.model = null;
  });

  test("createEvent acepta objeto plano (ensureFormData) y listEvents devuelve ítems", async () => {
    await svc.createEvent({ title: "Concierto", description: "Rock" });
    const res = await svc.listEvents();
    expect(res.items.length).toBe(1);
    expect(res.items[0].title).toBe("Concierto");
    // comprobamos que getList recibió sort/filter por defecto
    expect(calls.events.getList[0].params).toMatchObject({ sort: "-created", filter: "" });
  });

  test("updateEvent + getEvent", async () => {
    const rec = await svc.createEvent({ title: "Fiesta" });
    await svc.updateEvent(rec.id, { title: "Fiesta actualizada" });
    const got = await svc.getEvent(rec.id);
    expect(got.title).toBe("Fiesta actualizada");
  });

  test("deleteEvent elimina el registro", async () => {
    const rec = await svc.createEvent({ title: "Borrar" });
    await svc.deleteEvent(rec.id);
    const res = await svc.listEvents();
    expect(res.items.map(i => i.id)).not.toContain(rec.id);
  });

  test("listEvents admite expand, fields y skipTotal", async () => {
    await svc.listEvents({ page: 2, perPage: 5, sort: "title", filter: 'category = "music"', expand: "user,cover", fields: "id,title", skipTotal: true });
    const call = calls.events.getList[0];
    expect(call.page).toBe(2);
    expect(call.perPage).toBe(5);
    expect(call.params).toMatchObject({
      sort: "title",
      filter: 'category = "music"',
      expand: "user,cover",
      fields: "id,title",
      skipTotal: true,
    });
  });

  test("searchEvents combina filtro base + búsqueda escapada", async () => {
    await svc.searchEvents('fiesta "verano"', { filter: 'category = "party"' });
    const { params } = calls.events.getList[0];
    expect(params.filter).toContain('category = "party"');
    // Debe incluir la parte de búsqueda en title/description con comillas escapadas
    expect(params.filter).toContain('title ~ "fiesta \\"verano\\""');
    expect(params.filter).toContain('description ~ "fiesta \\"verano\\""');
  });

  test("fileUrl añade token si hay usuario autenticado", async () => {
    const rec = await svc.createEvent({ title: "Con token" });
    const urlNoAuth = svc.fileUrl(rec, "cover");
    expect(urlNoAuth.endsWith("t=0")).toBe(true);

    // set auth
    const { pb } = await import("./__mocks__/pb.js");
    pb.authStore.model = { id: "u1", email: "test@memories.plus" };
    const urlAuth = svc.fileUrl(rec, "cover");
    expect(urlAuth.endsWith("t=1")).toBe(true);
  });

  test("listMyRecentEvents devuelve vacío sin auth y lista filtrada con auth", async () => {
    // sin auth
    let res = await svc.listMyRecentEvents(3);
    expect(res.items).toEqual([]);

    // con auth (verifica que filtra por user)
    const { pb } = await import("./__mocks__/pb.js");
    pb.authStore.model = { id: "u42", email: "x@y.z" };

    await svc.createEvent({ title: "A", user: "u42" });
    await svc.createEvent({ title: "B", user: "u99" });

    res = await svc.listMyRecentEvents(5);
    const { params } = calls.events.getList.at(-1);
    expect(params.filter).toBe('user = "u42"');
    expect(params.sort).toBe("-updated,-created");
  });
});
