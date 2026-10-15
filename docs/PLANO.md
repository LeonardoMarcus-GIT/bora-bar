# Bora Bar: overview e plano para o primeiro cliente

15/10/2026 · versão editável: Claude Doc "Bora Bar: overview e plano para o primeiro cliente"

## O que já foi construído

O Bora Bar já é um produto funcionando, não um protótipo: compila sem erro, está
publicado na Netlify (https://bora-bar.netlify.app) e tem login e segurança bem feitos.

Ainda não há clientes reais: os 6 bares, fotos, donos, avaliações e cliques no
banco são todos de teste. O produto ainda não foi colocado à prova no mercado.

**Para quem procura um bar**

- Lista de bares por distância (GPS ou endereço do perfil), num raio de 20 km
- Busca por nome, bairro ou cidade, e filtros: aberto agora, promoção, mais barato
- Página de cada bar com foto, cardápio, promoções, próximos eventos e avaliações
- Botões de WhatsApp, ligar, Google Maps e Waze
- Favoritos, cadastro e recuperação de senha

**Para o dono do bar (o painel)**

- Edita nome, foto (upload), endereço por CEP, horários e o status aberto/fechado
- Cardápio com categorias, itens, preços e opção de marcar como indisponível
- Promoções com data de início e fim, que somem sozinhas quando vencem
- Eventos (samba, show) com data, hora e valor da entrada
- Métricas dos últimos 30 dias: visualizações, cliques no WhatsApp, ligações,
  rotas e favoritos. É o melhor argumento de venda.
- Pelas regras do banco, cada dono só consegue mexer no próprio bar

O app não tem pedido nem entrega: é um guia de "onde ir hoje". Isso é uma
vantagem — delivery exige logística, pagamento e enfrenta concorrência pesada.

## O que corrigir antes de vender

1. **O "aberto agora" é um botão manual.** Deve ser calculado pelo horário cadastrado.
2. **Se o banco falhar, o app mostra bares de mentira** (os dados de exemplo).
3. **Links com "#"**: sem prévia de foto/nome no WhatsApp e sem Google.
4. **A página inicial promete o que não existe** ("lugares bombando").
5. **Imagens pesadas**: fundo de 1,4 MB em PNG, lento no 4G.
6. **Aprovação do dono feita na mão** no Supabase.
7. **Planos "Em breve" e sem cobrança** — no início, cobrar por Pix.

## A versão para um cliente só

A página do bar que já existe é o produto. O "mini" é essa página funcionando
sozinha, como site do bar:

- **Link próprio**, tipo `borabar.app/esquina-77`, com prévia no WhatsApp e Instagram
- **Faixa "Hoje no bar"** no topo: "Hoje: samba às 20h · Chopp R$ 8 até 21h"
- **Aberto/fechado automático** pelo horário
- **QR Code pronto para imprimir** e colar na mesa
- O painel que já existe, simplificado para o celular

**Oferta atual na página (15/10/2026):** Programa Parceiro Fundador — 30 dias
grátis, vagas para os 10 primeiros bares de Volta Redonda, contato pelo WhatsApp
comercial, sem preço publicado. Validar o valor conversando com os primeiros donos.

**Preço em estudo:** R$ 79 a R$ 149 por mês, preço travado para fundadores. Argumento: "cardápio digital + site + agenda
de eventos, e você mesmo atualiza pelo celular", com as métricas como prova.

**Estratégia:** cada bar vendido entra no mesmo banco. Com 15 a 20 bares pagando
em Volta Redonda, o guia da cidade já nasce cheio.

## Próximos passos

- [ ] Escolher o bar que será o primeiro cliente
- [ ] Corrigir os pontos 1 a 3
- [ ] Montar a página avulsa do bar com link próprio, faixa "Hoje" e QR Code
- [ ] Preparar a demonstração com o nome do bar

## Ideias deixadas para depois

- Foto por item do cardápio: descartada por enquanto (15/10/2026); fazer só se um
  cliente pedir. Exige coluna `menu_items.image_url` e gravar a foto em
  `replace_bar_menu` (senão salvar o cardápio apaga as fotos).
