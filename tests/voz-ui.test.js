const {JSDOM}=require('jsdom'),assert=require('node:assert/strict');
const html=require('./html'),wait=()=>new Promise(r=>setTimeout(r,80));
(async()=>{
 const d=new JSDOM(html,{url:'https://viva.test',runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){w.scrollTo=()=>{}}}),w=d.window;
 await wait();assert(w.document.querySelector('.viva-voz p'));
 w.location.hash='perfil';await wait();
 const style=w.document.querySelector('[aria-label="Personalidade"]');style.value='carinhoso';style.dispatchEvent(new w.Event('change'));
 const freq=w.document.querySelector('[aria-label="Frequência"]');freq.value='desligado';freq.dispatchEvent(new w.Event('change'));
 w.location.hash='dashboard';await wait();assert(w.document.querySelector('.viva-voz').hidden);
 const saved=w.localStorage.getItem('viva.voz.v1.demo');assert.equal(JSON.parse(saved).pref.estilo,'carinhoso');
 const reload=new JSDOM(html,{url:'https://viva.test',runScripts:'dangerously',beforeParse(x){x.scrollTo=()=>{};x.localStorage.setItem('viva.voz.v1.demo',saved)}});
 await wait();assert(reload.window.document.querySelector('.viva-voz').hidden);reload.window.close();
 w.location.hash='perfil';await wait();const f=w.document.querySelector('[aria-label="Frequência"]');f.value='normal';f.dispatchEvent(new w.Event('change'));
 w.location.hash='hidratacao';await wait();w.document.querySelector('[data-act="wadd"][data-arg="200"]').click();await wait();
 assert.match(w.document.querySelector('.viva-voz p').textContent,/Registrado|Anotei|Boa/);
 w.document.querySelector('.viva-voz button:nth-child(2)').click();assert(w.document.querySelector('.viva-voz').hidden);
 w.close();console.log('VOZ UI OK: integração, preferências, recarga, desligar, reação e dispensa');
})().catch(e=>{console.error(e);process.exit(1)});
