# Ecency Self-Hosted Blog - Deployment Guide

Deploy your own blog powered by the Hive blockchain. This guide covers Docker deployment for the self-hosted Ecency blog application.

## Table of Contents

- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Deployment Options](#deployment-options)
- [Production Deployment](#production-deployment)
- [Custom Domain & SSL](#custom-domain--ssl)
- [Updating](#updating)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites

- Docker 20.10+ and Docker Compose 2.0+
- A Hive blockchain account (for blog mode)
- (Optional) A domain name for production deployment

### 1. Clone and Configure

```bash
# Clone the repository
git clone https://github.com/ecency/vision-next.git
cd vision-next/apps/self-hosted

# Copy the config template
cp config.template.json config.json
```

### 2. Edit Configuration

Edit `config.json` with your settings:

```json
{
  "version": 1,
  "configuration": {
    "general": {
      "theme": "system",
      "styleTemplate": "medium",
      "language": "en",
      "imageProxy": "https://images.ecency.com"
    },
    "instanceConfiguration": {
      "type": "blog",
      "username": "YOUR_HIVE_USERNAME",
      "meta": {
        "title": "My Hive Blog",
        "description": "My personal blog on Hive",
        "favicon": "https://your-favicon-url.com/favicon.ico"
      }
    }
  }
}
```

### 3. Start the Application

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f
```

Your blog is now running at `http://localhost:3000`

## Configuration

### Instance Types

#### Blog Mode (Personal Blog)

Display posts from a single Hive account:

```json
{
  "instanceConfiguration": {
    "type": "blog",
    "username": "your-hive-username"
  }
}
```

#### Community Mode

Display posts from a Hive community:

```json
{
  "instanceConfiguration": {
    "type": "community",
    "communityId": "hive-123456"
  }
}
```

### Theme Options

| Style Template | Description |
|----------------|-------------|
| `medium` | Editorial style (default) |
| `minimal` | Clean, minimalist |
| `magazine` | Magazine layout |
| `developer` | Tech-focused |
| `modern-gradient` | Modern with gradients |

### Feature Flags

Enable/disable features in your config:

```json
{
  "features": {
    "likes": { "enabled": true },
    "comments": { "enabled": true },
    "post": {
      "text2Speech": { "enabled": true }
    },
    "auth": {
      "enabled": true,
      "methods": ["keychain", "hivesigner", "hiveauth"]
    }
  }
}
```

### Layout Options

```json
{
  "layout": {
    "listType": "list",  // or "grid"
    "sidebar": {
      "placement": "right",  // or "left"
      "followers": { "enabled": true },
      "following": { "enabled": true },
      "hiveInformation": { "enabled": true }
    }
  }
}
```

## Deployment Options

### Option 1: Docker Compose (Recommended)

```bash
# Start in detached mode
docker-compose up -d

# Custom port
PORT=8080 docker-compose up -d
```

### Option 2: Docker Run

```bash
# Build the image
docker build -t myblog -f Dockerfile ../..

# Run with config volume mount
docker run -d \
  -p 3000:80 \
  -v $(pwd)/config.json:/usr/share/nginx/html/config.json:ro \
  --name myblog \
  myblog
```

### Option 3: Pre-built Image

```bash
# Pull from Docker Hub (when available)
docker pull ecency/self-hosted:latest

# Run with your config
docker run -d \
  -p 3000:80 \
  -v $(pwd)/config.json:/usr/share/nginx/html/config.json:ro \
  ecency/self-hosted:latest
```

### Option 4: Build with Config Baked In

For immutable deployments (e.g., Kubernetes), use base64 encoding to safely pass the config:

```bash
# Encode config as base64 to avoid shell interpolation issues
CONFIG_B64=$(base64 -w0 config.json)  # Linux
# or: CONFIG_B64=$(base64 -i config.json)  # macOS

# Build with base64-encoded config
docker build \
  --build-arg CONFIG_JSON_B64="$CONFIG_B64" \
  -t myblog:configured \
  -f Dockerfile ../..
```

The Dockerfile should decode this during build:

```dockerfile
ARG CONFIG_JSON_B64
RUN echo "$CONFIG_JSON_B64" | base64 -d > /usr/share/nginx/html/config.json
```

**Alternative: COPY method** (simpler, requires config.json in build context):

```dockerfile
# In Dockerfile, add:
COPY apps/self-hosted/config.json /usr/share/nginx/html/config.json
```

Then build without build-args:
```bash
docker build -t myblog:configured -f Dockerfile ../..
```

## Production Deployment

### With Traefik (Automatic SSL)

Create `docker-compose.production.yml`:

```yaml
services:
  blog:
    build:
      context: ../..
      dockerfile: apps/self-hosted/Dockerfile
    restart: unless-stopped
    volumes:
      - ./config.json:/usr/share/nginx/html/config.json:ro
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.blog.rule=Host(`blog.yourdomain.com`)"
      - "traefik.http.routers.blog.entrypoints=websecure"
      - "traefik.http.routers.blog.tls.certresolver=letsencrypt"
      - "traefik.http.services.blog.loadbalancer.server.port=80"

  traefik:
    image: traefik:v3.0
    restart: unless-stopped
    command:
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--entrypoints.web.http.redirections.entrypoint.to=websecure"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.letsencrypt.acme.email=you@example.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "letsencrypt:/letsencrypt"

volumes:
  letsencrypt:
```

### With Caddy (Simple SSL)

```bash
# Caddyfile
blog.yourdomain.com {
    reverse_proxy blog:80
}
```

### With Nginx Reverse Proxy

```nginx
server {
    listen 443 ssl http2;
    server_name blog.yourdomain.com;

    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Custom Domain & SSL

### Cloudflare (Easiest)

1. Point your domain's DNS to your server IP
2. Enable Cloudflare proxy (orange cloud)
3. SSL mode: Full (strict)
4. Run without SSL on your server (Cloudflare handles it)

### Let's Encrypt (Certbot)

```bash
# Install certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d blog.yourdomain.com

# Auto-renewal is configured automatically
```

## Updating

### Update with Docker Compose

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Update Configuration Only

Since config.json is mounted as a volume, you can update it without rebuilding:

```bash
# Edit config
nano config.json

# Restart to pick up changes (or just refresh browser)
docker-compose restart
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs blog

# Check if port is in use
lsof -i :3000
```

### Config Changes Not Reflected

1. Make sure `config.json` is mounted correctly
2. Hard refresh browser (Ctrl+Shift+R)
3. Check nginx is serving the right file:

```bash
docker-compose exec blog cat /usr/share/nginx/html/config.json
```

### Build Failures

```bash
# Clean Docker cache
docker system prune -a

# Rebuild from scratch
docker-compose build --no-cache
```

### Performance Issues

1. Enable gzip compression (already configured in nginx.conf)
2. Use a CDN like Cloudflare
3. Ensure image proxy is fast (default: images.ecency.com)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Your Server                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Docker Container                      │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │                 Nginx                        │  │  │
│  │  │  ┌────────────────────────────────────────┐ │  │  │
│  │  │  │        Static Files (SPA)              │ │  │  │
│  │  │  │  - index.html                          │ │  │  │
│  │  │  │  - JS/CSS bundles                      │ │  │  │
│  │  │  │  - config.json (runtime config)        │ │  │  │
│  │  │  └────────────────────────────────────────┘ │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
│                          │                              │
│                          │ Port 80/443                  │
└──────────────────────────┼──────────────────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Internet   │
                    └──────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │    Hive Blockchain     │
              │  (API: api.hive.blog)  │
              └────────────────────────┘
```

---

## Managed Hosting by Ecency

Don't want to manage your own infrastructure? Let Ecency host your blog.

### Pricing

| Plan | Price | Features |
|------|-------|----------|
| **Standard** | 1 HBD/month | Custom subdomain, SSL, CDN, 99.9% uptime |
| **Pro** | 3 HBD/month | Custom domain, priority support, analytics |

### How to Get Started

1. **Visit** [ecency.com/blog-hosting](https://ecency.com/blog-hosting)
2. **Connect** your Hive wallet
3. **Configure** your blog (username, theme, features)
4. **Pay** via HBD transfer to `@ecency.hosting`
5. **Go live** instantly!

### Custom Domain Setup

For custom domains, add a CNAME record:

```
Type:  CNAME
Name:  blog (or @ for root domain)
Value: YOUR-BLOG-ID.blogs.ecency.com
TTL:   3600
```

**Example:**
- Your domain: `myblog.com`
- CNAME: `myblog.com` → `alice.blogs.ecency.com`

### Payment Memo Format

When paying via HBD transfer:

```
To: @ecency.hosting
Amount: 1.000 HBD
Memo: blog:YOUR_HIVE_USERNAME
```

For renewals, use the same memo format. Subscriptions auto-renew if balance is available.

### Managed Hosting API

Programmatic access for advanced users:

```bash
# Check subscription status
curl https://api.ecency.com/blog-hosting/status/YOUR_USERNAME

# Get config
curl https://api.ecency.com/blog-hosting/config/YOUR_USERNAME
```

---

## Support

- GitHub Issues: https://github.com/ecency/vision-next/issues
- Discord: https://discord.gg/ecency
- Hive: @ecency

## License

MIT License - see LICENSE file for details.
