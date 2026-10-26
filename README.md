# Biblioteca Digital — Frontend

Frontend em HTML, CSS e JavaScript para a API de livros existente. O backend não precisa ser alterado.

## Arquivos

- `index.html`: estrutura da página.
- `style.css`: aparência responsiva.
- `app.js`: catálogo, busca, cadastro, edição e exclusão.
- `functions/api/[[path]].js`: Cloudflare Pages Function que encaminha `/api/*` ao Worker backend.

## Publicação no Cloudflare Pages

**Importante:** o proxy `functions/api/[[path]].js` só funciona quando o projeto é publicado no Cloudflare Pages com suporte a Pages Functions. Abrir `index.html` diretamente por `file://` não executa a função intermediária.

1. Envie todos os arquivos e a pasta `functions` para o repositório do frontend.
2. No Cloudflare Dashboard, abra **Workers & Pages** e crie/abra o projeto Pages conectado ao repositório do frontend.
3. Para um site HTML estático, use a raiz do projeto como diretório de saída (`/`) e não é necessário comando de build.
4. Publique e abra o domínio `*.pages.dev` fornecido pelo Cloudflare.
5. Teste primeiro `https://SEU-SITE.pages.dev/api/livros`. Deve retornar JSON da API.
6. Depois abra a página principal e teste cadastro/edição/exclusão.

## API esperada

- `GET /api/livros`
- `GET /api/livros/:id`
- `POST /api/livros` com `{ "titulo": "...", "autor": "...", "ano": 2024 }`
- `PUT /api/livros/:id` com os mesmos campos
- `DELETE /api/livros/:id`

O proxy encaminha os caminhos e métodos sem mudar o backend.
