/* Preferência de aparência e ajustes de apresentação; sem acesso aos registros. */
(() => {
 'use strict';
 const root=document.documentElement,media=window.matchMedia?.('(prefers-color-scheme: dark)');
 let preference='auto';
 try{const value=localStorage.getItem('viva-theme');if(['light','dark'].includes(value))preference=value}catch{}
 const apply=()=>{
  root.dataset.themePref=preference;root.dataset.theme=preference==='auto'?(media?.matches?'dark':'light'):preference;
  document.querySelectorAll('.tsw button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.arg===preference)));
  const meta=document.getElementById('tcolor'),background=getComputedStyle(root).getPropertyValue('--background').trim();
  if(meta&&background)meta.content=background;
 };
 const choose=value=>{
  if(!['light','dark','auto'].includes(value))return;preference=value;
  try{value==='auto'?localStorage.removeItem('viva-theme'):localStorage.setItem('viva-theme',value)}catch{}
  apply();
 };
 const icons={light:'M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6L7 7m10 10 1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4M16 12a4 4 0 1 0-8 0 4 4 0 0 0 8 0',dark:'M20 14A8 8 0 1 1 10 4a6.5 6.5 0 0 0 10 10z',auto:'M3 4h18v13H3zM8 21h8m-4-4v4'};
 const control=()=>'<div class="tsw" role="group" aria-label="Aparência">'+[['light','Claro'],['dark','Escuro'],['auto','Automático']].map(([key,label])=>`<button type="button" data-act="theme" data-arg="${key}" aria-label="${label}" aria-pressed="${preference===key}"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[key]}"/></svg>${key==='auto'?'<span class="theme-label-long">Automático</span><span class="theme-label-short" aria-hidden="true">Auto</span>':label}</button>`).join('')+'</div>';
 const decorate=main=>{
  apply();
  main.querySelectorAll('.prog').forEach(bar=>{
   const title=bar.closest('.card')?.querySelector('.ct')?.textContent;
   if(title)bar.setAttribute('aria-label','Progresso: '+title);
  });
  main.querySelectorAll('.dy').forEach(button=>button.setAttribute('aria-pressed',String(button.classList.contains('on'))));
  main.querySelectorAll('.days').forEach(strip=>{
   const selected=strip.querySelector('.on');if(!selected)return;
   const left=selected.offsetLeft,right=left+selected.offsetWidth;
   if(right>strip.scrollLeft+strip.clientWidth)strip.scrollLeft=right-strip.clientWidth+4;
   else if(left<strip.scrollLeft)strip.scrollLeft=left;
  });
 };
 const clearError=input=>{
  const id=input.dataset.vivaError;if(!id)return;
  document.getElementById(id)?.remove();input.removeAttribute('aria-invalid');delete input.dataset.vivaError;
  const descriptions=(input.getAttribute('aria-describedby')||'').split(/\s+/).filter(key=>key&&key!==id);
  descriptions.length?input.setAttribute('aria-describedby',descriptions.join(' ')):input.removeAttribute('aria-describedby');
 };
 const error=(id,message)=>{
  const input=document.getElementById(id);if(!input)return;
  clearError(input);const details=input.closest('details');if(details)details.open=true;
  const note=document.createElement('span');note.id=id+'-error';note.className='field-error';note.textContent=message;
  input.after(note);input.dataset.vivaError=note.id;input.setAttribute('aria-invalid','true');
  input.setAttribute('aria-describedby',((input.getAttribute('aria-describedby')||'')+' '+note.id).trim());input.focus();
 };
 window.VivaUI={control,choose,decorate,error};
 document.addEventListener('input',event=>{if(event.target.matches('input,select,textarea'))clearError(event.target)});
 document.addEventListener('change',event=>{if(event.target.matches('input,select,textarea'))clearError(event.target)});
 apply();
 media?.addEventListener?.('change',()=>{if(preference==='auto')apply()});
 window.addEventListener('storage',event=>{if(event.key==='viva-theme'||event.key===null){preference=['light','dark'].includes(event.newValue)?event.newValue:'auto';apply()}});
 document.addEventListener('click',event=>{const button=event.target.closest('.tsw [data-act="theme"]');if(button)choose(button.dataset.arg)});
 document.addEventListener('DOMContentLoaded',apply);
 let frame;
 const viewport=()=>{
  if(!window.visualViewport)return;
  cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
   if(!window.visualViewport)return;
   root.style.setProperty('--viewport-height',window.visualViewport.height+'px');
   root.style.setProperty('--viewport-top',window.visualViewport.offsetTop+'px');
  });
 };
 window.visualViewport?.addEventListener('resize',viewport);
 window.visualViewport?.addEventListener('scroll',viewport);viewport();
})();
