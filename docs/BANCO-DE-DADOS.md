# Bora Bar — banco de dados (Supabase)

Projeto Supabase: **Projeto-Bora-Bar** (ref `ovwhjngjismvlwhoqtmr`).
Fonte de verdade: `supabase/schema.sql` (idempotente).

## Situação em 15/10/2026

**Todos os dados abaixo são de teste.** Bares, fotos e lugares são fictícios;
usuários, donos, avaliações e cliques foram criados nos testes. Nenhum cliente
real ainda.

| Item | Quantidade |
| --- | --- |
| Bares (todos em Volta Redonda, vindos do seed) | 6 |
| Usuários | 4 |
| Donos vinculados (`bar_members`) | 2 |
| Pedidos de acesso (`bar_claims`), pendentes | 2, 0 |
| Itens de cardápio | 22 |
| Promoções | 1 |
| Eventos | 2 |
| Avaliações | 3 |
| Cliques registrados (total / últimos 30 dias) | 56 / 11 |

## Tabelas

| Tabela | Para que serve | Quem lê | Quem escreve |
| --- | --- | --- | --- |
| `bars` | O estabelecimento: nome, bairro, cidade, foto, coordenadas, `is_open`, `is_active`, faixa de preço, endereço (texto + campos de CEP), horário (texto), telefone, descrição, `menu` jsonb antigo. Chave `id` é texto (slug, ex.: `esquina-77`). | Todos | Dono/gerente, só colunas liberadas (`is_active`, `promotion`, `menu`, `distance_km` não). Criar bar: só você, via SQL. |
| `menu_categories` | Categorias do cardápio por bar, com ordem e ativo. | Todos (ativas); dono vê todas | Dono/gerente |
| `menu_items` | Itens com descrição, preço (≥ 0), disponível e ordem. | Todos (disponíveis); dono vê todos | Dono/gerente |
| `promotions` | Promoções com início/fim opcionais e ativo. | Todos (só as vigentes); dono vê todas | Dono/gerente |
| `bar_events` | Eventos (samba, show) com início, fim, preço da entrada e ativo. | Todos (só futuros/ativos); dono vê todos | Dono/gerente |
| `reviews` | Avaliações 1–5 com comentário. O `author` e o `user_id` são preenchidos pelo trigger. | Todos | Usuário logado cria e apaga as próprias |
| `profiles` | Perfil do usuário: nome, endereço, coordenadas, origem da localização. Criado automaticamente no cadastro (trigger). | O próprio usuário | O próprio usuário |
| `bar_claims` | Pedido de um usuário para administrar um bar: contato, documento, mensagem, `status` (`pending`/`approved`/`rejected`), `review_notes`. | O próprio usuário | Usuário cria (só `pending`). Aprovar/recusar: você, no Table Editor. |
| `bar_members` | Vínculo usuário ↔ bar com papel `owner`, `manager` ou `staff`. Criado sozinho quando um claim vira `approved`. | O próprio usuário | Trigger / você |
| `bar_engagement_events` | Métrica anônima: bar, tipo (`view`, `whatsapp`, `phone`, `route_google`, `route_waze`, `favorite`), id de sessão, data. | Dono/gerente do bar | Qualquer visitante (insert) |

Storage: bucket público **`bar-images`** (8 MB, JPG/PNG/WebP). Arquivos em
`<bar_id>/<uuid>.<ext>`; só o dono daquele bar pode enviar.

## Funções

| Função | O que faz |
| --- | --- |
| `is_bar_manager(bar_id)` | Verdadeiro se o usuário logado é `owner` ou `manager` do bar. Base de todas as policies de escrita. (`staff` ainda não tem permissão nenhuma.) |
| `get_bar_metrics(bar_id, since_at)` | Totais por tipo de evento desde a data. Só para quem administra o bar. |
| `replace_bar_menu(bar_id, categories jsonb)` | Apaga e regrava todas as categorias e itens do bar. |
| `replace_bar_promotions(bar_id, list jsonb)` | Apaga e regrava todas as promoções do bar. |
| `replace_bar_events(bar_id, list jsonb)` | Apaga e regrava todos os eventos do bar. |

## Triggers

| Trigger | Quando | Efeito |
| --- | --- | --- |
| `on_auth_user_created` | Novo usuário no Auth | Cria a linha em `profiles` com os dados do cadastro. |
| `on_bar_claim_approved` | `bar_claims.status` muda para `approved` | Cria o vínculo `owner` em `bar_members`. |
| `before_review_insert` | Nova avaliação | Exige login, força `user_id` e preenche `author` com o nome do perfil ou o início do e-mail. |

## Como aprovar um dono hoje

1. Supabase → Table Editor → `bar_claims`.
2. Conferir nome, telefone, documento e mensagem.
3. Mudar `status` para `approved` (ou `rejected` + motivo em `review_notes`).
4. O dono recarrega o app e o painel aparece.

## Como cadastrar um bar novo hoje

Não há tela para isso. Inserir uma linha em `bars` pelo SQL ou Table Editor
(campos obrigatórios: `id`, `name`, `neighborhood`, `city`, `image_url`,
`address`, `hours`, `phone`, `description`). Depois o dono pede acesso pelo app.
