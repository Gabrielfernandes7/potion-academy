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

## App instalável e jogo sem conexão (PWA)

O build publica `manifest.webmanifest`, os ícones (`icons/`) e o service worker `sw.js` (registrado por `src/pwa.ts`, só em produção). O que isso dá:
- **Instalar:** no Chrome/Edge (menu, "Instalar Potion Academy") e no Safari do iPhone/iPad (Compartilhar, "Adicionar à Tela de Início"); abre em janela própria, sem a barra do navegador.
- **Sem conexão:** depois da primeira visita o jogo abre offline. Os arquivos com hash (`/assets/*`) vêm do cache; a página e as imagens tentam a rede primeiro (para pegar versões novas) e caem no cache. Conferido: com a rede desligada, o recarregamento mostra o menu e o jogo.
- **Hospedagem:** `sw.js` e o manifesto precisam ser servidos na **mesma pasta** do jogo (a raiz do site, ou o `base` do Vite) e por **HTTPS** (ou `localhost`). Serviço de worker não funciona em `file://`.
- **Atualizar tudo à força:** aumente `CACHE` em `public/sw.js` (`potion-academy-v1` para `-v2`); o worker apaga os caches antigos ao ativar. Para desligar num aparelho, abra o jogo com `?nosw` e limpe os dados do site.
- **Ícones:** `node scripts/make-icons.cjs` os refaz a partir de `public/favicon.svg` (192, 512, "maskable" 512 e o do iOS, 180).
- **Pendências do endereço final** (ver acima) valem também para o manifesto: `start_url` e `scope` são relativos (`./`), então funcionam em qualquer pasta.
