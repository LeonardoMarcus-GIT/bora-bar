# Bora Bar — instruções para o Claude

Guia de "onde ir hoje" para bares. O cliente final descobre bares perto dele
(aberto agora, promoções, cardápio com preços, shows e eventos) e o dono de cada
bar atualiza tudo sozinho por um painel no celular.

**Modelo de negócio:** quem paga é o estabelecimento (mensalidade). Estratégia
atual: vender primeiro a página de UM bar como produto avulso (site + cardápio
digital + agenda) e, com 15–20 bares pagantes na mesma cidade, o guia da cidade
nasce cheio. Detalhes em `docs/PLANO.md`.

**Status (15/10/2026): ainda não há nenhum cliente real.** Tudo que está no
banco — os 6 bares, fotos, cardápios, donos vinculados, avaliações e cliques —
é dado de teste, fictício. O produto ainda não foi colocado à prova no mercado.
Pode apagar ou reescrever esses dados quando necessário (avisando antes).

## Leia antes de mexer

- `docs/ARQUIVOS.md` — o que faz cada arquivo do projeto
- `docs/BANCO-DE-DADOS.md` — tabelas, regras de acesso (RLS) e funções do Supabase
- `docs/PLANO.md` — diagnóstico do produto, problemas conhecidos e próximos passos

## Stack

- React 19 + Vite 7, JavaScript puro (sem TypeScript), CSS único em `src/styles.css`
- Ícones: `lucide-react`. Efeito de luz do fundo: `ogl` (WebGL)
- Backend: Supabase (Postgres + Auth + Storage), acessado direto do navegador com a chave pública; a segurança está nas policies RLS
- Uma função serverless: `api/geocode-profile.js` (CEP/endereço → latitude/longitude via Nominatim), servida na Netlify pelo adaptador `netlify/functions/geocode-profile.mjs`
- APIs públicas usadas no navegador: ViaCEP (endereço por CEP) e IBGE (estados e cidades)

## Comandos

```bash
npm install
npm run dev          # servidor local em http://localhost:5173
npm run build        # gera dist/
npm run preview      # serve o build
npm run serve:dist   # servidor Node simples para dist/ (porta 5174)
```

Não há testes automatizados nem linter configurado. Depois de qualquer mudança,
rode `npm run build` e confira que compila.

## Variáveis de ambiente

Arquivo `.env.local` na raiz (nunca commitar):

```
VITE_SUPABASE_URL=https://<projeto>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<chave pública>
```

Sem essas variáveis o app roda com os bares de exemplo de `src/data/mockBars.js`
e login/painel ficam indisponíveis.

## Infraestrutura

- Supabase: projeto **Projeto-Bora-Bar** (ref `ovwhjngjismvlwhoqtmr`, região us-west-2)
- **Site no ar: Netlify — https://bora-bar.netlify.app**, ligado ao GitHub
  `LeonardoMarcus-GIT/bora-bar`. Cada push na `main` publica sozinho em ~1 min.
  Para o usuário ver uma mudança: commit + push na `main` e recarregar o site.
  Não é preciso rodar `npm run dev`.
- Vercel (`bora-bar-three.vercel.app`, projeto **bora-bar**) é uma publicação
  antiga e parada, sem ligação com o GitHub. `vercel.json` ficou só por histórico.
- Supabase Auth: confirmar que *Site URL* e *Redirect URLs* apontam para
  `https://bora-bar.netlify.app` (o `supabase/README.md` ainda cita a Vercel);
  senão os e-mails de confirmação e de nova senha levam para o site antigo.

## Como o código está organizado

- `src/App.jsx` concentra o estado global (lista de bares, filtros, busca,
  favoritos, localização) e o roteamento. **O roteamento é por hash**
  (`#app`, `#bar/<id>`, `#business`, `#profile`, `#login`, `#for-business`,
  `#promotions`); a página inicial sem hash é a landing.
- `src/components/` — telas e peças de interface. Componentes recebem dados e
  callbacks por props; não chamam o Supabase diretamente, com exceção das telas
  que usam os services (Auth, Profile, Reviews, BusinessDashboard).
- `src/services/` — **todo acesso a dados passa por aqui.** Cada service converte
  as colunas do banco (`snake_case`) para objetos do front (`camelCase`).
- `src/hooks/useGeolocation.js` — GPS do navegador com cache de 30 min.
- `supabase/schema.sql` — **fonte de verdade do banco.** É idempotente: pode ser
  rodado de novo sem apagar dados.

## Regras do projeto

- Toda a interface é em **português do Brasil**. Textos, mensagens de erro e
  comentários no código também.
- Mudança no banco: edite `supabase/schema.sql` (mantendo idempotente com
  `if not exists` / `drop policy if exists`) **e** crie um arquivo de migração
  separado em `supabase/` para projetos que já existem. Aplique pelo Supabase
  conectado e atualize `docs/BANCO-DE-DADOS.md`.
- Toda tabela nova precisa de RLS ligada e policies. Escrita de dono de bar
  sempre via `public.is_bar_manager(bar_id)`.
- Cardápio, promoções e eventos são salvos pelas funções `replace_bar_*`
  (apagam e regravam a lista inteira do bar). Mantenha esse padrão.
- Métricas (`bar_engagement_events`) guardam só bar + tipo de ação + id de sessão
  anônimo. Não registrar nome, e-mail nem localização de visitante.
- `localStorage`/`sessionStorage` sempre dentro de `try/catch` (o app precisa
  funcionar com armazenamento bloqueado).
- Pensado para celular primeiro: o dono do bar usa o painel no meio do expediente.
- Ao criar ou mudar um arquivo, atualize a entrada dele em `docs/ARQUIVOS.md`.

## Problemas conhecidos (prioridade)

1. ~~`is_open` manual~~ — resolvido em 15/10/2026: status calculado por
   `src/utils/openingHours.js`. Pendente: o editor de horário do painel só
   edita um trecho (não suporta "Seg a qui… | Sex e sab…" com horários diferentes).
2. ~~Bares fictícios em produção quando o banco falha~~ — resolvido em
   15/10/2026: `fetchBars` lança erro (timeout de 15 s) e o App mostra
   "Tentar de novo"; `mockBars` só aparece em `npm run dev` sem Supabase.
   A landing ainda usa fotos/nomes de `mockBars` como ilustração.
3. Rotas com `#` impedem prévia de link no WhatsApp/Instagram e indexação no Google.
4. A landing promete "ver o movimento / lugares bombando", que não existe.
5. Imagens da landing em PNG de 0,8–1,4 MB; bundle JS de ~580 KB sem divisão.
6. Aprovação de dono é manual no Table Editor (`bar_claims.status`).
7. Planos pagos aparecem como "Em breve"; não há cobrança.
8. `src/data/barCoordinates.js` não é importado por nenhum arquivo (código morto).
9. Telefones dos bares de exemplo usam DDD 11, mas os bares são de Volta Redonda (DDD 24).
