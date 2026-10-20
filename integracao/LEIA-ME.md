# Integração Viva + FitForAll — entrega incremental 1

## Estado real da entrega

Implementados: servidor de integração, vínculo opcional entre duas contas já autenticadas, confirmação em duas etapas, revogação por qualquer conta e consulta real dos últimos 30 treinos concluídos na nuvem FitTrack. Há páginas de conexão nos dois aplicativos e acesso a elas nos respectivos index.html.

Preparado e testado localmente; NÃO publicado nem conectado aos bancos de produção. Sem servidor configurado, a página informa que a integração não foi ativada. Não há simulação de compartilhamento nem criação automática de contas.

Login único, notificações compartilhadas, sincronização contínua e migração de contas NÃO estão implementados. O vínculo conserva os logins existentes e não deve ser apresentado como SSO. A consulta não copia os treinos para as métricas do dashboard do Viva.

Os arquivos desta entrega foram aplicados diretamente às duas pastas em Downloads por solicitação do usuário. Os index.html anteriores foram preservados em backup fora das pastas dos projetos. Os demais arquivos e configurações existentes foram mantidos.

## Auditoria e decisão de arquitetura

Fontes exclusivas: VIVA-main/VIVA-main e fittrack-main/fittrack-main fornecidos nesta conversa.

Ambos são aplicações web estáticas em JavaScript e usam Supabase. Viva concentra boa parte da aplicação em index.html, com UI e comentários em módulos separados; tem migrations SQL, registros de água, alimentação, sono, hábitos, exercícios, medidas, metas e check-in. FitTrack organiza o código em js/, mantém estado local por usuário e já sincroniza perfil, treinos e metas. Sua documentação sobre sincronização está parcialmente desatualizada em relação ao código. O snapshot não contém as migrations SQL nem projeto Android nativo.

Os projetos Supabase são diferentes. profiles, goals e workout_exercises aparecem nos dois modelos, com semântica distinta. Não são tabelas intercambiáveis. Não foram alterados schemas, RLS, triggers, credenciais, sessões existentes ou algoritmos de sincronização dos aplicativos.

Riscos existentes a resolver separadamente: importação de treinos do FitTrack ignora registros locais já existentes; exclusão local de treino não tem a mesma fila remota das metas; atribuição de dados legados usa heurística de nome. A integração não utiliza essa heurística e não lê dados locais legados.

Arquitetura desta etapa: duas aplicações e dois bancos independentes + pequeno servidor Node 24 com armazenamento SQLite para vínculos/consentimento. O runtime Node já estava disponível para testes. Não há bibliotecas novas de terceiros. SQLite evita depender das migrations ausentes do FitTrack. Esta configuração é para UMA instância com disco persistente; múltiplas instâncias exigem migrar o registro de vínculos para armazenamento transacional compartilhado.

O servidor verifica cada sessão no /auth/v1/user do projeto emissor. Para consultar o FitTrack após o consentimento, usa uma chave service_role somente no servidor, com filtro obrigatório pelo usuário vinculado e projeção mínima de campos. Essa chave tem privilégios amplos; uma função SQL/API com privilégios restritos é a evolução recomendada depois de confirmar o schema real. Nunca coloque essa chave em GitHub, JavaScript público ou config.js.

## Matriz de funcionalidades e propriedade

| Categoria | Responsável | Compartilhamento nesta versão | Alteração pelo outro app |
|---|---|---|---|
| Credenciais e recuperação | Supabase de cada app | Não compartilhadas | Não |
| Vínculo e consentimento | Servidor de integração | Aprovação nas duas contas | Apenas criar/revogar vínculo |
| Treinos concluídos | FitForAll/FitTrack | Consulta de até 30 resumos por ambas as contas vinculadas | Não |
| Água, alimentação, hábitos, check-in | Viva | Não compartilhados | Não |
| Sono, medidas, peso e fotos | Respectivo aplicativo | Não compartilhados | Não |
| Metas e preferências | Respectivo aplicativo | Não compartilhadas | Não |
| Temas | Respectivo aplicativo | Página lê a preferência local da conta atual | Não |
| Notificações/Health Connect | Respectivo aplicativo | Fora desta etapa | Não |

