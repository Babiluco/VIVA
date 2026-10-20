/* Adaptação dos dados existentes. Preferências e histórico ficam neste navegador,
   separados por conta; nenhum dado de saúde é enviado a outro serviço. */
function vivaComentarios(cur,d){
 const V=window.VIVA_VOZ;if(!V)return;
 const slots={dashboard:'dash',hidratacao:'hid',alimentacao:'ali',sono:'sono',exercicios:'mov',habitos:'con',checkin:'con'},slot=slots[cur];
 const key='viva.voz.v1.'+(me?.id||'demo');
 let saved;try{saved=JSON.parse(localStorage.getItem(key)||'null')}catch{}
 if(!saved||typeof saved!=='object')saved={};
 const pref={estilo:'debochado',freq:'normal',...saved.pref};
 const persist=()=>{try{localStorage.setItem(key,JSON.stringify({pref,estado:saved.estado}))}catch{/* Navegação privada: mantém a tela funcional. */}};
 const host=document.createElement('section');host.className='card viva-voz';host.setAttribute('aria-label','Viva comenta');
 if(slot){
  const L=d.L;
  const data={hoje:today(),hora:new Date().getHours(),agoraMs:Date.now(),metas:{aguaMl:d.p.water_goal_ml,sonoH:d.p.sleep_goal_h,treinosSemana:d.p.exercise_per_week},
   agua:L.water.map(e=>({d:e.d,ml:e.amount_ml})),
   sono:L.sleep.map(e=>({d:e.d,min:smin(e),dormiu:e.slept_at})),
   treinos:L.work.map(e=>({d:e.d,min:e.minutes})),
   refeicoes:L.meal.map(e=>({d:e.d,desc:e.description,tags:e.tags})),
   habitos:{agendados:d.habits.length,feitos:d.habits.filter(h=>h.d).length},habDias:L.hab.map(e=>e.d),checkins:L.chk};
  // Reações só para inclusões de hoje confirmadas no estado, nunca para exclusões.
  const account=me?.id||'demo',prev=vivaComentarios.previous;
  const counts={hid:L.water.filter(e=>e.d===today()).length,ali:L.meal.filter(e=>e.d===today()).length,sono:L.sleep.filter(e=>e.d===today()).length};
  if(prev?.account===account&&prev.day===today())for(const cat of Object.keys(counts))if(counts[cat]>prev.counts[cat])vivaComentarios.event={cat,t:data.agoraMs,account};
  vivaComentarios.previous={account,day:today(),counts};
  if(vivaComentarios.event?.account===account)data.evento=vivaComentarios.event;
  const draw=force=>{
   let r;try{r=V.escolher(V.avaliar(data),{slot,...pref,estado:saved.estado,forcarNova:force})}catch{saved.estado=null;r=V.escolher(V.avaliar(data),{slot,...pref})}
   saved.estado=r.estado;persist();host.replaceChildren();
   if(!r.msg){host.hidden=true;return}host.hidden=false;
   const title=document.createElement('h2');title.className='ct';title.textContent='Viva comenta';
   const p=document.createElement('p');p.textContent=r.msg.texto;
   const actions=document.createElement('div');actions.className='viva-voz-actions';
   for(const [label,fn] of [['Outra frase',()=>draw(true)],['Dispensar',()=>{saved.estado=V.dispensar(saved.estado,slot,today());persist();host.hidden=true}]]){
    const b=document.createElement('button');b.className='btn soft sm';b.type='button';b.textContent=label;b.onclick=fn;actions.append(b);
   }
   const link=document.createElement('a');link.href='#perfil';link.textContent='Preferências';actions.append(link);host.append(title,p,actions);
  };
  draw(false);const sub=document.querySelector('#main > h1 + .sub') || document.querySelector('#main > h1');sub?sub.after(host):document.getElementById('main').append(host);
 }
 if(cur==='perfil'){
  const title=document.createElement('h2');title.className='ct';title.textContent='Viva comenta';host.append(title);
  for(const [field,label,options] of [['estilo','Personalidade',V.catalogo.estilos],['freq','Frequência',V.catalogo.freqs]]){
   const lab=document.createElement('label');lab.className='field';lab.textContent=label;
   const select=document.createElement('select');select.setAttribute('aria-label',label);
   Object.entries(options).forEach(([value,entry])=>{const op=document.createElement('option');op.value=value;op.textContent=entry.nome;op.selected=pref[field]===value;select.append(op)});
   select.onchange=()=>{pref[field]=select.value;persist()};lab.append(select);host.append(lab);
  }
  const note=document.createElement('p');note.className='sub';note.textContent='Preferências salvas neste navegador por conta. Normal: até 3 cobranças por dia, uma por área. Menos cobranças: até 1. Só comemorações inclui acolhimento. Você também pode desligar os comentários.';host.append(note);
  document.getElementById('main').append(host);
 }
}
