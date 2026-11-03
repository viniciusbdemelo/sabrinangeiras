# Manutenção do site

Site estático em HTML, CSS e JavaScript, sem dependências de aplicação.
Edite os arquivos de origem; `dist/` é gerado pelo build.

## Onde editar

| Arquivo | Responsabilidade |
| --- | --- |
| `index.html` | Conteúdo da página inicial, em sete seções comentadas |
| `mentoria.html` | Página de mentoria, atualmente com o conteúdo principal vazio |
| `clube-do-botox.html` | Página do clube, atualmente com o conteúdo principal vazio |
| `css/style.css` | Tokens visuais, layout, componentes e regras responsivas |
| `js/main.js` | Cabeçalho, menu, vídeo, carrosséis e animações de entrada |
| `img/`, `fonts/`, `icones/` | Imagens, fontes locais e ícones SVG |
| `build.sh` | Copia os arquivos publicados para `dist/` |
| `wrangler.jsonc` | Configuração de hospedagem dos arquivos de `dist/` |

## Estilos e responsividade

O início do CSS contém um mapa da cascata. Os valores compartilhados ficam
em `:root`; as regras responsivas ficam junto de cada componente.

- `--content-max`: largura máxima do conteúdo.
- `--gutter`: margens laterais usadas por `.container` e pelos carrosséis.
- `--section-gap`: distância entre seções.
- `--space-*`: escala de espaçamento.
- `--text-*` e `--leading-*`: tamanhos e entrelinhas.
- `--hero-*`: escala e medidas da primeira seção.
- `.closing__card`: espaçamento interno da última seção; no mobile, o recuo lateral é zero.

As media queries usam a tela; as container queries do hero e do encerramento
usam a largura do contêiner. Preserve essa distinção e a ordem das regras.
As declarações repetidas com `vh`/`dvh` e prefixos `-webkit-` são fallbacks.

## Interações

As funções `initHeader`, `initNavigation`, `initVideos`, `initCarousels` e
`initReveals` são chamadas uma vez pelo script carregado com `defer`.
Cada função mantém seu estado local. `reduceMotion` compartilha a preferência
de movimento reduzido. Não execute os inicializadores novamente, para evitar
ouvintes e observadores duplicados.

Os seletores de classes conectam o HTML, o CSS e o JavaScript. Ao renomear
uma classe, confira os três arquivos. Os procedimentos usam `<details>` nativo.

## Conteúdo compartilhado

Cabeçalho, símbolo SVG, navegação e rodapé estão presentes nas três páginas.
Ao atualizar contatos ou elementos compartilhados, aplique a alteração nas
três. Essa estrutura mantém o conteúdo disponível sem JavaScript.

Os vídeos usam URLs externas do Cloudflare R2. Preserve a ordem das fontes:
HEVC primeiro, H.264 como alternativa. O sexto caso está oculto com `hidden`;
a instrução para ativá-lo fica junto do item no HTML.

## Verificação e build

```sh
node --check js/main.js
sh -n build.sh
sh build.sh
```

O build usa `rsync --delete` em `dist/`, que deve conter apenas arquivos
gerados. Vídeos locais são excluídos porque as fontes publicadas usam R2.
Não edite `dist/` diretamente.

Antes de publicar, confira as três páginas em desktop e celular: menu e
Escape, vídeo e pausa, carrosséis com toque e mouse, procedimentos abertos,
links de contato e preferência de movimento reduzido.
