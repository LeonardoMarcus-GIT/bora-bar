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

## 4. Publicar na Netlify

No painel da Netlify, adicione as mesmas variaveis em:

Site configuration > Environment variables

Depois disso, faca um novo deploy.

## 5. Configurar Auth

No painel do Supabase, abra Authentication > URL Configuration:

- Site URL: `https://bora-bar.netlify.app`
- Redirect URLs:
  - `https://bora-bar.netlify.app/*`
  - `http://localhost:5173/*`

Em Authentication > Providers > Email, deixe email/senha habilitado. Para o fluxo
mais seguro, mantenha a confirmacao de email ativada.

## Observacao

Enquanto a tabela `bars` estiver vazia ou as variaveis nao estiverem configuradas,
o app continua usando os dados ficticios atuais. As avaliacoes vao para o Supabase
assim que as variaveis estiverem configuradas, os bares estiverem cadastrados e o
usuario estiver logado.
