const https = require('node:https');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const port = Number(process.env.STACK_PORT || 3443);
// Local self-signed certificate only; this script never contacts a remote host.
function call(route, token, body, method = body ? 'POST' : 'GET') {
  return new Promise((resolve, reject) => {
    const request = https.request({ hostname: 'localhost', port, path: route, method, rejectUnauthorized: false,
      headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }
    }, response => { let text = ''; response.on('data', chunk => text += chunk); response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, text, data: response.headers['content-type']?.includes('application/json') ? JSON.parse(text) : null })); });
    request.setTimeout(10000, () => request.destroy(new Error('Local stack request timed out.')));
    request.on('error', reject); request.end(body ? JSON.stringify(body) : undefined);
  });
}
async function run() {
  const home = await call('/');
  assert.equal(home.status, 200); assert.match(home.text, /<div id="root"><\/div>/);
  assert.match(home.headers['content-security-policy'], /script-src 'self'/);
  const asset = home.text.match(/src="(\/assets\/[^"]+\.js)"/)[1];
  assert.equal((await call(asset)).status, 200);
  assert.equal((await call('/api/unknown')).status, 404);
  assert.equal((await call('//example.com/')).status, 400);
  const suffix = randomUUID(), password = 'StackTest!' + randomUUID();
  const freelancerEmail = 'free-' + suffix + '@example.com', clientEmail = 'client-' + suffix + '@example.com';
  for (const [email, role] of [[freelancerEmail, 'freelancer'], [clientEmail, 'client']]) {
    const reply = await call('/api/auth/register', null, { name: 'Container Test', email, password, role });
    assert.equal(reply.status, 201);
  }
  const freeLogin = await call('/api/auth/login', null, { email: freelancerEmail, password });
  const clientLogin = await call('/api/auth/login', null, { email: clientEmail, password });
  assert.equal(freeLogin.status, 200); assert.equal(clientLogin.status, 200);
  const freeToken = freeLogin.data.data.token, clientToken = clientLogin.data.data.token;
  const gig = await call('/api/gigs', freeToken, { title: 'Container gig', description: 'Verified container workflow', priceCents: 12550 });
  assert.equal(gig.status, 201);
  const body = { gigId: gig.data.data.gig._id, requestKey: randomUUID() };
  assert.equal((await call('/api/bookings', clientToken, body)).status, 201);
  assert.equal((await call('/api/bookings', clientToken, body)).status, 200);
  const finance = await call('/api/finance', freeToken);
  assert.equal(finance.status, 200); assert.equal(finance.data.data.summary.grossCents, 12550);
  assert.equal(finance.data.data.summary.taxCents, 2510); assert.equal(finance.data.data.summary.netCents, 10040);
  assert.equal((await call('/api/finance', clientToken)).status, 403);
  assert.equal((await call('/api/auth/logout', clientToken, {})).status, 200);
  assert.equal((await call('/api/protected/profile', clientToken)).status, 401);
  // Fixed executable and arguments, with no shell or user-supplied command text.
  const restarted = spawnSync('docker', ['compose', '--env-file', '.env.compose', 'restart', 'api'], { stdio: 'inherit' });
  if (restarted.error) throw restarted.error;
  assert.equal(restarted.status, 0);
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await call('/api/health')).status === 200) { ready = true; break; } } catch { /* Waiting for the local container. */ }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  assert.ok(ready, 'API recovered after restart');
  assert.equal((await call('/api/protected/profile', clientToken)).status, 401);
  assert.equal((await call('/api/finance', freeToken)).data.data.summary.grossCents, 12550);
  fs.mkdirSync('artifacts', { recursive: true });
  fs.writeFileSync('artifacts/stack-verification.json', JSON.stringify({ status: 'passed', checkedAt: new Date().toISOString(), checks: ['frontend container through HTTPS', 'CSP and built asset', 'proxy origin boundary', 'registration and login', 'booking and idempotency', 'finance and tax', 'role restriction', 'logout revocation', 'restart persistence'] }, null, 2));
  console.log('Container verification passed: frontend, API, MongoDB, finance, permissions and restart persistence.');
}
run().catch(error => { console.error(error.message); process.exitCode = 1; });