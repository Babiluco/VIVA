// Utilitários dos testes no navegador real (Chromium). Requer: npm i --no-save @sparticuz/chromium puppeteer-core
import fs from 'fs';import path from 'path';import {fileURLToPath,pathToFileURL} from 'url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
export const URL=pathToFileURL(path.join(HERE,'..','..','index.html')).href;
export const OUT=path.join(HERE,'..','screenshots');fs.mkdirSync(OUT,{recursive:true});
export const wait=ms=>new Promise(r=>setTimeout(r,ms));
export async function launch(){let chromium,puppeteer;
  try{chromium=(await import('@sparticuz/chromium')).default;puppeteer=(await import('puppeteer-core')).default}
  catch(e){console.log('Testes no navegador ignorados. Para rodá-los: npm i --no-save @sparticuz/chromium puppeteer-core');process.exit(0)}
  return puppeteer.launch({args:[...chromium.args,'--no-sandbox'],executablePath:await chromium.executablePath(),headless:'shell'})}
// Auditoria executada DENTRO da página: contraste real de cada texto e dos elementos gráficos, fundos brancos no escuro e rolagem horizontal.
export const AUDIT=()=>{
  const P=c=>{const m=c&&c.match(/rgba?\(([^)]+)\)/);if(!m)return null;const p=m[1].split(/[ ,\/]+/).filter(Boolean).map(Number);return{r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1}};
  const over=(t,b)=>({r:t.r*t.a+b.r*(1-t.a),g:t.g*t.a+b.g*(1-t.a),b:t.b*t.a+b.b*(1-t.a),a:1});
  const L=c=>{const f=v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4};return .2126*f(c.r)+.7152*f(c.g)+.0722*f(c.b)};
  const CR=(a,b)=>{const x=L(a),y=L(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
  const bgOf=el=>{const layers=[];for(let e=el;e;e=e.parentElement){const c=P(getComputedStyle(e).backgroundColor);if(c&&c.a>0){layers.push(c);if(c.a>=1)break}}
    let base=P(getComputedStyle(document.body).backgroundColor)||{r:255,g:255,b:255,a:1};if(base.a<1)base=over(base,{r:255,g:255,b:255,a:1});
    for(let i=layers.length-1;i>=0;i--)base=over(layers[i],base);return base};
  const opac=el=>{let o=1;for(let e=el;e;e=e.parentElement)o*=parseFloat(getComputedStyle(e).opacity);return o};
  const sel=el=>{let s=el.tagName.toLowerCase();if(el.id)s+='#'+el.id;if(el.className&&typeof el.className==='string')s+='.'+el.className.trim().split(/\s+/).join('.');return s};
  const fails=[];let n=0;
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()){const t=walker.currentNode;if(!t.nodeValue.trim())continue;const el=t.parentElement;if(!el||el.closest('script,style,.sr'))continue;
    const cs=getComputedStyle(el),r=el.getBoundingClientRect();if(r.width===0||r.height===0||r.right<0||cs.visibility==='hidden'||cs.display==='none')continue;
    if(el.closest('[disabled]'))continue;
    const isSvg=el instanceof SVGElement;let fg=P(isSvg?cs.fill:cs.color);if(!fg)continue;const o=opac(el);fg={...fg,a:fg.a*o};
    const bg=bgOf(el),eff=over(fg,bg),ratio=CR(eff,bg),px=parseFloat(cs.fontSize),bold=parseInt(cs.fontWeight)>=700,large=px>=24||(px>=18.66&&bold),min=large?3:4.5;n++;
    if(ratio<min)fails.push({el:sel(el),text:t.nodeValue.trim().slice(0,28),ratio:+ratio.toFixed(2),min,fg:cs.color||cs.fill,bg:`rgb(${bg.r|0},${bg.g|0},${bg.b|0})`})}
  // elementos gráficos e bordas de campos (mínimo 3:1)
  const gfx=[];const chk=(q,prop,name,ref)=>document.querySelectorAll(q).forEach(el=>{const cs=getComputedStyle(el),r=el.getBoundingClientRect();if(r.width===0||el.closest('[disabled]'))return;
    const c=P(prop==='stroke'?cs.stroke:prop==='border'?cs.borderTopColor:cs.backgroundColor);if(!c||c.a===0)return;const bg=bgOf(ref?ref(el):el.parentElement);const ratio=CR(over(c,bg),bg);gfx.push({name,ratio:+ratio.toFixed(2),ok:ratio>=3})});
  chk('.prog i','bg','indicador de progresso',el=>el.parentElement);chk('.bars i','bg','barra do gráfico');chk('.field input,.field select','border','borda de campo',el=>el.parentElement);
  chk('.pill:not(:has(input:checked)):not([aria-pressed=true])','border','borda de opção');chk('.tsw','border','borda do seletor de tema');chk('svg polyline','stroke','linha do gráfico');chk('.chk input:not(:checked)','border','caixa de seleção');
  // fundos brancos indevidos no escuro
  const dark=document.documentElement.dataset.theme==='dark',white=[];
  if(dark)document.querySelectorAll('body *').forEach(el=>{const c=P(getComputedStyle(el).backgroundColor);if(c&&c.a>0&&c.r>235&&c.g>235&&c.b>235){const r=el.getBoundingClientRect();if(r.width>0)white.push(sel(el))}});
  const overflow=document.documentElement.scrollWidth>innerWidth+1;
  return{n,fails,gfx,white,overflow};
};
