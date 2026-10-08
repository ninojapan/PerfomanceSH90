const CACHE='nh90-perf-v32';
const FILES=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png','./icons/apple-touch-icon.png'];
// precache bypassing the browser HTTP cache (GitHub Pages keeps files for 10 min): never store an old page in a new version
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('message',e=>{if(e.data==='ver'&&e.source)e.source.postMessage({ver:CACHE});});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);if(url.origin!==location.origin)return;
  const page=req.mode==='navigate'||url.pathname.endsWith('/')||url.pathname.endsWith('/index.html');
  if(page){
    // the app page: network first (always the latest version when online), cache after 4 s or offline
    const net=fetch(url.pathname,{cache:'no-cache',credentials:'same-origin'}).then(res=>{if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put('./index.html',cp));}return res;});
    e.waitUntil(net.catch(()=>{}));
    e.respondWith(new Promise(resolve=>{let done=false;const fin=r=>{if(!done&&r){done=true;resolve(r);}};
      const cached=()=>caches.match('./index.html').then(r=>r||caches.match('./'));
      const t=setTimeout(()=>cached().then(fin),4000);
      net.then(r=>{clearTimeout(t);fin(r);}).catch(()=>{clearTimeout(t);cached().then(r=>{fin(r||Response.error());});});}));
    return;
  }
  e.respondWith(caches.match(req,{ignoreSearch:true}).then(hit=>hit||fetch(req).then(res=>{
    if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(req,cp));}return res;})));
});
