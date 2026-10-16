// Interação no navegador real: alternar sem recarregar, persistência, sem flash, automático, teclado, movimento reduzido, celular e contraste dos estados abertos.
import path from 'path';import {launch,AUDIT,URL,OUT,wait} from './common.mjs';
const browser=await launch();
let fails=0;const chk=(c,m)=>{console.log(c?'ok  ':'FAIL',m);if(!c)fails++};
const BG={light:'rgb(246, 247, 242)',dark:'rgb(20, 26, 22)'};
async function open(opts={}){const p=await browser.newPage();await p.setViewport(opts.mobile?{width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true}:{width:1280,height:860});
  await p.setRequestInterception(true);p.on('request',r=>r.url().startsWith('http')?r.abort():r.continue());
  await p.emulateMediaFeatures([{name:'prefers-color-scheme',value:opts.sys||'light'}]);
  if(opts.clear)await p.evaluateOnNewDocument(()=>{localStorage.removeItem('viva-theme')});
  if(opts.store)await p.evaluateOnNewDocument(v=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem('viva-theme',v);sessionStorage.setItem('seeded','1')}},opts.store);
  if(opts.spy)await p.evaluateOnNewDocument(()=>{window.__seq=[];const rec=()=>{const t=document.documentElement.dataset.theme;if(t&&window.__seq.at(-1)!==t)window.__seq.push(t)};new MutationObserver(rec).observe(document,{subtree:true,attributes:true,attributeFilter:['data-theme']});document.addEventListener('DOMContentLoaded',()=>{window.__dcl=[document.documentElement.dataset.theme,getComputedStyle(document.body).backgroundColor]});rec()});
  await p.goto(URL,{waitUntil:'domcontentloaded'});await wait(450);return p}
