/*
 * Service worker of the SampleLog web app (scope /app/, see docs/web-app.md). Keeps the app working
 * offline: the whole build is cached when this worker installs, every page inside the app gets the
 * app shell, and the caches of older builds are deleted once a new worker takes over. A new version
 * waits until the app asks for it ("Restart to update"). Lab data is never cached here: the app
 * keeps it in IndexedDB.
 *
 * scripts/build-web.mts fills in BUILD and FILES; as written here (development) nothing is cached.
 */
const BUILD = "81f0b5163052";
const FILES = [
 "/app/_expo/static/js/web/entry-fdd0d3ea3186f3cb400e226d92443a43.js",
 "/app/apple-touch-icon.png",
 "/app/assets/__node_modules/expo-router/assets/arrow_down.017bc6ba3fc25503e5eb5e53826d48a8.png",
 "/app/assets/__node_modules/expo-router/assets/error.d1ea1496f9057eb392d5bbf3732a61b7.png",
 "/app/assets/__node_modules/expo-router/assets/file.19eeb73b9593a38f8e9f418337fc7d10.png",
 "/app/assets/__node_modules/expo-router/assets/forward.d8b800c443b8972542883e0b9de2bdc6.png",
 "/app/assets/__node_modules/expo-router/assets/pkg.ab19f4cbc543357183a20571f68380a3.png",
 "/app/assets/__node_modules/expo-router/assets/react-navigation/elements/back-icon-mask.0a328cd9c1afd0afe8e3b1ec5165b1b4.png",
 "/app/assets/__node_modules/expo-router/assets/react-navigation/elements/back-icon.35ba0eaec5a4f5ed12ca16fabeae451d.png",
 "/app/assets/__node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55.png",
 "/app/assets/__node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@2x.png",
 "/app/assets/__node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@3x.png",
 "/app/assets/__node_modules/expo-router/assets/react-navigation/elements/clear-icon.c94f6478e7ae0cdd9f15de1fcb9e5e55@4x.png",
 "/app/assets/__node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7.png",
 "/app/assets/__node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@2x.png",
 "/app/assets/__node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@3x.png",
 "/app/assets/__node_modules/expo-router/assets/react-navigation/elements/close-icon.808e1b1b9b53114ec2838071a7e6daa7@4x.png",
 "/app/assets/__node_modules/expo-router/assets/react-navigation/elements/search-icon.286d67d3f74808a60a78d3ebf1a5fb57.png",
 "/app/assets/__node_modules/expo-router/assets/sitemap.412dd9275b6b48ad28f5e3d81bb1f626.png",
 "/app/assets/__node_modules/expo-router/assets/unmatched.20e71bdf79e3a97bf55fd9e164041578.png",
 "/app/assets/__node_modules/sql.js/dist/sql-wasm-browser.aa0b42c828efb2095048218e638ecbe0.wasm",
 "/app/assets/__node_modules/zxing-wasm/dist/reader/zxing_reader.0cc5baa8f5bba47cb85a4ad281945314.wasm",
 "/app/icon-192.png",
 "/app/icon-512.png",
 "/app/index.html",
 "/app/manifest.webmanifest"
];

const CACHE = `samplelog-app-${BUILD}`;
const SHELL = new URL("index.html", self.registration.scope).href;

self.addEventListener("install", (event) => {
  // "reload": straight from the server, never an older copy from the browser's HTTP cache.
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: "reload" })))));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith("samplelog-app-") && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || !req.url.startsWith(self.registration.scope)) return;
  const cache = caches.open(CACHE);
  // Any page inside the app is the app (deep links and reloads work offline).
  const cached = req.mode === "navigate"
    ? cache.then((c) => c.match(SHELL))
    : cache.then((c) => c.match(req, { ignoreSearch: true }));
  event.respondWith(cached.then((r) => r ?? fetch(req)));
});
