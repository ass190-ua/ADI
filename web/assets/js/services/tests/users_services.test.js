import { jest } from '@jest/globals';
jest.unstable_mockModule("../../pb.js", () => import("./__mocks__/pb.js"));

describe("users_services", () => {
  let svc, pbMock;

  beforeAll(async () => {
    svc = await import("../users_services.js");
    pbMock = await import("./__mocks__/pb.js");
  });

  beforeEach(() => {
    // limpiar stores y sesión antes de cada test
    pbMock.__stores.users ||= [];
    pbMock.__stores.users.length = 0;
    pbMock.pb.authStore.clear?.();
  });

  test("me() devuelve el modelo de sesión (null si no hay sesión)", () => {
    expect(svc.me()).toBeNull();

    pbMock.pb.authStore.model = { id: "u1", email: "t@ex.com", name: "Test" };
    expect(svc.me()).toMatchObject({ id: "u1", email: "t@ex.com" });
  });

  test("refreshMe() devuelve el usuario logueado; lanza si no hay sesión", async () => {
    await expect(svc.refreshMe()).rejects.toThrow("No hay sesión");

    // simula sesión y usuario en store
    const u = { id: "u1", email: "t@ex.com", name: "Test" };
    pbMock.pb.authStore.model = { id: u.id, email: u.email };
    pbMock.__stores.users.push(u);

    const got = await svc.refreshMe();
    expect(got).toMatchObject(u);
  });

  test("userAvatarUrl: null si no hay avatar, url con token y thumb si hay", () => {
    pbMock.pb.authStore.model = { id: "u1", email: "a@b.c" }; // para que haya token

    expect(svc.userAvatarUrl(null)).toBeNull();
    expect(svc.userAvatarUrl({ id: "u1" })).toBeNull();

    const url = svc.userAvatarUrl({ id: "u1", avatar: "perfil.jpg" }, "100x100");
    expect(url).toContain("/u1/");
    expect(url).toContain("perfil.jpg");
    expect(url).toContain("t=1"); // con token
  });

  test("updateMe actualiza el usuario logueado; lanza si no hay sesión", async () => {
    await expect(svc.updateMe({ name: "X" })).rejects.toThrow("No hay sesión");

    const u = { id: "u1", email: "t@ex.com", name: "Old" };
    pbMock.pb.authStore.model = { id: u.id, email: u.email };
    pbMock.__stores.users.push({ ...u });

    const updated = await svc.updateMe({ name: "New Name" });
    expect(updated.name).toBe("New Name");

    // el store debe reflejar el cambio
    const inStore = pbMock.__stores.users.find(x => x.id === "u1");
    expect(inStore.name).toBe("New Name");
  });

  test("deleteMe elimina el usuario y limpia la sesión; lanza si no hay sesión", async () => {
    await expect(svc.deleteMe()).rejects.toThrow("No hay sesión");

    const u = { id: "u1", email: "t@ex.com", name: "Test" };
    pbMock.pb.authStore.model = { id: u.id, email: u.email };
    pbMock.__stores.users.push({ ...u });

    await svc.deleteMe();

    // se elimina del store
    expect(pbMock.__stores.users.find(x => x.id === "u1")).toBeUndefined();
    // y se limpia la sesión
    expect(pbMock.pb.authStore.model).toBeNull();
    expect(pbMock.pb.authStore.token).toBe("");
  });
});
