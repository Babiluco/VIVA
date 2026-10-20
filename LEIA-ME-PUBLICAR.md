# Viva — aplicativo instalável

Este pacote completo inclui o Viva comenta e o config.js configurado com a URL e a chave pública do Supabase fornecidas pelo proprietário do projeto. Não é necessário editar esse arquivo para publicar neste mesmo projeto.

## Publicar no GitHub Pages

1. Extraia o ZIP no computador.
2. Envie **os arquivos extraídos** para a raiz do repositório do Viva. O index.html deve ficar na raiz, acompanhado de config.js, pwa.js, sw.js, offline.html, manifest.webmanifest e das pastas icons e voz. Preserve a estrutura das pastas.
3. Mantenha os demais arquivos que já existem no repositório. Substitua os de mesmo nome por esta versão. Não é necessário apagar tabelas ou rodar SQL.
4. Em Settings → Pages, confirme a publicação pela branch e pasta corretas. Se o site já usa GitHub Pages, aguarde a publicação terminar após o envio.
5. Abra o endereço HTTPS do site publicado. Confira o login e faça um registro de teste na sua conta.
6. Toque em **Instalar Viva**. No computador, o Chrome/Edge também podem oferecer instalação pela barra de endereço. No iPhone/iPad, abra no Safari, toque em Compartilhar → Adicionar à Tela de Início e, se disponível, habilite Abrir como App.

O ZIP é um pacote de arquivos para publicação: envie seu conteúdo extraído, e não apenas o ZIP. A instalação exige um endereço HTTPS ou localhost; abrir index.html diretamente pelo gerenciador de arquivos não instala o app. Os requisitos e os caminhos de instalação por navegador seguem a [documentação MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).

Se o site continuar com a versão anterior, recarregue a página e confirme que a publicação do GitHub terminou. Os caminhos são relativos e funcionam tanto na raiz de um domínio quanto em uma subpasta como /viva-app/.

## Supabase

- config.js já usa o projeto e a chave pública fornecidos. Nenhuma chave secret ou service_role foi adicionada.
- O login e os registros usam a integração e as tabelas existentes. Nenhuma migração de banco é exigida pela instalação.
- No Supabase, o Site URL e as Redirect URLs do Auth precisam incluir o endereço HTTPS publicado, como na configuração anterior do site. Isso é relevante para confirmação de e-mail e recuperação de senha.
- Esta entrega não executou gravações no Supabase real nem alterou suas políticas de acesso.

## Como funciona

- Ícone próprio do Viva em PNG (192, 512 e 180 px), com variante maskable para Android.
- Manifesto com modo standalone: abertura em janela de app pelo ícone instalado.
- Botão de instalação com instruções quando o navegador não oferece o aviso automático.
- Aviso de falta de conexão enquanto o site está aberto.
- Após a primeira abertura online e a conclusão da preparação, uma abertura sem conexão exibe uma tela para reconectar. O service worker guarda apenas sete arquivos públicos de apresentação; não armazena config.js, páginas autenticadas, sessões, fotos ou respostas do banco.
- Os registros exigem internet. Não há armazenamento de registros para sincronização posterior. Dados de uma tela já aberta podem ficar desatualizados até a próxima consulta.
- Se a configuração ou o SDK do Supabase não carregar, o app informa o erro em vez de mostrar demonstração como se fosse a conta.
- Atualizações do service worker podem ser adiadas. O botão Atualizar agora solicita recarregar; salve o que estiver preenchendo antes de usá-lo. Os arquivos do site continuam sendo buscados online normalmente.

## Próximas versões

Ao alterar sw.js ou qualquer arquivo listado em publicFiles, incremente a constante VERSION de sw.js, por exemplo de v1 para v2. Isso troca os arquivos públicos em cache. Não ative skipWaiting automaticamente: o fluxo atual permite ao usuário concluir seus formulários. Se uma atualização não baixar por completo, a versão anterior permanece ativa.

## Verificação realizada

- Testes de fluxos existentes: TUDO OK.
- Auditoria de acessibilidade, autenticação e validações: AUDITORIA OK.
- SQLs e isolamento em PGlite: BANCO OK.
- Motor e interface de comentários: VOZ OK e VOZ UI OK.
- Testes PWA: manifesto, tamanhos dos ícones, cache restrito, raiz/subpasta, ajuda de instalação, rede e falha de SDK passaram.
- Edge local via HTTP: manifesto reconhecido; o navegador de teste informou apenas a restrição esperada de instalação em janela anônima; abertura offline, reconexão, atualização adiada e confirmada, preservação do formulário até confirmação, falha de atualização e isolamento do cache passaram. A indicação de janela instalada foi simulada para verificar a ocultação do botão.
- Interface de instalação conferida em claro/escuro, com larguras 360, 390, 768 e 1440, sem overflow horizontal; capturas de tela e ícone inspecionados.

Para repetir os testes do projeto: npm install e npm test. Os testes automatizados usam dados de demonstração e Supabase simulado; a verificação do banco usa PGlite local. A checagem adicional de instalabilidade em perfil normal não foi executada porque a revisão automática de execução atingiu o limite de uso da conta. A instalação física em um celular e o site publicado ainda precisam ser conferidos após o envio ao GitHub.

## Arquivos desta etapa

Criados: manifest.webmanifest, sw.js, pwa.js, offline.html, icons/viva.svg, icons/viva-192.png, icons/viva-512.png, icons/viva-maskable-512.png, icons/apple-touch-icon.png, tests/pwa.test.js e este guia.

Modificados: index.html, config.js (configuração pública solicitada), package.json (teste PWA) e tests/html.js (carregamento do novo script nos testes existentes).

O pacote também contém os arquivos do Viva comenta e as funcionalidades anteriores. Esta entrega prepara a publicação; não realizou envio ao GitHub nem instalou o aplicativo no dispositivo do usuário.
