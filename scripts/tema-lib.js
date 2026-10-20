// Lê os tokens de tema direto do index.html e calcula contraste WCAG.
// Usado por tests/theme.test.js e por scripts/gerar-docs-temas.js.
const fs=require('fs'),path=require('path');
const HTML=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const CSS=HTML.slice(HTML.indexOf('<style>')+7,HTML.indexOf('</style>'));

function block(open){const i=CSS.indexOf(open);if(i<0)throw new Error('bloco não encontrado: '+open);let d=0,j=CSS.indexOf('{',i);const st=j;for(;j<CSS.length;j++){if(CSS[j]==='{')d++;else if(CSS[j]==='}'){d--;if(!d)break}}return CSS.slice(st+1,j)}
const decl=b=>Object.fromEntries([...b.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)].map(m=>[m[1],m[2].trim()]));
const LIGHT=decl(block(':root{\n  color-scheme:light;')),DARK=decl(block(':root[data-theme="dark"]{'));
const TOKEN_BLOCKS_END=CSS.indexOf(':root{--r:20px');      // tudo depois daqui são componentes (--r = raio, token não-cor compartilhado)
if(TOKEN_BLOCKS_END<0)throw new Error('marcador do fim dos tokens não encontrado no CSS');
const COMPONENT_CSS=CSS.slice(TOKEN_BLOCKS_END);

const hex=h=>{h=h.replace('#','');if(h.length===3)h=[...h].map(c=>c+c).join('');return[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255)};
const lum=h=>{const[r,g,b]=hex(h).map(c=>c<=.03928?c/12.92:((c+.055)/1.055)**2.4);return .2126*r+.7152*g+.0722*b};
const ratio=(a,b)=>{const x=lum(a),y=lum(b),hi=Math.max(x,y),lo=Math.min(x,y);return(hi+.05)/(lo+.05)};

// [descrição, texto/elemento, fundo, mínimo]  (4,5 = texto normal · 3 = componentes e indicadores)
const PAIRS=[
 ['texto principal / fundo','foreground','background',4.5],['texto principal / card','card-foreground','card',4.5],['texto principal / superfície secundária','foreground','surface-secondary',4.5],['texto principal / verde suave','secondary-foreground','secondary',4.5],
 ['texto secundário / fundo','muted-foreground','background',4.5],['texto secundário / card','muted-foreground','card',4.5],['texto secundário / superfície secundária','muted-foreground','surface-secondary',4.5],['texto secundário / verde suave','muted-foreground','secondary',4.5],
 ['verde principal (texto) / fundo','primary','background',4.5],['verde principal (texto) / card','primary','card',4.5],['verde principal (texto) / superfície secundária','primary','surface-secondary',4.5],['verde principal (texto) / verde suave','primary','secondary',4.5],
 ['texto do botão / botão principal','primary-foreground','primary',4.5],['texto / elemento selecionado','selected-foreground','selected',4.5],['texto do calendário / dia de treino','primary-foreground','progress-indicator',4.5],
 ['texto da navegação / sidebar','sidebar-foreground','sidebar-background',4.5],['verde principal / sidebar','primary','sidebar-background',4.5],['texto principal / sidebar','foreground','sidebar-background',4.5],
 ['sucesso (texto) / card','success','card',4.5],['sucesso (texto) / fundo','success','background',4.5],['alerta (texto) / card','warning','card',4.5],['texto do aviso / fundo do aviso de alerta','warning-foreground','warning',4.5],
 ['erro (texto) / card','destructive','card',4.5],['erro (texto) / fundo','destructive','background',4.5],['erro (texto) / superfície secundária','destructive','surface-secondary',4.5],['texto do aviso / fundo do aviso de erro','destructive-foreground','destructive',4.5],
 ['destaque complementar (texto) / card','accent','card',4.5],
 ['indicador de progresso / trilho','progress-indicator','progress-track',3],['indicador de progresso / card','progress-indicator','card',3],['indicador de progresso / fundo','progress-indicator','background',3],
 ['gráfico 1 / card','chart-1','card',3],['gráfico 2 / card','chart-2','card',3],['gráfico 3 / card','chart-3','card',3],['gráfico 4 / card','chart-4','card',3],
 ['gráfico 1 / fundo','chart-1','background',3],['gráfico 2 / fundo','chart-2','background',3],['gráfico 3 / fundo','chart-3','background',3],['gráfico 4 / fundo','chart-4','background',3],
 ['linha da meta / card','chart-goal','card',3],['texto dos eixos / card','chart-axis','card',4.5],
 ['borda de campo / campo','input-border','input',3],['borda de campo / card','input-border','card',3],['borda de campo / fundo','input-border','background',3],['borda de campo / superfície secundária','input-border','surface-secondary',3],
 ['foco (ring) / card','ring','card',3],['foco (ring) / fundo','ring','background',3],['foco (ring) / sidebar','ring','sidebar-background',3],['foco (ring) / superfície secundária','ring','surface-secondary',3],['foco (ring) / verde suave','ring','secondary',3],
 ['estado selecionado / card','selected','card',3],['estado selecionado / fundo','selected','background',3],
];
const REQUIRED=['background','foreground','card','card-foreground','surface-secondary','primary','primary-foreground','secondary','secondary-foreground','muted','muted-foreground','border','input','ring','success','warning','destructive','chart-1','chart-2','chart-3','chart-4','progress-track','progress-indicator','sidebar-background','sidebar-foreground','selected'];
const SPEC={ // valores definidos no briefing "Soft Wellness"
 light:{background:'#F6F7F2',card:'#FFFFFF','surface-secondary':'#EDF1E9',primary:'#426B52','progress-indicator':'#4F8061',secondary:'#DCEBDD',foreground:'#243329','muted-foreground':'#58675D',border:'#DDE4DA',accent:'#A75F43',input:'#FFFFFF'},
 dark:{background:'#141A16','sidebar-background':'#19221C',card:'#202B23','surface-secondary':'#29372C',primary:'#A9D0AF','progress-indicator':'#91C49C',secondary:'#304A37',foreground:'#F0F4EE','muted-foreground':'#B7C4B8',border:'#38463B',accent:'#E5AC8F',input:'#202B23'}};
module.exports={HTML,CSS,COMPONENT_CSS,LIGHT,DARK,PAIRS,REQUIRED,SPEC,ratio};
