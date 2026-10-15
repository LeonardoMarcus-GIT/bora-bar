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
| `package.json` | Nome `bora-bar`, versão 0.1.0, módulos ES. Scripts `dev`, `build`, `preview`, `serve:dist`. Dependências: React 19, Vite 7, `@supabase/supabase-js`, `lucide-react`, `ogl`. |
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
| `supabase/listing-visibility-migration.sql` | Migração da coluna `bars.is_listed` (aparece no guia ou só página avulsa). Já aplicada em 15/10/2026. |
| `supabase/bar-images-storage.sql` | Migração para bancos antigos: cria o bucket público `bar-images` (até 8 MB, JPG/PNG/WebP) e as policies para cada dono enviar fotos só na pasta do próprio bar. |

## `public/` — arquivos servidos como estão

| Arquivo | O que é |
| --- | --- |
| `public/estabelecimentos/<id>/*.jpg` | Fotos dos estabelecimentos (capa e galeria), servidas em `/estabelecimentos/<id>/...`. Hoje: `cantinho-portugues/` (capa-bacalhau, risoto-camarao, salpicao-bife-acebolado, espaguete-bife-acebolado, feijoada), redimensionadas para até 1200 px. |

## `src/` — entrada

| Arquivo | O que é |
| --- | --- |
| `src/main.jsx` | Ponto de entrada. **Se o endereço for `/r/<id>`, renderiza só a `StandalonePage`** (página avulsa, sem marca, sem login, sem o efeito de luz); senão, o app normal. Renderiza o efeito `SideRays` (luz amarela no canto) e o `App` dentro do `AuthProvider`. Importa `styles.css`. |
| `src/App.jsx` | Componente raiz (≈780 linhas). Faz o **roteamento por hash** (`getRoute`), carrega os bares, calcula a distância de cada um até o usuário (GPS ou endereço do perfil verificado), limita a descoberta a **20 km**, monta as sugestões de busca (bar, bairro, cidade), aplica filtros (aberto, promoção, mais barato, mais próximo, favoritos), guarda favoritos no `localStorage` e decide qual tela mostrar. Tem um relógio interno (`now`, atualizado a cada minuto) que recalcula o aberto/fechado de cada bar com `getOpenStatus` e adiciona `openStatusDetail` ao bar. O card "Seu estabelecimento no Bora Bar" no fim da lista é um botão inteiro (ícone, texto e seta levam a `#for-business`). Na lista mostra três estados: carregando, erro com botão "Tentar de novo" (`barsLoadError` / `retryLoadBars`) e "Nenhum bar por aqui ainda". |
| `src/styles.css` | Todo o CSS do app (≈2.800 linhas): landing, lista, detalhes, painel, formulários, navegação inferior, responsivo. |

## `src/context/`

| Arquivo | O que é |
| --- | --- |
| `src/context/AuthContext.jsx` | `AuthProvider` e hook `useAuth()`. Busca a sessão do Supabase ao abrir e escuta mudanças de login. Expõe `user`, `session` e `isAuthReady`. |

## `src/hooks/`

| Arquivo | O que é |
| --- | --- |
| `src/hooks/useGeolocation.js` | Pede a localização ao navegador (alta precisão, timeout 20 s). Rejeita leituras com precisão pior que 1 km, guarda a última posição no `localStorage` por 30 min. Retorna `coordinates`, `status` (`idle`, `loading`, `granted`, `cached`, `denied`, `unavailable`), `hasLocation`, `errorMessage` e `requestLocation()`. |

## `src/services/` — acesso a dados

