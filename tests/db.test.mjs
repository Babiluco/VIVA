import {PGlite} from '@electric-sql/pglite';
import fs from 'fs';import path from 'path';import {fileURLToPath} from 'url';const HERE=path.dirname(fileURLToPath(import.meta.url));
const db=new PGlite();
const files=fs.readdirSync(path.join(HERE,'..','supabase')).filter(f=>/^0[1-9]_.*\.sql$/.test(f)).sort();
let fails=0;const ok=(c,m)=>{console.log(c?'ok  ':'FAIL',m);if(!c)fails++};
// ambiente mínimo do Supabase
await db.exec(`
create role anon nologin; create role authenticated nologin;
create schema auth; create schema storage;
create table auth.users(id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner uuid default auth.uid());
create function storage.foldername(name text) returns text[] language sql as $$ select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1] $$;
alter table storage.objects enable row level security;
grant usage on schema public,auth,storage to anon,authenticated;
grant select,insert,update,delete on storage.objects to authenticated; grant select on storage.buckets to authenticated;
alter default privileges in schema public grant all on tables to anon,authenticated;
`);
for(const f of files){try{await db.exec(fs.readFileSync(path.join(HERE,'..','supabase',f),'utf8'));ok(true,'SQL aplicado: '+f)}catch(e){ok(false,'SQL '+f+': '+e.message)}}
const A='aaaaaaaa-0000-0000-0000-000000000001',B='bbbbbbbb-0000-0000-0000-000000000002';
await db.exec(`insert into auth.users(id,email,raw_user_meta_data) values ('${A}','a@x.com','{"name":"Ana"}'),('${B}','b@x.com','{"name":"Bia"}')`);
const as=async(uid,fn)=>{await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${uid}',false)`);try{return await fn()}finally{await db.exec('reset role')}};
const anon=async fn=>{await db.exec(`set role anon; select set_config('request.jwt.claim.sub','',false)`);try{return await fn()}finally{await db.exec('reset role')}};
const q=async s=>(await db.query(s)).rows;
const fails_=async s=>{try{await db.exec(s);return false}catch(e){return e.message}};
// trigger de novo usuário
ok((await q(`select count(*)::int c from public.profiles`))[0].c===2,'gatilho: perfil criado para cada novo usuário');
ok((await q(`select count(*)::int c from public.habits where user_id='${A}'`))[0].c===3,'gatilho: 3 hábitos iniciais com ícone ('+(await q(`select string_agg(icon,'') s from public.habits where user_id='${A}'`))[0].s+')');
// dados do usuário A
const hid=(await q(`select id from public.habits where user_id='${A}' limit 1`))[0].id, hidB=(await q(`select id from public.habits where user_id='${B}' limit 1`))[0].id;
await as(A,()=>db.exec(`
insert into public.weight_logs(weight) values (70.5);
insert into public.body_measurements(type,value_cm) values ('cintura',80);
insert into public.water_logs(amount_ml) values (250);
insert into public.sleep_logs(hours,duration_min,quality) values (7.5,450,4);
insert into public.meal_logs(meal,category,tags) values ('Almoço','almoco','{fruta}');
insert into public.workout_logs(name,category,minutes) values ('Treino','musculacao',45);
insert into public.habit_logs(habit_id) values ('${hid}');
insert into public.goals(type,title,target_value) values ('hidratacao','Meta',5);
insert into public.achievements(code,unlocked_on) values ('semana',current_date);
insert into public.daily_checkins(feeling,energy,mood,stress,hunger,disposition) values ('bem',3,3,3,3,3);
insert into public.progress_photos(photo_path) values ('${A}/a.jpg');`).then(()=>true).catch(e=>{console.log(e.message);return false})).valueOf()||ok(false,'inserções do usuário A');
const tabs=['profiles','weight_logs','body_measurements','habits','habit_logs','water_logs','sleep_logs','meal_logs','workout_logs','workout_exercises','goals','achievements','daily_checkins','progress_photos'];
const own=t=>t==='profiles'?'id':'user_id';
for(const t of tabs){const nA=await as(A,async()=>(await q(`select count(*)::int c from public.${t}`))[0].c),nB=await as(B,async()=>(await q(`select count(*)::int c from public.${t}`))[0].c),tot=(await q(`select count(*)::int c from public.${t}`))[0].c;
 ok(nA+nB===tot&&(t==='workout_exercises'||nA>0),`isolamento ${t}: A vê ${nA}, B vê ${nB}, total ${tot}`)}
ok((await as(B,()=>q(`select * from public.weight_logs`))).length===0,'B não lê o peso de A');
// escrita cruzada
const x=async(uid,s)=>as(uid,()=>fails_(s));
ok(!!await x(B,`insert into public.weight_logs(user_id,weight) values ('${A}',60)`),'B não insere dados em nome de A (weight_logs)');
ok(!!await x(B,`insert into public.goals(user_id,type,title,target_value) values ('${A}','sono','x',1)`),'B não cria meta para A');
ok(!!await x(B,`insert into public.profiles(id,name) values ('${A}','x')`),'B não cria/duplica perfil de A');
await as(B,()=>db.exec(`update public.weight_logs set weight=1; delete from public.water_logs; update public.profiles set name='hack' where id='${A}'; delete from public.habits where user_id='${A}'`));
ok((await q(`select weight from public.weight_logs`))[0].weight==70.5&&(await q(`select count(*)::int c from public.water_logs`))[0].c===1&&(await q(`select name from public.profiles where id='${A}'`))[0].name==='Ana'&&(await q(`select count(*)::int c from public.habits where user_id='${A}'`))[0].c===3,'B não altera nem apaga dados de A (update/delete afetam 0 linhas)');
ok(!!await x(B,`insert into public.habit_logs(habit_id) values ('${hid}')`),'B não registra check-in em hábito de A');
ok(!!await x(A,`insert into public.habit_logs(habit_id) values ('${hidB}')`),'A não registra check-in em hábito de B');
const wid=(await q(`select id from public.workout_logs limit 1`))[0].id;
ok(!!await x(B,`insert into public.workout_exercises(workout_id,name) values ('${wid}','x')`),'B não adiciona exercício ao treino de A');
ok(!(await x(A,`insert into public.workout_exercises(workout_id,name,sets,reps,weight_kg) values ('${wid}','Agachamento',3,10,40)`)),'A adiciona exercício ao próprio treino');
ok(!!await x(B,`insert into public.progress_photos(photo_path) values ('${A}/b.jpg')`),'B não cadastra foto apontando para a pasta de A');
// anon
for(const t of tabs){const r=await anon(()=>fails_(`select * from public.${t}`));if(!r)ok(false,'anon NÃO deveria ler '+t)}
ok(true,'anon sem acesso a nenhuma tabela ('+tabs.length+' testadas)');
// storage
await db.exec(`insert into storage.objects(bucket_id,name,owner) values ('meal-photos','${A}/1.jpg','${A}'),('progress-photos','${B}/1.jpg','${B}')`);
ok((await as(A,()=>q(`select * from storage.objects`))).length===1&&(await as(B,()=>q(`select * from storage.objects`))).length===1,'storage: cada usuário só vê os próprios arquivos');
ok(!!await x(B,`insert into storage.objects(bucket_id,name) values ('meal-photos','${A}/hack.jpg')`),'storage: B não envia arquivo para a pasta de A');
ok(!!await x(A,`insert into storage.objects(bucket_id,name) values ('outro-bucket','${A}/x.jpg')`),'storage: A não escreve em bucket não previsto');
// constraints / duplicados
ok(!!await x(A,`insert into public.habit_logs(habit_id) values ('${hid}')`),'duplicado: mesmo hábito no mesmo dia é bloqueado');
ok(!!await x(A,`insert into public.sleep_logs(hours) values (6)`),'duplicado: duas noites de sono no mesmo dia bloqueadas');
ok(!!await x(A,`insert into public.daily_checkins(feeling,energy,mood,stress,hunger,disposition) values ('bem',3,3,3,3,3)`),'duplicado: dois check-ins no mesmo dia bloqueados');
ok(!!await x(A,`insert into public.achievements(code,unlocked_on) values ('semana',current_date)`),'duplicado: mesma conquista duas vezes bloqueada');
ok(!!await x(A,`insert into public.daily_checkins(logged_on,feeling,energy,mood,stress,hunger,disposition) values (current_date-1,'bem',6,3,3,3,3)`),'validação: escala 6 recusada');
ok(!!await x(A,`insert into public.habits(name,frequency) values ('x','semanal')`),'validação: frequência antiga recusada');
ok(!!await x(A,`insert into public.water_logs(amount_ml) values (-5)`),'validação: água negativa recusada');
ok(!!await x(A,`insert into public.goals(type,title,target_value) values ('medida','x',5)`),'validação: meta de medida exige a medida');
ok(!!await x(A,`insert into public.profiles(id) values ('${A}')`)||true,'(info) perfil duplicado');
// upsert usado pelo app
ok(!(await x(A,`insert into public.sleep_logs(logged_on,hours,duration_min) values (current_date,8,480) on conflict (user_id,logged_on) do update set hours=excluded.hours,duration_min=excluded.duration_min`)),'upsert de sono (onConflict user_id,logged_on) funciona sob RLS');
ok(!(await x(A,`insert into public.daily_checkins(feeling,energy,mood,stress,hunger,disposition) values ('normal',3,3,3,3,3) on conflict (user_id,logged_on) do update set feeling=excluded.feeling`)),'upsert de check-in funciona sob RLS');
// órfãos: apagar usuário remove tudo
await db.exec(`delete from auth.users where id='${B}'`);
let orf=0;for(const t of tabs){const c=(await q(`select count(*)::int c from public.${t} where ${own(t)}='${B}'`))[0].c;orf+=c}
ok(orf===0,'órfãos: apagar o usuário remove todos os dados dele (cascade)');
await db.exec(`delete from public.workout_logs where id='${wid}'`);
ok((await q(`select count(*)::int c from public.workout_exercises where workout_id='${wid}'`))[0].c===0,'órfãos: apagar treino remove os exercícios');
await db.exec(`delete from public.habits where id='${hid}'`);
ok((await q(`select count(*)::int c from public.habit_logs where habit_id='${hid}'`))[0].c===0,'órfãos: apagar hábito remove os check-ins');
// tabelas sem RLS?
const norls=await q(`select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity`);
ok(norls.length===0,'todas as tabelas públicas têm RLS ligado'+(norls.length?': '+norls.map(r=>r.relname):''));
const nopol=await q(`select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not exists(select 1 from pg_policies p where p.schemaname='public' and p.tablename=c.relname)`);
ok(nopol.length===0,'todas as tabelas têm política'+(nopol.length?': '+nopol.map(r=>r.relname):''));
const fn=await q(`select has_function_privilege('authenticated','public.handle_new_user()','execute') a,has_function_privilege('anon','public.handle_new_user()','execute') b`);
ok(!fn[0].a&&!fn[0].b,'função do gatilho não pode ser chamada pelo app (authenticated/anon)');
console.log(fails?fails+' falhas':'BANCO OK');process.exit(fails?1:0);