Não existe fusão de registros ou sincronização bidirecional. A fonte de verdade dos treinos é FitTrack. Sem cópias, não há sobrescrita concorrente de registros entre aplicativos. A restrição UNIQUE impede vínculos duplicados e a confirmação consome o código apenas uma vez. Tentativas repetidas não criam vínculos adicionais.

## Fluxo de vínculo, sessões e revogação

1. Entre normalmente em cada aplicativo. Na página de conexão, autorize explicitamente a consulta limitada aos treinos.
2. Gere um código em um deles. O código é aleatório, expira em cinco minutos, fica apenas em memória na página e é armazenado como hash no servidor. Não aparece na URL.
3. Na página de conexão do outro aplicativo, cole o código e aprove.
4. Compare as identificações exibidas nas duas páginas. Retorne à página que gerou o código, confira a aprovação, marque a confirmação de identidade e confirme o vínculo. Se a identificação não corresponder, NÃO confirme; gere outro código.
5. Use “Atualizar conexão” na outra página, se necessário. Depois, consulte os treinos.
6. “Revogar compartilhamento” elimina o vínculo e bloqueia novas consultas. Não apaga os treinos originais.

Um vínculo é exclusivo de um par de contas. A chave canônica desta etapa é o UUID do vínculo junto com os IDs originais; não se pretende substituir o usuário de nenhum banco. A igualdade de e-mail não vincula contas. Compartilhar um código é uma ação sensível: use apenas entre suas próprias páginas autenticadas.

Logout permanece o comportamento original de cada aplicativo. Não faz logout no outro projeto e não revoga automaticamente o consentimento. Sessões expiradas devem ser renovadas pelo SDK original; o servidor revalida cada token. Tokens não são enviados por URL, postMessage ou armazenamento novo; o cliente usa a sessão já mantida pelo SDK. É preservada a limitação atual de sessões em armazenamento acessível ao JavaScript: proteger os sites contra XSS continua necessário. Um futuro SSO deve ser implantado gradualmente por federação/OIDC, com plano específico de vínculo e rollback; não compartilhar senhas nem copiar tokens entre projetos.

## Arquivos e aplicação

Em C:/Users/barba/Downloads/VIVA-main/VIVA-main/:

- Substituir apenas index.html pela versão entregue em VIVA-main/index.html.
- Adicionar integracao/index.html, config.js, painel.js e painel.css.
- Adicionar integracao/server.mjs, integracao/tests/server.test.mjs e este LEIA-ME.md ao repositório como fontes do serviço e documentação. O processo do servidor é independente da hospedagem estática.

Em C:/Users/barba/Downloads/fittrack-main/fittrack-main/:

- Substituir apenas index.html pela versão entregue em fittrack-main/index.html.
- Adicionar integracao/index.html, config.js, painel.js e painel.css.

Não substituir os config.js existentes na RAIZ do Viva nem js/config.js do FitTrack. O config.js novo fica DENTRO de integracao/ e contém somente a URL pública do serviço. Não reenviar ou substituir demais arquivos.

Os arquivos index.html foram produzidos diretamente das cópias fornecidas, acrescentando um link de navegação. Os demais dados, scripts e configurações foram preservados. Uma página de conexão usa os caminhos reais de configuração/SDK de seu respectivo projeto.

## Configuração do serviço — necessária antes de ativar

Hospede server.mjs em um ambiente com Node 24, processo persistente, disco persistente e proxy HTTPS. GitHub Pages sozinho NÃO executa esse servidor. Os aplicativos podem continuar no GitHub Pages.

Configure estas variáveis exclusivamente no ambiente privado do serviço:

