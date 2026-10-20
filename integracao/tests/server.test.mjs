import {test} from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {createGateway,productionOptions} from '../server.mjs';

test('vínculo com aprovação dupla, isolamento, consulta e revogação',async()=>{
  let clock=1000, reads=0;
  const gateway=createGateway({dbPath:':memory:',origins:['https://apps.example'],now:()=>clock,
    verify:async(app,token)=>token.startsWith(app+'-') ? {id:token} : null,
    readWorkouts:async(id)=>{reads++;assert.equal(id,'fit-owner');return [{id:'workout-1',name:'Treino',minutes:20}];}});
  const server=http.createServer(gateway.handler);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}`;
  const call=async(path,app='viva',token='viva-owner',body={},origin='https://apps.example')=>{
    const r=await fetch(url+'/v1/'+path,{method:'POST',headers:{Origin:origin,'X-Viva-App':app,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body)});
    return {status:r.status,body:r.headers.get('content-type') ? await r.json() : null,cache:r.headers.get('cache-control')};
  };
  try{
    assert.equal((await call('status','viva','fit-owner')).status,401);
    assert.equal((await call('status','viva','viva-owner',{},'https://evil.example')).status,403);
    assert.equal((await call('workouts')).status,403);assert.equal(reads,0);
    const {code}= (await call('propose')).body;
    assert.equal(code.length,32);
    assert.equal((await call('accept','viva','viva-intruder',{code})).status,409);
    assert.equal((await call('confirm','viva','viva-owner',{code})).status,409);
    assert.equal((await call('accept','fit','fit-owner',{code})).status,200);
    assert.equal((await call('confirm','viva','viva-intruder',{code})).status,403);
    assert.equal((await call('proposal','viva','viva-owner',{code})).body.ready,true);
    assert.equal((await call('workouts')).status,403);
    assert.equal((await call('confirm','viva','viva-owner',{code})).body.linked,true);
    assert.equal((await call('confirm','viva','viva-owner',{code})).status,404);
    const data=await call('workouts');assert.equal(data.status,200);assert.equal(data.cache,'no-store');assert.equal(data.body.workouts.length,1);
    assert.equal((await call('workouts','viva','viva-intruder')).status,403);
    assert.equal((await call('status','fit','fit-owner')).body.linked,true);
    assert.equal((await call('revoke','fit','fit-owner')).status,200);
    assert.equal((await call('workouts')).status,403);
    const expired=(await call('propose')).body.code;clock+=300001;
    assert.equal((await call('accept','fit','fit-owner',{code:expired})).status,404);
    assert.equal((await call('accept','fit','fit-owner',{code:'bad'})).status,400);
    assert.equal((await call('missing')).status,404);
  }finally{await new Promise(resolve=>server.close(resolve));gateway.close();}
});

test('configuração incompleta falha antes de iniciar',()=>{
  assert.throws(()=>productionOptions({}),/VIVA_URL/);
});

test('revogação durante consulta impede entrega',async()=>{
  let release,start;
  const begun=new Promise(resolve=>start=resolve);
  const gateway=createGateway({dbPath:':memory:',origins:['https://apps.example'],
    verify:async(app,token)=>({id:app}),
    readWorkouts:async()=>{start();await new Promise(resolve=>release=resolve);return [];}});
  const server=http.createServer(gateway.handler);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const call=async(path,app,body={})=>{
    const r=await fetch(`http://127.0.0.1:${server.address().port}/v1/${path}`,{method:'POST',headers:{Origin:'https://apps.example','X-Viva-App':app,Authorization:'Bearer token'},body:JSON.stringify(body)});
    return {status:r.status,body:await r.json()};
  };
  try{
    const code=(await call('propose','viva')).body.code;
    await call('accept','fit',{code});await call('confirm','viva',{code});
    const pending=call('workouts','viva');await begun;
    await call('revoke','fit');release();
    assert.equal((await pending).status,403);
  }finally{await new Promise(resolve=>server.close(resolve));gateway.close();}
});

test('adaptador Supabase valida emissor e restringe consulta ao dono e campos mínimos',async()=>{
  const env={VIVA_URL:'https://viva.example',FIT_URL:'https://fit.example',VIVA_PUBLIC_KEY:'public-viva',FIT_PUBLIC_KEY:'public-fit',FIT_SERVICE_ROLE_KEY:'private-fit',APP_ORIGINS:'https://apps.example',INTEGRATION_DB:':memory:'};
  const options=productionOptions(env);
  const original=globalThis.fetch;
  const calls=[];
  globalThis.fetch=async(url,init)=>{
    calls.push({url:new URL(url),init});
    return {ok:true,json:async()=>String(url).includes('/auth/') ? {id:'owner'} : [{id:'w1',name:'Treino',completed_at:'2026-10-20',duration_seconds:1230,user_id:'never-return'}]};
  };
  try{
    await options.verify('viva','token-viva');await options.verify('fit','token-fit');
    assert.equal(calls[0].url.origin,env.VIVA_URL);assert.equal(calls[1].url.origin,env.FIT_URL);
    assert.equal(calls[0].init.headers.Authorization,'Bearer token-viva');
    const rows=await options.readWorkouts('owner');
    assert.equal(calls[2].url.searchParams.get('user_id'),'eq.owner');
    assert.equal(calls[2].url.searchParams.get('limit'),'30');
    assert.equal(calls[2].url.searchParams.get('completed_at'),'not.is.null');
    assert.deepEqual(Object.keys(rows[0]),['id','name','completedAt','minutes']);
    assert.equal(rows[0].minutes,21);
    assert.equal(calls[2].init.redirect,'error');
  }finally{globalThis.fetch=original;}
});

test('falha interna não expõe segredo em mensagem',async()=>{
  const gateway=createGateway({dbPath:':memory:',origins:['https://apps.example'],verify:async()=>{throw Error('private-secret');},readWorkouts:async()=>[]});
  const server=http.createServer(gateway.handler);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
    const response=await fetch(`http://127.0.0.1:${server.address().port}/v1/status`,{method:'POST',headers:{Origin:'https://apps.example','X-Viva-App':'viva',Authorization:'Bearer token'}});
    assert.equal(response.status,503);assert.equal((await response.text()).includes('private-secret'),false);
  }finally{await new Promise(resolve=>server.close(resolve));gateway.close();}
});