| Arquivo | O que é |
| --- | --- |
| `src/services/supabaseClient.js` | Cria o cliente Supabase a partir das variáveis `VITE_*`. Exporta `supabase` (ou `null`) e `isSupabaseConfigured`. |
| `src/services/barsService.js` | Mapeia também `gallery` (fotos). `fetchBars()` (só estabelecimentos com `is_listed = true`) e `fetchBarById(id)` (um estabelecimento, listado ou não — para a página avulsa). `fetchBars()`: busca bares com categorias, itens, promoções e eventos numa consulta só; filtra promoções vigentes e eventos futuros; converte para o formato do front. Tem limite de 15 s. **Se o banco falhar, lança erro** (nunca devolve bares de exemplo em produção); banco sem bares ativos devolve lista vazia. `mockBars` só é usado rodando localmente (`npm run dev`) sem as variáveis do Supabase. |
| `src/services/businessService.js` | Tudo do painel do dono: `fetchBusinessAccess` (vínculos e pedidos de acesso do usuário), `createBarClaim` (pedir acesso a um bar), `fetchManagedBarData`, `updateManagedBar` (perfil e endereço), `replaceManagedMenu`, `replaceManagedPromotions`, `replaceManagedEvents` (via funções RPC). Converte endereço antigo em texto para campos estruturados. |
| `src/services/businessImageService.js` | `uploadBusinessCoverImage(barId, file)`: valida tipo (JPG/PNG/WebP) e tamanho (8 MB), envia para o bucket `bar-images/<barId>/<uuid>.<ext>` e devolve a URL pública. |
| `src/services/analyticsService.js` | Métricas anônimas. `recordBarEvent` grava `view`, `whatsapp`, `phone`, `route_google`, `route_waze` ou `favorite` com um id de sessão aleatório; `recordBarViewOnce` conta uma visualização por bar por sessão; `fetchBarMetrics` chama `get_bar_metrics` (últimos 30 dias). |
| `src/services/authService.js` | Cadastro, login, logout, sessão, escuta de mudanças, recuperação e troca de senha, atualização de metadados do usuário — tudo pelo Supabase Auth. |
| `src/services/profilesService.js` | `fetchProfile` e `saveProfile` (upsert) na tabela `profiles`. |
| `src/services/reviewsService.js` | Avaliações: listar, criar e apagar. Com Supabase usa a tabela `reviews`; sem Supabase usa o `localStorage`. O nome do autor é preenchido pelo banco (trigger). |
| `src/services/addressService.js` | Endereço: formatar CEP, normalizar campos, buscar endereço no **ViaCEP**, listar estados e cidades no **IBGE**, montar endereço completo e chamar `/api/geocode-profile` para obter coordenadas. |

## `src/utils/`

| Arquivo | O que é |
| --- | --- |
| `src/utils/format.js` | `formatCurrency` (R$), `getStartingPrice` (menor preço do cardápio), `normalizeText` (minúsculas sem acento, para busca). |
| `src/utils/openingHours.js` | **Aberto/fechado automático.** `getOpenStatus(textoDoHorario, abertoManual, agora)` lê o horário em texto ("Seg a qui: 17h-00h \| Sex e sab: 17h-02h", "Ter a dom: 15h-01h", "Seg, Qua e Sex: 18h30-02h", "Todos os dias: 16h-01h", vários horários no mesmo dia com "e"), sempre no fuso de Brasília, entende fechamento depois da meia-noite e devolve `{ isOpen, isAutomatic, detail }` — `detail` é "Fecha às 02h", "Abre hoje às 18h", "Abre amanhã às 15h" ou "Abre seg às 11h". Se o texto não puder ser lido, usa o valor manual (`is_open`). Também exporta `parseOpeningHours`, `parseOpeningDays` e `formatClock`. |
| `src/utils/geo.js` | `calculateDistanceKm` (fórmula de Haversine), `formatDistanceKm` ("850 m" / "1,9 km"), `isValidCoordinate`. |

## `src/data/`

| Arquivo | O que é |
| --- | --- |
| `src/data/mockBars.js` | 6 bares fictícios de Volta Redonda (Esquina 77, Boteco do Porto, Varanda Aurora, Marola Bar, Quintal Boa Prosa, Samba da Rua) com cardápio, promoção e horário. Usados só rodando localmente sem Supabase e como ilustração na landing. Telefones com DDD 11 (incorreto para a cidade). |
| `src/data/barCoordinates.js` | Endereços e coordenadas dos mesmos 6 bares. **Não é importado por nenhum arquivo** (código morto). |

## `src/assets/`

| Arquivo | O que é |
| --- | --- |
| `src/assets/bora-bar-icon.png` | Ícone da marca (121 KB). Usado no cabeçalho do app e no rodapé da landing. |
| `src/assets/bora-bar-logo-full.png` | Logo completo (803 KB). Usado na landing. |
| `src/assets/bora-bar-bg-test.png` | Fundo da landing no desktop (1,2 MB). |
| `src/assets/bora-bar-bg-mobile.png` | Fundo da landing no celular (1,4 MB). Também referenciado em `styles.css`. |

## `src/components/` — telas