| Variável | Conteúdo |
|---|---|
| VIVA_URL | URL do projeto Supabase já definido no config.js original do Viva |
| VIVA_PUBLIC_KEY | Chave pública original do Viva |
| FIT_URL | URL já definida em js/config.js do FitTrack |
| FIT_PUBLIC_KEY | Chave pública original do FitTrack |
| FIT_SERVICE_ROLE_KEY | Chave service_role JWT do projeto FitTrack; segredo somente do servidor |
| APP_ORIGINS | Origens HTTPS exatas separadas por vírgula; sem caminho nem barra final |
| INTEGRATION_DB | Caminho ABSOLUTO para arquivo SQLite privado FORA do diretório público |
| PORT | Porta local do processo, padrão 8787 |

Inicialização: `node integracao/server.mjs`, a partir da raiz do Viva no ambiente do servidor. O processo escuta somente 127.0.0.1; publique por proxy HTTPS no mesmo host. Configure limite de requisições também no proxy. Se os apps estiverem em repositórios do mesmo usuário no GitHub Pages, compartilham a mesma origem: informe essa origem uma vez. CORS não distingue caminhos de repositório; o token validado é a fronteira de autorização.

Em AMBOS os integracao/config.js novos, preencha apiUrl com a URL HTTPS do serviço, sem o sufixo /v1. Nenhuma chave privada vai nesses arquivos. Se usar prefixo de caminho, o proxy deve removê-lo antes de encaminhar ao processo.

A tabela workouts real precisa aceitar os campos id, user_id, name, started_at, completed_at e duration_seconds já consultados pelo código FitTrack. Não criamos um schema presumido para ela. Ausência desses campos, chave inválida ou indisponibilidade retornam erro, sem dados fictícios.

## Contrato v1

Todas as chamadas são POST JSON e exigem Origin permitido, Authorization: Bearer da conta atual e X-Viva-App: viva ou fit. Respostas usam Cache-Control: no-store. Nenhuma requisição inclui senha.

| Rota | Corpo | Resultado |
|---|---|---|
| /v1/status | {} | linked e escopo fixo fit.workouts.read |
| /v1/propose | {} | código temporário e validade de 300 segundos |
| /v1/accept | {code} | aprovação da outra conta; ainda não cria vínculo |
| /v1/proposal | {code} | aprovação pendente e identificação parcial para conferência do iniciador |
| /v1/confirm | {code} | criação atômica do vínculo após aprovação |
| /v1/revoke | {} | revogação do vínculo da conta autenticada |
| /v1/workouts | {} | fonte, modo read-only e resumos autorizados |

Erros: 400 pedido inválido, 401 sessão inválida, 403 acesso negado, 404 código/recurso ausente, 409 conflito, 413 corpo grande, 429 limite de chamadas e 503 indisponibilidade. O servidor não retorna erro interno, tokens ou dados de outras contas. Sem redirecionamentos arbitrários.

## Privacidade, retenção, backup e reversão

Persistem apenas IDs dos vínculos, data de criação, propostas temporárias e contagens de ações com data. Os treinos são consultados sob demanda, sem persistência no servidor ou na página. A auditoria deliberadamente não registra corpo, tokens, e-mail, nome ou detalhes de saúde; ela não substitui uma trilha atribuível para ambientes regulados.

Consentimento: escopo fixo documentado nesta versão; timestamps ficam no vínculo. Alterar a finalidade exige nova versão e nova autorização. Revogação elimina os IDs do vínculo; propostas expiram em cinco minutos e são eliminadas na próxima chamada. Auditoria expira em 30 dias, também com limpeza na próxima chamada. Backups exigem política de retenção própria e procedimento que impeça restaurar consentimentos já revogados.

