const V='situp-v6';
const SHELL=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:'reload'})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const url=new URL(r.url);
  if(url.origin===self.location.origin){
    // 自分のファイル：まずネットワーク（新しい版を取る）、だめなら保存分
    e.respondWith(
      fetch(r.url,{cache:'no-cache'}).then(res=>{
        if(res&&res.status===200){const c=res.clone();caches.open(V).then(ch=>ch.put(r,c));}
        return res;
      }).catch(()=>caches.match(r,{ignoreSearch:true}).then(hit=>hit||(r.mode==='navigate'?caches.match('./index.html'):undefined)))
    );
  }else{
    // 外部（wasm・モデル）：保存分があればそれを使い、なければ取得して保存
    e.respondWith(caches.match(r).then(hit=>{
      if(hit)return hit;
      return fetch(r).then(res=>{
        if(res&&(res.status===200||res.type==='opaque')){const c=res.clone();caches.open(V).then(ch=>ch.put(r,c));}
        return res;
      });
    }));
  }
});
