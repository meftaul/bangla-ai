# Deploy Guide — Pathshala

`.env` file with your Supabase values:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

## Build

`NEXT_PUBLIC_*` vars are baked in at build time, so they're passed as build args:

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$(grep NEXT_PUBLIC_SUPABASE_URL .env | cut -d= -f2)" \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="$(grep NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY .env | cut -d= -f2)" \
  -t pathshala:latest .
```

## Run

```bash
docker run -d --name pathshala --env-file .env -p 3000:3000 --restart unless-stopped pathshala:latest
```

## Nginx + Let's Encrypt (HTTPS)

On the host (Ubuntu):

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

Create `/etc/nginx/sites-available/bangla-ai`:

```nginx
server {
    server_name www.bangla.ai;
    return 301 https://bangla.ai$request_uri;
}

server {
    server_name bangla.ai;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable it and get the certificate:

```bash
sudo ln -s /etc/nginx/sites-available/bangla-ai /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d bangla.ai -d www.bangla.ai
```

Certbot rewrites the config for HTTPS and auto-renews via its systemd timer.
