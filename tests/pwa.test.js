const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom'),html=require('./html'),root=path.join(__dirname,'..');
const wait=()=>new Promise(r=>setTimeout(r,60));

async function workerTests(){
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
 assert.equal(manifest.display,'standalone');assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');assert.equal(manifest.id,'./');
 for(const icon of manifest.icons){const b=fs.readFileSync(path.join(root,icon.src));const size=Number(icon.sizes.split('x')[0]);assert.equal(b.readUInt32BE(16),size);assert.equal(b.readUInt32BE(20),size)}
 for(const scope of ['https://viva.test/','https://viva.test/viva-app/']){
  const handlers={},entries=new Map(),deleted=[];let claimed=false,skipped=false,failNetwork=false,onlineRequests=0;
  const cache={addAll:async urls=>urls.forEach(url=>entries.set(url,'public:'+url)),match:async request=>entries.get(typeof request==='string'?request:request.url)};
  const caches={open:async()=>cache,keys:async()=>['other-app-cache','viva-pwa:'+scope+':old','viva-pwa:'+scope+':v1'],delete:async key=>{deleted.push(key);return true}};
  const self={registration:{scope},location:new URL(scope),clients:{claim:async()=>{claimed=true}},skipWaiting:()=>{skipped=true},addEventListener:(name,handler)=>{handlers[name]=handler}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'sw.js'),'utf8'),{self,caches,URL,fetch:async()=>{onlineRequests++;if(failNetwork)throw Error('offline');return'online'}});
  let promise;handlers.install({waitUntil:p=>{promise=p}});await promise;assert.equal(skipped,false);
  assert(entries.has(scope+'offline.html'));assert(!entries.has(scope+'config.js'));assert(!entries.has(scope+'index.html'));
  handlers.activate({waitUntil:p=>{promise=p}});await promise;assert(claimed);assert.deepEqual(deleted,['viva-pwa:'+scope+':old']);
  for(const request of [
   {url:scope+'config.js',method:'GET'},
   {url:scope+'api/water_logs',method:'GET'},
   {url:scope+'icons/viva-192.png?token=private',method:'GET'},
   {url:'https://project.supabase.co/rest/v1/water_logs',method:'GET'},
   {url:'https://project.supabase.co/auth/v1/token',method:'POST'},
   {url:scope+'icons/viva-192.png',method:'POST'},
   {url:'https://viva.test/another-app/',method:'GET',mode:'navigate',onlySubpath:true}
  ]){if(request.onlySubpath&&scope==='https://viva.test/')continue;let intercepted=false;handlers.fetch({request,respondWith:()=>{intercepted=true}});assert(!intercepted,request.url)}
  let response;const navigation={url:scope+'?code=private',method:'GET',mode:'navigate'};
  handlers.fetch({request:navigation,respondWith:p=>{response=p}});assert.equal(await response,'online');assert.equal(onlineRequests,1);
  failNetwork=true;handlers.fetch({request:navigation,respondWith:p=>{response=p}});assert.equal(await response,'public:'+scope+'offline.html');assert(!entries.has(navigation.url));
  handlers.message({data:{type:'unknown'}});assert(!skipped);handlers.message({data:{type:'VIVA_ACTIVATE_UPDATE'}});assert(skipped);
 }
 console.log('PWA OK: manifesto, ícones, raiz/subpasta, atualização e cache sem dados privados');
}

async function uiTests(){
 let registered;const workerListeners={},reg={waiting:null,addEventListener(){}};
 const d=new JSDOM(html,{url:'https://viva.test/viva-app/',runScripts:'dangerously',beforeParse(w){
  w.scrollTo=()=>{};Object.defineProperty(w,'isSecureContext',{value:true});w.matchMedia=()=>({matches:false,addEventListener(){}});
  Object.defineProperty(w.navigator,'serviceWorker',{value:{controller:{},register:async(url,options)=>{registered={url,options};return reg},addEventListener:(name,fn)=>{workerListeners[name]=fn}}});
 }}),w=d.window,doc=w.document;
 await wait();assert.equal(registered.url,'https://viva.test/viva-app/sw.js');assert.equal(registered.options.scope,'./');assert(!doc.getElementById('pwa-tools').hidden);
 doc.getElementById('pwa-install').click();assert(!doc.getElementById('pwa-help').hidden);assert.match(doc.getElementById('pwa-help').textContent,/iPhone/);
 doc.getElementById('pwa-help-close').click();assert(doc.getElementById('pwa-help').hidden);
 let prompted=0;const event=new w.Event('beforeinstallprompt',{cancelable:true});event.prompt=async()=>{prompted++};event.userChoice=Promise.resolve({outcome:'dismissed'});w.dispatchEvent(event);assert(event.defaultPrevented);
 doc.getElementById('pwa-install').click();await wait();assert.equal(prompted,1);assert(!doc.getElementById('pwa-tools').hidden);
 Object.defineProperty(w.navigator,'onLine',{value:false,configurable:true});w.dispatchEvent(new w.Event('offline'));assert(!doc.getElementById('pwa-network').hidden);
 Object.defineProperty(w.navigator,'onLine',{value:true,configurable:true});w.dispatchEvent(new w.Event('online'));assert(doc.getElementById('pwa-network').hidden);
 w.dispatchEvent(new w.Event('appinstalled'));assert(doc.getElementById('pwa-tools').hidden);w.close();
 const broken=new JSDOM(html.replace("const SB=window.VIVA_CONFIG||{url:'',key:''}","const SB={url:'https://project.supabase.co',key:'public-test'}"),{url:'https://viva.test/',runScripts:'dangerously',beforeParse(x){x.scrollTo=()=>{}}});
 await wait();assert.match(broken.window.document.getElementById('main').textContent,/Não foi possível conectar/);broken.window.location.hash='dashboard';await wait();assert(!broken.window.document.getElementById('main').textContent.includes('Barbara'));broken.window.close();
 console.log('PWA UI OK: ajuda, instalação recusada, rede, instalação concluída e proteção contra demonstração acidental');
}
(async()=>{await workerTests();await uiTests()})().catch(e=>{console.error(e);process.exit(1)});
