/* Instalação progressiva: o site continua utilizável sem estas APIs. */
(() => {
  'use strict';
  let pendingPrompt = null, registration = null, updating = false, dismissedUpdate = false;
  const tools = document.getElementById('pwa-tools');
  const install = document.getElementById('pwa-install');
  const help = document.getElementById('pwa-help');
  const network = document.getElementById('pwa-network');
  const update = document.getElementById('pwa-update');
  const updateButton = document.getElementById('pwa-update-now');
  if (!tools || !install || !help || !network || !update) return;
  const mode = window.matchMedia ? window.matchMedia('(display-mode: standalone)') : null;
  const standalone = () => navigator.standalone === true || mode?.matches;
  const secure = window.isSecureContext && /^https?:$/.test(location.protocol);
  const refreshInstall = () => { tools.hidden = !secure || !!standalone(); };
  const refreshNetwork = () => { network.hidden = navigator.onLine !== false; };
  const showUpdate = () => {
    if (registration?.waiting && navigator.serviceWorker.controller && !dismissedUpdate) update.hidden = false;
  };

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); pendingPrompt = event; refreshInstall();
  });
  window.addEventListener('appinstalled', () => { pendingPrompt = null; tools.hidden = true; help.hidden = true; });
  mode?.addEventListener?.('change', refreshInstall);
  window.addEventListener('online', refreshNetwork);
  window.addEventListener('offline', refreshNetwork);
  install.addEventListener('click', async () => {
    if (!pendingPrompt) { help.hidden = !help.hidden; install.setAttribute('aria-expanded', String(!help.hidden)); return; }
    const prompt = pendingPrompt; pendingPrompt = null;
    install.disabled = true;
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === 'accepted') tools.hidden = true;
    } catch { help.hidden = false; install.setAttribute('aria-expanded', 'true'); }
    finally { install.disabled = false; }
  });
  document.getElementById('pwa-help-close').addEventListener('click', () => {
    help.hidden = true; install.setAttribute('aria-expanded', 'false'); install.focus();
  });
  document.getElementById('pwa-update-later').addEventListener('click', () => {
    dismissedUpdate = true; update.hidden = true;
  });
  updateButton.addEventListener('click', () => {
    if (!registration?.waiting) { update.hidden = true; return; }
    updating = true; updateButton.disabled = true;
    registration.waiting.postMessage({ type: 'VIVA_ACTIVATE_UPDATE' });
  });
  refreshInstall(); refreshNetwork();
  if (!secure || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (updating) location.reload(); });
  navigator.serviceWorker.register(new URL('sw.js', document.baseURI).href, { scope: './', updateViaCache: 'none' })
    .then(reg => {
      registration = reg; showUpdate();
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing;
        worker?.addEventListener('statechange', () => { if (worker.state === 'installed') showUpdate(); });
      });
    }).catch(() => { /* Falha no recurso opcional não impede login ou registros. */ });
})();
