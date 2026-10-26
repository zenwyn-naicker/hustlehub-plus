const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');
const assert = require('node:assert/strict');
const { randomBytes, randomUUID } = require('node:crypto');
const { spawn } = require('node:child_process');
const mongoose = require('mongoose');
const newman = require('newman');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = randomBytes(48).toString('hex');
process.env.BCRYPT_ROUNDS = '10';
process.env.LOKI_HOST = ''; process.env.LOKI_USERNAME = ''; process.env.LOKI_PASSWORD = '';
const { connectDatabase } = require('../src/config/database');
const { loadHttpsCredentials } = require('../src/config/https');
const { hashPassword } = require('../src/utils/password');
const { generateToken } = require('../src/utils/jwt');
const { flushAudit } = require('../src/utils/audit');
const User = require('../src/models/User');
const Transaction = require('../src/models/Transaction');
const RevokedToken = require('../src/models/RevokedToken');
const app = require('../src/app');
const logs = [], originalLog = console.log;
console.log = (...args) => {
  if (typeof args[0] === 'string' && args[0].startsWith('{')) {
    try { logs.push(JSON.parse(args[0])); return; } catch { /* Non-JSON diagnostic. */ }
  }
  originalLog(...args);
};
let repl, server, child;
function call(port, route, token, body, method = body ? 'POST' : 'GET') {
  return new Promise((resolve, reject) => {
    const request = https.request({ hostname: 'localhost', port, path: '/api' + route, method,
      rejectUnauthorized: false, headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }
    }, response => { let text = ''; response.on('data', chunk => text += chunk); response.on('end', () => resolve({ status: response.statusCode, data: JSON.parse(text) })); });
    request.on('error', reject); request.end(body ? JSON.stringify(body) : undefined);
  });
}
async function run() {
  repl = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  process.env.MONGODB_URI = repl.getUri('hustlehub_security_test'); await connectDatabase();
  server = https.createServer(loadHttpsCredentials(), app);
  await new Promise(resolve => server.listen(0, 'localhost', resolve));
  const port = server.address().port;
  const result = await new Promise((resolve, reject) => newman.run({
    collection: require('../../postman/security.postman_collection.json'), insecure: true,
    envVar: [{ key: 'baseUrl', value: `https://localhost:${port}` }], reporters: ['cli']
  }, (error, summary) => error ? reject(error) : resolve(summary)));
  assert.equal(result.run.failures.length, 0);
  const password = 'PartThree!12345';
  const passwordHash = await hashPassword(password);
  const freelancer = await User.create({ name: 'Browser Freelancer', email: 'browser-free@example.com', role: 'freelancer', passwordHash });
  const client = await User.create({ name: 'Browser Client', email: 'browser-client@example.com', role: 'client', passwordHash });
  const other = await User.create({ name: 'Other Freelancer', email: 'other-free@example.com', role: 'freelancer', passwordHash });
  const admin = await User.create({ name: 'Final Admin', email: 'browser-admin@example.com', role: 'admin', passwordHash });
  const freeToken = generateToken(freelancer), clientToken = generateToken(client);
  const gig = await call(port, '/gigs', freeToken, { title: 'Financial test gig', description: 'Verified financial flow', priceCents: 12550 });
  assert.equal(gig.status, 201);
  const booking = await call(port, '/bookings', clientToken, { gigId: gig.data.data.gig._id, requestKey: randomUUID() });
  assert.equal(booking.status, 201);
  const year = new Date().getUTCFullYear();
  const finance = await call(port, `/finance?year=${year}`, freeToken);
  assert.equal(finance.status, 200);
  assert.equal(finance.data.data.summary.grossCents, 12550); assert.equal(finance.data.data.summary.taxCents, 2510);
  assert.equal(finance.data.data.summary.netCents, 10040);
  assert.equal((await call(port, '/finance', generateToken(other))).data.data.summary.grossCents, 0);
  assert.equal((await call(port, '/finance', generateToken(admin))).status, 403);
  assert.equal((await call(port, '/finance?year=2026&year=2025', freeToken)).status, 400);
  await Transaction.create({ booking: randomUUID(), client: client.id, freelancer: freelancer.id, amountCents: 999,
    createdAt: new Date(Date.UTC(year - 1, 11, 31, 23, 59, 59)) });
  assert.equal((await call(port, `/finance?year=${year}`, freeToken)).data.data.summary.grossCents, 12550);
  assert.equal((await call(port, `/finance?year=${year - 1}`, freeToken)).data.data.summary.grossCents, 999);
  assert.equal((await call(port, '/auth/logout', clientToken, undefined, 'POST')).status, 200);
  assert.equal((await call(port, '/bookings', clientToken)).status, 401);
  assert.equal(await RevokedToken.countDocuments(), 2); // Newman token plus this token.
  const locked = await User.findOne({ email: /^final-client-/ });
  assert.equal(locked.failedLogins, 5); assert.ok(locked.lockedUntil > new Date());
  await User.updateOne({ _id: locked.id }, { $set: { lockedUntil: new Date(Date.now() - 1) } });
  assert.equal((await call(port, '/auth/login', null, { email: locked.email, password })).status, 200);
  assert.equal((await User.findById(locked.id)).failedLogins, 0);
  await User.updateOne({ _id: locked.id }, { $set: { lockedUntil: new Date(Date.now() + 300000), failedLogins: 5 } });
  assert.equal((await call(port, '/unknown-route')).status, 404);
  assert.ok(logs.some(record => record.event === 'request.error'));
  await new Promise(resolve => server.close(resolve));
  child = spawn(process.execPath, ['server.js'], { env: { ...process.env, HOST: 'localhost', PORT: String(port) }, stdio: 'inherit' });
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try { ready = (await call(port, '/health')).status === 200; } catch { /* Waiting for database connection. */ }
    if (ready) break; await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, 'API must restart');
  assert.equal((await call(port, '/bookings', clientToken)).status, 401);
  assert.equal((await call(port, '/auth/login', null, { email: locked.email, password })).status, 401);
  assert.equal((await call(port, '/finance', freeToken)).data.data.summary.grossCents, 12550);
  for (const event of ['auth.login_failed', 'auth.login_success', 'auth.logout', 'booking.confirmed', 'transaction.recorded', 'http.request'])
    assert.ok(logs.some(record => record.event === event), event);
  assert.equal((await call(port, '/unknown-route')).status, 404);
  const serialised = JSON.stringify(logs);
  for (const secret of [password, freeToken, clientToken, freelancer.email, process.env.JWT_SECRET]) assert.ok(!serialised.includes(secret));
  fs.mkdirSync('evidence', { recursive: true });
  fs.writeFileSync(path.join('evidence', 'security-verification.json'), JSON.stringify({ requests: result.run.stats.requests.total,
    assertions: result.run.stats.assertions.total, failures: 0, checks: ['tax totals', 'UTC year boundaries', 'owner isolation', 'admin denial',
      'query validation', 'logout revocation', 'lock expiry', 'persistent revocation', 'persistent lockout', 'finance persistence', 'structured log events', 'secret exclusion'] }, null, 2));
  fs.writeFileSync(path.join('evidence', 'security-safe-logs.json'), JSON.stringify(logs, null, 2));
  console.log('Security checks passed.');
  if (process.argv.includes('--serve')) {
    console.log(`BROWSER_URL=https://localhost:${port}`);
    await new Promise(resolve => process.once('SIGINT', resolve));
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (child && child.exitCode === null) { const stopped = new Promise(resolve => child.once('exit', resolve)); child.kill(); await stopped; }
  if (server?.listening) await new Promise(resolve => server.close(resolve));
  await flushAudit(); await mongoose.disconnect(); if (repl) await repl.stop(); console.log = originalLog;
});
