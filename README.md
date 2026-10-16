# Viva 🌿

App web para acompanhar uma rotina de vida saudável, no seu ritmo: hábitos, hidratação, sono, exercícios, alimentação, check-in diário, metas e conquistas. Feito para celular (mobile-first), funciona também no tablet e no computador.

Sem diagnósticos, sem dietas extremas e sem linguagem de culpa: o foco é consistência.

## O que o app tem

| Página | O que faz |
|---|---|
| **Início** | Resumo do dia, check-in rápido, hábitos de hoje e progresso de água, sono, treino e refeições |
| **Alimentação** | Diário de refeições com timeline, hábitos alimentares opcionais, foto opcional e histórico semanal |
| **Hidratação** | Adição rápida (+200, +300, +500 ml), editar/remover, gráfico e média semanal |
| **Sono** | Horário que dormiu/acordou, qualidade de 1 a 5, comparação entre semanas |
| **Exercícios** | Tipos de treino, musculação com vários exercícios, calendário e consistência |
| **Hábitos** | Sugestões e hábitos personalizados, check-in, sequências e evolução semanal |
| **Evolução** | Peso, medidas, hábitos, treinos, sono e água ao longo do tempo, com a "Minha jornada" |
| **Metas** | Metas por tipo e conquistas (com animação ao desbloquear) |
| **Check-in** | Como você está hoje, energia/humor/estresse/fome/disposição e observações simples |
| **Semana** | Resumo semanal automático, destaque, ponto de atenção e semanas anteriores |
| **Perfil** | Dados pessoais e metas diárias |

## Tema claro e escuro

Identidade visual **Soft Wellness**: os dois temas usam os mesmos componentes e a mesma estrutura; só mudam as cores (tokens).

- **Onde trocar:** *Perfil → Aparência* (Claro, Escuro, Automático), no menu lateral (desktop), em *Mais* (celular) e na tela de login.
- **Automático** acompanha o sistema operacional ao vivo. Escolher Claro ou Escuro **nunca** é sobrescrito pelo sistema.
- A escolha é salva neste aparelho (`localStorage`, chave `viva-theme`), vale para visitantes e para quem fez login, e é aplicada **antes da primeira pintura**, sem flash do tema errado. Nenhum dado pessoal é guardado.
- Todas as cores vêm de tokens CSS (`--background`, `--card`, `--primary`, `--chart-1`…). Veja a lista completa e os contrastes calculados em [`docs/TEMAS.md`](docs/TEMAS.md).
- Contraste verificado para WCAG 2.2 AA (texto 4,5:1 · componentes 3:1) em 51 combinações por tema, e também medido nas cores realmente renderizadas.
- A cor nunca é o único sinal: seleção com ✓, menu ativo em negrito com barra lateral, gráficos com traçados diferentes e descrição em texto.
- Vermelho só aparece em erros de formulário. Nunca em peso aumentado ou metas não concluídas.

**Para mudar uma cor:** edite o token nos dois blocos `:root` no início do CSS do `index.html` e rode `npm run docs && npm test`.

## Testar agora (modo demonstração)

Não precisa de nenhuma configuração. Sem Supabase configurado, o app abre com dados de exemplo e **não salva nada** (os dados somem ao recarregar a página).

```bash
python3 -m http.server 8080
# abra http://localhost:8080
```

## Ativar login e salvar os dados (Supabase)

