import test from 'node:test';
import assert from 'node:assert/strict';
import { createStaticServer } from '../app/server.js';
import { once } from 'node:events';

async function serve() {
  const server = createStaticServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  return { server, url: `http://127.0.0.1:${port}` };
}

test('server serves the lab and the shared modules over an allowlist', async () => {
  const { server, url } = await serve();
  try {
    for (const path of ['/', '/guide.html', '/styles.css', '/app.js', '/pairs.mjs', '/freshness.mjs', '/loop.mjs', '/harness.mjs', '/memory.mjs', '/gates.mjs', '/decision.mjs', '/fixtures.mjs']) {
      const res = await fetch(url + path);
      assert.equal(res.status, 200, `${path} should be served`);
    }
    const idx = await (await fetch(url + '/')).text();
    assert.match(idx, /Term Cost Lab/);
  } finally {
    server.close();
  }
});

test('/health and /version respond for the deploy platform', async () => {
  const { server, url } = await serve();
  try {
    assert.equal(await (await fetch(`${url}/health`)).text(), 'ok');
    const version = await (await fetch(`${url}/version`)).json();
    assert.equal(version.name, 'five-ai-terms-people-mix-up-demo');
    assert.ok(version.version);
  } finally {
    server.close();
  }
});

test('unknown paths and traversal attempts return 404', async () => {
  const { server, url } = await serve();
  try {
    for (const path of ['/nope', '/../package.json', '/%2e%2e/package.json', '/examples/needs.json']) {
      const res = await fetch(url + path);
      assert.equal(res.status, 404, `${path} must not be served`);
    }
  } finally {
    server.close();
  }
});

test('non-GET methods on static files are rejected', async () => {
  const { server, url } = await serve();
  try {
    const res = await fetch(url + '/', { method: 'POST', body: 'x' });
    assert.equal(res.status, 404);
  } finally {
    server.close();
  }
});
