/* 계리패스 AI — 서비스워커 (오프라인 캐시 + PWA 설치 조건 충족) */
const CACHE = 'gyeripass-v1';
const ASSETS = [
  './',
  './index.html',
  './googleapi-module.js',
  './integration.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn('프리캐시 실패:', err))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // 외부 요청(Gemini / OpenAI / Google API 등)은 절대 캐시·가로채기 하지 않음
  if (url.origin !== self.location.origin) return;

  // 앱 자산: 캐시 우선, 없으면 네트워크 → 실패 시 index.html 폴백
  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
