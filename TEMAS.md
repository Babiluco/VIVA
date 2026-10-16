# Tema claro e escuro: tokens e contraste

> Gerado automaticamente por `npm run docs` a partir do `index.html`. Não edite à mão.

## Como funciona

- O tema é definido por `<html data-theme="light|dark">` e a escolha da pessoa por `data-theme-pref` (`light`, `dark` ou `auto`).
- Um script curto no `<head>`, executado antes da primeira pintura, lê `localStorage['viva-theme']` e a preferência do sistema. Por isso não há flash do tema errado.
- `auto` acompanha o sistema operacional ao vivo. Uma escolha manual (Claro/Escuro) nunca é sobrescrita pelo sistema.
- Todas as cores dos componentes usam `var(--token)`. Valores hexadecimais existem **somente** nos dois blocos de tokens no início do CSS.

## Tokens

### Superfícies e texto

| Token | Claro | Escuro |
|---|---|---|
| `--background` | `#F6F7F2` | `#141A16` |
| `--foreground` | `#243329` | `#F0F4EE` |
| `--card` | `#FFFFFF` | `#202B23` |
| `--card-foreground` | `#243329` | `#F0F4EE` |
| `--surface-secondary` | `#EDF1E9` | `#29372C` |
| `--muted` | `#EDF1E9` | `#29372C` |
| `--muted-foreground` | `#58675D` | `#B7C4B8` |

### Marca

| Token | Claro | Escuro |
|---|---|---|
| `--primary` | `#426B52` | `#A9D0AF` |
| `--primary-foreground` | `#FFFFFF` | `#141A16` |
| `--secondary` | `#DCEBDD` | `#304A37` |
| `--secondary-foreground` | `#243329` | `#F0F4EE` |
| `--accent` | `#A75F43` | `#E5AC8F` |

### Bordas, campos e foco

| Token | Claro | Escuro |
|---|---|---|
| `--border` | `#DDE4DA` | `#38463B` |
| `--input` | `#FFFFFF` | `#202B23` |
| `--input-border` | `#7C8D81` | `#7E967F` |
| `--ring` | `#426B52` | `#A9D0AF` |

### Feedback

| Token | Claro | Escuro |
|---|---|---|
| `--success` | `#2F6B45` | `#91C49C` |
| `--warning` | `#8A5A00` | `#E6C27A` |
| `--warning-foreground` | `#FFFFFF` | `#141A16` |
| `--destructive` | `#A8412F` | `#F0907A` |
| `--destructive-foreground` | `#FFFFFF` | `#141A16` |

### Progresso e gráficos

| Token | Claro | Escuro |
|---|---|---|
| `--progress-track` | `#DCEBDD` | `#304A37` |
| `--progress-indicator` | `#4F8061` | `#91C49C` |
| `--chart-1` | `#4F8061` | `#91C49C` |
| `--chart-2` | `#A75F43` | `#E5AC8F` |
| `--chart-3` | `#4A6FA5` | `#8FB4E3` |
| `--chart-4` | `#8A6D1F` | `#D9BC6A` |
| `--chart-goal` | `#426B52` | `#A9D0AF` |
| `--chart-grid` | `#DDE4DA` | `#38463B` |
| `--chart-axis` | `#58675D` | `#B7C4B8` |

### Navegação e seleção

| Token | Claro | Escuro |
|---|---|---|
| `--sidebar-background` | `#FFFFFF` | `#19221C` |
| `--sidebar-foreground` | `#58675D` | `#B7C4B8` |
| `--selected` | `#426B52` | `#A9D0AF` |
| `--selected-foreground` | `#FFFFFF` | `#141A16` |

### Elevação

| Token | Claro | Escuro |
|---|---|---|
| `--shadow` | `0 4px 20px rgba(36,51,41,.08)` | `0 4px 20px rgba(0,0,0,.28)` |
| `--overlay` | `rgba(20,26,22,.5)` | `rgba(0,0,0,.6)` |

## Contraste (WCAG 2.2 AA)

Mínimo: **4,5:1** para texto normal e **3:1** para componentes e indicadores. Valores calculados sobre os tokens acima.

