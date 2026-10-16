// Testes do sistema de temas: tokens, paleta, contraste, ausência de cores soltas e comportamento (jsdom).
const {JSDOM}=require('jsdom');
const {HTML,CSS,COMPONENT_CSS,LIGHT,DARK,PAIRS,REQUIRED,SPEC,ratio}=require('../scripts/tema-lib');
let fails=0;const chk=(c,m)=>{console.log(c?'ok  ':'FAIL',m);if(!c)fails++};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const norm=h=>h.toUpperCase();

// ---------- 1. tokens e paleta ----------
const miss=t=>REQUIRED.filter(k=>!t[k]);
chk(!miss(LIGHT).length&&!miss(DARK).length,'tokens semânticos obrigatórios definidos nos dois temas ('+REQUIRED.length+')'+(miss(LIGHT).length?' · faltam no claro: '+miss(LIGHT):'')+(miss(DARK).length?' · faltam no escuro: '+miss(DARK):''));
const onlyL=Object.keys(LIGHT).filter(k=>!(k in DARK)),onlyD=Object.keys(DARK).filter(k=>!(k in LIGHT));
chk(!onlyL.length&&!onlyD.length,'o tema escuro redefine exatamente os mesmos tokens do claro (mesma estrutura)'+(onlyL.length?' · só no claro: '+onlyL:'')+(onlyD.length?' · só no escuro: '+onlyD:''));
for(const th of ['light','dark']){const T=th==='light'?LIGHT:DARK,bad=Object.entries(SPEC[th]).filter(([k,v])=>norm(T[k]||'')!==norm(v));chk(!bad.length,'paleta do briefing (tema '+(th==='light'?'claro':'escuro')+'): '+Object.keys(SPEC[th]).length+' cores conferem'+(bad.length?' · divergem: '+bad.map(b=>b[0]+'='+T[b[0]]):''))}

// ---------- 2. contraste WCAG 2.2 AA ----------
for(const [nome,T] of [['claro',LIGHT],['escuro',DARK]]){const fal=PAIRS.filter(([d,a,b,m])=>ratio(T[a],T[b])<m).map(([d,a,b,m])=>d+' '+ratio(T[a],T[b]).toFixed(2)+'<'+m);chk(!fal.length,`contraste no tema ${nome}: ${PAIRS.length} combinações (texto ≥4,5 · componentes ≥3)`+(fal.length?' · FALHAS: '+fal.join('; '):''))}

