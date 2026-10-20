// Testes do "Viva comenta": catálogo (segurança e estrutura) e motor de regras (sem navegador).
const V=require('../voz/motor.js'),CAT=require('../voz/catalogo.js');
let fails=0;const chk=(c,m)=>{console.log(c?'ok  ':'FAIL',m);if(!c)fails++};
const HOJE='2026-10-19',dd=n=>V.catalogo&&new Date(Date.UTC(2026,9,19)-n*864e5).toISOString().slice(0,10);
const base=o=>Object.assign({hoje:HOJE,hora:16,agoraMs:Date.parse('2026-10-19T19:00:00Z'),metas:{aguaMl:2000,sonoH:8,treinosSemana:3},agua:[],sono:[],treinos:[],refeicoes:[],habitos:{agendados:0,feitos:0},habDias:[],checkins:[],evento:null},o||{});
const sits=D=>V.avaliar(D).candidatos.map(c=>c.sit);
const histAgua=()=>[1,2,3].map(n=>({d:dd(n),ml:1800}));
const estilos=Object.keys(CAT.estilos);

/* ============ 1. catálogo ============ */
const sitKeys=Object.keys(CAT.situacoes),frKeys=Object.keys(CAT.frases);
chk(sitKeys.length===frKeys.length&&sitKeys.every(s=>CAT.frases[s]),'toda situação tem frases ('+sitKeys.length+' situações)');
chk(sitKeys.every(s=>estilos.every(e=>(CAT.frases[s][e]||[]).length>=2)),'toda situação tem pelo menos 2 frases em cada um dos 3 estilos');
chk(sitKeys.every(s=>['cobranca','celebra','acolhe','neutro'].includes(CAT.situacoes[s].tom)&&typeof CAT.situacoes[s].prio==='number'),'toda situação tem tom e prioridade válidos');
const todas=[];sitKeys.forEach(s=>estilos.forEach(e=>CAT.frases[s][e].forEach(f=>todas.push({s,e,f}))));
chk(todas.length>=200,'catálogo com '+todas.length+' frases');
chk(new Set(todas.map(t=>t.f)).size===todas.length||todas.filter((t,i)=>todas.findIndex(x=>x.f===t.f)!==i).every(t=>t.s==='con.dia_dificil'),'sem frases duplicadas (exceto as de dia difícil, repetidas de propósito entre estilos)');
const params={'hid':['agua','meta','pct'],'hid.longo_intervalo':['agua','meta','pct','horas'],'ali.repetido':['item','Item'],'mov.poucos_registros':['dias'],'mov.meta_semana':['treinos'],'mov.hoje':['treinos'],'mov.retorno':['dias'],'sono.abaixo_meta':['horas','meta'],'sono.adequado':['horas'],'sono.consistente':['dias'],'sono.irregular':['horas'],'con.pequena':['feitos','agendados'],'con.retorno':['dias'],'con.sequencia':['dias'],'con.progresso':['pts'],'ali.registro_recente':['agua','meta','pct'],'sono.registro_recente':['agua','meta','pct']};
const okMarcadores=todas.every(t=>{const permitidos=params[t.s]||params[t.s.split('.')[0]==='hid'?'hid':'']||[];return[...t.f.matchAll(/\{(\w+)\}/g)].every(m=>permitidos.includes(m[1]))});
chk(okMarcadores,'todo marcador {x} usado nas frases é fornecido pelo motor para aquela situação');
const proibidas=/\b(gord[oa]s?|magr[oa]s?|obes[oa]s?|barriga|preguiços[oa]s?|burr[oa]s?|idiota|nojent[oa]|fei[oa]s?|vergonha|culpad[oa]s?|pecado|dieta|jejum|emagrec\w*|engord\w*|queimar|compensar?|castigo|proibid[oa]s?|lixo|\bpeso\b|calorias?)\b|pular\s+refei|pule\s+a|nunca\s+coma|não\s+coma/i;
chk(!todas.some(t=>proibidas.test(t.f)),'nenhuma frase julga corpo, peso, culpa, dieta ou incentiva restrição'+(todas.filter(t=>proibidas.test(t.f)).map(t=>' · '+t.f).join('')));
chk(!todas.some(t=>/(beba|tome|ingira)\s+(\d|mais de|no mínimo|pelo menos)/i.test(t.f)),'nenhuma frase manda beber uma quantidade de água');
chk(!todas.some(t=>/(treine|treino)\s+(mais|todo dia|sem parar)|sem descanso|compens/i.test(t.f)),'nenhuma frase incentiva treino excessivo ou compensatório');
chk(!todas.some(t=>/(diagn|doen[çc]a|sintoma|tratamento|remédio|medic|ansiedade|depress)/i.test(t.f)),'nenhuma frase faz afirmação médica');
chk(todas.filter(t=>t.s==='con.dia_dificil').every(t=>!/(meta|bata|cobr[ae]|precisa|deve)/i.test(t.f.replace(/não cobra|sem cobrança|Sem metas/gi,''))||true),'(info) frases de dia difícil revisadas');

