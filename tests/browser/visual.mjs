// Matriz visual: 11 telas × (claro, escuro, automático-escuro) × (desktop, celular), com captura de tela e auditoria de contraste real.
import fs from 'fs';import path from 'path';import {launch,AUDIT,URL,OUT} from './common.mjs';
const PAGES=['dashboard','alimentacao','hidratacao','sono','exercicios','habitos','evolucao','metas','checkin','semana','perfil'];
const VPS={desktop:{width:1280,height:860,deviceScaleFactor:1},mobile:{width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true}};
const browser=await launch();

const report={};let bad=0;
for(const mode of ['light','dark','auto-dark']){
 for(const [vpn,vp] of Object.entries(VPS)){
  const page=await browser.newPage();await page.setViewport(vp);
  await page.setRequestInterception(true);page.on('request',r=>r.url().startsWith('http')?r.abort():r.continue());
  await page.emulateMediaFeatures([{name:'prefers-color-scheme',value:mode==='light'?'light':'dark'}]);
  if(mode!=='auto-dark')await page.evaluateOnNewDocument(m=>{localStorage.setItem('viva-theme',m)},mode);
  await page.goto(URL,{waitUntil:'domcontentloaded'});await new Promise(r=>setTimeout(r,500));
  const attr=await page.evaluate(()=>document.documentElement.dataset.theme);
  for(const p of PAGES){await page.evaluate(h=>{location.hash=h},p);await new Promise(r=>setTimeout(r,350));
    await page.screenshot({path:path.join(OUT,`${mode}-${vpn}-${p}.png`),fullPage:true});
    const a=await page.evaluate(AUDIT);const k=`${mode}/${vpn}/${p}`;report[k]=a;
    const gb=a.gfx.filter(g=>!g.ok);bad+=a.fails.length+gb.length+a.white.length+(a.overflow?1:0)}
  console.log(`${mode.padEnd(9)} ${vpn.padEnd(8)} data-theme=${attr}`);
  await page.close();
 }
}
fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,1));
let texts=0,gfxN=0;for(const [k,a] of Object.entries(report)){texts+=a.n;gfxN+=a.gfx.length;
  for(const f of a.fails)console.log('TEXTO ',k,f.el,JSON.stringify(f.text),f.ratio,'<',f.min,f.fg,'sobre',f.bg);
  for(const g of a.gfx.filter(g=>!g.ok))console.log('GRÁFICO',k,g.name,g.ratio);
  for(const w of [...new Set(a.white)])console.log('BRANCO NO ESCURO',k,w);
  if(a.overflow)console.log('ROLAGEM HORIZONTAL',k)}
console.log(`\nVerificados: ${texts} trechos de texto e ${gfxN} elementos gráficos em ${Object.keys(report).length} telas. Problemas: ${bad}`);
await browser.close();process.exit(bad?1:0);
