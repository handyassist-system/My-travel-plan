/* 旅遊計畫 Service Worker — 網路優先，離線才用快取 */
var CACHE = 'travel-cache-v1';
var CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(CORE).catch(function(){}); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){ return k===CACHE ? null : caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('message', function(e){ if(e.data==='SKIP_WAITING') self.skipWaiting(); });

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  var url = e.request.url;
  if(url.indexOf('firebase') > -1 || url.indexOf('googleapis') > -1 || url.indexOf('gstatic') > -1) return;
  var bare = url.split('?')[0].split('#')[0];
  var isPage = e.request.mode === 'navigate' || /\.html$/.test(bare) || /\/$/.test(bare);
  var netReq = isPage ? fetch(url, { cache:'no-store', credentials:'same-origin' }) : fetch(e.request);
  e.respondWith(
    netReq.then(function(res){
      if(res && res.ok){
        var copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
      }
      return res;
    }).catch(function(){
      return caches.match(e.request).then(function(hit){
        return hit || caches.match('./index.html');
      });
    })
  );
});
