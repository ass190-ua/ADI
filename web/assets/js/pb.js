import PocketBase from "https://unpkg.com/pocketbase/dist/pocketbase.es.mjs";

// PB local
export const pb = new PocketBase("http://127.0.0.1:8090");

// opcional: exponer pb en window para depurar en consola
window.pb = pb;
