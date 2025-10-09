import PocketBase from "https://unpkg.com/pocketbase/dist/pocketbase.es.mjs";

// apúntalo a tu PB local
export const pb = new PocketBase("http://127.0.0.1:8090");

// opcional: expón pb en window para depurar en consola
window.pb = pb;
