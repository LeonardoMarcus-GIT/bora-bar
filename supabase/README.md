# Supabase no Bora Bar

## 1. Criar o banco

1. Crie um projeto em https://database.new.
2. Abra o SQL Editor no Supabase.
3. Cole e rode o conteudo de `supabase/schema.sql`.
4. Depois cole e rode o conteudo de `supabase/seed-mock-bars.sql` para cadastrar os 6 bares iniciais.

## 2. Pegar as chaves

No Supabase, abra Project Settings > API e copie:

- Project URL
- Publishable key

## 3. Rodar local

Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica
```

Reinicie o servidor local depois de criar ou alterar esse arquivo.

## 4. Publicar na Vercel

No painel da Vercel, adicione as mesmas variaveis em:

Project Settings > Environment Variables

Depois disso, faca um novo deploy.

## 5. Configurar Auth

No painel do Supabase, abra Authentication > URL Configuration:

- Site URL: `https://bora-bar-three.vercel.app`
- Redirect URLs:
  - `https://bora-bar-three.vercel.app/*`
  - `http://localhost:5173/*`

Em Authentication > Providers > Email, deixe email/senha habilitado. Para o fluxo
mais seguro, mantenha a confirmacao de email ativada.

## Observacao

Enquanto a tabela `bars` estiver vazia ou as variaveis nao estiverem configuradas,
o app continua usando os dados ficticios atuais. As avaliacoes vao para o Supabase
assim que as variaveis estiverem configuradas, os bares estiverem cadastrados e o
usuario estiver logado.

## 6. Ativar a area do estabelecimento

Rode novamente o arquivo `supabase/schema.sql` no SQL Editor. Ele e
incremental: cria as novas tabelas e policies sem apagar bares, perfis ou
avaliacoes existentes.

Depois disso, um responsavel pode abrir Perfil > Area do estabelecimento e
enviar uma solicitacao para administrar um bar.

Para aprovar:

1. Abra Table Editor > `bar_claims`.
2. Confira nome, telefone, documento e mensagem.
3. Mude a coluna `status` de `pending` para `approved`.

O trigger `on_bar_claim_approved` cria automaticamente o vinculo na tabela
`bar_members`. Ao recarregar o app, o responsavel ja tera acesso ao painel do
bar.

Para recusar, altere `status` para `rejected` e use `review_notes` para informar
o motivo.

## 7. O que o responsavel pode editar

- Informacoes basicas, telefone, endereco, horarios e status aberto/fechado.
- Categorias do cardapio, itens, descricoes, disponibilidade e precos.
- Promocoes com periodo de validade.
- Eventos com data, horario, descricao e valor de entrada.

As policies RLS permitem alteracoes apenas em estabelecimentos vinculados ao
usuario nas funcoes `owner` ou `manager`.
