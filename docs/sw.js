/* Cache the application shell only. Private study data is never cached here. */
const CACHE='mir27-shell-1.3.0';
const ASSETS=['/','/index.html','/core-v1.js?v=1.3.0','/store-v1.js?v=1.3.0','/app-v1.js?v=1.3.0','/print-v1.js?v=1.3.0','/launcher.js?v=1.3.0','/offline-v1.js?v=1.3.0','/styles-v1.css?v=1.3.0','/icon.svg','/manifest.webmanifest'];
const PATHS=new Set(ASSETS.map(x=>new URL(x,self.location.origin).pathname));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('mir27-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 if(request.mode==='navigate'){
  event.respondWith(fetch(request).catch(async()=>{const cache=await caches.open(CACHE);return(await cache.match('/index.html'))||Response.error();}));return;
 }
 if(!PATHS.has(url.pathname))return;
 event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(request))||fetch(request)));
});
