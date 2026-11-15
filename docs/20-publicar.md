# Publicar o jogo (404, 500 e o endereço final)

O jogo é estático: `npm run build` gera `dist/` e basta servir essa pasta. Duas coisas dependem do hospedeiro.

## Páginas de erro

O build publica `404.html` e `500.html` na raiz de `dist/`. O jogo não precisa delas para funcionar; elas só deixam os erros em tom de casa (frasco, vela, pergaminho).

| Hospedeiro | 404 | 500 |
|---|---|---|
| GitHub Pages, Netlify, Cloudflare Pages | automático: servem `404.html` da raiz | não há 500 do lado do servidor deles |
| Nginx | `error_page 404 /404.html;` | `error_page 500 502 503 504 /500.html;` |
| Apache | `ErrorDocument 404 /404.html` | `ErrorDocument 500 /500.html` |
| Vercel | `vercel.json`: `{ "cleanUrls": true }` e o `404.html` da raiz | — |

Nginx completo (exemplo):

```nginx
server {
  root /var/www/potion-academy/dist;
  index index.html;
  location / { try_files $uri $uri/ =404; }
  error_page 404 /404.html;
  error_page 500 502 503 504 /500.html;
  location = /404.html { internal; }
  location = /500.html { internal; }
}
```

`try_files ... =404` é o que faz um endereço que não existe devolver a 404 de verdade (e não o jogo). O jogo vive em `/`, e as páginas de apoio são `/manuscrito.html`, `/history.html` e `/sprites.html`.

## O endereço final

Quando o endereço for conhecido, troque em `index.html` as metatags `og:image` (e `og:url`, que hoje não existe) pelo endereço absoluto, por exemplo `https://seu-dominio/og-image.png`. Hoje elas usam `%BASE_URL%`, que serve para o dia a dia mas não para a prévia ao compartilhar o link em redes sociais, que exige o endereço completo.

## Verificar

Depois de publicar: abra `/` (o jogo), `/algo-que-nao-existe` (deve mostrar a 404 com status 404), `/manuscrito.html` e `/history.html`.
