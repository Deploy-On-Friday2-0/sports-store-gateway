const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..");
const nginxConfig = fs.readFileSync(path.join(root, "nginx.conf"), "utf8");
const proxyParams = fs.readFileSync(path.join(root, "proxy_params.conf"), "utf8");

const routes = [
  ["/", "https://d1rygqqor3hbbp.cloudfront.net"],
  ["/api/auth/", "http://auth:8001"],
  ["/api/products", "http://catalog:8002"],
  ["/api/internal/", "http://catalog:8002"],
  ["/api/cart", "http://cart:8003"],
  ["/api/orders", "http://order:8004"],
  ["/api/payments", "http://payment:8005"],
];

function locationBlock(route) {
  const escapedRoute = route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = nginxConfig.match(
    new RegExp(`location\\s+${escapedRoute}\\s*\\{([\\s\\S]*?)\\}`),
  );

  assert.ok(match, `missing Nginx location for ${route}`);
  return match[1];
}

test("routes requests to the expected services", () => {
  for (const [route, upstream] of routes) {
    const block = locationBlock(route);
    assert.match(block, new RegExp(`proxy_pass\\s+${upstream};`));
    assert.match(block, /include\s+\/etc\/nginx\/proxy_params\.conf;/);
  }
});

test("forwards the out-of-cluster frontend Host header to CloudFront", () => {
  const block = locationBlock("/");
  assert.match(
    block,
    /proxy_set_header\s+Host\s+d1rygqqor3hbbp\.cloudfront\.net;/,
  );
});

test("serves a static /health response for probes", () => {
  assert.match(nginxConfig, /location\s+=\s+\/health\s*\{\s*return\s+200;/);
});

test("forwards the original request identity and protocol", () => {
  const expectedDirectives = [
    "proxy_http_version 1.1;",
    "proxy_set_header Host $host;",
    "proxy_set_header X-Real-IP $remote_addr;",
    "proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;",
    "proxy_set_header X-Forwarded-Proto $scheme;",
  ];

  for (const directive of expectedDirectives) {
    assert.ok(proxyParams.includes(directive), `missing directive: ${directive}`);
  }
});
