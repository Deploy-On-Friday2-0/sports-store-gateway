# Sports Store Gateway

NGINX reverse proxy and single public entry point for Sports Store. It serves the frontend through a separate frontend container and sends API paths to the correct backend service.

## Request routing

| Incoming path | Upstream container |
| --- | --- |
| `/` | `frontend:80` |
| `/api/auth/` | `auth:8001` |
| `/api/products` and `/api/internal/` | `catalog:8002` |
| `/api/cart` | `cart:8003` |
| `/api/orders` | `order:8004` |
| `/api/payments` | `payment:8005` |

The upstream names are Docker Compose or Kubernetes service names, not public DNS names. `proxy_params.conf` forwards the host, client address, scheme, and request ID. The current `/api/internal/` route is intentionally exposed for course demonstrations; a production design should keep it inside the service network.

## Stack and repository layout

- NGINX Alpine provides routing on port `80`.
- `nginx.conf` defines routes and the 2 MiB request-body limit.
- `proxy_params.conf` defines shared proxy headers.
- `Dockerfile` builds the non-root runtime image.
- `tests/gateway-config.test.js` validates routing; `review_runner/` has [separate documentation](review_runner/README.md).

## Local development

Prerequisites: Docker for the container, or NGINX plus resolvable upstream service names. This repository is normally run with [sports-store-local](https://github.com/Deploy-On-Friday2-0/sports-store-local).

```bash
npm ci
npm run lint
npm test
docker build -t sports-store-gateway:local .
```

Running this image alone will produce upstream-resolution errors unless services named `frontend`, `auth`, `catalog`, `cart`, `order`, and `payment` share its container network.

## CI/CD and deployment

`PR Quality` validates the branch, runs ESLint and Node tests, scans for secrets with Gitleaks, checks the Dockerfile with Checkov, and scans the image with Trivy. `Publish Production Image` pushes to Amazon ECR and updates the gateway image in [sports-store-deployments](https://github.com/Deploy-On-Friday2-0/sports-store-deployments). The production gateway is exposed through the Kubernetes ingress/load balancer configured there; cloud resources are in [sports-store-infrastructure](https://github.com/Deploy-On-Friday2-0/sports-store-infrastructure).

## Configuration, security, and troubleshooting

Gateway runtime routing is configured in `nginx.conf`; there are no application environment variables. `.env.example` contains only optional review-runner settings.

- A `502 Bad Gateway` means the named upstream is unavailable or cannot be resolved. Check container/service names and ports.
- Keep backend services private wherever possible and expose only the gateway.
- Preserve forwarded request IDs when adding routes, and never place secrets in NGINX files or images.
- Run `nginx -t` inside a built image when diagnosing syntax. Follow [CONTRIBUTING.md](CONTRIBUTING.md) for changes.
