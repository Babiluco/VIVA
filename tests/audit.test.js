const {JSDOM,VirtualConsole}=require('jsdom'),fs=require('fs');
const html0=require('./html');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let fails=0;const chk=(c,m)=>{console.log(c?'ok  ':'FAIL',m);if(!c)fails++};
function boot(sbMode){
  let T={profiles:[{id:'u1',name:'Ana',water_goal_ml:2000,sleep_goal_h:8,exercise_per_week:3,start_weight:null,journey_start:'2026-01-01'}],habits:[{id:'h1',user_id:'u1',name:'Beber água',icon:'💧',frequency:'diario',days:[0,1,2,3,4,5,6],active:true,created_at:'2026-01-01T00:00:00Z'}]},toasts=[];
  const vc=new VirtualConsole();
  const dom=new JSDOM(sbMode?html0.replace("const SB=window.VIVA_CONFIG||{url:'',key:''}","const SB={url:'u',key:'k'}"):html0,{runScripts:'dangerously',url:'https://x.test/',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.confirm=()=>true;w.__q=[];w.__calls=[];
    if(!sbMode)return;
    const mk=n=>{const rows=T[n]??=[];let op='sel',f=[],pay,one=false;const b={select(){return b},insert(r){op='ins';pay=r;return b},delete(){op='del';return b},update(r){op='upd';pay=r;return b},upsert(r){op='ups';pay=r;return b},eq(c,v){f.push(x=>x[c]==v);return b},gte(c,v){f.push(x=>x[c]>=v);return b},order(){return b},limit(){return b},range(){return b},single(){one=true;return b},
      then(res,rej){let data=null;if(op==='ins'){const out=[].concat(pay).map(p=>({id:'r'+Math.random(),...p}));rows.push(...out);data=one?out[0]:out}else if(op==='ups'){const i=rows.findIndex(x=>x.user_id===pay.user_id&&x.logged_on===pay.logged_on);i<0?rows.push({id:'r'+Math.random(),...pay}):Object.assign(rows[i],pay)}else if(op==='upd')rows.filter(x=>f.every(g=>g(x))).forEach(x=>Object.assign(x,pay));else if(op==='del')T[n]=rows.filter(x=>!f.every(g=>g(x)));else{w.__q.push(n);data=rows.filter(x=>f.every(g=>g(x)));if(n==='workout_logs')data=data.map(x=>({...x,workout_exercises:(T.workout_exercises||[]).filter(y=>y.workout_id==x.id)}));if(one)data=data[0]}res({data,error:null})}};return b};
    let sess=null;const U=e=>({id:'u1',email:e,user_metadata:{name:'Ana'}});w.__setSess=e=>{sess={user:U(e)}};
    w.supabase={createClient:()=>({from:mk,storage:{from:()=>({upload:async()=>({error:null}),createSignedUrls:async()=>({data:[]}),remove:async()=>({})})},auth:{getSession:async()=>({data:{session:sess}}),onAuthStateChange(cb){w.__authcb=cb},
      signInWithPassword:async({email,password})=>{w.__calls.push('signIn');return password==='errada'?{data:{},error:{message:'Invalid login credentials'}}:(sess={user:U(email)},{data:{session:sess},error:null})},
      signUp:async({email,password,options})=>{w.__calls.push('signUp:'+(options?.data?.name||''));if(/confirmar/.test(email))return{data:{session:null},error:null};if(/existe/.test(email))return{data:{},error:{message:'User already registered'}};return(sess={user:U(email)},{data:{session:sess},error:null})},
      signOut:async()=>{sess=null;return{error:null}},resetPasswordForEmail:async(e,o)=>{w.__calls.push('reset:'+e+'|'+o.redirectTo);return{error:null}},updateUser:async(u)=>{w.__calls.push('update:'+u.password);return{error:null}}}})};
  }});
  return {dom,T};
}
const $=(d,s)=>d.window.document.querySelector(s),$$=(d,s)=>[...d.window.document.querySelectorAll(s)],txt=d=>$(d,'#main').textContent,toastT=d=>$$(d,'.toast').map(e=>e.textContent).join('|');
const go=async(d,h)=>{d.window.location.hash=h;await wait(70)};
const click=async(d,s)=>{$(d,s).click();await wait(80)};
const key=(d,el,k)=>el.dispatchEvent(new d.window.KeyboardEvent('keydown',{key:k,bubbles:true,cancelable:true}));
const fill=(d,id,v)=>{d.window.document.getElementById(id).value=v};
(async()=>{
 // ===== AUTENTICAÇÃO COMPLETA =====
 let {dom,T}=boot(true);await wait(150);const W=dom.window,D=W.document;
 chk(/Entrar/.test(txt(dom))&&$(dom,'#ap').getAttribute('autocomplete')==='current-password'&&$(dom,'#ae').getAttribute('autocomplete')==='email','auth: tela de login com autocomplete correto');
 chk($$(dom,'.auth [data-act=authMode]').every(e=>e.tagName==='BUTTON'),'auth: links "Cadastre-se"/"Esqueci minha senha" são botões (alcançáveis pelo teclado)');
 fill(dom,'ae','ana@x.com');fill(dom,'ap','errada');await click(dom,'[data-act=login]');
 chk(/E-mail ou senha incorretos\./.test(toastT(dom))&&/Entrar/.test(txt(dom)),'login: senha errada mostra mensagem em português e continua no login');
 fill(dom,'ap','');await click(dom,'[data-act=login]');chk(/Informe e-mail e senha/.test(toastT(dom)),'login: campos vazios são validados antes de chamar o servidor');
 fill(dom,'ap','certa123');key(dom,$(dom,'#ap'),'Enter');await wait(250);
 chk(/Boa|Bom dia/.test(txt(dom))&&/Ana!/.test(txt(dom))&&!/Barbara/.test(txt(dom)),'login: tecla Enter entra, com o nome do perfil e sem dados de demonstração');
 chk(!/Barbara/.test(txt(dom))&&$$(dom,'#side a[aria-current=page]').length===1&&$(dom,'#side').getAttribute('aria-label')==='Menu principal','navegação: aria-label e aria-current');
 chk(D.title==='Viva · Início','navegação: título da página atualizado');
 // logout
 await go(dom,'perfil');await click(dom,'[data-act=logout]');await wait(100);
 chk(/Entrar/.test(txt(dom))&&D.body.classList.contains('noauth')&&!/Ana/.test(txt(dom)),'logout: volta ao login e limpa os dados da tela');
 // cadastro
 await click(dom,'[data-act=authMode][data-arg="signup"]');chk(/Criar conta/.test(txt(dom))&&$(dom,'#ap').getAttribute('autocomplete')==='new-password','cadastro: formulário com nome, e-mail e senha');
 fill(dom,'an','Bia');fill(dom,'ae','bia@x.com');fill(dom,'ap','123');await click(dom,'[data-act=signup]');chk(/pelo menos 6 caracteres/.test(toastT(dom))&&!W.__calls.some(c=>c.startsWith('signUp')),'cadastro: senha curta é barrada antes de chamar o servidor');
 fill(dom,'ae','existe@x.com');fill(dom,'ap','123456');await click(dom,'[data-act=signup]');chk(/já tem cadastro/.test(toastT(dom)),'cadastro: e-mail repetido → mensagem em português');
 fill(dom,'ae','confirmar@x.com');await click(dom,'[data-act=signup]');await wait(60);chk(/Confirme seu e-mail/.test(toastT(dom))&&/Entrar/.test(txt(dom)),'cadastro: com confirmação por e-mail, orienta e volta ao login');
 await click(dom,'[data-act=authMode][data-arg="signup"]');fill(dom,'an','Bia');fill(dom,'ae','bia@x.com');fill(dom,'ap','123456');await click(dom,'[data-act=signup]');await wait(250);
 chk(W.__calls.includes('signUp:Bia')&&/bia@x\.com/.test(txt(dom))&&!D.body.classList.contains('noauth'),'cadastro: conta criada entra direto, nome enviado nos metadados');
 // recuperação de senha
 await go(dom,'perfil');await click(dom,'[data-act=logout]');await wait(100);await click(dom,'[data-act=authMode][data-arg="reset"]');
 await click(dom,'[data-act=reset]');chk(/Informe seu e-mail/.test(toastT(dom)),'recuperar senha: e-mail vazio é validado');
 fill(dom,'ae','ana@x.com');await click(dom,'[data-act=reset]');chk(W.__calls.some(c=>c.startsWith('reset:ana@x.com|https://x.test/'))&&/Enviamos um link/.test(toastT(dom)),'recuperar senha: envia o link com o endereço do app');
 W.__setSess('ana@x.com');W.__authcb('PASSWORD_RECOVERY');await wait(60);chk(/Nova senha/.test(txt(dom))&&!$(dom,'#ae'),'recuperar senha: link do e-mail abre a tela de nova senha');
 fill(dom,'ap','12');await click(dom,'[data-act=newpass]');chk(/pelo menos 6 caracteres/.test(toastT(dom)),'nova senha: curta é barrada');
 fill(dom,'ap','nova1234');await click(dom,'[data-act=newpass]');await wait(250);chk(W.__calls.includes('update:nova1234')&&!D.body.classList.contains('noauth'),'nova senha: atualiza e entra no app');
 // sessão expirada em outra aba
 W.__authcb('SIGNED_OUT');await wait(80);chk(/Entrar/.test(txt(dom))&&D.body.classList.contains('noauth'),'sessão encerrada em outra aba: volta ao login');
 // ===== NOVO LOGIN PARA O RESTANTE =====
 fill(dom,'ae','ana@x.com');fill(dom,'ap','certa123');await click(dom,'[data-act=login]');await wait(300);
 // consultas por ação
 await go(dom,'hidratacao');await wait(100);W.__q.length=0;await click(dom,'[data-act=wadd][data-arg="200"]');await wait(100);
 chk(W.__q.length===1&&W.__q[0]==='water_logs','performance: +200 ml recarrega só a água (1 consulta, antes eram 12) → '+W.__q.join(','));
 chk(T.water_logs.length===1,'persistência: registro de água gravado');
 W.__q.length=0;$(dom,'[data-act=wadd][data-arg="300"]').click();$(dom,'[data-act=wadd][data-arg="300"]').click();await wait(150);
 chk(T.water_logs.length===2,'toque duplo: segundo toque ignorado enquanto salva (2 registros, não 3)');
 await go(dom,'habitos');await wait(100);W.__q.length=0;$(dom,'.hrow input').click();await wait(120);chk(W.__q.join()==='habit_logs'&&T.habit_logs.length===1,'performance: check-in recarrega só os check-ins → '+W.__q.join(','));
 // modal acessível
 await go(dom,'evolucao');await wait(250);const bt=$(dom,'[data-act=addWeight]');bt.focus();bt.click();await wait(60);
 const m=$(dom,'#layer .modal');chk(m&&m.getAttribute('role')==='dialog'&&m.getAttribute('aria-modal')==='true'&&D.getElementById(m.getAttribute('aria-labelledby'))&&D.activeElement===m,'modal: role=dialog, aria-modal, título associado e foco dentro');
 key(dom,m,'Escape');await wait(40);chk(!$(dom,'#layer .modal')&&D.activeElement===bt,'modal: Esc fecha e devolve o foco ao botão de origem');
 // validações
 bt.click();await wait(40);fill(dom,'wk','5000');await click(dom,'[data-act=saveWeight]');chk(/entre 20 e 500 kg/.test(toastT(dom))&&!(T.weight_logs||[]).length,'validação: peso absurdo é barrado antes de ir ao banco');
 fill(dom,'wk','69.5');key(dom,$(dom,'#wk'),'Enter');await wait(200);chk((T.weight_logs||[]).length===1&&!$(dom,'#layer .modal'),'formulário: Enter salva o peso e fecha o modal');
 await click(dom,'[data-act=addMeasure]');fill(dom,'mv','1');await click(dom,'[data-act=saveMeasure]');chk(/entre 5 e 300 cm/.test(toastT(dom))&&!(T.body_measurements||[]).length,'validação: medida absurda barrada');await click(dom,'#layer [data-act=close]');
 // perfil
 await go(dom,'perfil');fill(dom,'pa','5');await click(dom,'[data-act=saveProfile]');chk(/fora do intervalo/.test(toastT(dom))&&T.profiles[0].age===undefined,'validação: idade fora do intervalo barrada');
 fill(dom,'pa','30');fill(dom,'pe','0');await click(dom,'[data-act=saveProfile]');await wait(80);chk(T.profiles[0].exercise_per_week===0,'correção: meta de 0 treinos por semana agora é aceita (antes virava 3)');
 // escape de texto
 const evil='"><img src=x onerror=alert(1)>';await go(dom,'dashboard');W.eval('db.p.name='+JSON.stringify(evil)+';derive();render()');await wait(100);
 chk($$(dom,'#main img').length===0&&txt(dom).includes(evil),'segurança: nome com HTML é exibido como texto na saudação');
 await go(dom,'perfil');chk($(dom,'#pn').value===evil&&$$(dom,'#main img').length===0,'segurança: nome com aspas/HTML não quebra o campo do Perfil');
 // estado de tela por página
 await go(dom,'hidratacao');const pills=$$(dom,'[data-act=wday]');pills[0].click();await wait(60);chk($(dom,'.dy.on').textContent!==pills.at(-1).textContent,'hidratação: dia anterior selecionado');
 await go(dom,'dashboard');await go(dom,'hidratacao');chk(/Hoje/.test($(dom,'.dy.on').textContent)||$(dom,'.dy.on').textContent===$$(dom,'[data-act=wday]').at(-1).textContent,'navegação: voltar à página abre em "hoje" (não registra no dia errado)');
 // ===== ACESSIBILIDADE EM TODAS AS TELAS (modo demonstração) =====
 const dm=boot(false).dom;await wait(150);const DD=dm.window.document;
 const nameOf=el=>{if(el.getAttribute('aria-label')||el.getAttribute('aria-labelledby'))return true;if(el.id&&DD.querySelector('label[for="'+el.id+'"]'))return true;const l=el.closest('label');return !!(l&&l.textContent.trim())};
 let bad=[],pagesN=0;
 for(const p of ['dashboard','alimentacao','hidratacao','sono','exercicios','habitos','evolucao','metas','checkin','semana','perfil']){await go(dm,p);pagesN++;
   const main=DD.querySelector('#main');
   if(main.querySelectorAll('h1').length!==1)bad.push(p+': h1 ×'+main.querySelectorAll('h1').length);
   main.querySelectorAll('input,select,textarea').forEach(e=>{if(!nameOf(e))bad.push(p+': campo sem nome #'+e.id)});
   main.querySelectorAll('button,a[href]').forEach(e=>{if(!(e.textContent.trim()||e.getAttribute('aria-label')))bad.push(p+': botão/link sem texto')});
   main.querySelectorAll('svg').forEach(e=>{if(e.getAttribute('role')!=='img'&&e.getAttribute('aria-hidden')!=='true'&&!e.closest('[role=img]'))bad.push(p+': svg sem alternativa')});
   main.querySelectorAll('img').forEach(e=>{if(!e.hasAttribute('alt'))bad.push(p+': img sem alt')});}
 // modais
 const modals=[['evolucao','addWeight'],['evolucao','addMeasure'],['alimentacao','addMeal'],['sono','addSleep'],['exercicios','addWorkout'],['habitos','addHabit'],['metas','addGoal'],['dashboard','ckq'],['hidratacao','wopen']];
 for(const [p,a] of modals){await go(dm,p);const b=DD.querySelector('[data-act='+a+']');if(!b){bad.push('modal '+a+': botão não achado');continue}b.click();await wait(50);
   if(a==='addWorkout'){const sel=DD.getElementById('xt');sel.value='musculacao';sel.dispatchEvent(new dm.window.Event('change',{bubbles:true}))}
   DD.querySelectorAll('#layer input,#layer select,#layer textarea').forEach(e=>{if(!nameOf(e))bad.push('modal '+a+': campo sem nome '+(e.id||e.className))});
   if(!DD.querySelector('#layer [role=dialog]'))bad.push('modal '+a+': sem role=dialog');
   DD.querySelector('#layer [data-act=close]')?.click();await wait(20);}
 chk(bad.length===0,'acessibilidade: '+pagesN+' telas e '+modals.length+' formulários — todo campo com nome, 1 h1 por tela, botões com texto, gráficos com alternativa'+(bad.length?' → '+[...new Set(bad)].slice(0,8).join('; '):''));
 // CSS
 const css=DD.querySelector('style').textContent;
 chk(!/\.pill input\{display:none/.test(css)&&/:focus-visible\{outline/.test(css)&&/prefers-reduced-motion/.test(css),'css: opções de escolha acessíveis por teclado, foco visível e redução de movimento');
 chk(!/(^|\})\.sm\{/.test(css)&&/\.btn\.sm\{/.test(css),'css: conflito .sm (grade de indicadores × botão pequeno) resolvido');
 chk($$(dm,'.skip').length===1&&DD.getElementById('live').getAttribute('aria-live')==='polite','acessibilidade: link "pular para o conteúdo" e região de avisos para leitor de tela');
 await go(dm,'dashboard');chk($$(dm,'#main > .grid > *').length<=9&&!$(dm,'.card.hero'),'design: Dashboard com '+$$(dm,'#main > .grid > *').length+' blocos (antes 11) e sem card duplicado de hábitos');
 console.log(fails?fails+' falhas':'AUDITORIA OK');process.exit(fails?1:0)
})().catch(e=>{console.log('ERRO',e);process.exit(1)});
