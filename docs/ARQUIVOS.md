# Bora Bar — documentação dos arquivos

Uma entrada por arquivo do projeto, agrupada por pasta. `node_modules/` e `dist/`
são gerados e não entram aqui. Ao criar ou mudar um arquivo, atualize a entrada dele.

Mapa rápido de como os dados fluem:

```
Supabase (tabelas + RLS)
   │
   ├── services/barsService.js ──► App.jsx (lista, filtros, distância) ──► BarList / BarCard / BarDetails
   ├── services/businessService.js ──► BusinessDashboard.jsx (painel do dono)
   ├── services/reviewsService.js ──► Reviews.jsx
   ├── services/profilesService.js + authService.js ──► AuthPage / ProfilePage / AuthContext
   └── services/analyticsService.js ◄── BarDetails (registra cliques) ──► BusinessDashboard (mostra métricas)

/api/geocode-profile (função Netlify) ◄── addressService.geocodeAddress ◄── AuthPage / ProfilePage / painel
```

---

## Raiz

| Arquivo | O que é |
| --- | --- |
| `CLAUDE.md` | Instruções para o Claude trabalhar no projeto: stack, comandos, regras, problemas conhecidos. |
| `package.json` | Nome `bora-bar`, versão 0.1.0, módulos ES. Scripts `dev`, `build`, `preview`, `serve:dist`. Dependências: React 19, Vite 7, `@supabase/supabase-js`, `lucide-react`, `qrcode` (e `ogl`, hoje sem uso). |
| `package-lock.json` | Versões travadas das dependências (gerado pelo npm). |
| `index.html` | HTML base em pt-BR com `<div id="root">` e meta description. Carrega `src/main.jsx`. Não tem tags Open Graph (prévia de link). |
| `vite.config.js` | Config do Vite com plugin React e `base: "/"` (caminhos absolutos — necessário para a página `/r/<id>` achar os arquivos). |
| `netlify.toml` | **Deploy ativo (https://bora-bar.netlify.app).** Build `npm run build`, saída `dist`, funções em `netlify/functions`; redireciona `/api/geocode-profile` para a função e todo o resto para `index.html`. |
| `vercel.json` | Config da publicação antiga na Vercel (parada). Mantido só por histórico. |
| `.env.example` | Modelo das duas variáveis: `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. |
| `.gitignore` | Ignora `node_modules`, `dist`, `.env*`, `.vercel`, `.netlify`, logs. |

## `api/` e `netlify/functions/` — função serverless

| Arquivo | O que é |
| --- | --- |
| `netlify/edge-functions/link-preview.js` | **Prévia do link** de `/r/<id>` no WhatsApp/Instagram/Facebook: antes de entregar o `index.html`, busca o estabelecimento no Supabase (REST, chave pública das variáveis `VITE_SUPABASE_*` da Netlify) e coloca título, descrição e foto nas tags Open Graph. Se falhar, entrega o HTML sem mudança. Não atua em `/r/<id>/qr`. |
| `netlify/functions/geocode-profile.mjs` | Adaptador da Netlify: converte o `Request` da Web para o formato request/response que `api/geocode-profile.js` espera e devolve um `Response`. Exposto em `/api/geocode-profile` pelo redirect do `netlify.toml`. |
| `api/geocode-profile.js` | Lógica da `POST /api/geocode-profile` (escrita no formato da Vercel; na Netlify roda pelo adaptador acima). Recebe um endereço (CEP, rua, número, bairro, cidade, UF), monta várias buscas e consulta o **Nominatim** (OpenStreetMap) para achar latitude/longitude. Confere se o resultado é mesmo da cidade/UF informada, respeita limite de 1 requisição/segundo e guarda cache em memória por 30 dias. Se vier o token do usuário (`Authorization: Bearer`) e `saveProfile` não for `false`, grava a localização no perfil dele no Supabase. Usa `process.env.VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. |

## `scripts/`

| Arquivo | O que é |
| --- | --- |
| `scripts/serve-dist.mjs` | Servidor HTTP mínimo em Node que serve a pasta `dist/` na porta 5174 (ou `PORT`), com proteção contra acesso fora da pasta e fallback para `index.html`. Usado por `npm run serve:dist`. |

## `supabase/` — banco de dados

Detalhes de tabelas e regras em `docs/BANCO-DE-DADOS.md`.

| Arquivo | O que é |
| --- | --- |
| `supabase/README.md` | Passo a passo em português: criar o projeto, rodar o schema e o seed, configurar chaves, Auth (URLs de redirecionamento), aprovar donos e ativar CEP e métricas. |
| `supabase/schema.sql` | **Fonte de verdade do banco.** Cria todas as tabelas, liga RLS, cria policies, permissões por coluna, bucket de fotos, triggers e funções (`is_bar_manager`, `get_bar_metrics`, `replace_bar_menu`, `replace_bar_promotions`, `replace_bar_events`) e índices. Idempotente: pode ser rodado de novo sem apagar dados. |
| `supabase/seed-mock-bars.sql` | Insere os 6 bares fictícios de Volta Redonda (mesmos de `mockBars.js`). Rodar depois do schema. |
| `supabase/business-address-migration.sql` | Migração para bancos antigos: adiciona CEP, rua, número, complemento, estado e UF na tabela `bars` e libera a edição dessas colunas para os donos. |
| `supabase/engagement-metrics-migration.sql` | Migração para bancos antigos: cria `bar_engagement_events`, policies e a função `get_bar_metrics`. |
| `supabase/whatsapp-orders-migration.sql` | Coluna `bars.takes_whatsapp_orders` (aceita pedidos pelo WhatsApp) e permissão para o dono. Já aplicada em 19/10/2026. |
| `supabase/daily-views-migration.sql` | Função `get_bar_daily_views(bar, dias)`: visitas da página por dia (horário de Brasília, com dias zerados) para o gráfico do painel. Aplicado em 30/10/2026. |
| `supabase/stories-migration.sql` | Stories, etapa 1 (aplicado em 30/10/2026): coluna `image_url` em `promotions` e `bar_events`, métricas `story_view`/`story_open` e `replace_bar_promotions`/`replace_bar_events` gravando a foto. |
| `supabase/stories-cleanup-migration.sql` | Fotos de story expiram em 8 horas: funções `list_expired_story_images` e `clear_story_image_urls` (só `service_role`) e agendamento de hora em hora no pg_cron chamando `limpar-stories`. Aplicado em 30/10/2026. |
| `supabase/functions/limpar-stories/index.ts` | Edge Function chamada pelo pg_cron: apaga pelo Storage as fotos de story com mais de 8 horas e limpa os links. Publicada em 30/10/2026 (`verify_jwt` desligado: não recebe dados e só apaga o que já venceu). |
| `supabase/vibes-migration.sql` | Coluna `bars.vibes` (clima do lugar) e permissão de edição para o dono. Já aplicada em 15/10/2026. |
| `supabase/listing-visibility-migration.sql` | Migração da coluna `bars.is_listed` (aparece no guia ou só página avulsa). Já aplicada em 15/10/2026. |
| `supabase/bar-images-storage.sql` | Migração para bancos antigos: cria o bucket público `bar-images` (até 8 MB, JPG/PNG/WebP) e as policies para cada dono enviar fotos só na pasta do próprio bar. |

## `public/` — arquivos servidos como estão

| Arquivo | O que é |
| --- | --- |
| `public/estabelecimentos/<id>/*.jpg` | Fotos dos estabelecimentos (capa e galeria), servidas em `/estabelecimentos/<id>/...`. Hoje: `cantinho-portugues/capa-bacalhau.jpg` (capa, até 1200 px). |

## `src/` — entrada

| Arquivo | O que é |
| --- | --- |
| `src/main.jsx` | Ponto de entrada. Escolhe a tela pelo endereço: **`/r/<id>/qr`** → `QrCodePage`; **`/r/<id>`** → `StandalonePage` (página avulsa); qualquer outro → o app normal. Renderiza o `App` dentro do `AuthProvider`. O fundo é preto liso (sem efeito de luz). Importa `styles/index.css`. |
| `src/App.jsx` | Componente raiz (≈780 linhas). Faz o **roteamento por hash** (`getRoute`), carrega os bares, calcula a distância de cada um até o usuário (GPS ou endereço do perfil verificado), limita a descoberta a **20 km**, monta as sugestões de busca (bar, bairro, cidade), aplica filtros (aberto, promoção, mais barato, mais próximo, favoritos), guarda favoritos no `localStorage` e decide qual tela mostrar. Tem um relógio interno (`now`, atualizado a cada minuto) que recalcula o aberto/fechado de cada bar com `getOpenStatus` e adiciona `openStatusDetail` ao bar. A lista termina nos bares: o antigo card "Seu estabelecimento no Bora Bar" foi removido em 27/10/2026 (a entrada para donos fica na landing e no Perfil, que leva a `#for-business`). Rota `#clima/<id>` filtra a lista pelo clima (`barMatchesVibe`) e mostra a faixa "Mostrando lugares com clima de…" com "Ver todos". Na lista mostra três estados: carregando, erro com botão "Tentar de novo" (`barsLoadError` / `retryLoadBars`) e "Nenhum bar por aqui ainda". |
| `src/styles/index.css` | Lista, na ordem, os arquivos de CSS da pasta `src/styles/` (a ordem importa: um arquivo pode sobrescrever o anterior). Veja a seção `src/styles/` abaixo. |

## `src/context/`

| Arquivo | O que é |
| --- | --- |
| `src/context/AuthContext.jsx` | `AuthProvider` e hook `useAuth()`. Busca a sessão do Supabase ao abrir e escuta mudanças de login. Expõe `user`, `session` e `isAuthReady`. |

## `src/hooks/`

| Arquivo | O que é |
| --- | --- |
| `src/hooks/useGeolocation.js` | Pede a localização ao navegador (alta precisão, timeout 20 s). Rejeita leituras com precisão pior que 1 km, guarda a última posição no `localStorage` por 30 min. Retorna `coordinates`, `status` (`idle`, `loading`, `granted`, `cached`, `denied`, `unavailable`), `hasLocation`, `errorMessage` e `requestLocation()`. |
| `src/hooks/useFlip.js` | Faz os itens da lista deslizarem para o novo lugar quando o filtro ou a busca muda (técnica FLIP). Usado em `BarList`; cada card tem `data-flip-id`. |

## `src/services/` — acesso a dados

| Arquivo | O que é |
| --- | --- |
| `src/services/supabaseClient.js` | Cria o cliente Supabase a partir das variáveis `VITE_*`. Exporta `supabase` (ou `null`) e `isSupabaseConfigured`. |
| `src/services/barsService.js` | `fetchBars()` (só estabelecimentos com `is_listed = true`) e `fetchBarById(id)` (um estabelecimento, listado ou não — para a página avulsa). `fetchBars()`: busca bares com categorias, itens, promoções e eventos numa consulta só; filtra promoções vigentes e eventos futuros; converte para o formato do front. Tem limite de 15 s. **Se o banco falhar, lança erro** (nunca devolve bares de exemplo em produção); banco sem bares ativos devolve lista vazia. `mockBars` só é usado rodando localmente (`npm run dev`) sem as variáveis do Supabase. |
| `src/services/businessService.js` | Tudo do painel do dono: `fetchBusinessAccess` (vínculos e pedidos de acesso do usuário), `createBarClaim` (pedir acesso a um bar), `fetchManagedBarData`, `updateManagedBar` (perfil e endereço), `replaceManagedMenu`, `replaceManagedPromotions`, `replaceManagedEvents` (via funções RPC). Converte endereço antigo em texto para campos estruturados. |
| `src/services/businessImageService.js` | `uploadBusinessCoverImage(barId, file, folder)`: valida tipo (JPG/PNG/WebP) e tamanho (8 MB) e envia para o bucket `bar-images` em `<bar>/` (capa) ou `<bar>/stories/`. `uploadBusinessStoryImage(barId, file)`: reduz a foto no celular (WebP, até 1080×1920) e envia para `stories/`, que expira em 8 horas. Devolve o link público. |
| `src/services/analyticsService.js` | Métricas anônimas. `recordBarEvent` grava `view`, `whatsapp`, `phone`, `route_google`, `route_waze`, `favorite`, `story_view` ou `story_open` com um id de sessão aleatório; `recordBarViewOnce` conta uma visualização por bar por sessão; `fetchBarMetrics`, `fetchBarDailyViews` (visitas por dia) chama `get_bar_metrics` (últimos 30 dias). |
| `src/services/authService.js` | Cadastro, login, logout, sessão, escuta de mudanças, recuperação e troca de senha, atualização de metadados do usuário — tudo pelo Supabase Auth. |
| `src/services/profilesService.js` | `fetchProfile` e `saveProfile` (upsert) na tabela `profiles`. |
| `src/services/reviewsService.js` | Avaliações: listar, criar e apagar. Com Supabase usa a tabela `reviews`; sem Supabase usa o `localStorage`. O nome do autor é preenchido pelo banco (trigger). |
| `src/services/addressService.js` | Endereço: formatar CEP, normalizar campos, buscar endereço no **ViaCEP**, listar estados e cidades no **IBGE**, montar endereço completo e chamar `/api/geocode-profile` para obter coordenadas. |

## `src/utils/`

| Arquivo | O que é |
| --- | --- |
| `src/utils/format.js` | `formatCurrency` (R$), `getStartingPrice` (menor preço do cardápio), `normalizeText` (minúsculas sem acento, para busca), `formatEventWhen` (data curta de evento: "Hoje · 21h", "Sáb · 19h"). |
| `src/utils/openingHours.js` | **Aberto/fechado automático** (com `isClosingSoon` nos últimos `CLOSING_SOON_MINUTES` = 30 min). `getOpenStatus(textoDoHorario, abertoManual, agora)` lê o horário em texto ("Seg a qui: 17h-00h \| Sex e sab: 17h-02h", "Ter a dom: 15h-01h", "Seg, Qua e Sex: 18h30-02h", "Todos os dias: 16h-01h", vários horários no mesmo dia com "e"), sempre no fuso de Brasília, entende fechamento depois da meia-noite e devolve `{ isOpen, isAutomatic, detail }` — `detail` é "Fecha às 02h", "Abre hoje às 18h", "Abre amanhã às 15h" ou "Abre seg às 11h". Se o texto não puder ser lido, usa o valor manual (`is_open`). Também exporta `parseOpeningHours`, `parseOpeningDays` e `formatClock`. |
| `src/utils/vibes.js` | **Clima do lugar**: lista `VIBES` (Barzinho, Comer bem, Drinks, Música ao vivo, Festa, Date, Assistir jogo, Rooftop) e `barMatchesVibe(bar, id)` — vale o que o dono marcou em `bars.vibes`; "música ao vivo" e "assistir jogo" também são reconhecidos pelos próximos eventos (samba, show, jogo, telão...). |
| `src/utils/geo.js` | `calculateDistanceKm` (fórmula de Haversine), `formatDistanceKm` ("850 m" / "1,9 km"), `isValidCoordinate`. |
| `src/utils/viewTransition.js` | `transitionRoute`: a foto do card cresce até virar a capa da página do bar (e volta), com a View Transitions API do navegador. Sem suporte, ou com "reduzir movimento", a troca é direta. Usado em `App.jsx`. |

## `src/data/`

| Arquivo | O que é |
| --- | --- |
| `src/data/mockBars.js` | 6 bares fictícios de Volta Redonda (Esquina 77, Boteco do Porto, Varanda Aurora, Marola Bar, Quintal Boa Prosa, Samba da Rua) com cardápio, promoção e horário. Usados só rodando localmente sem Supabase e como ilustração na landing. Telefones com DDD 11 (incorreto para a cidade). |
| `src/data/barCoordinates.js` | Endereços e coordenadas dos mesmos 6 bares. **Não é importado por nenhum arquivo** (código morto). |

## `src/assets/`

| Arquivo | O que é |
| --- | --- |
| `src/assets/bora-bar-icon.png` | Ícone da marca (pin coral com taça de martini), PNG com fundo transparente. Usado no cabeçalho do app, no login e no rodapé da landing, sem moldura. |
| `src/assets/bora-bar-logo-full.png` | Logo completo (pin + "BORA" + "BAR"), PNG transparente. Usado na landing. Ambos foram feitos a partir da arte original do dono (fundo preto removido). |
| `src/assets/bora-bar-bg-test.png` | Antigo fundo da landing no desktop (1,2 MB). Sem uso desde a landing nova (30/10/2026); pode ser apagado. |
| `src/assets/bora-bar-bg-mobile.png` | Antigo fundo da landing no celular (1,4 MB). Sem uso desde a landing nova (30/10/2026); pode ser apagado. |

## `src/pages/` — telas inteiras (cada uma é uma página do app)

| Arquivo | O que é |
| --- | --- |
| `LandingPage.jsx` | Página de entrada (sem hash), no visual da **Versão 3 "Bolso"** (30/10/2026): topo centralizado "Seu rolê começa…" com o final trocando sozinho, celular de demonstração que alterna lista → bar → story, etiquetas flutuando; **stories** "Hoje nos bares" (os mesmos `BarStories` do app, com os bares de exemplo); climas em cartões com foto (`#clima/<id>`); passos que se empilham ao rolar; bloco para donos; chamada final com brilho e anéis; rodapé; modal de login. Os links mortos do rodapé (Sobre, Termos, Privacidade, Instagram, TikTok) saíram. Estilo em `styles/landing-bolso.css`. |
| `AuthPage.jsx` | Login, cadastro e "esqueci a senha" (`#login`). No cadastro coleta nome e endereço opcional, calcula coordenadas e salva nos metadados do usuário. Os erros do Supabase são traduzidos em `texts/authErrors.js`. |
| `PasswordResetPage.jsx` | Tela para definir nova senha ao voltar do link de recuperação enviado por e-mail. |
| `PromotionsPage.jsx` | Tela **Promoções** (`#promotions`, botão do meio do menu e atalho do cabeçalho), igual à da Versão 3: cartões das promoções valendo agora (foto, bar · bairro, título, aberto/fechado) e, embaixo, a **Agenda** com os próximos eventos de todos os bares (dia e dia da semana, nome do evento, bar e "Hoje às 20h30"). Tocar abre a página do bar. Textos em `promotionsPage` de `src/texts/app.js`. |
| `ProfilePage.jsx` | Perfil do usuário (`#profile`): nome e endereço (para calcular distância sem GPS), sair da conta, e atalhos para a área do estabelecimento. |
| `BusinessDashboard.jsx` | **Painel do dono** (`#business`, ≈1.470 linhas). Sem vínculo: formulário para pedir acesso a um bar (nome, telefone, CNPJ opcional, mensagem) e status dos pedidos. Com vínculo: seletor de bar e 5 abas — **Visão geral** (percentual do perfil completo, métricas de 30 dias, atalhos; "Ver minha página" abre `/r/<id>` e "QR Code para imprimir" abre `/r/<id>/qr` em nova aba), **Perfil público** (nome, foto por upload ou URL, endereço por CEP, editor de dias/horário com minutos, chave **"Aceito pedidos pelo WhatsApp"** (`takes_whatsapp_orders`), **clima do lugar** (botões, salva em `bars.vibes`), telefone, descrição, faixa de preço e o status aberto/fechado — automático pelo horário; a chave manual só aparece quando o horário não pode ser lido. O editor de horário edita só o primeiro trecho: horários com vários trechos ("Seg a qui… \| Sex e sab…") viram um só se o dono mexer), **Cardápio** (categorias e itens com preço e disponibilidade), **Promoções** e **Eventos** (com início, fim, preço e ativo). Cada aba salva com um botão. **Visão geral (30/10/2026):** capa com aberto/fechado automático e botões Ver minha página e QR Code; **Promoção de hoje** (publica em um toque, vale até 23h59, e encerra as que estão no ar); 4 números grandes (visitas, WhatsApp, rotas, ligações) + favoritos e stories; **gráfico de visitas por dia** da semana (`get_bar_daily_views`); qualidade do perfil; atalhos para as abas. Promoções e eventos têm **foto do story** opcional (`StoryPhotoField`, sai sozinha em 8 horas), e a visão geral mostra "Viram seu story" e "Abriram o bar pelo story". |
| `ForBusinessPage.jsx` | Página de vendas para donos (`#for-business`): benefícios, "como entrar" em 3 passos e o **Programa Parceiro Fundador** (30 dias grátis, 10 primeiros bares de Volta Redonda, sem preço publicado). Os botões "Quero ser parceiro"/"Quero minha vaga" abrem o WhatsApp comercial (constante `SALES_WHATSAPP` em `src/texts/contact.js`, hoje 24 99219-6584) com mensagem pronta. No fim, atalho para quem já é parceiro entrar no painel. |
| `StandalonePage.jsx` | **Página avulsa do estabelecimento (`/r/<id>`)** — o "site" do restaurante/bar para QR Code e link no Instagram. Carrega um estabelecimento com `fetchBarById` (aparece no guia ou não), calcula aberto/fechado (a cada minuto) e distância (GPS do visitante, se ele tocar em "Ver distância") e renderiza **a mesma `BarDetails` do app** com `isStandalone` — design idêntico ao dos outros bares. Estados próprios: carregando, erro com "Tentar de novo" e "Página não encontrada". |
| `BarDetails.jsx` | Página do bar (`#bar/<id>`): foto, status, ações rápidas (WhatsApp, ligar, Google Maps, Waze — cada clique é registrado como métrica), sobre, endereço, horário, promoções, resumo, cardápio, próximos eventos e avaliações. Registra uma visualização por sessão. No topo: foto, nome, bairro e, logo abaixo, o selo de status (a faixa de preço fica só em "Sobre o lugar"). Mostra os atalhos do cardápio (`MenuNav`). Com `isStandalone` (página `/r/<id>`): sem "Voltar", "Favoritar" e avaliações; no botão de WhatsApp aparece uma dica discreta (visível também no celular): "Peça por aqui" se o estabelecimento aceita pedidos pelo WhatsApp (`takesWhatsappOrders`), senão "Tire suas dúvidas"; distância só com GPS do visitante (botão "Ver distância"). Sem telefone cadastrado, WhatsApp e Ligar aparecem desativados ("Em breve"). |
| `QrCodePage.jsx` | **Cartão de QR Code para imprimir** (`/r/<id>/qr`): nome do estabelecimento, QR para `/r/<id>`, "Aponte a câmera…", botões Imprimir e Baixar imagem (PNG 1200 px). Sem marca Bora Bar; estilo próprio para impressão. Usa a biblioteca `qrcode`. |

## `src/components/` — peças reutilizadas pelas telas

| Arquivo | O que é |
| --- | --- |
| `AppHeader.jsx` | Cabeçalho da lista: logo, atalho para as promoções de hoje (ícone de porcentagem com pontinho coral quando há promoção; antes era um sino sem função), saudação pelo horário + título "Qual vai ser hoje?" (ou o nome do clima/favoritos via prop `title`), campo de busca com sugestões (bar, bairro, cidade, com distância) e botão de localização. |
| `FilterBar.jsx` | Quatro filtros: Aberto agora, Mais barato, Mais próximo, Com promoção. |
| `BarList.jsx` | Grade de `BarCard`; mostra estado vazio próprio para favoritos, para "Aberto agora" sem nenhum bar aberto e para busca sem resultado. |
| `BarCard.jsx` | Card da lista (formato da Versão 2, mais compacto): foto à esquerda, selo aberto/fechado, nome, "distância · bairro · faixa de preço · desde R$", e etiquetas da promoção de hoje (coral) e do próximo evento (verde); botão de favoritar no canto. |
| `BarStories.jsx` | Bolinhas de **stories** "Hoje nos bares": um story por bar com promoção valendo hoje ou evento de hoje/amanhã (até 2 de cada); a foto da promoção/evento vira o fundo (sem foto, usa a capa). Quem tem novidade aparece primeiro; o já visto fica com anel cinza (guardado só no celular, em `localStorage`). Em tela cheia: progresso, avanço a cada 5 s, toque à esquerda/direita, pausa segurando, Esc fecha; botões **Ver o bar**, **Como chegar** e **WhatsApp** ("Tire suas dúvidas" ou "Peça por aqui"). Registra `story_view` (uma vez por bar e sessão) e `story_open`. Com `isPreview` (landing, bares de exemplo) não registra métrica nem mostra contato. |
| `src/utils/barLinks.js` | Links de um bar usados pela página do bar e pelos stories: `getPhoneDigits`, `getWhatsappLink` e `getRouteLinks` (Google Maps e Waze). |
| `NearbyStrip.jsx` | Faixa compacta "Perto de você" (ou "Em destaque" sem localização): até 6 cartões pequenos que rolam para o lado, acima de "Todos os lugares". |
| `MenuCategory.jsx` | Uma categoria do cardápio com itens, descrição (se houver) e preços; cada categoria tem id `menu-<nome>` para os atalhos; traduz as chaves antigas (`cervejas`, `drinks`, `porcoes`, `combos`). |
| `Reviews.jsx` | Lista de avaliações com nota de 1 a 5, formulário para quem está logado e botão de apagar a própria avaliação. |
| `StatusBadge.jsx` | Selo "Aberto"/"Fechado", com detalhe opcional ("· Fecha às 02h"). Fica **pêssego** nos últimos 30 min (`isClosingSoon`, "Fecha em 25 min"). |
| `TextEffects.jsx` | Efeitos de texto: `RevealWords` (palavra por palavra, usado no título da landing), `RotatingText` (frase que se alterna, no cartão do topo da landing) e `CountUp` (número que conta, no painel do dono). Todos respeitam "reduzir movimento". |
| `MenuNav.jsx` | **Atalhos do cardápio**: um botão por categoria (aparece com 3+ categorias), grudado no topo enquanto o cardápio está na tela; toque desliza suave até a categoria; a categoria visível fica destacada. **Uma linha só**: no celular desliza pro lado com o dedo (pontas esmaecidas, sem barra de rolagem), e a fileira anda sozinha para mostrar a categoria atual. |
| `BottomNav.jsx` | Menu fixo de baixo, só ícones; o da tela atual fica coral com um pontinho. **Início**: lista completa (limpa filtros). **Buscar (lupa)**: vai para a lista, sobe ao topo e deixa o campo de busca pronto para digitar. **Promoções** (ou **Cardápio** na página do bar): tela de promoções e agenda (`#promotions`, `PromotionsPage.jsx`). **Favoritos**: só os bares favoritados. **Perfil**: seu perfil, ou o login se não estiver logado. Os comportamentos ficam em `src/App.jsx` (`goBack`, `openSearch`, `showPromotions`, `showFavorites`, `openProfile`). |
| `AddressFields.jsx` | Campos de endereço do perfil do usuário: CEP com busca automática, UF e cidade por listas do IBGE, bairro. |
| `BarAddressFields.jsx` | Campos de endereço do estabelecimento no painel: CEP com busca, rua, número, complemento, bairro, cidade, estado. |

## `src/styles/` — design (CSS)

Um arquivo por área da interface. `index.css` importa todos, na ordem da tabela. Para mudar a aparência de uma tela, abra o arquivo dela; as cores e fontes ficam em `base.css` (`:root`).

| Arquivo | O que tem |
| --- | --- |
| `index.css` | Fontes do Google (**Plus Jakarta Sans** para texto e **Instrument Serif** itálica para destaques) e a lista de imports (ordem importa). |
| `base.css` | **Identidade visual**: o acento do site inteiro é `--coral` (com `--coral-dark` e `--coral-soft`, o âmbar de preços e estrelas) e `--radius`. Troque aqui para mudar a cor em todas as telas (menos a landing, que tem as próprias cores em `landing.css`). O fundo do app é um cinza suave (--bg, #1b1b1b, igual à prévia da landing), com cards em --card e campos em branco translúcido; o preto fica só nos degradês sobre as fotos. Também tem as fontes (`--font-sans`, `--font-serif`) e reset. |
| `header.css` | Cabeçalho enxuto, busca arredondada, sugestões e filtros (chips coral). |
| `bar-card.css` | Card de bar (base), selo aberto/fechado, promoções. Na tela inicial o card é redesenhado por `home.css`. |
| `bar-details.css` | Página do bar: capa, ações rápidas, informações. |
| `account.css` | Login, perfil, endereço e botões padrão (`primary-action`, `secondary-action`). |
| `menu-events.css` | Cardápio, destaques e eventos. |
| `for-business.css` | Página "Para estabelecimentos". |
| `dashboard.css` | Painel do dono do bar. |
| `reviews.css` | Avaliações e campos de formulário. |
| `bottom-nav.css` | Menu fixo de baixo (celular). |
| `responsive.css` | Ajustes de tela pequena (celular) e movimento reduzido — vários trechos de outras telas ficam aqui. |
| `extras.css` | Atalhos do cardápio, filtro por clima e ajustes finais. |
| `dashboard-bolso.css` | **Painel do estabelecimento no visual da Versão 3** (30/10/2026), por cima de `dashboard.css`: painel sem caixa, abas em pílula presas no topo (no celular com ícone + nome), cartões arredondados, botão Salvar preso acima do menu e a visão geral nova (prefixo `pnl-`: capa com status, Promoção de hoje, números, gráfico, atalhos, aviso). |
| `promotions.css` | Tela de Promoções e Agenda (`PromotionsPage.jsx`): cartão de promoção e linha da agenda com a data em destaque coral. |
| `home.css` | **Tela inicial no visual da Versão 3**: saudação e título, stories e o story em tela cheia, filtros compactos (os climas ficaram só na landing, em 30/10/2026), faixa "Perto de você" maior e o card da lista. Tudo escopado em `.home-page`. |
| `motion.css` | **Animações**: entrada das telas, cards da lista em sequência, resposta ao toque (botões, filtros, menu), pulo do coração e sugestões da busca. Tempos e curva em `base.css` (`--dur-fast`, `--dur-base`, `--ease-out`). Respeita "reduzir movimento". |
| `landing.css` | Regras antigas da página inicial; ainda usadas pelo modal de login e pela chamada final. Carregado por `pages/LandingPage.jsx`. |
| `landing-bolso.css` | **Landing nova (Versão 3)**, prefixo `lpb-`: topo, celular de demonstração, stories, climas, passos empilhados, bloco para donos, anéis da chamada final e rodapé. Carregado por `pages/LandingPage.jsx`. |

## `src/texts/` — textos (para editar sem mexer na tela)

Todo texto que o usuário vê fica aqui; as telas só importam e mostram. Para mudar uma frase, procure-a no arquivo da tela correspondente. Títulos com destaque vêm em duas partes (`titulo` e `destaque`).

| Arquivo | Tela / componente | O que tem |
| --- | --- | --- |
| `contact.js` | `ForBusinessPage` | WhatsApp comercial do Bora Bar, mensagem pronta e dados do Programa Parceiro Fundador (vagas, cidade). |
| `forBusiness.js` | `ForBusinessPage` | Benefícios, vantagens do fundador e passos "Como entrar". |
| `landing.js` | `LandingPage` | Menu, topo (com as frases que trocam), celular de demonstração, "Hoje nos bares", "Qual é o rolê de hoje?", "Como funciona", bloco para donos, chamada final, rodapé e modal de login. |
| `account.js` | `AuthPage`, `PasswordResetPage`, `ProfilePage` | Login/cadastro, nova senha e perfil. |
| `authErrors.js` | login, cadastro, senha | Mensagens de erro (Supabase → português). |
| `app.js` | `App`, `AppHeader`, `FilterBar`, `BarList`, `BarCard`, `BarStories`, `NearbyStrip`, `PromotionsPage`, `BottomNav`, `StatusBadge` | Tela inicial do app (saudação, título), busca, filtros, stories, "Perto de você", cards, tela de promoções e agenda, menu de baixo, selo aberto/fechado. |
| `bar.js` | `BarDetails`, `Reviews` | Página do bar e avaliações. |
| `dashboard.js` | `BusinessDashboard` | Painel do dono: abas, pedido de acesso, perfil, cardápio, promoções/eventos, visão geral. |
| `misc.js` | `QrCodePage`, `StandalonePage`, `AddressFields`, `BarAddressFields`, `MenuNav` | Textos menores. |

Ficaram fora de `texts/` de propósito: os rótulos dos dias ("Seg", "Todos os dias") e do horário em `BusinessDashboard.jsx`, porque são gravados no banco e lidos por `utils/openingHours.js`; os nomes dos climas (`utils/vibes.js`) e das categorias do cardápio (`MenuCategory.jsx`), que também são dados; e os bares de exemplo (`data/mockBars.js`). Mensagens de `console.warn` seguem no código.
