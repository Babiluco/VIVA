(function(root,f){if(typeof module==='object'&&module.exports)module.exports=f(require('./catalogo.js'));else root.VIVA_VOZ=f(root.VIVA_VOZ_CATALOGO)})(typeof self!=='undefined'?self:this,function(C){
 'use strict';
 const days=(a,b)=>Math.round((Date.parse(a+'T12:00:00Z')-Date.parse(b+'T12:00:00Z'))/864e5);
 const unique=a=>[...new Set(a)];
 function avaliar(D){
  const candidatos=[],t=D.hoje,h=D.hora,m=D.metas||{},now=D.agoraMs;
  const recent=a=>(a||[]).filter(e=>days(t,e.d)>=0&&days(t,e.d)<7);
  const today=a=>a.filter(e=>e.d===t),num=n=>Number(n)||0;
  const add=(sit,params={})=>candidatos.push({sit,cat:sit.split('.')[0],...C.situacoes[sit],params});
  const water=recent(D.agua),w=today(water),ml=w.reduce((s,e)=>s+num(e.ml),0),goal=num(m.aguaMl),pct=goal>0?ml/goal*100:0;
  const wp={agua:(ml/1000).toLocaleString('pt-BR')+' L',meta:(goal/1000).toLocaleString('pt-BR')+' L',pct:Math.round(pct)};
  if(goal>0){
   if(pct>100)add('hid.superou',wp);else if(pct===100)add('hid.meta',wp);else if(pct>=80)add('hid.quase',wp);
   else if(ml>0&&((h>=15&&pct<50)||(h>=18&&pct<80)))add('hid.abaixo_meta',wp);
   else if(!w.length&&unique(water.map(e=>e.d)).length>=3&&h>=15)add('hid.sem_registro',wp);
   const last=Math.max(...w.map(e=>Number.isFinite(e.t)?e.t:0));
   if(ml>0&&pct<100&&last>0&&now-last>=4*36e5)add('hid.longo_intervalo',{...wp,horas:Math.floor((now-last)/36e5)});
  }
  const tr=(D.treinos||[]).filter(e=>days(t,e.d)>=0&&num(e.min)>0),tw=recent(tr),tt=today(tr),past=tr.filter(e=>e.d<t).sort((a,b)=>b.d.localeCompare(a.d)),gap=past.length?days(t,past[0].d):0;
  if(tt.length){add('mov.hoje',{treinos:tw.length});if(gap>=7)add('mov.retorno',{dias:gap})}
  if(m.treinosSemana>0&&unique(tw.map(e=>e.d)).length>=m.treinosSemana)add(tt.length?'mov.meta_semana':'mov.descanso',{treinos:unique(tw.map(e=>e.d)).length});
  if(!tt.length&&gap>=7)add('mov.poucos_registros',{dias:gap});
  const sl=recent(D.sono).filter(e=>num(e.min)>0),st=today(sl).at(-1);
  if(st&&m.sonoH>0)add(st.min>=m.sonoH*60-30?'sono.adequado':'sono.abaixo_meta',{horas:(st.min/60).toFixed(1).replace('.',','),meta:m.sonoH});
  if(m.sonoH>0&&unique(sl.filter(e=>e.min>=m.sonoH*60-30).map(e=>e.d)).length>=5)add('sono.consistente',{dias:unique(sl.map(e=>e.d)).length});
  const times=sl.filter(e=>/^\d\d:\d\d/.test(e.dormiu||'')).map(e=>{const [hh,mm]=e.dormiu.split(':').map(Number);return (hh*60+mm+720)%1440});
  if(times.length>=4&&Math.max(...times)-Math.min(...times)>=90)add('sono.irregular',{horas:((Math.max(...times)-Math.min(...times))/60).toFixed(1)});
  if(!st&&sl.length>=3&&h>=12)add('sono.sem_registro');
  const meals=recent(D.refeicoes),mt=today(meals),tags=e=>e.tags||[],hist=unique(meals.map(e=>e.d)).length;
  if(hist>=3&&!mt.length&&h>=15)add('ali.sem_registro');
  if(unique(mt.flatMap(tags)).length>=2)add('ali.variada');
  if(hist>=3){
   for(const item of ['batata frita','refrigerante','hambúrguer','pizza']){
    if(unique(meals.filter(e=>(e.desc||'').toLowerCase().includes(item)).map(e=>e.d)).length>=3){add('ali.repetido',{item,Item:item[0].toUpperCase()+item.slice(1)});break}
   }
   const marked=meals.filter(e=>tags(e).length);
   if(unique(marked.map(e=>e.d)).length>=4&&!marked.some(e=>tags(e).some(x=>['fruta','vegetal'].includes(x))))add('ali.poucas_fv');
   if(hist>=5&&unique(meals.filter(e=>tags(e).includes('ultra')).map(e=>e.d)).length>=4)add('ali.ultra_frequente');
  }
  const hb=D.habitos||{},hd=unique((D.habDias||[]).filter(d=>days(t,d)>=0)).sort().reverse();
  if(hb.agendados>0&&hb.feitos>=hb.agendados)add('con.meta_dia');
  else if(hb.feitos>0)add('con.pequena',{feitos:hb.feitos,agendados:hb.agendados});
  let seq=0;while(hd.includes(new Date(Date.parse(t+'T12:00:00Z')-seq*864e5).toISOString().slice(0,10)))seq++;
  if(seq>=3)add('con.sequencia',{dias:seq});
  if(hd[0]===t&&hd[1]&&days(t,hd[1])>=3)add('con.retorno',{dias:days(t,hd[1])});
  if(h>=19&&hd.filter(d=>days(t,d)>0&&days(t,d)<=7).length>=3&&!hd.includes(t))add('con.poucos_dia');
  if(Number.isFinite(hb.semana)&&Number.isFinite(hb.semanaAnt)&&hb.semana>hb.semanaAnt)add('con.progresso',{pts:Math.round(hb.semana-hb.semanaAnt)});
  const bad=(D.checkins||[]).filter(e=>days(t,e.d)>=0&&days(t,e.d)<3&&(e.feeling==='nao_bem'||e.mood<=2));
  const gentil=bad.some(e=>e.d===t)||unique(bad.map(e=>e.d)).length>=2;
  if(gentil)add('con.dia_dificil');
  if(D.evento&&now-D.evento.t>=0&&now-D.evento.t<90000&&['hid','ali','sono'].includes(D.evento.cat))add(D.evento.cat+'.registro_recente',wp);
  if(!candidatos.length)add('con.neutro');
  return{candidatos,gentil,dia:t};
 }
 function formatar(s,p={}){return s.replace(/\{(\w+)\}/g,(_,k)=>p[k]??(k==='Item'&&p.item?p.item[0].toUpperCase()+p.item.slice(1):''))}
 function escolher(a,o={}){
  let e=JSON.parse(JSON.stringify(o.estado||{}));
  if(e.dia!==a.dia)e={dia:a.dia,cob:{tot:0,sits:[],cats:[]},slots:{},disp:{},recentes:e.recentes||[]};
  const slot=o.slot||'dash',style=a.gentil?'carinhoso':C.estilos[o.estilo]?o.estilo:'debochado',freq=o.freq||'normal',limit=freq==='menos'?1:3;
  const candidates=a.candidatos.filter(c=>(slot==='dash'||c.cat===slot)&&(!a.gentil||c.tom!=='cobranca')&&(freq!=='comemoracoes'||['celebra','acolhe'].includes(c.tom))&&(c.tom!=='cobranca'||e.cob.sits.includes(c.sit)||(e.cob.tot<limit&&!e.cob.cats.includes(c.cat)))).sort((x,y)=>(a.gentil&&y.sit==='con.dia_dificil'?1000:y.prio)-(a.gentil&&x.sit==='con.dia_dificil'?1000:x.prio));
  const c=candidates[0];if(freq==='desligado'||!c||e.disp[slot]===c.sit)return{msg:null,estado:e};
  const key=c.sit+'|'+style,fr=C.frases[c.sit][style],old=e.slots[slot],last=e.recentes.findLast(x=>x.key===key);
  let idx=old&&old.key===key&&!o.forcarNova?old.idx:Math.min(fr.length-1,Math.max(0,Math.floor((o.rng||Math.random)()*fr.length)));
  if((!old||old.key!==key||o.forcarNova)&&last&&idx===last.idx)idx=(idx+1)%fr.length;
  e.slots[slot]={key,idx,sit:c.sit};e.recentes.push({key,idx});e.recentes=e.recentes.slice(-100);
  if(c.tom==='cobranca'&&!e.cob.sits.includes(c.sit)){e.cob.sits.push(c.sit);e.cob.cats.push(c.cat);e.cob.tot++}
  return{msg:{...c,idx,texto:formatar(fr[idx],c.params),alternativas:fr.length},estado:e};
 }
 function dispensar(estado,slot,dia){const e=JSON.parse(JSON.stringify(estado));if(e.dia===dia&&e.slots[slot])e.disp[slot]=e.slots[slot].sit;return e}
 return{catalogo:C,avaliar,escolher,formatar,dispensar};
});
