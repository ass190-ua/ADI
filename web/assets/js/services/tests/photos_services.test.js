import { jest } from '@jest/globals';
jest.unstable_mockModule("../../pb.js", () => import("./__mocks__/pb.js"));

// (Opcional) Polyfill de File en JSDOM por si no existiese
// Node 18 + JSDOM suele tenerla, pero así evitamos sustos en CI.
if (typeof File === "undefined") {
  global.File = class extends Blob {
    constructor(chunks, filename, opts={}) { super(chunks, opts); this.name = filename; }
  };
}

describe("photos_services", () => {
  let svc, pbMock;

  beforeAll(async () => {
    svc = await import("../photos_services.js");
    pbMock = await import("./__mocks__/pb.js");
  });

  beforeEach(() => {
    // Limpia estado entre tests
    pbMock.__stores.photos ||= [];
    pbMock.__stores.photos.length = 0;

    pbMock.__calls.photos = pbMock.__calls.photos || { getList: [], create: [], delete: [], update: [] };
    pbMock.__calls.photos.getList = [];
    pbMock.__calls.photos.create  = [];
    pbMock.__calls.photos.delete  = [];
    pbMock.__calls.photos.update  = [];

    // borra auth
    pbMock.pb.authStore.clear?.();
    pbMock.pb.authStore.model = null;
  });

  test("fileUrl devuelve '' si no hay record", () => {
    expect(svc.fileUrl(null, "image")).toBe("");
  });

  test("fileUrl con nombre de campo existente usa ese fichero", async () => {
    // Guarda un registro simulado
    const rec = await pbMock.pb.collection("photos").create({ id: "ph_1", image: "img.jpg" });
    const url = svc.fileUrl(rec, "image");
    expect(url).toContain("/ph_1/");
    expect(url).toContain("img.jpg");
  });

  test("fileUrl sin fileOrField busca por prioridad de FILE_FIELDS", async () => {
    // FILE_FIELDS = ["field", "image", "file", "photo", "picture"]
    const rec = await pbMock.pb.collection("photos").create({ id: "ph_2", image: "foto.png" });
    // Llamada sin pasar el nombre → debe elegir 'image' porque 'field' no existe
    const url = svc.fileUrl(rec);
    expect(url).toContain("/ph_2/");
    expect(url).toContain("foto.png");
  });

  test("listPhotos usa paginación y sort/filter por defecto", async () => {
    const res = await svc.listPhotos(); // page=1, perPage=24, sort=-created, filter=""
    expect(res).toHaveProperty("items");
    const call = pbMock.__calls.photos.getList[0];
    expect(call.page).toBe(1);
    expect(call.perPage).toBe(24);
    expect(call.params).toMatchObject({ sort: "-created", filter: "" });
  });

  test("uploadPhoto construye FormData con 'field', title y user (si hay sesión)", async () => {
    // Activa un usuario autenticado
    pbMock.pb.authStore.model = { id: "u123", email: "x@y.z" };

    const file = new File(["abc"], "playa.jpg", { type: "image/jpeg" });
    const rec = await svc.uploadPhoto({ file, title: "Playa", extra: { tags: "verano" } });

    // Debe guardar un registro con id y los campos que pasamos en el FormData
    expect(rec.id).toBeTruthy();
    // Nuestro mock convierte FormData -> Object al guardar
    expect(rec).toMatchObject({
      title: "Playa",
      user: "u123",
      tags: "verano",
    });
    // Y debe haber un nombre de fichero en el primer FILE_FIELDS ("field")
    expect(rec.field).toBe("playa.jpg");

    // Además comprobamos que se llamó a create con FormData
    const firstCall = pbMock.__calls.photos.create[0];
    expect(firstCall).toBeTruthy();
    expect(firstCall.data instanceof FormData).toBe(true);
  });

  test("uploadPhoto también funciona sin sesión (sin user en el FormData)", async () => {
    const file = new File(["xyz"], "montana.png", { type: "image/png" });
    const rec = await svc.uploadPhoto({ file, title: "Montaña" });
    expect(rec.title).toBe("Montaña");
    expect(rec.user).toBeUndefined();
    expect(rec.field).toBe("montana.png");
  });

  test("deletePhoto elimina el registro", async () => {
    const rec = await pbMock.pb.collection("photos").create({ title: "Borrar", field: "x.jpg" });
    await svc.deletePhoto(rec.id);
    const list = await pbMock.pb.collection("photos").getList(1, 100);
    expect(list.items.map(i => i.id)).not.toContain(rec.id);
  });

  test("toggleFavorite invierte el booleano a partir del valor actual", async () => {
    const rec = await pbMock.pb.collection("photos").create({ title: "Fav", field: "f.jpg", favourite: true });
    const updated = await svc.toggleFavorite(rec.id, /* isCurrentlyFavorite= */ true);
    expect(updated.favourite).toBe(false);

    // vuelve a llamar, ahora partimos de false
    const updated2 = await svc.toggleFavorite(rec.id, false);
    expect(updated2.favourite).toBe(true);
  });
});
