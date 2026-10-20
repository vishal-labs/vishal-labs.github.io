# vishal-labs portfolio

My personal site, woven as a Jacquard loom: the homelab is the warp, every request a shuttle, and reliability, AI and web3 three silks that meet in a network built from real projects.

Next.js (static export), GSAP ScrollTrigger and a small WebGL2 renderer. Product context lives in `PRODUCT.md`, the design system in `DESIGN.md`.

## Develop

```sh
npm ci
npm run dev        # http://localhost:3000
npm run build      # static site in out/
```

All copy and links live in `lib/content.ts`.

## Host it with Docker

The image builds the static export, then serves it from unprivileged nginx on port 8080 inside the container (non-root, read-only filesystem, all capabilities dropped).

```sh
docker compose up -d --build                 # serves on http://localhost:8088
PORTFOLIO_PORT=9000 docker compose up -d     # or pick another host port
docker compose ps                            # shows (healthy) once /healthz answers
```

To update after a change: `git pull && docker compose up -d --build`.

Without Compose:

```sh
docker build -t vishal-labs/portfolio .
docker run -d --name portfolio -p 8088:8080 --read-only --tmpfs /tmp vishal-labs/portfolio
```

### Behind Nginx Proxy Manager and a Cloudflare Tunnel

1. Run the container on the Docker host and note the host port (8088 by default).
2. In Nginx Proxy Manager, add a proxy host for your domain forwarding to `http://<docker-host>:8088` (from inside the same Docker host, the bridge gateway works, as with the other self-hosted apps).
3. Route the domain through the Cloudflare Tunnel to Nginx Proxy Manager. TLS ends at Cloudflare's edge; no port opens at home.

nginx sends long-lived caching for hashed `/_next/static/` assets and `no-cache` for pages, so a new deploy shows up immediately.