const state=p=>p.evaluate(()=>({t:document.documentElement.dataset.theme,pref:document.documentElement.dataset.themePref,ls:localStorage.getItem('viva-theme'),bg:getComputedStyle(document.body).backgroundColor,meta:document.getElementById('tcolor').content,marker:window.__m}));
// 1) alternar sem recarregar
let p=await open({sys:'light'});await p.evaluate(()=>{window.__m=42});
await p.click('.side .tsw [data-arg=dark]');await wait(150);let s=await state(p);
chk(s.t==='dark'&&s.pref==='dark'&&s.ls==='dark'&&s.bg===BG.dark&&s.marker===42,'alternar para Escuro: aplica na hora, salva a preferência e não recarrega a página');
chk(s.meta.toLowerCase()==='#141a16','cor da barra do navegador (theme-color) acompanha o tema: '+s.meta);
chk(await p.evaluate(()=>[...document.querySelectorAll('.side .tsw button')].map(b=>b.getAttribute('aria-pressed')).join())==='false,true,false','seletor mostra Escuro como selecionado (aria-pressed)');
await p.click('.side .tsw [data-arg=light]');await wait(150);s=await state(p);chk(s.t==='light'&&s.ls==='light'&&s.bg===BG.light&&s.marker===42,'alternar para Claro');
// 2) automático acompanha o sistema; manual não é sobrescrito
await p.emulateMediaFeatures([{name:'prefers-color-scheme',value:'dark'}]);await wait(100);s=await state(p);chk(s.t==='light','manual (Claro) NÃO é sobrescrito quando o sistema muda para escuro');
await p.click('.side .tsw [data-arg=auto]');await wait(150);s=await state(p);chk(s.t==='dark'&&s.pref==='auto'&&s.ls===null,'Automático com sistema escuro → escuro, e remove a preferência manual');
await p.emulateMediaFeatures([{name:'prefers-color-scheme',value:'light'}]);await wait(150);s=await state(p);chk(s.t==='light'&&s.marker===42,'Automático acompanha a mudança do sistema ao vivo, sem recarregar');
// 3) gráficos e dados mudam com o tema sem re-renderizar
await p.evaluate(()=>{location.hash='evolucao'});await wait(400);
const stroke=()=>p.evaluate(()=>getComputedStyle(document.querySelector('svg polyline')).stroke);const c1=await stroke();
await p.evaluate(()=>{document.querySelector('.side .tsw [data-arg=dark]').click()});await wait(150);const c2=await stroke();chk(c1!==c2,`cor da linha do gráfico muda com o tema (${c1} → ${c2})`);
await p.evaluate(()=>{location.hash='habitos'});await wait(300);
const checked=()=>p.evaluate(()=>document.querySelectorAll('.hrow input:checked').length);const n1=await checked();
await p.evaluate(()=>{document.querySelector('.side .tsw [data-arg=light]').click()});await wait(150);chk((await checked())===n1&&n1>0,'trocar o tema não altera dados nem estado dos componentes ('+n1+' hábitos marcados antes e depois)');
await p.close();
// 4) persistência + sem flash
p=await open({sys:'light',store:'dark',spy:true});s=await state(p);const spy=await p.evaluate(()=>({seq:window.__seq,dcl:window.__dcl}));
chk(s.t==='dark'&&s.ls==='dark','preferência Escuro persiste ao reabrir o app (sistema claro)');
chk(JSON.stringify(spy.seq)==='["dark"]'&&spy.dcl[0]==='dark'&&spy.dcl[1]===BG.dark,'sem flash do tema errado: o tema correto é definido antes da primeira pintura (histórico: '+JSON.stringify(spy.seq)+', fundo no DOMContentLoaded: '+spy.dcl[1]+')');
await p.reload({waitUntil:'domcontentloaded'});await wait(300);s=await state(p);chk(s.t==='dark','continua escuro após atualizar a página');
await p.close();
p=await open({sys:'dark',store:'light',spy:true});s=await state(p);chk(s.t==='light'&&s.ls==='light','preferência manual Claro vence o sistema escuro (visitante, sem login)');await p.close();
p=await open({sys:'dark',spy:true,clear:true});s=await state(p);const sp2=await p.evaluate(()=>window.__seq);chk(s.t==='dark'&&s.pref==='auto'&&JSON.stringify(sp2)==='["dark"]','primeira visita com sistema escuro já abre escuro, sem flash');await p.close();
// 5) teclado
p=await open({sys:'light'});
let ok=false;for(let i=0;i<30&&!ok;i++){await p.keyboard.press('Tab');ok=await p.evaluate(()=>document.activeElement.matches('.side .tsw [data-arg=light]'))}
chk(ok,'seletor de tema alcançável com a tecla Tab');
await p.keyboard.press('Tab');await p.keyboard.press('Enter');await wait(150);s=await state(p);chk(s.t==='dark','Enter no botão Escuro troca o tema pelo teclado');
const ring=await p.evaluate(()=>{const e=document.activeElement,c=getComputedStyle(e);return{w:c.outlineWidth,st:c.outlineStyle,col:c.outlineColor,ringVar:getComputedStyle(document.documentElement).getPropertyValue('--ring').trim()}});
chk(ring.st==='solid'&&ring.w==='3px','foco de teclado visível (contorno de 3 px na cor do token ring: '+ring.col+' / '+ring.ringVar+')');
// 6) movimento reduzido
await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);await wait(100);
chk(await p.evaluate(()=>parseFloat(getComputedStyle(document.querySelector('.nav')).transitionDuration)<0.001),'prefers-reduced-motion desliga transições e animações');
await p.close();
// 7) mobile: "Mais" e Perfil
p=await open({sys:'light',mobile:true});await p.click('[data-act=more]');await wait(200);
chk(await p.evaluate(()=>!!document.querySelector('#layer .tsw')&&document.querySelectorAll('#layer .tsw button').length===3),'celular: controle rápido de tema dentro de "Mais"');
await p.click('#layer .tsw [data-arg=dark]');await wait(150);s=await state(p);chk(s.t==='dark'&&(await p.evaluate(()=>!!document.querySelector('#layer .modal'))),'celular: troca o tema com a janela aberta e sem fechá-la');
await p.screenshot({path:path.join(OUT,'state-dark-mobile-mais.png')});
await p.evaluate(()=>{A.close();location.hash='perfil'});await wait(400);
chk(await p.evaluate(()=>{const b=[...document.querySelectorAll('#main .tsw button')];return b.length===3&&b.every(x=>x.querySelector('svg')&&x.textContent.trim().length>2)&&b.some(x=>x.getAttribute('aria-pressed')==='true')}),'Perfil: 3 opções com ícone, rótulo escrito e estado selecionado');
await p.close();
// 8) estados dos componentes: auditoria de contraste com modais, erros e popup abertos
const audited=[];
for(const theme of ['light','dark']){for(const mobile of [false,true]){
 p=await open({sys:theme,store:theme,mobile});const tag=`${theme}-${mobile?'mobile':'desktop'}`;
 const snap=async(name,fn)=>{await fn();await wait(250);const a=await p.evaluate(AUDIT);audited.push([tag+' '+name,a]);await p.screenshot({path:path.join(OUT,`state-${tag}-${name}.png`)})};
 await snap('modal-peso-erro',async()=>{await p.evaluate(()=>{location.hash='evolucao'});await wait(300);await p.evaluate(()=>{document.querySelector('[data-act=addWeight]').click()});await wait(150);await p.evaluate(()=>{document.getElementById('wk').value='5000';document.querySelector('[data-act=saveWeight]').click()})});
 await snap('modal-checkin',async()=>{await p.evaluate(()=>{A.close();location.hash='dashboard'});await wait(300);await p.evaluate(()=>document.querySelector('.emo[data-arg=bem]').click())});
 await snap('modal-habito',async()=>{await p.evaluate(()=>{A.close();location.hash='habitos'});await wait(300);await p.evaluate(()=>document.querySelector('[data-act=addHabit]').click())});
 await snap('modal-treino',async()=>{await p.evaluate(()=>{A.close();location.hash='exercicios'});await wait(300);await p.evaluate(()=>{document.querySelector('[data-act=addWorkout]').click();const x=document.getElementById('xt');x.value='musculacao';x.dispatchEvent(new Event('change',{bubbles:true}))})});
 await snap('conquista-e-avisos',async()=>{await p.evaluate(()=>{A.close();location.hash='metas'});await wait(300);await p.evaluate(()=>{celebrate([{i:'🏆',t:'Primeira semana'}]);toast('Ritmo mais acelerado do que o usual. Considere um prazo maior.',9000,'warn')})});
 await snap('aviso-erro',async()=>{await p.evaluate(()=>toast('E-mail ou senha incorretos.',9000,'err'))});
 await snap('tooltip-barra',async()=>{await p.evaluate(()=>{location.hash='hidratacao'});await wait(300);const b=await p.$('.bars div[data-tip]');if(b)await b.hover()});
 await p.close()}}
let tot=0,bad=0;for(const [k,a] of audited){tot+=a.n;const gb=a.gfx.filter(g=>!g.ok);const nb=a.fails.length+gb.length+a.white.length;bad+=nb;if(nb){console.log('  ✗',k);a.fails.slice(0,4).forEach(f=>console.log('     texto',JSON.stringify(f.text),f.ratio,'<',f.min,f.fg,'sobre',f.bg,f.el));gb.forEach(g=>console.log('     gráfico',g.name,g.ratio));a.white.slice(0,3).forEach(w=>console.log('     branco no escuro',w))}}
chk(bad===0,`estados abertos (modais, erro de campo, avisos, popup de conquista, tooltip) em claro/escuro × desktop/celular: ${tot} textos, 0 problemas de contraste`);
console.log(fails?fails+' FALHAS':'INTERAÇÃO OK');await browser.close();process.exit(fails?1:0);
