import { jest } from '@jest/globals';
jest.unstable_mockModule("../../pb.js", () => import("./__mocks__/pb.js"));

describe("auth_service", () => {
  let auth, pbMock;

  beforeAll(async () => {
    auth = await import("../auth_service.js");
    pbMock = await import("./__mocks__/pb.js");
  });

  beforeEach(() => {
    // limpiar sesión
    pbMock.pb.authStore.clear();
  });

  test("login correcto establece sesión", async () => {
    await expect(auth.login("test@memories.plus", "123456")).resolves.toBeTruthy();
    expect(auth.isLoggedIn()).toBe(true);
    expect(auth.currentUser()).toMatchObject({ email: "test@memories.plus" });
  });

  test("login inválido lanza error e isLoggedIn=false", async () => {
    await expect(auth.login("foo@bar.com", "badpass")).rejects.toThrow();
    expect(auth.isLoggedIn()).toBe(false);
    expect(auth.currentUser()).toBeNull();
  });

  test("logout limpia la sesión", async () => {
    await auth.login("test@memories.plus", "123456");
    auth.logout();
    expect(auth.isLoggedIn()).toBe(false);
    expect(auth.currentUser()).toBeNull();
  });

  test("registerUser llama a create en users y devuelve registro", async () => {
    const rec = await auth.registerUser({
      username: "ana",
      email: "ana@ex.com",
      password: "abcdef",
      passwordConfirm: "abcdef",
    });
    expect(rec).toMatchObject({ username: "ana", email: "ana@ex.com" });
  });

  test("requestPasswordReset devuelve true", async () => {
    const ok = await auth.requestPasswordReset("alguien@ex.com");
    expect(ok).toBe(true);
  });

  test("requireAuth redirige y lanza error si no logueado", async () => {
    // Habilitar escritura en location.href en JSDOM
    const oldLoc = window.location;
    delete window.location;
    window.location = { href: "about:blank" };

    expect(() => auth.requireAuth("login.html")).toThrow("Unauthenticated");
    expect(window.location.href).toBe("login.html");

    // restaurar location
    window.location = oldLoc;
  });

  test("logoutAndGo hace logout y redirige", async () => {
    await auth.login("test@memories.plus", "123456");

    const oldLoc = window.location;
    delete window.location;
    window.location = { href: "about:blank" };

    auth.logoutAndGo("login.html");
    expect(auth.isLoggedIn()).toBe(false);
    expect(window.location.href).toBe("login.html");

    window.location = oldLoc;
  });
});