// ---------- 3. nenhuma cor solta fora dos tokens ----------
chk(COMPONENT_CSS.length>6000&&/\.btn\{/.test(COMPONENT_CSS)&&/\.tsw\{/.test(COMPONENT_CSS),'verificação de sanidade: o CSS de componentes foi isolado corretamente ('+COMPONENT_CSS.length+' caracteres), então os testes abaixo não passam vazios');
const cores=/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/g;
chk(!(COMPONENT_CSS.match(cores)||[]).length,'CSS dos componentes sem hexadecimal/rgb (só var(--token))'+((COMPONENT_CSS.match(cores)||[]).length?' · '+COMPONENT_CSS.match(cores).slice(0,5):''));
const SEMCOM=HTML.replace(/\/\*[\s\S]*?\*\//g,'');
const rest=SEMCOM.slice(SEMCOM.indexOf('</style>')).replace(/<script>\s*\(function\(\)\{var r=document[\s\S]*?<\/script>/,'').replace(/href="#[a-z]+"/g,'').replace(/%[0-9A-F]{2}/g,'');
const soltas=(rest.match(/(?<![\w&])#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?\b(?![\w-])|rgba?\([^)]*\)|hsla?\([^)]*\)/g)||[]).filter(x=>/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(x)?/\d/.test(x)&&!/^#[a-z]+$/i.test(x):true);
chk(soltas.length===0,'HTML/JavaScript sem cores fixas (gráficos e componentes usam tokens)'+(soltas.length?' · '+soltas.slice(0,6):''));
const legado=SEMCOM.match(/var\(--(sage2?|sand|forest|ink|mut|line|bg|bd|sh)\)/g);chk(!legado,'nenhum nome de variável antigo restante'+(legado?' · '+legado.slice(0,4):''));
const definidos=new Set([...Object.keys(LIGHT),'r','a']) /* r = raio (compartilhado); a = ângulo da animação */,usados=[...new Set([...SEMCOM.matchAll(/var\(--([a-z0-9-]+)\)/g)].map(m=>m[1]))],indef=usados.filter(u=>!definidos.has(u));
chk(!indef.length,'todo var(--x) usado existe nos tokens ('+usados.length+' tokens em uso)'+(indef.length?' · indefinidos: '+indef:''));
const regrasDestrutivas=COMPONENT_CSS.split('}').filter(r=>/var\(--destructive/.test(r)).map(r=>r.split('{')[0].trim());
chk(regrasDestrutivas.length>0&&regrasDestrutivas.every(s=>/aria-invalid|toast\.err/.test(s)),'cor de erro só em campo inválido e aviso de erro, nunca em peso ou metas ('+regrasDestrutivas.length+' regras)');

// ---------- 4. carregamento sem flash ----------
const iHead=HTML.indexOf('<head>'),iStyle=HTML.indexOf('</style>'),iBody=HTML.indexOf('<body>'),iScript=HTML.indexOf('Aplica o tema salvo');
chk(iScript>iStyle&&iScript<iBody&&iScript>iHead,'script do tema roda no <head>, depois do CSS e antes do <body> (antes da primeira pintura)');
chk(/<meta name="color-scheme" content="light dark">/.test(HTML)&&/<meta name="theme-color" id="tcolor"/.test(HTML),'meta color-scheme e theme-color presentes');

// ---------- 5. comportamento no navegador simulado ----------
function boot({store,dark=false}={}){let listeners=[];const st={dark};
 const dom=new JSDOM(HTML,{runScripts:'dangerously',url:'https://x.test/',pretendToBeVisual:true,beforeParse(w){w.confirm=()=>true;if(store)w.localStorage.setItem('viva-theme',store);
  w.matchMedia=q=>({matches:st.dark&&/dark/.test(q),media:q,addEventListener:(t,f)=>listeners.push(f),removeEventListener(){}})}});
 return{dom,st,fire:()=>listeners.forEach(f=>f({matches:st.dark}))}}
const th=d=>d.window.document.documentElement.dataset.theme,pref=d=>d.window.document.documentElement.dataset.themePref,ls=d=>d.window.localStorage.getItem('viva-theme');
(async()=>{
 let b=boot({dark:false});await wait(150);chk(th(b.dom)==='light'&&pref(b.dom)==='auto','sem preferência + sistema claro → claro');
 b=boot({dark:true});await wait(150);chk(th(b.dom)==='dark'&&pref(b.dom)==='auto','sem preferência + sistema escuro → escuro (Automático)');
 b=boot({store:'dark',dark:false});await wait(150);chk(th(b.dom)==='dark'&&pref(b.dom)==='dark','preferência manual Escuro vence o sistema claro');
 b=boot({store:'light',dark:true});await wait(150);chk(th(b.dom)==='light','preferência manual Claro vence o sistema escuro (não é sobrescrita)');
 // troca pela interface, sem recarregar
 b=boot({dark:false});await wait(150);const D=b.dom,doc=D.window.document,tsw=()=>[...doc.querySelectorAll('.side .tsw button')];
 chk(tsw().length===3&&tsw().every(x=>x.querySelector('svg')&&x.textContent.trim()),'menu lateral: controle com 3 opções (sol, lua, sistema), cada uma com texto acessível');
 doc.querySelector('.side .tsw [data-arg=dark]').click();await wait(60);
 chk(th(D)==='dark'&&ls(D)==='dark'&&tsw().map(x=>x.getAttribute('aria-pressed')).join()==='false,true,false','clicar em Escuro: aplica, salva e marca o botão (aria-pressed)');
 const antes=D.window.eval('JSON.stringify([db.L.water.length,db.habits.filter(h=>h.d).length,db.p.name])');
 doc.querySelector('.side .tsw [data-arg=light]').click();await wait(60);chk(th(D)==='light'&&ls(D)==='light','clicar em Claro');
 chk(D.window.eval('JSON.stringify([db.L.water.length,db.habits.filter(h=>h.d).length,db.p.name])')===antes,'trocar o tema não altera dados');
 b.st.dark=true;doc.querySelector('.side .tsw [data-arg=auto]').click();await wait(60);chk(th(D)==='dark'&&pref(D)==='auto'&&ls(D)===null,'Automático: segue o sistema e remove a escolha manual');
 b.st.dark=false;b.fire();await wait(40);chk(th(D)==='light','Automático: acompanha a mudança do sistema ao vivo');
 doc.querySelector('.side .tsw [data-arg=dark]').click();await wait(40);b.st.dark=false;b.fire();await wait(40);chk(th(D)==='dark','manual não é sobrescrito quando o sistema muda');
 D.window.localStorage.setItem('viva-theme','light');D.window.dispatchEvent(new D.window.StorageEvent('storage',{key:'viva-theme',newValue:'light'}));await wait(40);chk(th(D)==='light','mudança feita em outra aba é aplicada (evento storage)');
 // onde o controle aparece
 D.window.location.hash='perfil';await wait(120);chk(doc.querySelectorAll('#main .tsw button').length===3&&/Claro/.test(doc.querySelector('#main .tsw').textContent)&&/Automático/.test(doc.querySelector('#main .tsw').textContent),'Perfil: seção Aparência com Claro, Escuro e Automático');
 doc.querySelector('[data-act=more]').click();await wait(60);chk(doc.querySelectorAll('#layer .tsw button').length===3,'celular: controle rápido dentro de "Mais"');
 const sb=new JSDOM(HTML.replace("const SB=window.VIVA_CONFIG||{url:'',key:''}","const SB={url:'u',key:'k'}"),{runScripts:'dangerously',url:'https://x.test/',pretendToBeVisual:true,beforeParse(w){w.supabase={createClient:()=>({from:()=>({}),auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange(){}}})}}});await wait(200);
 chk(sb.window.document.querySelectorAll('#main .tsw button').length===3,'tela de login: visitante também pode escolher o tema');
 console.log(fails?fails+' falhas':'TEMA OK');process.exit(fails?1:0)})();