| Combinação | Mínimo | Claro | Escuro |
|---|---|---|---|
| texto principal / fundo | 4.5 | 12.34 ✅ | 15.88 ✅ |
| texto principal / card | 4.5 | 13.29 ✅ | 13.19 ✅ |
| texto principal / superfície secundária | 4.5 | 11.62 ✅ | 11.26 ✅ |
| texto principal / verde suave | 4.5 | 10.74 ✅ | 8.74 ✅ |
| texto secundário / fundo | 4.5 | 5.55 ✅ | 9.76 ✅ |
| texto secundário / card | 4.5 | 5.98 ✅ | 8.11 ✅ |
| texto secundário / superfície secundária | 4.5 | 5.23 ✅ | 6.92 ✅ |
| texto secundário / verde suave | 4.5 | 4.83 ✅ | 5.37 ✅ |
| verde principal (texto) / fundo | 4.5 | 5.64 ✅ | 10.37 ✅ |
| verde principal (texto) / card | 4.5 | 6.08 ✅ | 8.61 ✅ |
| verde principal (texto) / superfície secundária | 4.5 | 5.31 ✅ | 7.35 ✅ |
| verde principal (texto) / verde suave | 4.5 | 4.91 ✅ | 5.71 ✅ |
| texto do botão / botão principal | 4.5 | 6.08 ✅ | 10.37 ✅ |
| texto / elemento selecionado | 4.5 | 6.08 ✅ | 10.37 ✅ |
| texto do calendário / dia de treino | 4.5 | 4.57 ✅ | 8.90 ✅ |
| texto da navegação / sidebar | 4.5 | 5.98 ✅ | 9.02 ✅ |
| verde principal / sidebar | 4.5 | 6.08 ✅ | 9.58 ✅ |
| texto principal / sidebar | 4.5 | 13.29 ✅ | 14.67 ✅ |
| sucesso (texto) / card | 4.5 | 6.34 ✅ | 7.39 ✅ |
| sucesso (texto) / fundo | 4.5 | 5.89 ✅ | 8.90 ✅ |
| alerta (texto) / card | 4.5 | 5.93 ✅ | 8.64 ✅ |
| texto do aviso / fundo do aviso de alerta | 4.5 | 5.93 ✅ | 10.40 ✅ |
| erro (texto) / card | 4.5 | 6.07 ✅ | 6.27 ✅ |
| erro (texto) / fundo | 4.5 | 5.63 ✅ | 7.55 ✅ |
| erro (texto) / superfície secundária | 4.5 | 5.30 ✅ | 5.35 ✅ |
| texto do aviso / fundo do aviso de erro | 4.5 | 6.07 ✅ | 7.55 ✅ |
| destaque complementar (texto) / card | 4.5 | 4.82 ✅ | 7.43 ✅ |
| indicador de progresso / trilho | 3 | 3.70 ✅ | 4.90 ✅ |
| indicador de progresso / card | 3 | 4.57 ✅ | 7.39 ✅ |
| indicador de progresso / fundo | 3 | 4.25 ✅ | 8.90 ✅ |
| gráfico 1 / card | 3 | 4.57 ✅ | 7.39 ✅ |
| gráfico 2 / card | 3 | 4.82 ✅ | 7.43 ✅ |
| gráfico 3 / card | 3 | 5.11 ✅ | 6.85 ✅ |
| gráfico 4 / card | 3 | 4.90 ✅ | 7.93 ✅ |
| gráfico 1 / fundo | 3 | 4.25 ✅ | 8.90 ✅ |
| gráfico 2 / fundo | 3 | 4.47 ✅ | 8.94 ✅ |
| gráfico 3 / fundo | 3 | 4.75 ✅ | 8.25 ✅ |
| gráfico 4 / fundo | 3 | 4.55 ✅ | 9.55 ✅ |
| linha da meta / card | 3 | 6.08 ✅ | 8.61 ✅ |
| texto dos eixos / card | 4.5 | 5.98 ✅ | 8.11 ✅ |
| borda de campo / campo | 3 | 3.51 ✅ | 4.58 ✅ |
| borda de campo / card | 3 | 3.51 ✅ | 4.58 ✅ |
| borda de campo / fundo | 3 | 3.26 ✅ | 5.51 ✅ |
| borda de campo / superfície secundária | 3 | 3.07 ✅ | 3.91 ✅ |
| foco (ring) / card | 3 | 6.08 ✅ | 8.61 ✅ |
| foco (ring) / fundo | 3 | 5.64 ✅ | 10.37 ✅ |
| foco (ring) / sidebar | 3 | 6.08 ✅ | 9.58 ✅ |
| foco (ring) / superfície secundária | 3 | 5.31 ✅ | 7.35 ✅ |
| foco (ring) / verde suave | 3 | 4.91 ✅ | 5.71 ✅ |
| estado selecionado / card | 3 | 6.08 ✅ | 8.61 ✅ |
| estado selecionado / fundo | 3 | 5.64 ✅ | 10.37 ✅ |

A cor da borda dos cards (`--border`) é decorativa. As bordas de **campos e botões de opção** usam `--input-border`, mais escura, para atingir 3:1.

## A cor nunca é o único sinal

- Opção selecionada: preenchimento **e** marca ✓.
- Item de menu ativo: fundo, **negrito** e barra lateral.
- Dia de treino no calendário: círculo preenchido com número em negrito.
- Linhas do gráfico de check-in: cores **e** traçados diferentes (contínuo, tracejado, pontilhado).
- Barra de destaque: cor mais forte **e** rótulo em negrito. Todo gráfico tem descrição em texto (`aria-label`).
- Erro em campo: borda **e** mensagem; o campo recebe foco.

## Regras de uso das cores

- Verde = ações positivas e progresso. Tons neutros = informação do dia a dia.
- Vermelho (`--destructive`) só aparece em erros de formulário e avisos de erro. **Nunca** para peso aumentado ou metas não concluídas.
- Gráficos usam uma cor (`--chart-1`); as demais (`--chart-2..4`) só aparecem no gráfico de check-in, que tem 4 séries.