| Arquivo | O que é |
| --- | --- |
| `LandingPage.jsx` | Página de entrada (sem hash). Hero "Seu rolê começa aqui", prévia do app com bares de exemplo, seções de marketing, modal de login (botão Google ainda "em breve") e chamadas para explorar ou criar conta. |
| `AuthPage.jsx` | Login, cadastro e "esqueci a senha" (`#login`). No cadastro coleta nome e endereço opcional, calcula coordenadas e salva nos metadados do usuário. Traduz erros do Supabase para português. |
| `PasswordResetPage.jsx` | Tela para definir nova senha ao voltar do link de recuperação enviado por e-mail. |
| `ProfilePage.jsx` | Perfil do usuário (`#profile`): nome e endereço (para calcular distância sem GPS), sair da conta, e atalhos para a área do estabelecimento. |
| `BusinessDashboard.jsx` | **Painel do dono** (`#business`, ≈1.470 linhas). Sem vínculo: formulário para pedir acesso a um bar (nome, telefone, CNPJ opcional, mensagem) e status dos pedidos. Com vínculo: seletor de bar e 5 abas — **Visão geral** (percentual do perfil completo, métricas de 30 dias, atalhos; "Ver minha página" abre `/r/<id>` em nova aba), **Perfil público** (nome, foto por upload ou URL, endereço por CEP, editor de dias/horário com minutos, telefone, descrição, faixa de preço e o status aberto/fechado — automático pelo horário; a chave manual só aparece quando o horário não pode ser lido. O editor de horário edita só o primeiro trecho: horários com vários trechos ("Seg a qui… \| Sex e sab…") viram um só se o dono mexer), **Cardápio** (categorias e itens com preço e disponibilidade), **Promoções** e **Eventos** (com início, fim, preço e ativo). Cada aba salva com um botão. |
| `ForBusinessPage.jsx` | Página de vendas para donos (`#for-business`): benefícios, "como entrar" em 3 passos e o **Programa Parceiro Fundador** (30 dias grátis, 10 primeiros bares de Volta Redonda, sem preço publicado). Os botões "Quero ser parceiro"/"Quero minha vaga" abrem o WhatsApp comercial (constante `SALES_WHATSAPP`, hoje 24 99219-6584) com mensagem pronta. No fim, atalho para quem já é parceiro entrar no painel. |

## `src/components/` — peças do app

| Arquivo | O que é |
| --- | --- |
| `AppHeader.jsx` | Cabeçalho da lista: logo, sino (sem função), campo de busca com sugestões (bar, bairro, cidade, com distância) e botão de localização. |
| `FilterBar.jsx` | Quatro filtros: Aberto agora, Mais barato, Mais próximo, Com promoção. |
| `BarList.jsx` | Grade de `BarCard`; mostra estado vazio próprio para favoritos ou busca sem resultado. |
| `BarCard.jsx` | Card do bar: foto, aberto/fechado, faixa de preço, bairro, distância, "a partir de R$", promoção e botão de favoritar. |
| `StandalonePage.jsx` | **Página avulsa do estabelecimento (`/r/<id>`)** — o "site" do restaurante/bar para QR Code e link no Instagram, sem a marca Bora Bar. Carrega um estabelecimento com `fetchBarById` (aparece no guia ou não). Mostra foto, nome, aberto/fechado automático, faixa **Hoje** (promoções vigentes + eventos do dia, ex.: prato do dia), botões WhatsApp/Ligar/Como chegar (somem se não houver telefone), galeria de fotos rolável (`bar.gallery`), cardápio com descrições, próximos eventos, descrição, horário e endereço. Registra métricas (visualização, WhatsApp, ligação, rota). Estados: carregando, erro com "Tentar de novo" e "Página não encontrada". |
| `BarDetails.jsx` | Página do bar (`#bar/<id>`): foto, status, ações rápidas (WhatsApp, ligar, Google Maps, Waze — cada clique é registrado como métrica), sobre, endereço, horário, promoções, resumo, cardápio, próximos eventos e avaliações. Registra uma visualização por sessão. |
| `MenuCategory.jsx` | Uma categoria do cardápio com itens, descrição (se houver) e preços; traduz as chaves antigas (`cervejas`, `drinks`, `porcoes`, `combos`). |
| `Reviews.jsx` | Lista de avaliações com nota de 1 a 5, formulário para quem está logado e botão de apagar a própria avaliação. |
| `StatusBadge.jsx` | Selo "Aberto"/"Fechado", com detalhe opcional ("· Fecha às 02h"). |
| `BottomNav.jsx` | Barra inferior: Início, Buscar, Promoções (ou Cardápio na página do bar), Favoritos, Perfil. |
| `AddressFields.jsx` | Campos de endereço do perfil do usuário: CEP com busca automática, UF e cidade por listas do IBGE, bairro. |
| `BarAddressFields.jsx` | Campos de endereço do estabelecimento no painel: CEP com busca, rua, número, complemento, bairro, cidade, estado. |
| `SideRays.jsx` | Efeito visual de raios de luz em WebGL (biblioteca `ogl`) desenhado atrás do app. |
