export const __stores = {
  users: [],
  events: [],
  photos: [],
  contact_messages: [],
};

export const __calls = {
  users:  { getList: [], getOne: [], create: [], update: [], delete: [], authWithPassword: [], requestPasswordReset: [] },
  events: { getList: [], getOne: [], create: [], update: [], delete: [] },
  photos: { getList: [], getOne: [], create: [], update: [], delete: [] },
  contact_messages: { getList: [], getOne: [], create: [], update: [], delete: [] },
};

let __authModel = null;

function ensureStore(name) {
  if (!__stores[name]) __stores[name] = [];
  if (!__calls[name])  __calls[name]  = {};
  // Asegura arrays de cada método para evitar optional chaining en los tests
  for (const m of ["getList","getOne","create","update","delete","authWithPassword","requestPasswordReset"]) {
    __calls[name][m] ||= [];
  }
}

function formDataToObject(data) {
  if (!(data instanceof FormData)) return data ?? {};

  const obj = {};
  for (const [k, v] of data.entries()) {
    if (typeof File !== "undefined" && v instanceof File) {
      obj[k] = v.name;
    } else if (typeof Blob !== "undefined" && v instanceof Blob) {
      obj[k] = "blob";
    } else {
      obj[k] = v;
    }
  }
  return obj;
}

export const pb = {
  collection(name) {
    ensureStore(name);
    const store = __stores[name];
    const calls = __calls[name];

    const base = {
      async getList(page = 1, perPage = 8, params = {}) {
        calls.getList.push({ page, perPage, params });
        // No aplicamos filtro/sort real: los tests validan que SE PASAN bien los parámetros
        return { page, perPage, items: [...store], totalItems: store.length };
      },

      async getOne(id, opts = {}) {
        calls.getOne.push({ id, opts });
        const rec = store.find(x => x.id === id);
        if (!rec) throw new Error("not found");
        return { ...rec };
      },

      async create(data) {
        calls.create.push({ data });
        const obj = formDataToObject(data) ?? {};
        const rec = { id: `${name}_${Math.random().toString(36).slice(2,8)}`, ...obj };
        // Si el payload es FormData con ficheros, el mock conserva solo el nombre (tests lo esperan)
        // p.ej. uploadPhoto usa FILE_FIELDS[0] = "field" como clave
        store.push(rec);
        return { ...rec };
      },

      async update(id, data, opts = {}) {
        calls.update.push({ id, data, opts });
        const i = store.findIndex(x => x.id === id);
        if (i < 0) throw new Error("not found");
        const patch = formDataToObject(data) ?? {};
        store[i] = { ...store[i], ...patch };
        return { ...store[i] };
      },

      async delete(id) {
        calls.delete.push({ id });
        const i = store.findIndex(x => x.id === id);
        if (i < 0) throw new Error("not found");
        store.splice(i, 1);
        return true;
      },
    };

    // Métodos especiales de la colección "users"
    if (name === "users") {
      return {
        ...base,
        async authWithPassword(identity, password) {
          calls.authWithPassword.push({ identity, password });
          // Credenciales válidas “demo” para tests
          if (identity === "test@memories.plus" && password === "123456") {
            __authModel = { id: "u1", email: identity, name: "Test User" };
            return { record: __authModel, token: "mocktoken" };
          }
          throw new Error("invalid credentials");
        },
        async requestPasswordReset(email) {
          calls.requestPasswordReset.push({ email });
          // Simula éxito siempre
          return true;
        },
      };
    }

    return base;
  },

  files: {
    getUrl(rec, file, opts = {}) {
      // Incluye bit de token (t=1 si hay token) para que los tests lo verifiquen
      const t = opts.token ? 1 : 0;
      return `http://mock/${rec.id}/${file}?t=${t}`;
    },
  },

  authStore: {
    get model() { return __authModel; },
    set model(v) { __authModel = v ?? null; },
    get token() { return __authModel ? "mocktoken" : ""; },
    clear() { __authModel = null; },
  },
};
