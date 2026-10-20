/* Viva · catálogo de frases do "Viva comenta".
 * SÓ DADOS. Para ampliar o vocabulário do Viva, basta acrescentar frases nas listas abaixo.
 * Marcadores: {agua} {meta} {pct} {horas} {dias} {treinos} {feitos} {agendados} {pts} {item} {Item}.
 * Cada situação ("categoria.situacao") tem: tom (cobranca | celebra | acolhe | neutro), prio (maior aparece primeiro)
 * e frases nos três estilos. Para criar uma SITUAÇÃO nova, acrescente aqui e a regra em motor.js.
 * Regras de ouro: nunca julgar peso, aparência ou alimentos; nunca culpar; nada de incentivo a exageros ou a pular refeições. */
(function(root,f){var c=f();if(typeof module==='object'&&module.exports)module.exports=c;else root.VIVA_VOZ_CATALOGO=c})(typeof self!=='undefined'?self:this,function(){
return{
estilos:{
 debochado:{nome:'Debochado',emoji:'😏',desc:'Humor, ironia leve e provocações amigáveis.'},
 carinhoso:{nome:'Carinhoso',emoji:'🤗',desc:'Gentil, acolhedor e motivador.'},
 treinador:{nome:'Treinador',emoji:'📋',desc:'Direto e prático, sem agressividade.'}},
freqs:{
 normal:{nome:'Normal',desc:'Comemora e provoca com moderação (no máximo 1 cobrança por área e 3 por dia).'},
 menos:{nome:'Menos cobranças',desc:'No máximo 1 cobrança por dia. As comemorações continuam.'},
 comemoracoes:{nome:'Só comemorações',desc:'Nada de cobranças: apenas comemorações e acolhimento.'},
 desligado:{nome:'Desligado',desc:'O Viva fica quieto.'}},
categorias:{hid:'Hidratação',ali:'Alimentação',mov:'Movimento',sono:'Sono',con:'Rotina'},
exemplos:{
 debochado:'Ei, a garrafinha está ali de decoração ou você vai beber essa água? 💧',
 carinhoso:'Que tal um copinho de água agora? Seu corpo agradece 💙',
 treinador:'Nenhuma água registrada hoje. Pegue um copo agora e registre. 💧'},
situacoes:{
 'hid.sem_registro':{tom:'cobranca',prio:50},'hid.abaixo_meta':{tom:'cobranca',prio:45},'hid.longo_intervalo':{tom:'cobranca',prio:55},
 'hid.quase':{tom:'celebra',prio:60},'hid.meta':{tom:'celebra',prio:85},'hid.superou':{tom:'celebra',prio:70},'hid.registro_recente':{tom:'celebra',prio:95},
 'ali.variedade_baixa':{tom:'cobranca',prio:32},'ali.repetido':{tom:'cobranca',prio:30},'ali.poucas_fv':{tom:'cobranca',prio:33},'ali.ultra_frequente':{tom:'cobranca',prio:28},
 'ali.variada':{tom:'celebra',prio:75},'ali.registro_recente':{tom:'celebra',prio:95},'ali.sem_registro':{tom:'neutro',prio:20},
 'mov.poucos_registros':{tom:'cobranca',prio:40},'mov.meta_semana':{tom:'celebra',prio:85},'mov.hoje':{tom:'celebra',prio:80},'mov.retorno':{tom:'celebra',prio:88},'mov.descanso':{tom:'acolhe',prio:50},
 'sono.abaixo_meta':{tom:'cobranca',prio:45},'sono.irregular':{tom:'cobranca',prio:30},'sono.adequado':{tom:'celebra',prio:70},'sono.consistente':{tom:'celebra',prio:78},'sono.sem_registro':{tom:'neutro',prio:15},'sono.registro_recente':{tom:'celebra',prio:95},
 'con.meta_dia':{tom:'celebra',prio:90},'con.pequena':{tom:'celebra',prio:55},'con.retorno':{tom:'celebra',prio:86},'con.sequencia':{tom:'celebra',prio:65},'con.progresso':{tom:'celebra',prio:60},'con.poucos_dia':{tom:'acolhe',prio:25},'con.dia_dificil':{tom:'acolhe',prio:70},'con.neutro':{tom:'neutro',prio:5}},
frases:{
/* ======================= HIDRATAÇÃO ======================= */
'hid.sem_registro':{
 debochado:['Ei, a garrafinha está ali de decoração ou você vai beber essa água? 💧','Seu registro de água hoje está mais vazio que geladeira no fim do mês. 🫗','Nenhum copo registrado ainda... a água está com ciúmes do café, né? ☕'],
 carinhoso:['Ainda não vi água registrada hoje. Que tal um copinho agora? Seu corpo agradece 💙','Passando só para lembrar de você: um golinho de água cai bem. 💧','Se você já bebeu água, é só registrar aqui. Se ainda não, vamos com um copo? 🌿'],
 treinador:['Nenhuma água registrada hoje. Pegue um copo agora e registre. Meta do dia: {meta}. 💧','Sem registro de água até aqui. Comece com um copo e deixe a garrafa à vista.','Hidratação não entra sozinha na rotina: um copo agora, outro depois do almoço.']},
'hid.abaixo_meta':{
 debochado:['Você está em {pct}% da meta de água. Vamos acelerar sem desespero, tá? 🐢💧','Água de hoje: {agua} de {meta}. A garrafa quer participar mais da sua história!','Está devendo uns golinhos para a meta, hein? Sem pânico, ainda dá tempo.'],
 carinhoso:['Você já chegou a {agua} de {meta}. Vamos juntos até a meta, no seu ritmo? 💙','Que tal um copinho agora? Falta um pouco para a meta de hoje 🌿','Cada copo conta. Você está em {pct}% da meta, vamos continuar? 💧'],
 treinador:['{pct}% da meta de água. Distribua o restante ao longo do dia, sem exageros.','Hoje: {agua} de {meta}. Deixe a garrafa à vista e feche a meta até a noite.','Meta parcial: {pct}%. Próximo passo: um copo agora.']},
'hid.longo_intervalo':{
 debochado:['Já faz {horas}h desde o último gole registrado. Cadê a hidratação, meu bem? 👀','Faz {horas} horas que a água não aparece por aqui. Ela te fez algo? 😂','Último copo registrado há {horas}h. A garrafinha pediu notícias.'],
 carinhoso:['Faz um tempinho desde o último copo ({horas}h). Que tal uma pausa para um golinho? 💙','Já se passaram {horas}h do seu último registro de água. Um golinho agora? 🌿','Pausa para um copo de água? Já faz {horas}h desde o último registro. 💧'],
 treinador:['{horas}h sem registro de água. Pausa curta: beba um copo e volte ao que estava fazendo.','Último registro de água há {horas}h. Crie um lembrete para manter o ritmo.','Faz {horas}h do último registro de água. Aproveite a próxima pausa para beber.']},
'hid.quase':{
 debochado:['QUASE LÁ! Mais um golinho e a meta de água cai. 💧🏁','Falta só um tiquinho para bater a meta de hoje. Não me abandona agora! 😅','{pct}% da meta! Já dá para sentir o gostinho da vitória (que é água, mas enfim). 🥤'],
 carinhoso:['Que lindo! Você está pertinho da meta de água ({agua} de {meta}). 💙','Quase lá! Só mais um pouquinho, no seu ritmo 🌿','Você está em {pct}% da meta de água. Cuidar de você está dando certo! 💧'],
 treinador:['Reta final: {agua} de {meta}. Feche a meta com mais um copo.','Faltam poucos goles para a meta de água. Termine bem o dia.','{pct}% da meta. Mantenha o ritmo até completar.']},
'hid.meta':{
 debochado:['OLHA A HIDRATAÇÃO! A garrafinha finalmente recebeu atenção! 🏆','Meta de água batida! O Viva está emocionado, quase chorou no copo. 💧','Hidratação em dia! Pode se achar, você merece. 😎'],
 carinhoso:['Meta de água concluída! Obrigado por cuidar de você hoje 💙','Que orgulho: você bateu a meta de hidratação! 🌿','Meta de água batida. Seu corpo agradece o carinho! 💧'],
 treinador:['Meta de hidratação cumprida: {agua}. Consistência é isso.','Meta de água fechada. Repita amanhã o mesmo processo.','Missão água concluída ({agua}). Próximo foco: manter o hábito amanhã.']},
'hid.superou':{
 debochado:['Meta batida e ainda passou dela! Agora pode ir com calma, não precisa virar peixinho. 🐟','Passou da meta de água! Pode relaxar o copo: o corpo já entendeu o recado. 😄'],
 carinhoso:['Você passou da meta de água hoje. Ótimo! Agora é só ouvir seu corpo e ir com calma 💙','Meta de água cumprida com folga. Sem pressa para beber mais, tá? 🌿'],
 treinador:['Meta superada ({agua}). Não precisa beber além disso só por beber: siga com moderação.','Meta de água batida com folga. Daqui em diante, beba apenas conforme a sede.']},
'hid.registro_recente':{
 debochado:["Água registrada! Seu corpo mandou um 'obrigado' por e-mail. 💧",'Mais um copo no placar! Continue assim. 🥤','Glub, glub! Anotado. A garrafinha agradece a atenção. 💦'],
 carinhoso:['Registrado! Cuidar de você é feito de gestos pequenos 💙','Boa! Mais um golinho de cuidado 🌿','Anotei! Obrigado por se cuidar. 💧'],
 treinador:['Registro feito. Próximo passo: manter o ritmo ao longo do dia.','Registrado: {agua} de {meta}.','Água registrada. Continue distribuindo ao longo do dia.']},
/* ======================= ALIMENTAÇÃO ======================= */
'ali.variedade_baixa':{
 debochado:['Seus registros dos últimos dias estão com pouca variedade no cardápio. Que tal inovar um pouquinho? 🍽️','O cardápio anda no modo repetir, hein? Dá para variar uma coisinha hoje. 😉','Uma refeição não define sua saúde, mas vamos tentar variar esse cardápio? 🥗'],
 carinhoso:['Percebi que os últimos registros têm bastante repetição. Que tal experimentar algo novo, se tiver vontade? 💙','Variar um pouquinho pode ser divertido. Quer testar um ingrediente diferente? 🌿'],
 treinador:['Pouca variedade nos últimos registros. Meta prática: incluir um alimento diferente hoje.','Cardápio repetitivo nos registros. Planeje uma troca simples na próxima refeição.']},
'ali.repetido':{
 debochado:['{Item} de novo? 😂 Que tal variar um pouquinho na próxima refeição?','{Item} apareceu várias vezes nos seus registros. Fidelidade é bonita, mas variedade também! 😜'],
 carinhoso:['Vi bastante {item} nos seus registros. Se quiser variar, é só dar uma chance a algo novo 💙','{Item} tem aparecido bastante. Que tal combinar com algo diferente hoje? 🌿'],
 treinador:['{Item} em vários registros recentes. Troque um deles por outra opção.','{Item} se repetiu nos últimos dias. Inclua uma alternativa na próxima refeição.']},
'ali.poucas_fv':{
 debochado:['Frutas e vegetais ficaram de fora dos registros dos últimos dias. Eles estão com saudade! 🥦🍎','Cadê a cor no prato? Nos últimos registros está tudo meio bege. 🥔'],
 carinhoso:['Nos últimos registros, frutas e vegetais apareceram pouco. Quer incluir algo colorido hoje? 🍓💙','Que tal uma frutinha ou um legume por aí? Só se você quiser, sem pressão 🌿'],
 treinador:['Poucas frutas e vegetais nos registros recentes. Adicione uma porção na próxima refeição.','Registros sem frutas ou vegetais nos últimos dias. Meta simples: uma porção hoje.']},
'ali.ultra_frequente':{
 debochado:['Opa, os ultraprocessados estão querendo protagonismo nos seus registros, hein? 😅','Uma refeição não define sua saúde. Vamos pensar no equilíbrio ao longo do tempo? ⚖️'],
 carinhoso:['Os ultraprocessados apareceram bastante nos últimos registros. Sem culpa: que tal equilibrar aos poucos? 💙','Equilíbrio se constrói aos poucos. Quer tentar uma opção mais natural na próxima refeição? 🌿'],
 treinador:['Ultraprocessados frequentes nos registros da semana. Substitua um por uma opção in natura quando puder.','Muitos ultraprocessados nos registros recentes. Escolha uma troca simples para amanhã.']},
'ali.variada':{
 debochado:['Olha esse prato variado! O departamento de nutrição do Viva está aplaudindo. 👏','Registro variado e colorido! Estou impressionado (e com fome). 😋','Variedade no prato hoje! Seu eu do futuro mandou agradecer. 🌈'],
 carinhoso:['Que registros variados hoje! Cuidar da alimentação com carinho faz diferença 💙','Pratos variados e coloridos. Você está se cuidando muito bem! 🌿','Gostei de ver tanta variedade nas suas refeições hoje 🥗'],
 treinador:['Boa variedade nas refeições de hoje. Mantenha esse padrão.','Refeições variadas registradas hoje. Repita a estratégia amanhã.','Ótimo mix de alimentos hoje. Continue assim.']},
'ali.registro_recente':{
 debochado:['Refeição registrada! O diário agradece (e eu também, adoro fofoca de cardápio). 📝','Anotado! Nada de refeição fantasma por aqui. 👻','Registrado! O Viva já está salivando só com a descrição. 😋'],
 carinhoso:['Refeição registrada. Obrigado por acompanhar com carinho 💙','Anotado com carinho! Bom apetite 🌿','Registro salvo. Cuidar da alimentação também é se conhecer 💙'],
 treinador:['Refeição registrada. Mantenha o registro ao longo do dia.','Registro feito. Continue anotando as próximas refeições.','Refeição anotada. Registrar é o primeiro passo para ajustar.']},
'ali.sem_registro':{
 debochado:['Nenhuma refeição registrada hoje. Se você já comeu, é só lançar (sem fofoca, juro). 😉','O diário alimentar está de folga hoje. Se já comeu, é só contar para ele! 📝'],
 carinhoso:['Ainda sem refeições registradas hoje. Se já comeu, registre quando puder, sem pressa 💙','Se já fez alguma refeição, pode registrar com calma. O diário espera 🌿'],
 treinador:['Sem refeições registradas hoje. Registre as que já fez para manter o histórico em dia.','Diário alimentar vazio hoje. Lance as refeições já feitas.']},
/* ======================= MOVIMENTO ======================= */
'mov.poucos_registros':{
 debochado:['Você e o sofá estão ficando íntimos demais, hein? Que tal uma caminhada? 🛋️','Suas pernas não são apenas decorativas. Bora se movimentar um pouquinho? 🚶','Faz {dias} dias sem movimento registrado. O tênis está começando a achar que foi esquecido. 👟'],
 carinhoso:['Faz {dias} dias sem movimento registrado. Que tal uma caminhadinha leve hoje? 💙','Se tiver vontade, um alongamento já conta. Cuidar de você pode ser pequeno 🌿','Que tal um passeio curtinho hoje? Seu corpo gosta de se mexer, no ritmo que for bom para você 💙'],
 treinador:['{dias} dias sem treino registrado. Hoje: 15 minutos de movimento, qualquer tipo.','Sem movimento registrado na semana. Defina um horário fixo e comece pequeno.','Que tal uma caminhada de 10 minutos hoje? Comece pequeno e mantenha.']},
'mov.meta_semana':{
 debochado:['Meta de treinos da semana batida! O sofá está chorando de saudade. 💪','Quem diria? Semana fechada com {treinos} treinos! 🏆',"{treinos} treinos na semana! Seus músculos mandaram um 'valeu'. 🏋️"],
 carinhoso:['Você completou sua meta de treinos da semana. Que orgulho! 💙','Meta semanal cumprida! Obrigado por se cuidar tanto 🌿','Semana de movimento completa! Você merece comemorar 🎉'],
 treinador:['Meta semanal de treinos cumprida ({treinos}). Planeje a próxima semana com a mesma estrutura.','{treinos} treinos nesta semana: meta batida. Garanta o descanso para manter o ritmo.','Meta de treinos fechada. Revise o que funcionou e repita.']},
'mov.hoje':{
 debochado:['Treino registrado! O Viva está orgulhoso dessa parceria. 💪',"Mexeu o corpo hoje! Seus músculos mandaram um 'valeu'. 🏋️",'Movimento registrado! O sofá que se vire sem você hoje. 😎'],
 carinhoso:['Movimento registrado hoje. Obrigado por cuidar de você 💙','Que bom que você se movimentou hoje! 🌿','Seu corpo agradece o carinho em forma de movimento 💙'],
 treinador:['Treino de hoje registrado. Sequência de atitudes, não de perfeição.','Atividade cumprida hoje. Hidrate-se e descanse bem.','Treino registrado. Mantenha a regularidade nos próximos dias.']},
'mov.retorno':{
 debochado:['Olha quem voltou a se mexer! O tênis até acordou. 👟','Voltou à ativa depois de {dias} dias! Que bom ter você de volta, lenda. 🎉','O sofá ficou chocado: você voltou a se mexer depois de {dias} dias! 😂'],
 carinhoso:['Que bom te ver de volta ao movimento! Retomar é lindo 💙','Voltar depois de {dias} dias é uma vitória. Orgulho de você 🌿','Retomar no seu ritmo já é motivo para comemorar 💙'],
 treinador:['Retomada registrada depois de {dias} dias. O importante é manter a regularidade a partir de agora.','Voltou ao treino. Comece leve e aumente aos poucos.','Retorno ao movimento registrado. Próximo passo: definir os próximos dias de treino.']},
'mov.descanso':{
 debochado:['Dia de descanso também faz parte do plano. Recuperar é cuidar de você! 😴','Hoje o sofá está liberado, com moderação e sem culpa. 🛋️','Descansar também é treinar. Aproveite o dia livre! 🍃'],
 carinhoso:['Dia de descanso é parte do cuidado. Aproveite com tranquilidade 💙','Sua meta da semana já foi cumprida. Hoje, descanso sem culpa 🌿'],
 treinador:['Meta da semana cumprida: hoje é dia de recuperação. Descanse sem culpa.','Recuperação também faz parte do plano de treino. Aproveite o descanso de hoje.']},
/* ======================= SONO ======================= */
'sono.abaixo_meta':{
 debochado:['Você quer render como um notebook novo dormindo com 3% de bateria? 🔋','Seu travesseiro está solicitando uma reunião urgente com você. 🛏️','Dormiu {horas} e a meta é {meta}. Seu cérebro abriu um chamado no suporte. 😴'],
 carinhoso:['Você dormiu {horas}, um pouquinho abaixo da sua meta de {meta}. Que tal descansar mais cedo hoje? 💙','Noite mais curta que o planejado. Sem pressão: hoje vale um descanso extra 🌙','Que tal cama cedo hoje? Você dormiu {horas} e merece descansar 🌿'],
 treinador:['Sono de {horas} contra meta de {meta}. Hoje: telas desligadas 30 minutos antes de deitar.','Abaixo da sua meta de sono. Ajuste o horário de dormir esta noite.','Noite de {horas}. Defina um horário-alvo para deitar hoje.']},
'sono.irregular':{
 debochado:['Seus horários de dormir andam mais variados que playlist no aleatório. 🎲','Cada dia numa hora diferente para dormir? O seu relógio está pedindo um horário fixo, hein. ⏰'],
 carinhoso:['Percebi que os horários de dormir variaram bastante. Quem sabe tentar manter um horário parecido? 💙','Horários de dormir bem diferentes nos últimos dias. Que tal ensaiar uma rotina mais constante, sem pressão? 🌙'],
 treinador:['Horário de dormir irregular nos últimos dias (variação de {horas} h). Defina um horário-alvo e mantenha.','Variação de {horas} h no horário de dormir. Escolha um horário fixo para esta semana.']},
'sono.adequado':{
 debochado:['Boa! Dormir bem também é uma forma de cuidar da saúde. 😴✨','Noite de sono em dia! Seu eu de amanhã agradece.','{horas} de sono! O travesseiro e você estão de bem. 🛏️💚'],
 carinhoso:['Você dormiu bem, dentro da sua meta. Que bom! 💙','Descanso em dia! Cuidar do sono é cuidar de você 🌙','Noite tranquila registrada. Que delícia de cuidado 💙'],
 treinador:['Meta de sono cumprida ({horas}). Mantenha o horário.','Sono dentro da meta. Repita a rotina de hoje.','{horas} de sono registradas. Boa consistência.']},
'sono.consistente':{
 debochado:['{dias} noites de sono em boa forma na semana! Rotina de descanso de respeito. 🏅','{dias} noites dentro da meta! Seu travesseiro está te dando um troféu. 🏆'],
 carinhoso:['Sua rotina de descanso está bem consistente esta semana. Que cuidado lindo 💙','{dias} noites dentro da meta nesta semana. Você está cuidando bem do seu descanso 🌙'],
 treinador:['{dias} de 7 noites dentro da meta. Boa consistência, continue.','Rotina de sono consistente nesta semana ({dias} noites na meta). Mantenha.']},
'sono.sem_registro':{
 debochado:['Como foi a noite? Registre seu sono para eu acompanhar com você. 🌙','Bom dia! Se quiser, conta aí como foi a noite de sono. 😴'],
 carinhoso:['Bom dia! Se quiser, registre como foi a sua noite de sono 💙','Como você dormiu? Pode registrar quando tiver um tempinho 🌿'],
 treinador:['Sono de ontem ainda sem registro. Lance o horário em que dormiu e acordou.','Registre a noite de sono para acompanhar a média da semana.']},
'sono.registro_recente':{
 debochado:['Sono registrado! Agora o Viva sabe quem anda cuidando do descanso. 🌙','Anotei sua noite! Bom saber que você cuida do descanso. 😴'],
 carinhoso:['Registro de sono salvo. Obrigado por cuidar de você 💙','Noite registrada com carinho 🌙'],
 treinador:['Registro de sono feito. Acompanhe a média da semana.','Sono registrado. Continue anotando para ver a evolução.']},
/* ======================= CONSISTÊNCIA E ROTINA ======================= */
'con.meta_dia':{
 debochado:['Hábitos do dia 100% concluídos! OLHA SÓ: cuidando da saúde e fingindo que não está arrasando! 🏆','Todos os hábitos de hoje feitos. Hoje você jogou no nível difícil! 🎮','Missão do dia cumprida! O Viva está tirando foto para colocar na geladeira. 📸'],
 carinhoso:['Você concluiu todos os hábitos de hoje. Que orgulho de você! 💙','Dia completo de cuidados. Parabéns pela dedicação 🌿','Tudo feito hoje! Aproveite esse sentimento bom 💙'],
 treinador:['Hábitos do dia concluídos. Revise amanhã o que funcionou e repita.','100% dos hábitos de hoje. Consistência é o que traz resultado.','Dia fechado com todos os hábitos. Mantenha o padrão amanhã.']},
'con.pequena':{
 debochado:['Primeiro hábito do dia no bolso! Pequenos passos também contam. 👣','{feitos} de {agendados} hábitos feitos. Já saiu da linha de largada! 🏁'],
 carinhoso:['Um passinho já foi hoje. Cada pequeno passo importa 🌿','{feitos} de {agendados} hábitos feitos. Você está indo no seu ritmo 💙'],
 treinador:['{feitos} de {agendados} hábitos feitos. Priorize o próximo agora.','Hábitos em andamento ({feitos}/{agendados}). Escolha o próximo e execute.']},
'con.retorno':{
 debochado:['Sumiu, hein? 😂 Vamos retomar no seu ritmo?','Olha quem apareceu! Senti sua falta, mas sem cobrança. 🎉','Depois de {dias} dias, o Viva já estava falando sozinho. Que bom que você voltou! 😄'],
 carinhoso:['Que bom te ver de novo! Retomar no seu ritmo já é uma vitória 💙','Voltar depois de uma pausa também é cuidar de você 🌿','Que bom ter você de volta! Uma pausa não apaga o que você já construiu 💙'],
 treinador:['Retomada registrada depois de {dias} dias. Comece pequeno e mantenha.','De volta aos registros. Foque em um hábito hoje.','Retorno ao plano. Uma ação simples hoje já recupera o ritmo.']},
'con.sequencia':{
 debochado:['{dias} dias seguidos de hábitos. Consistência, meu amor! É assim que se constrói uma rotina de verdade. 🔥','{dias} dias de hábitos em fila! Se um dia escapar, está tudo bem: o progresso continua com você. 😉'],
 carinhoso:['{dias} dias com hábitos registrados. Se um dia fugir do plano, tudo bem: o progresso continua com você 💙','Que sequência bonita: {dias} dias! E se um dia for diferente, seguimos juntos 🌿'],
 treinador:['{dias} dias de hábitos registrados. Foque em manter o padrão, sem perfeccionismo.','{dias} dias seguidos. Se interromper, retome no dia seguinte.']},
'con.progresso':{
 debochado:['Seus hábitos subiram {pts} pontos em relação à semana passada. Evolução! 📈','+{pts} pontos nos hábitos desta semana! Alguém aqui está evoluindo. 😎'],
 carinhoso:['Você está evoluindo: {pts} pontos a mais nos hábitos desta semana 💙','Progresso gradual é progresso de verdade: +{pts} pontos nos hábitos 🌿'],
 treinador:['Hábitos +{pts} pontos sobre a semana anterior. Mantenha a direção.','Evolução semanal de {pts} pontos nos hábitos. Continue.']},
'con.poucos_dia':{
 debochado:['Dia corrido? Dá para registrar um hábito rapidinho, nem precisa ser perfeito. 😉','O dia quase acabando e o Viva sem notícias. Um registrinho rápido? 📝'],
 carinhoso:['Hoje ainda sem registros. Se o dia foi puxado, tudo bem: um passo pequeno já conta 💙','Se o dia foi corrido, tudo bem. Se der, registre um hábito, sem pressão 🌿'],
 treinador:['Sem registros hoje. Escolha um hábito simples e registre antes de dormir.','Dia sem registros. Lance ao menos um hábito para manter o histórico.']},
'con.dia_dificil':{
 debochado:['Dia pesado? Sem cobrança hoje, o Viva fica de boa. Cuide de você do jeito que der. 💙','Hoje o plano é simples: ir devagar. Pequenos cuidados já valem. 🌿','Se hoje está difícil, tudo bem. O Viva não cobra nada, só torce por você. 💙'],
 carinhoso:['Dia pesado? Sem cobrança hoje. Cuide de você do jeito que der 💙','Hoje o plano é simples: ir devagar. Pequenos cuidados já valem 🌿','Se hoje está difícil, tudo bem. Estou aqui e só torço por você 💙'],
 treinador:['Dia difícil não pede perfeição. Escolha só uma coisa pequena para cuidar de você hoje.','Hoje o objetivo é mínimo: um copo de água e um momento de pausa.','Sem metas pesadas hoje. Um passo pequeno já é suficiente.']},
'con.neutro':{
 debochado:['Como estão seus hábitos hoje? Registre suas atividades para eu acompanhar com você. 📝','Ainda não tenho muito para comentar. Registre água, refeições e movimento e eu apareço com opinião! 😏'],
 carinhoso:['Como estão seus hábitos hoje? Registre suas atividades para eu acompanhar com você 💙','Estou aqui para acompanhar sua rotina. Registre o que quiser, no seu tempo 🌿'],
 treinador:['Sem dados suficientes ainda. Registre água, refeições e movimento para eu te dar um retorno útil.','Comece registrando um hábito hoje. Com mais dados, o acompanhamento fica mais preciso.']}
}};
});
