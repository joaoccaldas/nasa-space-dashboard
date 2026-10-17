const CACHE='caldaspace-v4-transit';
const SHELL=['./','./index.html','./bootstrap.js','./transit-model.js','./manifest.webmanifest'];
const SCOPE=new URL(self.registration.scope);
// Only this application's static files. Never cache API/credential queries,
// third-party responses or another application's data.
function cacheable(request) {
  const url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==SCOPE.origin||url.search||!url.pathname.startsWith(SCOPE.pathname))return false;
  const path=url.pathname.slice(SCOPE.pathname.length);
  return ['', 'index.html','bootstrap.js','transit-model.js','manifest.webmanifest'].includes(path)
    || /^parts\/[hcda][1-7]\/\d{2}\.txt$/.test(path)
    || /^assets\/[\w-]+\.svg$/.test(path);
}
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('caldaspace-')&&key!==CACHE).map(key=>caches.delete(key))))
    .then(()=>self.clients.claim())
));
self.addEventListener('fetch',event=>{
  if(!cacheable(event.request))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try{
      const response=await fetch(event.request);
      if(response.ok&&response.type==='basic')await cache.put(event.request,response.clone());
      return response;
    }catch(error){const cached=await cache.match(event.request);if(cached)return cached;throw error;}
  })());
});
