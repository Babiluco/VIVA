/* Página independente: não altera o estado, os registros ou o login do app. */
(async function(){
  'use strict';
  const app = document.body.dataset.app;
  const $ = id=>document.getElementById(id);
  let client, proposal = null;
  const message = text=>{ $('message').textContent = text; };
  const config = window.VIVA_INTEGRATION;
  let api;
  try {
    api = new URL(config.apiUrl);
    if(api.protocol !== 'https:' || api.username || api.password || api.search || api.hash) throw Error();
  } catch {
    message('Integração ainda não ativada. O servidor precisa ser publicado e configurado. Seus aplicativos continuam funcionando normalmente.');
    return;
  }
  if(app === 'viva') {
    const config = window.VIVA_CONFIG;
    if(!window.supabase || !config?.url || !config?.key) {message('Configuração do Viva indisponível.');return;}
    client = window.supabase.createClient(config.url,config.key);
  } else {
    if(!await SupabaseClient.ensureReady()) {message('Não foi possível carregar a autenticação.');return;}
    client = SupabaseClient.getClient();
  }
  if(!client) {message('Autenticação indisponível.');return;}
  async function session() {
    const {data,error} = await client.auth.getSession();
    if(error || !data.session) throw Error('Entre no aplicativo e volte a esta página.');
    try {
      const theme = app === 'viva' ? localStorage.getItem('viva-theme') :
        JSON.parse(localStorage.getItem(`${CONFIG.STORAGE_KEY}:user:${data.session.user.id}`) || '{}').user?.theme;
      if(['light','dark'].includes(theme)) document.documentElement.dataset.theme=theme;
    } catch { /* Preferência indisponível: acompanha o sistema. */ }
    $('identity').textContent = `Sua identificação para conferência: ${data.session.user.id.slice(-6)}`;
    return data.session;
  }
  async function request(path,body={}) {
    const auth = await session();
    const response = await fetch(new URL(`v1/${path}`,api.href.endsWith('/') ? api : api.href+'/'), {
      method:'POST', cache:'no-store', credentials:'omit', redirect:'error',
      headers:{'Content-Type':'application/json','X-Viva-App':app,Authorization:`Bearer ${auth.access_token}`},
      body:JSON.stringify(body), signal:AbortSignal.timeout(15000)
    });
    const data = await response.json();
    if(!response.ok) throw Error(data.error || 'Não foi possível concluir a operação.');
    return data;
  }
  async function status() {
    const data = await request('status');
    $('status').textContent = data.linked ? 'Contas conectadas · consulta de treinos autorizada' : 'Contas independentes · sem compartilhamento';
    $('workouts').hidden = !data.linked;
    $('revoke').hidden = !data.linked;
    $('pairing').hidden = data.linked;
  }
  async function perform(action) {
    const buttons = [...document.querySelectorAll('button')];
    buttons.forEach(button=>button.disabled=true);
    message('Aguarde…');
    try {await action();} catch(error) {message(error.name === 'TimeoutError' ? 'O serviço demorou a responder. Tente novamente.' : error.message || 'Falha de conexão. Tente novamente.');}
    finally {buttons.forEach(button=>button.disabled=false);}
  }
  $('create').onclick = ()=>perform(async()=>{
    if(!$('consent').checked) throw Error('Leia e autorize o compartilhamento antes de continuar.');
    const data = await request('propose'); proposal = data.code;
    $('created').value = proposal; $('createdArea').hidden = false;
    message('Código válido por 5 minutos. Abra a outra conta e cole o código lá. Não envie este código a outras pessoas.');
  });
  $('accept').onclick = ()=>perform(async()=>{
    if(!$('consent').checked) throw Error('Leia e autorize o compartilhamento antes de continuar.');
    const data = await request('accept',{code:$('code').value.trim()});
    message(`Aprovação registrada. Confira se a identificação ${data.verification} corresponde à sua conta no outro aplicativo. Volte à página que gerou o código para conferir e confirmar o vínculo.`);
    $('code').value = '';
  });
  $('check').onclick = ()=>perform(async()=>{
    const data = await request('proposal',{code:proposal});
    $('confirm').hidden = !data.ready;
    $('confirmConsent').hidden = !data.ready;
    message(data.ready ? `Confira na outra página se sua identificação é ${data.verification}. Confirme somente se as duas contas forem suas.` : 'Aguardando aprovação na outra conta.');
  });
  $('confirm').onclick = ()=>perform(async()=>{
    if(!$('identityChecked').checked || !$('consent').checked) throw Error('Confira a identidade das duas contas e a autorização.');
    await request('confirm',{code:proposal}); proposal=null;
    $('created').value=''; $('createdArea').hidden=true;
    await status(); message('Vínculo confirmado. Nenhum registro original foi alterado.');
  });
  $('revoke').onclick = ()=>perform(async()=>{
    await request('revoke'); $('list').replaceChildren(); await status();
    message('Compartilhamento revogado. Os registros originais continuam em cada aplicativo.');
  });
  $('refresh').onclick = ()=>perform(async()=>{await status();message('Estado do compartilhamento atualizado.');});
  $('workouts').onclick = ()=>perform(async()=>{
    $('list').replaceChildren();
    const data = await request('workouts');
    for(const workout of data.workouts) {
      const li = document.createElement('li');
      const date = new Date(workout.completedAt);
      li.textContent = `${workout.name} · ${Number(workout.minutes)} min · ${Number.isNaN(date.getTime()) ? 'Data indisponível' : date.toLocaleDateString('pt-BR')}`;
      $('list').append(li);
    }
    message(data.workouts.length ? 'Últimos 30 treinos concluídos consultados no FitForAll. Esta consulta não copia registros para o Viva.' : 'Nenhum treino concluído disponível na nuvem. Treinos ainda locais não aparecem aqui.');
  });
  client.auth.onAuthStateChange(event=>{
    if(event === 'SIGNED_OUT') {proposal=null;$('list').replaceChildren();$('controls').hidden=true;message('Sessão encerrada. Entre novamente no aplicativo.');}
  });
  await perform(async()=>{await session();await status();$('controls').hidden=false;message('Escolha uma ação. O vínculo é opcional e pode ser revogado.');});
})();
