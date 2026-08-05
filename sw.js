const CACHE_STATIC = 'artcomma-static-v2';
const CACHE_API = 'artcomma-api-v2';
const CACHE_IMG = 'artcomma-img-v2';

const STATIC_ASSETS = ['./', './index.html', './brush.png', './manifest.json'];

// 설치 시 정적 파일 캐시
self.addEventListener('install', e=>{
  e.waitUntil(
    caches.open(CACHE_STATIC).then(c=>c.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// 이전 캐시 삭제
self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>
      Promise.all(keys.filter(k=>![CACHE_STATIC,CACHE_API,CACHE_IMG].includes(k)).map(k=>caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e=>{
  const url = e.request.url;

  // 번역 API는 캐시 안 함
  if(url.includes('mymemory') || url.includes('wikipedia.org/api/rest_v1/page/summary')){
    return;
  }

  // 작품 이미지 캐시 (MET, 클리블랜드, 미니애폴리스)
  if(url.includes('images.metmuseum.org') ||
     url.includes('openaccess-cdn.clevelandart.org') ||
     url.includes('0.api.artsmia.org') ||
     url.includes('upload.wikimedia.org')){
    e.respondWith(
      caches.open(CACHE_IMG).then(async c=>{
        const cached = await c.match(e.request);
        if(cached) return cached;
        try{
          const res = await fetch(e.request);
          if(res.ok) c.put(e.request, res.clone());
          return res;
        }catch(){
          return cached || new Response('', {status: 404});
        }
      })
    );
    return;
  }

  // MET API 작품 데이터 캐시
  if(url.includes('collectionapi.metmuseum.org') ||
     url.includes('openaccess-api.clevelandart.org') ||
     url.includes('search.artsmia.org') ||
     url.includes('commons.wikimedia.org')){
    e.respondWith(
      caches.open(CACHE_API).then(async c=>{
        const cached = await c.match(e.request);
        try{
          const res = await fetch(e.request);
          if(res.ok) c.put(e.request, res.clone());
          return res;
        }catch(){
          return cached || new Response(JSON.stringify({error:'offline'}), {
            headers:{'Content-Type':'application/json'}
          });
        }
      })
    );
    return;
  }

  // 정적 파일 - 캐시 우선
  e.respondWith(
    caches.match(e.request).then(cached=>{
      if(cached) return cached;
      return fetch(e.request).then(res=>{
        if(res.ok){
          caches.open(CACHE_STATIC).then(c=>c.put(e.request, res.clone()));
        }
        return res;
      }).catch(()=>cached);
    })
  );
});
