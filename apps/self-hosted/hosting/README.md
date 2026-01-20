# Ecency Managed Hosting Platform

Multi-tenant hosting infrastructure for Ecency self-hosted blogs.

## Architecture Overview

```
                                   ┌─────────────────────────────────────┐
                                   │         DNS (Cloudflare)            │
                                   │  *.blogs.ecency.com → Load Balancer │
                                   │  Custom domains → CNAME validation  │
                                   └──────────────────┬──────────────────┘
                                                      │
                                   ┌──────────────────▼──────────────────┐
                                   │        Load Balancer (Traefik)       │
                                   │  - SSL termination (Let's Encrypt)   │
                                   │  - Dynamic routing by hostname       │
                                   │  - Rate limiting                     │
                                   └──────────────────┬──────────────────┘
                                                      │
              ┌───────────────────────────────────────┼───────────────────────────────────────┐
              │                                       │                                       │
    ┌─────────▼─────────┐                ┌───────────▼───────────┐              ┌────────────▼────────────┐
    │   Blog Instance   │                │    Blog Instance      │              │    Hosting API          │
    │   (nginx + SPA)   │                │    (nginx + SPA)      │              │    (Node.js/Deno)       │
    │                   │                │                       │              │                         │
    │ alice.blogs.ec... │                │ bob.blogs.ecency...   │              │ api.ecency.com/hosting  │
    │ config: alice.json│                │ config: bob.json      │              │                         │
    └───────────────────┘                └───────────────────────┘              └────────────┬────────────┘
                                                                                              │
                                                                           ┌──────────────────┼──────────────────┐
                                                                           │                  │                  │
                                                                  ┌────────▼────────┐ ┌───────▼───────┐ ┌────────▼────────┐
                                                                  │   Config DB     │ │ HBD Payment   │ │ Domain Verify   │
                                                                  │  (PostgreSQL)   │ │   Listener    │ │    Service      │
                                                                  │                 │ │               │ │                 │
                                                                  │ - Tenant configs│ │ - Watch txs   │ │ - CNAME check   │
                                                                  │ - Subscriptions │ │ - Auto-renew  │ │ - SSL provision │
                                                                  │ - Custom domains│ │ - Receipts    │ │                 │
                                                                  └─────────────────┘ └───────────────┘ └─────────────────┘
```

## Components

### 1. Traefik (Edge Router)
- Handles all incoming traffic
- Dynamic routing based on hostname
- Automatic SSL via Let's Encrypt
- Wildcard cert for `*.blogs.ecency.com`

### 2. Blog Instances
- Shared static SPA assets
- Per-tenant config.json
- Served via nginx

### 3. Hosting API
- Tenant management (CRUD)
- Subscription handling
- Config generation
- Domain verification

### 4. HBD Payment Listener
- Monitors Hive blockchain for payments
- Activates/renews subscriptions
- Sends notifications

## Deployment Models

### Model A: Shared Container (Recommended for Scale)
All tenants share a single nginx container with dynamic config routing.

```
┌─────────────────────────────────────┐
│           Nginx Container            │
│  /usr/share/nginx/html/             │
│  ├── index.html (shared SPA)        │
│  ├── static/ (shared assets)        │
│  └── configs/                       │
│      ├── alice.json                 │
│      ├── bob.json                   │
│      └── carol.json                 │
│                                     │
│  Config routing via $host header    │
└─────────────────────────────────────┘
```

### Model B: Container Per Tenant (Isolation)
Each tenant gets their own container. Higher resource usage but better isolation.

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Alice     │  │    Bob      │  │   Carol     │
│  Container  │  │  Container  │  │  Container  │
└─────────────┘  └─────────────┘  └─────────────┘
```

## Files

- `docker-compose.yml` - Full hosting stack
- `traefik/` - Traefik configuration
- `nginx/` - Multi-tenant nginx config
- `api/` - Hosting management API
- `scripts/` - Utility scripts

## Quick Start

```bash
# Start the hosting platform
docker-compose up -d

# Add a new tenant
./scripts/add-tenant.sh alice

# Check tenant status
./scripts/tenant-status.sh alice
```
