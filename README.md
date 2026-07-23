# Sports Store Gateway

NGINX edge gateway for the Sports Store platform. It is the platform's single public entry point and routes `/api` traffic to the backend services.

## Contents

- `nginx.conf`: Gateway routing and static-content configuration
- `proxy_params.conf`: Shared reverse-proxy headers
- `Dockerfile`: Starter container definition

The Dockerfile and upstream service names still contain containerization TODOs. The original starter built the frontend inside the gateway image; the polyrepo implementation should consume a versioned frontend artifact or route to a separately deployed frontend rather than reading another repository's working tree.
