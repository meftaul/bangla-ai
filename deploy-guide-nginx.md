# Nginx tuning for bangla.ai mobile performance — step-by-step

Goal: cut first-load transfer size for the landing page `/` by enabling
**brotli + gzip** at nginx and caching static assets efficiently. Today nginx is
a bare reverse proxy — no compression, no caching block — so all compression
falls to Next's node server, which does **gzip only, no brotli** (verified live:
`Accept-Encoding: br` returns uncompressed bytes).

**Deployment context:** app runs in Docker (`node server.js`, standalone) bound
to `127.0.0.1:3000`; nginx on the Ubuntu host reverse-proxies it; TLS via
certbot. Existing config: `/etc/nginx/sites-available/bangla-ai`.

---

## Step 1 — Install the brotli module

Node cannot emit brotli; nginx can, but needs the dynamic module (Ubuntu 24.04
ships it as a package):

```bash
sudo apt update
sudo apt install -y libnginx-mod-http-brotli
```

Verify the modules are present (the package auto-drops load files in
`/etc/nginx/modules-enabled/`):

```bash
ls /etc/nginx/modules-enabled/ | grep brotli
# expect: 50-mod-http-brotli-filter.conf  50-mod-http-brotli-static.conf
```

If the package is unavailable on your host, **skip brotli** and do gzip only
(Step 3 keeps working; just omit the `brotli*` lines and Step 2's Next change).

## Step 2 — Tell Next to stop compressing (hand compression to nginx)

So nginx receives uncompressed bytes and can pick **brotli or gzip** per the
client. Edit `next.config.ts` in the repo:

```ts
const nextConfig: NextConfig = {
  output: "standalone",
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  compress: false, // nginx does gzip + brotli; node cannot brotli
};
```

Rebuild + redeploy the Docker image after this change (see `deploy-guide.md`).

> If you are **not** installing brotli (Step 1 skipped), leave `compress` at its
> default (`true`) and do gzip at nginx anyway — harmless, node's gzip just wins.

## Step 3 — Add compression to the nginx server block

Edit `/etc/nginx/sites-available/bangla-ai`. Add these lines **inside** the
`server { server_name bangla.ai; ... }` block (the HTTPS one certbot manages),
alongside the existing `location /`:

```nginx
    # --- Compression (brotli preferred, gzip fallback) ---
    gzip on;
    gzip_vary on;
    gzip_comp_level 6;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css application/javascript application/json
               image/svg+xml font/woff2 application/manifest+json;

    brotli on;
    brotli_comp_level 6;
    brotli_types text/plain text/css application/javascript application/json
                 image/svg+xml font/woff2 application/manifest+json;
```

Notes:
- `woff2` is already compressed internally, so compression barely helps fonts —
  keeping it in the list is harmless. The real wins are the JS/CSS chunks
  (~200 KB gzip today → ~15–20 % smaller with brotli).
- Put these at the `server` level so they apply to the proxied `/` responses.

## Step 4 — (Optional but recommended) far-future cache for hashed static assets

Next already sends `Cache-Control: public, max-age=31536000, immutable` on
`/_next/static/*`, so browsers cache correctly on repeat visits even without
this. This block mainly ensures nginx passes those responses through cleanly and
compresses them. Add **above** the existing `location /`:

```nginx
    # Hashed, immutable build assets — compress + let the browser cache hard.
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        access_log off;
    }
```

(Serving these files directly from disk with `alias` is faster still, but the
files live *inside* the Docker container — that needs a bind-mount and is left
out here to keep this guide deploy-safe. The proxied version above is the
low-risk win.)

## Step 5 — Keep the existing proxy + cookie buffers

Do **not** remove the current `location /` block — it carries the Supabase
cookie buffer tuning. Final shape of the server block:

```nginx
server {
    server_name bangla.ai;

    # Step 3 compression lines here (gzip + brotli) ...

    # Step 4 static block here ...
    location /_next/static/ { ... }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;

        # Supabase writes large chunked session cookies on /auth/callback
        proxy_buffer_size       16k;
        proxy_buffers           8 16k;
        proxy_busy_buffers_size 32k;
    }

    # certbot-managed listen 443 / ssl_certificate lines stay as-is
}
```

## Step 6 — Test config and reload

```bash
sudo nginx -t          # must print "syntax is ok" / "test is successful"
sudo systemctl reload nginx
```

If `nginx -t` fails on `brotli` being unknown, the module from Step 1 isn't
loaded — recheck `/etc/nginx/modules-enabled/` or remove the `brotli*` lines.

## Step 7 — Verify from outside

```bash
# Brotli negotiated on a JS chunk?
CHUNK=$(curl -sS https://bangla.ai/ | grep -oE '/_next/static/chunks/[^"]+\.js' | head -1)
curl -sS -o /dev/null -D - -H 'Accept-Encoding: br' "https://bangla.ai$CHUNK" \
  | grep -i 'content-encoding'
# expect: content-encoding: br

# gzip still works for clients without brotli?
curl -sS -o /dev/null -D - -H 'Accept-Encoding: gzip' "https://bangla.ai$CHUNK" \
  | grep -i 'content-encoding'
# expect: content-encoding: gzip

# Immutable caching header present on static?
curl -sS -o /dev/null -D - "https://bangla.ai$CHUNK" | grep -i 'cache-control'
# expect: cache-control: public, max-age=31536000, immutable
```

Then re-run Lighthouse mobile on `https://bangla.ai/` and compare the transfer
size / LCP against the baseline.

---

## Update the repo doc too

Mirror Steps 1, 3, 4 into `deploy-guide.md` (the nginx code block) and the
`next.config.ts` change from Step 2, so a fresh deploy reproduces this instead of
the bare passthrough.

## Rollback

Remove the added `gzip`/`brotli`/`location /_next/static/` lines, set
`compress: true` (or drop the line) in `next.config.ts`, then
`sudo nginx -t && sudo systemctl reload nginx`. Zero data risk — these are
transport/caching only.