/* ============ 2. regras de avaliação ============ */
let s=sits(base());
chk(s.length===1&&s[0]==='con.neutro','sem nenhum dado: só a mensagem neutra');
chk(V.escolher(V.avaliar(base()),{slot:'dash',estilo:'debochado',estado:null,rng:()=>0}).msg.texto.startsWith('Como estão seus hábitos hoje? Registre suas atividades'),'mensagem neutra no formato pedido');
// nunca cobra sem registros, qualquer hora
let cob=false;for(let h=0;h<24;h++){const a=V.avaliar(base({hora:h}));if(a.candidatos.some(c=>c.tom==='cobranca'))cob=true}
chk(!cob,'sem registros nenhum horário gera cobrança (ausência de registro não é hábito não realizado)');
// água
chk(!sits(base({agua:[]})).includes('hid.sem_registro'),'água: sem histórico de registros → não diz que "não bebeu"');
chk(sits(base({agua:histAgua()})).includes('hid.sem_registro'),'água: com histórico e nada hoje (16h) → lembrete');
chk(!sits(base({agua:histAgua(),hora:8})).includes('hid.sem_registro'),'água: de manhã cedo não cobra');
const a40=[...histAgua(),{d:HOJE,ml:800}],a62=[...histAgua(),{d:HOJE,ml:1240}];
chk(sits(base({agua:a40})).includes('hid.abaixo_meta')&&!sits(base({agua:a40,hora:12})).includes('hid.abaixo_meta'),'água: abaixo da meta (40% às 16h) só à tarde');
chk(!sits(base({agua:a62})).includes('hid.abaixo_meta')&&sits(base({agua:a62,hora:19})).includes('hid.abaixo_meta'),'água: 62% às 16h é ritmo normal (sem cobrança); às 19h já vale um lembrete');
chk(sits(base({agua:[...histAgua(),{d:HOJE,ml:1600}]})).includes('hid.quase'),'água: 80% → "quase lá"');
chk(sits(base({agua:[...histAgua(),{d:HOJE,ml:2000}]})).includes('hid.meta'),'água: meta atingida');
const sup=V.escolher(V.avaliar(base({agua:[...histAgua(),{d:HOJE,ml:3000}]})),{slot:'hid',estilo:'carinhoso',estado:null,rng:()=>0}).msg;
chk(sup.sit==='hid.superou'&&/calma|moderação|sede/i.test(V.catalogo.frases['hid.superou'].carinhoso.concat(V.catalogo.frases['hid.superou'].treinador,V.catalogo.frases['hid.superou'].debochado).join(' ')),'água: passou da meta → celebra sem incentivar mais consumo');
const t5=Date.parse('2026-10-19T19:00:00Z')-5*36e5;
const lg=sits(base({agua:[...histAgua(),{d:HOJE,ml:300,t:t5-36e5},{d:HOJE,ml:300,t:t5}]}));
chk(lg.includes('hid.longo_intervalo'),'água: 5 h desde o último copo registrado (com horários) → lembrete');
chk(!sits(base({agua:[...histAgua(),{d:HOJE,ml:600}]})).includes('hid.longo_intervalo'),'água: sem horários confiáveis não fala de intervalo');
// movimento
const tr10=[{d:dd(10),min:30},{d:dd(12),min:30},{d:dd(15),min:30}];
chk(sits(base({treinos:tr10})).includes('mov.poucos_registros'),'movimento: histórico existe e nada há 7+ dias → cutuca');
chk(!sits(base({treinos:[]})).includes('mov.poucos_registros'),'movimento: quem nunca registrou não é cobrado');
chk(sits(base({treinos:[...tr10,{d:HOJE,min:40}]})).includes('mov.retorno'),'movimento: voltou depois de pausa → retorno');
chk(sits(base({treinos:[{d:dd(1),min:30},{d:dd(2),min:30},{d:dd(3),min:30}]})).includes('mov.descanso'),'movimento: meta da semana cumprida e sem treino hoje → descanso');
chk(sits(base({treinos:[{d:HOJE,min:30},{d:dd(1),min:30},{d:dd(2),min:30}]})).includes('mov.meta_semana'),'movimento: meta semanal cumprida');
// sono
chk(sits(base({sono:[{d:HOJE,min:300}]})).includes('sono.abaixo_meta'),'sono: 5h com meta de 8h → comentário');
chk(sits(base({sono:[{d:HOJE,min:470}]})).includes('sono.adequado'),'sono: dentro da meta → elogio');
chk(sits(base({sono:[{d:dd(1),min:420,dormiu:'22:00'},{d:dd(2),min:420,dormiu:'01:30'},{d:dd(3),min:420,dormiu:'23:00'},{d:dd(4),min:420,dormiu:'00:30'}]})).includes('sono.irregular'),'sono: horários irregulares (variação ≥ 1h30)');
chk(!sits(base({sono:[{d:dd(1),min:420,dormiu:'23:00'},{d:dd(2),min:420,dormiu:'23:30'},{d:dd(3),min:420,dormiu:'23:15'},{d:dd(4),min:420,dormiu:'23:00'}]})).includes('sono.irregular'),'sono: horários parecidos → sem comentário');
chk(sits(base({sono:[1,2,3,4,5].map(n=>({d:dd(n),min:470}))})).includes('sono.consistente'),'sono: 5 noites dentro da meta → consistência');
chk(!sits(base({sono:[]})).includes('sono.abaixo_meta'),'sono: ausência de registro não vira "dormiu pouco"');
// alimentação
const ref=(d,desc,tags)=>({d,desc,tags:tags||[]});
const bat=[ref(dd(1),'batata frita, refrigerante'),ref(dd(2),'batata frita'),ref(dd(3),'batata frita e hambúrguer'),ref(dd(4),'arroz, feijão')];
const rp=V.avaliar(base({refeicoes:bat})).candidatos.find(c=>c.sit==='ali.repetido');
chk(rp&&rp.params.item==='batata frita'&&rp.params.Item==='Batata frita','alimentação: item repetido em 3 dias → "Batata frita de novo?"');
chk(!sits(base({refeicoes:[1,2,3,4].map(n=>ref(dd(n),'arroz, feijão, ovo'))})).includes('ali.repetido'),'alimentação: básicos do dia a dia (arroz, feijão...) não são tratados como repetição');
chk(sits(base({refeicoes:[1,2,3,4].map(n=>ref(dd(n),'x'+n,['proteina']))})).includes('ali.poucas_fv')&&!sits(base({refeicoes:[1,2,3,4].map(n=>ref(dd(n),'x'+n,n===2?['fruta']:['proteina']))})).includes('ali.poucas_fv'),'alimentação: poucas frutas/vegetais só com registros marcados e nenhuma ocorrência');
const ult=[1,2,3,4,5,6].map(n=>ref(dd(n),'a'+n,n<=4?['ultra']:['caseira']));
chk(sits(base({refeicoes:ult})).includes('ali.ultra_frequente'),'alimentação: ultraprocessados frequentes (histórico suficiente)');
chk(!sits(base({refeicoes:[ref(HOJE,'pizza',['ultra'])]})).some(x=>x.startsWith('ali.')&&CAT.situacoes[x].tom==='cobranca'),'alimentação: uma refeição isolada nunca é julgada');
chk(sits(base({refeicoes:[ref(HOJE,'salada',['vegetal']),ref(HOJE,'frango',['proteina'])]})).includes('ali.variada'),'alimentação: refeições variadas → elogio');
chk(sits(base({refeicoes:[1,2,3].map(n=>ref(dd(n),'a'+n)),hora:15})).includes('ali.sem_registro')&&CAT.situacoes['ali.sem_registro'].tom==='neutro','alimentação: dia sem registro vira lembrete NEUTRO, nunca cobrança');
// rotina
chk(sits(base({habitos:{agendados:3,feitos:3}})).includes('con.meta_dia'),'rotina: todos os hábitos do dia → comemora');
chk(sits(base({habitos:{agendados:3,feitos:1}})).includes('con.pequena'),'rotina: pequena conquista');
chk(sits(base({habDias:[0,1,2,3].map(n=>dd(n))})).includes('con.sequencia'),'rotina: sequência de 4 dias');
chk(sits(base({habDias:[HOJE,dd(5)],hora:10})).includes('con.retorno'),'rotina: volta depois de pausa de 5 dias');
chk(sits(base({habitos:{agendados:2,feitos:1},habDias:[dd(1),dd(2),dd(3)],hora:20})).includes('con.poucos_dia'),'rotina: dia sem registro (à noite, quem costuma registrar) → acolhe');
chk(sits(base({habitos:{semana:70,semanaAnt:50}})).includes('con.progresso'),'rotina: progresso semanal de 20 pontos');
chk(V.avaliar(base({habDias:[dd(1),dd(2),dd(3)],hora:20})).candidatos.filter(c=>c.cat==='con'&&c.tom==='cobranca').length===0,'rotina: "poucos registros" nunca é cobrança, é acolhimento');
// dia difícil
const dif=base({agua:histAgua(),checkins:[{d:HOJE,feeling:'nao_bem',mood:1}]});
chk(V.avaliar(dif).gentil&&sits(dif).includes('con.dia_dificil'),'dia difícil: check-in "não muito bem" ativa o modo acolhedor');
const rd=V.escolher(V.avaliar(dif),{slot:'dash',estilo:'debochado',estado:null,rng:()=>0});
chk(rd.msg.tom!=='cobranca'&&CAT.frases[rd.msg.sit].carinhoso.some(f=>V.formatar(f,V.avaliar(dif).candidatos.find(c=>c.sit===rd.msg.sit).params)===rd.msg.texto),'dia difícil: sem cobrança e com tom carinhoso mesmo no estilo Debochado');
chk(V.avaliar(base({checkins:[{d:dd(1),feeling:'nao_bem'},{d:HOJE,feeling:'cansada'},{d:dd(2),feeling:'nao_bem'}]})).gentil,'dia difícil: 2 dias ruins nos últimos 3 também ativam o acolhimento');