Antes da ativação, faça backup dos dois index.html originais e das configurações públicas; nenhum backup de dados remotos é necessário para aplicar estes arquivos porque eles não escrevem nos bancos dos apps. Restrinja arquivo SQLite e cópias aos operadores do serviço, use disco criptografado e backup consistente do SQLite com processo parado ou ferramenta apropriada. Não copie apenas o arquivo principal com WAL ativo. Nunca faça commit do SQLite, variáveis privadas ou backups. Defina operador, prazo de retenção e procedimento de exclusão antes de tratar usuários reais. Esta entrega não certifica conformidade legal.

Rollback: esvazie apiUrl nos dois integracao/config.js e restaure os index.html originais; pare o processo. Os registros e logins originais continuam independentes. Se o consentimento tiver sido revogado, não reative um backup antigo sem reconciliar as revogações.

## Testes e pendências

Executados: Node 24 disponível; cinco testes automatizados do serviço passaram, com cenários de autenticação por emissor simulada, CORS, aprovação dupla, código inválido/expirado, replay, isolamento entre contas, consulta, revogação e revogação durante consulta. O teste voz.test.js original passou. Os testes usam SQLite real temporário em memória e HTTP local; não fazem chamadas aos Supabase reais.

audit.test.js e pwa.test.js existentes foram tentados e não iniciaram: falta jsdom na cópia fornecida. Também não estão instaladas as dependências declaradas jsdom 30.1.2 e @electric-sql/pglite 0.5.8 necessárias à suíte completa do Viva. Não foram instaladas dependências. O FitTrack não traz suíte automatizada/package.json nesse snapshot.

Para repetir o serviço: `node --test integracao/tests/server.test.mjs`. Para a suíte original do Viva, instalar as dependências já declaradas no package.json e executar npm test, além de node tests/theme.test.js. Fazer isso em ambiente de teste antes de atualizar os sites.

Roteiro manual PENDENTE:

1. Autenticação: login em cada app, recuperação de senha, token expirado, logout de apenas um app e acesso após revogação. SSO não está disponível.
2. Identidade/permissões: duas contas legítimas; código interceptado com identificação divergente; terceira conta sem acesso; reaprovação após revogar; mesma conta em abas diferentes.
3. Dados: banco real com treino concluído, sem treino, treino somente local e mais de 30 treinos; duração em segundos convertida para minutos; nenhuma duplicação ou alteração no dashboard.
4. Rede: serviço desligado, timeout, Supabase indisponível, conexão perdida durante vínculo e durante leitura; repetir a operação com mensagens claras.
5. Navegação: links nas duas páginas iniciais, retorno ao app de origem, acesso sem sessão e publicação em subpastas do GitHub Pages.
6. Interface: 320/375/768/1440 px, zoom 200%, tema claro/escuro explícito e automático, navegação por teclado, leitor de tela, código longo, nomes longos, foco e toque.
7. Regressão: registros de água, alimentação, sono, hábitos, check-in e Viva comenta; treino completo e filas locais do FitTrack; uso de apenas um aplicativo; instalação PWA e atualização de cache.

Não foram realizados testes visuais em navegador, publicação, verificação de RLS remoto ou chamadas com contas reais. Não considerar a entrega liberada para produção até concluir essas verificações.

## Próximas etapas e dependências reais

1. Publicar serviço com variáveis privadas e backup/reversão definidos; confirmar schema remoto, políticas e chaves no FitTrack sem migração automática.
2. Validar vínculo e consulta ponta a ponta com contas de teste. Ativar primeiro para teste controlado; até então apiUrl continua vazio.
3. Definir provedor de identidade comum/OIDC e estratégias de vínculo/recovery/logout antes do SSO. Isso exige configurações dos serviços que não estão contidas nas pastas.
4. Somente depois definir importação no dashboard, filas de sincronização e idempotência por (origem, ID) com versionamento, conflitos e exclusões. Nenhuma sincronização bidirecional automática será feita nesta etapa.

Dependências externas impedem concluir o ecossistema completo exclusivamente com arquivos estáticos: hospedagem do processo, segredo privado do servidor e configuração de identidade. Nenhum recurso em produção foi alterado nesta entrega.
