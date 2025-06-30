# SanNEXT

Projeto exemplo para gerenciamento de filas usando Netlify Functions, Ably e FaunaDB.

## Estrutura
- **functions/** – Funções serverless em Node.js (ESM)
- **public/** – Front-end estático
- **netlify.toml** – Configuração do Netlify

## Variáveis de Ambiente
Defina no painel da Netlify:
- `FAUNA_SECRET` – chave de acesso ao FaunaDB
- `ABLY_API_KEY` – chave de API da Ably
- `ABLY_CHANNEL` – nome do canal Ably (ex.: `san-next`)

## Scripts
Não há etapa de build necessária, apenas:
```bash
npm run build
```

## Deploy
Ao fazer deploy no Netlify, as funções serão publicadas em `/.netlify/functions/*` e o front-end em `public/`.