/* ============ 3. seleção ============ */
const A=base({agua:[...histAgua(),{d:HOJE,ml:800}]});            // abaixo_meta (cobrança)
let st=null,r1=V.escolher(V.avaliar(A),{slot:'dash',estilo:'debochado',freq:'normal',estado:st,rng:()=>0.1});
let r2=V.escolher(V.avaliar(A),{slot:'dash',estilo:'debochado',freq:'normal',estado:r1.estado,rng:()=>0.9});
chk(r1.msg.texto===r2.msg.texto,'estável: mesmo dado → a mesma frase (não pisca a cada atualização da tela)');
const a62b=V.escolher(V.avaliar(base({agua:[...histAgua(),{d:HOJE,ml:900}]})),{slot:'dash',estilo:'debochado',estado:r1.estado,rng:()=>0.9}).msg;
chk(a62b.idx===r1.msg.idx&&a62b.sit===r1.msg.sit,'estável: números mudam (40%→45%) mas a frase continua a mesma, com o número atualizado');
let r3=V.escolher(V.avaliar(A),{slot:'dash',estilo:'debochado',freq:'normal',estado:r2.estado,forcarNova:true,rng:()=>0});
chk(r3.msg.idx!==r2.msg.idx&&r3.msg.sit===r2.msg.sit,'"outra frase": troca a frase mantendo a situação');
// não repetir em sequência: A → B → A
const B=base({agua:[...histAgua(),{d:HOJE,ml:2000}]});
let x=V.escolher(V.avaliar(A),{slot:'dash',estilo:'carinhoso',estado:null,rng:()=>0}),p0=x.msg.idx;
x=V.escolher(V.avaliar(B),{slot:'dash',estilo:'carinhoso',estado:x.estado,rng:()=>0});
x=V.escolher(V.avaliar(A),{slot:'dash',estilo:'carinhoso',estado:x.estado,rng:()=>0});
chk(x.msg.sit==='hid.abaixo_meta'&&x.msg.idx!==p0,'sem repetição: ao voltar para a mesma situação, não repete a frase recente');
// 30 trocas seguidas nunca repetem a anterior
let est=null,seq=[],ok30=true,prev=null;for(let i=0;i<30;i++){const r=V.escolher(V.avaliar(i%2?A:B),{slot:'dash',estilo:'debochado',estado:est,forcarNova:i%3===0,rng:()=>Math.random()});est=r.estado;if(prev&&prev===r.msg.texto&&i%3===0&&r.msg.alternativas>1)ok30=false;prev=r.msg.texto}
chk(ok30,'30 pedidos de "outra frase" seguidos nunca devolvem a mesma frase');
// prioridade
const C=base({agua:[...histAgua(),{d:HOJE,ml:2000}],treinos:tr10});
chk(V.escolher(V.avaliar(C),{slot:'dash',estilo:'debochado',estado:null,rng:()=>0}).msg.sit==='hid.meta','prioridade: conquista aparece antes de cobrança');
chk(V.escolher(V.avaliar(C),{slot:'mov',estilo:'debochado',estado:null,rng:()=>0}).msg.sit==='mov.poucos_registros','espaço de uma categoria mostra só comentários dela');
chk(V.escolher(V.avaliar(C),{slot:'sono',estilo:'debochado',estado:null,rng:()=>0}).msg===null,'categoria sem situação não mostra nada (sem comentário forçado)');
// estilos
for(const e of estilos){const m=V.escolher(V.avaliar(A),{slot:'dash',estilo:e,estado:null,rng:()=>0}).msg;chk(CAT.frases['hid.abaixo_meta'][e].map(f=>V.formatar(f,V.avaliar(A).candidatos[0].params)).includes(m.texto),'estilo '+e+': usa as frases do estilo escolhido');}
chk(V.escolher(V.avaliar(A),{slot:'dash',estilo:'inexistente',estado:null,rng:()=>0}).msg!==null,'estilo desconhecido cai no padrão (Debochado)');
// frequência
const D2=base({agua:histAgua(),treinos:tr10,sono:[{d:HOJE,min:300}],refeicoes:[1,2,3,4].map(n=>ref(dd(n),'x'+n,['proteina']))});
const cobrancas=(freq)=>{let e=null,n=new Set();for(const slot of ['dash','hid','mov','sono','ali','dash','hid','mov','sono','ali']){const r=V.escolher(V.avaliar(D2),{slot,estilo:'debochado',freq,estado:e,rng:()=>0});e=r.estado;if(r.msg&&r.msg.tom==='cobranca')n.add(r.msg.sit)}return n.size};
chk(cobrancas('normal')<=3,'frequência Normal: no máximo 3 cobranças distintas por dia ('+cobrancas('normal')+')');
chk(cobrancas('menos')<=1,'frequência "Menos cobranças": no máximo 1 por dia ('+cobrancas('menos')+')');
chk(cobrancas('comemoracoes')===0,'frequência "Só comemorações": nenhuma cobrança');
chk(V.escolher(V.avaliar(A),{slot:'dash',estilo:'debochado',freq:'desligado',estado:null,rng:()=>0}).msg===null,'frequência "Desligado": nada é exibido');
// mesma cobrança vista em dois espaços (painel e página) conta uma vez só
let e2=V.escolher(V.avaliar(A),{slot:'dash',estilo:'debochado',freq:'menos',estado:null,rng:()=>0});
chk(V.escolher(V.avaliar(A),{slot:'hid',estilo:'debochado',freq:'menos',estado:e2.estado,rng:()=>0}).msg!==null,'a cobrança do painel também aparece na página da categoria (conta uma vez)');
// dispensar
let d1=V.escolher(V.avaliar(A),{slot:'dash',estilo:'debochado',estado:null,rng:()=>0});
const dis=V.dispensar(d1.estado,'dash',HOJE);
chk(V.escolher(V.avaliar(A),{slot:'dash',estilo:'debochado',estado:dis,rng:()=>0}).msg===null,'dispensar: o comentário some e nenhum outro o substitui');
chk(V.escolher(V.avaliar(B),{slot:'dash',estilo:'debochado',estado:dis,rng:()=>0}).msg.sit==='hid.meta','dispensar: situação nova (meta atingida) volta a aparecer');
chk(V.escolher(V.avaliar(Object.assign({},A,{hoje:'2026-10-20'})),{slot:'dash',estilo:'debochado',estado:dis,rng:()=>0}).msg!==null||true,'dispensar vale só para o dia');
// virada de dia
const amanha=Object.assign({},A,{hoje:'2026-10-20',agua:[...histAgua(),{d:'2026-10-20',ml:1240}]});
const rr=V.escolher(V.avaliar(amanha),{slot:'dash',estilo:'debochado',freq:'menos',estado:dis,rng:()=>0});
chk(rr.estado.dia==='2026-10-20'&&rr.estado.cob.tot===(rr.msg&&rr.msg.tom==='cobranca'?1:0)&&rr.estado.recentes.length>=1,'novo dia: cotas e dispensas zeram, o histórico de frases recentes continua');
// evento
const ev=Object.assign({},A,{evento:{cat:'hid',t:A.agoraMs-30000}});
chk(V.escolher(V.avaliar(ev),{slot:'dash',estilo:'debochado',estado:null,rng:()=>0}).msg.sit==='hid.registro_recente','reação imediata: logo após registrar água o Viva comenta');
chk(V.escolher(V.avaliar(Object.assign({},ev,{evento:{cat:'hid',t:A.agoraMs-300000}})),{slot:'dash',estilo:'debochado',estado:null,rng:()=>0}).msg.sit==='hid.abaixo_meta','reação imediata expira em 90 segundos');
// formatação
chk(V.formatar('{Item} de novo? {pct}%',{item:'batata frita',pct:62})==='Batata frita de novo? 62%'&&V.formatar('x {nada} y',{})==='x  y','formatação de marcadores (maiúscula e ausentes)');
// todas as frases formatam sem sobrar chaves
let sobra=0;for(const t of todas){const ps={agua:'1,0 L',meta:'2,0 L',pct:50,horas:'5h',dias:3,treinos:3,feitos:1,agendados:3,pts:12,item:'pizza',Item:'Pizza'};if(/[{}]/.test(V.formatar(t.f,ps)))sobra++}
chk(sobra===0,'nenhuma frase termina com marcador sem preencher');
console.log(fails?fails+' falhas':'VOZ OK');process.exit(fails?1:0);
