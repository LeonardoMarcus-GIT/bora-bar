# Supabase no Bora Bar

## 1. Criar o banco

1. Crie um projeto em https://database.new.
2. Abra o SQL Editor no Supabase.
3. Cole e rode o conteúdo de `supabase/schema.sql`.

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

## 4. Publicar na Netlify

No painel da Netlify, adicione as mesmas variáveis em:

Site configuration > Environment variables

Depois disso, faça um novo deploy.

## Observacao

Enquanto a tabela `bars` estiver vazia ou as variaveis nao estiverem configuradas,
o app continua usando os dados ficticios atuais. As avaliacoes vao para o Supabase
assim que as variaveis estiverem configuradas e a tabela existir.