1. **Crie um projeto** em [supabase.com](https://supabase.com).
2. **Crie as tabelas.** No painel, abra *SQL Editor* e rode o arquivo `supabase/00_tudo.sql` (ele contém os arquivos de `01` a `09`, na ordem certa). Rode **uma única vez**.
3. **Configure o Auth.** Em *Authentication → URL Configuration*:
   - *Site URL*: o endereço onde o app ficará (por exemplo `https://SEU-USUARIO.github.io/viva/`).
   - *Redirect URLs*: o mesmo endereço, e também `http://localhost:8080` se for testar no computador. Sem isso, o link de "esqueci minha senha" não volta para o app.
   - Em *Authentication → Providers → Email*, deixe a confirmação de e-mail ligada ou desligada, como preferir. Ligada, a pessoa precisa clicar no e-mail antes do primeiro login.
4. **Preencha o `config.js`** com a *Project URL* e a chave **publishable** (`sb_publishable_...`). Você encontra as duas no botão **Connect** do projeto, ou em *Settings → API Keys*. Projetos mais antigos mostram também a chave `anon`, que continua funcionando até a Supabase desativá-la (previsto para o fim de 2026):
   ```js
   window.VIVA_CONFIG = {
     url: 'https://xxxxxxxx.supabase.co',
     key: 'sb_publishable_...'
   };
   ```
5. Abra o app: agora ele pede cadastro/login e cada pessoa vê só os próprios dados.

> A chave publishable (ou `anon`) é pública por natureza e pode ir para o GitHub. O que protege os dados é o Row Level Security do banco (já configurado nos SQLs). **Nunca** coloque a chave `secret` (`sb_secret_...`) nem a `service_role` em nenhum arquivo deste projeto.

## Publicar no GitHub Pages

1. Crie um repositório e envie todos os arquivos desta pasta (o `index.html` precisa ficar na raiz).
2. No repositório: *Settings → Pages → Build and deployment → Deploy from a branch → `main` / `(root)`*.
3. Aguarde o endereço `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/` e use-o no passo 3 da configuração do Supabase.

## Estrutura

```
index.html          o app inteiro (HTML, CSS com tokens de tema e JavaScript)
config.js           URL e chave do Supabase (vazio = modo demonstração)
supabase/
  00_tudo.sql       todos os SQLs em uma execução (projeto novo)
  01_base.sql       perfis, peso, medidas, hábitos, check-ins de hábitos e segurança
  02_dashboard.sql  água, sono, treinos e refeições
  03_alimentacao.sql  diário alimentar e fotos das refeições
  04_sono.sql       horários, qualidade e observação do sono
  05_exercicios.sql tipos de treino e exercícios de musculação
  06_habitos.sql    ícones e frequência dos hábitos
  07_evolucao.sql   estrutura das fotos de evolução (privadas)
  08_metas.sql      metas e conquistas
  09_checkin.sql    check-in diário
docs/TEMAS.md       tokens, contrastes e regras de cor (gerado)
scripts/            leitura dos tokens e gerador da documentação
tests/              testes automáticos (e tests/browser, no Chromium real)
```

**Projeto que já está em uso?** Rode apenas os arquivos que ainda não rodou, na ordem numérica. Rodar um arquivo duas vezes dá erro de "já existe".

## Testes

```bash
npm install
npm test                # 256 verificações, rápidas (sem navegador)
npm i --no-save @sparticuz/chromium puppeteer-core
npm run test:browser    # Chromium real: capturas de tela e contraste renderizado
```

`npm test` roda quatro conjuntos:

- `tests/app.test.js` (132): fluxos do app (registros, edição, exclusão, gráficos, filtros) no modo demonstração e com um Supabase simulado.
- `tests/audit.test.js` (39): autenticação completa, tecla Enter, toque duplo, formulários acessíveis, validações, proteção contra HTML nos textos e nomes acessíveis em todas as telas.
- `tests/theme.test.js` (29): tokens e paleta, contraste de 51 combinações por tema, ausência de cores fixas, persistência, modo automático, sem flash.
- `tests/db.test.mjs` (56): aplica todos os SQLs em um Postgres de verdade e confere o isolamento entre usuários (RLS), o storage, duplicados e órfãos.

`npm run test:browser` abre o app em um Chromium de verdade: 11 telas × claro/escuro/automático × desktop/celular (66 telas), mede o contraste de cada texto e elemento gráfico **como renderizado**, procura fundos brancos no tema escuro e testa a troca de tema, a persistência, a ausência de flash, o teclado e o movimento reduzido. As capturas ficam em `tests/screenshots/`.

Os testes **não** substituem um teste com o seu projeto Supabase real nem em celulares reais.

## Segurança e privacidade

- Todas as tabelas têm Row Level Security: uma pessoa nunca acessa dados de outra, nem o acesso anônimo.
- As fotos ficam em buckets **privados**, em uma pasta por usuário.
- As conquistas são calculadas no aplicativo. Uma pessoa mal-intencionada poderia forjar a própria conquista (efeito só estético). Para evitar isso, o cálculo teria de ir para o servidor.
- Os textos digitados são exibidos como texto, não como HTML.

## Limitações conhecidas

- O Supabase devolve no máximo 1000 linhas por consulta. Com muitos hábitos (cerca de 10 por 90 dias) os check-ins ficam perto desse limite.
- Se uma conta for apagada, os arquivos de foto dela permanecem no storage; vale uma limpeza periódica.
- No envio de e-mails (confirmação e recuperação de senha), o Supabase gratuito tem limite de envios por hora. Para uso real, configure um servidor SMTP próprio.
- Os gráficos de evolução usam até 3 anos de histórico.
