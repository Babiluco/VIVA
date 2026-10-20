import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const digest = value => createHash('sha256').update(value).digest('hex');
const problem = (status, message) => Object.assign(new Error(message), {status});
export function createGateway({dbPath, origins, verify, readWorkouts, now = Date.now}) {
  const db = new DatabaseSync(dbPath);
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS links (
      id TEXT PRIMARY KEY, viva TEXT NOT NULL UNIQUE, fit TEXT NOT NULL UNIQUE,
      created INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS proposals (
      hash TEXT PRIMARY KEY, app TEXT NOT NULL, owner TEXT NOT NULL,
      peer TEXT, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS audit (
      id INTEGER PRIMARY KEY, action TEXT NOT NULL, at INTEGER NOT NULL);`);
  const limits = new Map();
  const transaction = fn => {
    db.exec('BEGIN IMMEDIATE');
    try { const result = fn(); db.exec('COMMIT'); return result; }
    catch(error) { db.exec('ROLLBACK'); throw error; }
  };
  const audit = action => db.prepare('INSERT INTO audit(action,at) VALUES (?,?)').run(action, now());
  const linked = (app, user) => db.prepare(`SELECT * FROM links WHERE ${app === 'viva' ? 'viva' : 'fit'}=?`).get(user);
  const handler = async (req, res) => {
    const origin = req.headers.origin;
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Vary', 'Origin');
    if(!origins.includes(origin)) { res.writeHead(403); res.end(); return; }
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Viva-App');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    if(req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    try {
      const at = now();
      for(const [key,value] of limits) if(value.until <= at) limits.delete(key);
      const ip = req.socket.remoteAddress;
      const limit = limits.get(ip) || {count:0, until:at+60000};
      limits.set(ip, limit);
      if(++limit.count > 60) throw problem(429, 'Aguarde um minuto e tente novamente.');
      if(req.method !== 'POST') throw problem(405, 'Método não permitido.');
      const route = new URL(req.url, 'http://localhost').pathname;
      const app = req.headers['x-viva-app'];
      if(!['viva','fit'].includes(app)) throw problem(400, 'Aplicativo inválido.');
      const token = /^Bearer ([^\s]+)$/.exec(req.headers.authorization || '')?.[1];
      if(!token) throw problem(401, 'Entre novamente no aplicativo.');
      const user = await verify(app, token);
      if(!user?.id) throw problem(401, 'Sessão inválida ou expirada.');
      let raw = '';
      for await(const chunk of req) {
        raw += chunk;
        if(Buffer.byteLength(raw) > 4096) throw problem(413, 'Pedido muito grande.');
      }
      let body;
      try { body = JSON.parse(raw || '{}'); } catch { throw problem(400, 'Pedido inválido.'); }
      if(!body || Array.isArray(body) || typeof body !== 'object') throw problem(400, 'Pedido inválido.');
      db.prepare('DELETE FROM proposals WHERE expires<=?').run(at);
      db.prepare('DELETE FROM audit WHERE at<?').run(at-30*86400000);
      let result;
      if(route === '/v1/status') {
        result = {linked:!!linked(app,user.id), scope:'fit.workouts.read'};
      } else if(route === '/v1/propose') {
        if(linked(app,user.id)) throw problem(409, 'Revogue o vínculo atual antes de criar outro.');
        const code = randomBytes(24).toString('base64url');
        transaction(()=>{
          db.prepare('DELETE FROM proposals WHERE app=? AND owner=?').run(app,user.id);
          db.prepare('INSERT INTO proposals(hash,app,owner,expires) VALUES (?,?,?,?)').run(digest(code),app,user.id,at+300000);
        });
        result = {code, expiresIn:300};
      } else if(['/v1/accept','/v1/proposal','/v1/confirm'].includes(route)) {
        if(typeof body.code !== 'string' || !/^[A-Za-z0-9_-]{32}$/.test(body.code)) throw problem(400,'Código inválido.');
        const hash = digest(body.code);
        result = transaction(()=>{
          const p = db.prepare('SELECT * FROM proposals WHERE hash=? AND expires>?').get(hash,now());
          if(!p) throw problem(404,'Código inexistente ou expirado.');
          if(route === '/v1/accept') {
            if(p.app === app || p.peer || linked(app,user.id)) throw problem(409,'Vínculo indisponível.');
            db.prepare('UPDATE proposals SET peer=? WHERE hash=?').run(user.id,hash);
            return {accepted:true, verification:p.owner.slice(-6)};
          }
          if(p.app !== app || p.owner !== user.id) throw problem(403,'Operação não autorizada.');
          if(route === '/v1/proposal') return {ready:!!p.peer, verification:p.peer?.slice(-6)};
          if(!p.peer) throw problem(409,'A outra conta ainda não aprovou.');
          const viva = app === 'viva' ? user.id : p.peer;
          const fit = app === 'fit' ? user.id : p.peer;
          if(linked('viva',viva) || linked('fit',fit)) throw problem(409,'Uma das contas já possui vínculo.');
          db.prepare('INSERT INTO links(id,viva,fit,created) VALUES (?,?,?,?)').run(randomBytes(16).toString('hex'),viva,fit,now());
          db.prepare('DELETE FROM proposals WHERE hash=?').run(hash);
          audit('link.confirm');
          return {linked:true};
        });
      } else if(route === '/v1/revoke') {
        transaction(()=>{
          const link = linked(app,user.id);
          if(link) db.prepare('DELETE FROM links WHERE id=?').run(link.id);
          db.prepare('DELETE FROM proposals WHERE app=? AND owner=? OR peer=?').run(app,user.id,user.id);
          audit('link.revoke');
        });
        result = {linked:false};
      } else if(route === '/v1/workouts') {
        const link = linked(app,user.id);
        if(!link) throw problem(403,'Autorize o compartilhamento nas duas contas.');
        const rows = await readWorkouts(link.fit);
        if(!linked(app,user.id) || linked(app,user.id).id !== link.id) throw problem(403,'Compartilhamento revogado.');
        result = {source:'FitForAll', mode:'read-only', workouts:rows};
        audit('workouts.read');
      } else throw problem(404,'Recurso inexistente.');
      res.writeHead(200, {'Content-Type':'application/json; charset=utf-8'});
      res.end(JSON.stringify(result));
    } catch(error) {
      res.writeHead(error.status || 503, {'Content-Type':'application/json; charset=utf-8'});
      res.end(JSON.stringify({error:error.status ? error.message : 'Serviço temporariamente indisponível.'}));
    }
  };
  return {handler, close:()=>db.close()};
}

export function productionOptions(env = process.env) {
  const required = ['VIVA_URL','VIVA_PUBLIC_KEY','FIT_URL','FIT_PUBLIC_KEY','FIT_SERVICE_ROLE_KEY','APP_ORIGINS','INTEGRATION_DB'];
  for(const key of required) if(!env[key]) throw new Error(`Configure ${key}.`);
  for(const key of ['VIVA_URL','FIT_URL']) {
    const url = new URL(env[key]);
    if(url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash || url.username || url.password) throw new Error(`URL inválida: ${key}`);
  }
  const origins = env.APP_ORIGINS.split(',').map(value=>value.trim());
  for(const origin of origins) if(new URL(origin).origin !== origin || !origin.startsWith('https://')) throw new Error('APP_ORIGINS exige origens HTTPS exatas.');
  async function fetchJSON(url, headers) {
    const response = await fetch(url, {headers, signal:AbortSignal.timeout(10000), redirect:'error'});
    if(!response.ok) throw problem(response.status === 401 || response.status === 403 ? 401 : 503, 'Não foi possível validar ou consultar o serviço.');
    return response.json();
  }
  return {
    dbPath:env.INTEGRATION_DB, origins,
    async verify(app,token) {
      const prefix = app === 'viva' ? 'VIVA' : 'FIT';
      return fetchJSON(`${env[prefix+'_URL'].replace(/\/$/,'')}/auth/v1/user`, {apikey:env[prefix+'_PUBLIC_KEY'], Authorization:`Bearer ${token}`});
    },
    async readWorkouts(userId) {
      const url = new URL('/rest/v1/workouts',env.FIT_URL);
      url.searchParams.set('select','id,name,started_at,completed_at,duration_seconds');
      url.searchParams.set('user_id',`eq.${userId}`);
      url.searchParams.set('completed_at','not.is.null');
      url.searchParams.set('order','completed_at.desc');
      url.searchParams.set('limit','30');
      const rows = await fetchJSON(url, {apikey:env.FIT_SERVICE_ROLE_KEY,Authorization:`Bearer ${env.FIT_SERVICE_ROLE_KEY}`});
      if(!Array.isArray(rows)) throw problem(503,'Resposta inválida do FitForAll.');
      return rows.map(row=>({id:row.id,name:String(row.name || 'Treino').slice(0,160),completedAt:row.completed_at,minutes:Math.round(Math.max(0,Number(row.duration_seconds)||0)/60)}));
    }
  };
}
if(process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const gateway = createGateway(productionOptions());
  const server = http.createServer(gateway.handler);
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.listen(Number(process.env.PORT || 8787),'127.0.0.1');
  const stop = ()=>server.close(()=>{gateway.close();process.exit(0);});
  process.on('SIGTERM',stop); process.on('SIGINT',stop);
}
