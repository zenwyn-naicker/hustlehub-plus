/*Code Attribution: */
/**************************************************************************************************************
 * Author: Node.js Contributors
 * Date: 2026
 * Title: Node.js
 * Type: [Source Code]
 * Available at: <https://github.com/nodejs/node> [Accessed 28 August 2026]
 **************************************************************************************************************/
/**************************************************************************************************************
 * Author: Auth0
 * Date: 2026
 * Title: node-jsonwebtoken
 * Type: [Source Code]
 * Available at: <https://github.com/auth0/node-jsonwebtoken> [Accessed 28 August 2026]
 **************************************************************************************************************/
/**************************************************************************************************************
 * Author: Mongoose Contributors
 * Date: 2026
 * Title: Mongoose
 * Type: [Source Code]
 * Available at: <https://github.com/Automattic/mongoose> [Accessed 15 September 2026]
 **************************************************************************************************************/
/**************************************************************************************************************
 * Author: Postman
 * Date: 2026
 * Title: Newman
 * Type: [Source Code]
 * Available at: <https://github.com/postmanlabs/newman> [Accessed 15 September 2026]
 **************************************************************************************************************/
/**************************************************************************************************************
 * Author: mongodb-memory-server Contributors
 * Date: 2026
 * Title: mongodb-memory-server
 * Type: [Source Code]
 * Available at: <https://github.com/typegoose/mongodb-memory-server> [Accessed 15 September 2026]
 **************************************************************************************************************/

const path = require('node:path');
const fs = require('node:fs');
const https = require('node:https');
const assert = require('node:assert/strict');
const { randomBytes, randomUUID } = require('node:crypto');
const { spawn } = require('node:child_process');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const newman = require('newman');
process.env.NODE_ENV = 'test';
process.env.LOKI_HOST = ''; process.env.LOKI_USERNAME = ''; process.env.LOKI_PASSWORD = '';
process.env.JWT_SECRET = randomBytes(48).toString('hex');
process.env.BCRYPT_ROUNDS = '10'; // Test speed only. The actual application retains 12.
const { connectDatabase } = require('../src/config/database');
const User = require('../src/models/User');
const Booking = require('../src/models/Booking');
const Transaction = require('../src/models/Transaction');
const Gig = require('../src/models/Gig');
const { generateToken } = require('../src/utils/jwt');
const { loadHttpsCredentials } = require('../src/config/https');
const app = require('../src/app');
const evidence = path.resolve('evidence');
fs.mkdirSync(evidence, { recursive: true });
let repl, server, application;
function call(port, route, token, body, method = body ? 'POST' : 'GET') {
  return new Promise((resolve, reject) => {
    // This exception is scoped to the isolated local test certificate.
    const req = https.request({ hostname: 'localhost', port, path: '/api'+route, method,
      rejectUnauthorized: false, headers: { ...(token ? { Authorization: 'Bearer '+token } : {}), ...(body ? { 'Content-Type':'application/json' } : {}) }
    }, res => { let data=''; res.on('data', chunk => data+=chunk); res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) })); });
    req.on('error', reject); req.end(body ? JSON.stringify(body) : undefined);
  });
}
async function runAdmin(email) {
  const code = await new Promise(resolve => {
    const child = spawn(process.execPath, ['scripts/create-admin.js'], { env: { ...process.env, ADMIN_EMAIL: email, ADMIN_PASSWORD: 'GuideAdmin!12345' }, stdio: 'inherit' });
    child.on('exit', resolve);
  });
  return code;
}
async function main() {
  repl = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: 'wiredTiger' } });
  process.env.MONGODB_URI = repl.getUri('hustlehub_guide_test');
  assert.equal(await runAdmin('guide-admin@example.com'), 0);
  assert.notEqual(await runAdmin('guide-admin@example.com'), 0);
  assert.notEqual(await runAdmin('invalid-email'), 0);
  await connectDatabase();
  server = https.createServer(loadHttpsCredentials(), app);
  await new Promise(resolve => server.listen(0, 'localhost', resolve));
  const port = server.address().port;
  const summary = await new Promise((resolve, reject) => newman.run({
    collection: require('../../postman/marketplace.postman_collection.json'),
    envVar: [{ key:'baseUrl', value:`https://localhost:${port}` }, { key:'adminEmail', value:'guide-admin@example.com' }, { key:'adminPassword', value:'GuideAdmin!12345' }],
    insecure: true, reporters: ['cli', 'json'], reporter: { json: { export: path.join(evidence, 'newman.json') } }
  }, (error, result) => error ? reject(error) : resolve(result)));
  if (summary.run.failures.length) throw new Error(`${summary.run.failures.length} Newman failures`);
  console.log('Running additional database, concurrency and JWT checks…');
  const users = await User.find().select('+passwordHash');
  assert.ok(users.every(u => /^\$2[ab]\$/.test(u.passwordHash)));
  const client = users.find(u => u.role === 'client');
  const freelancer = users.find(u => u.role === 'freelancer');
  const freelancerToken = generateToken(freelancer);
  const anotherClient = users.find(u => u.role === 'client' && u.id !== client.id);
  const anotherToken = generateToken(anotherClient);
  const gig = await Gig.create({ title: 'Concurrent gig', description: 'Concurrency test listing', priceCents: 20000, freelancer: freelancer.id });
  const key = randomUUID();
  // Use an unthrottled second client after the collection intentionally exhausts the first client's limit.
  const replies = await Promise.all([call(port,'/bookings',anotherToken,{gigId:gig.id,requestKey:key}),call(port,'/bookings',anotherToken,{gigId:gig.id,requestKey:key})]);
  assert.deepEqual(replies.map(r=>r.status).sort(),[200,201]);
  assert.equal(await Booking.countDocuments({client:anotherClient.id,requestKey:key}),1);
  assert.equal(await Transaction.countDocuments({booking:replies[0].body.data.booking._id}),1);
  const create = Transaction.create;
  Transaction.create = async () => { throw new Error('Injected write failure'); };
  const before = await Booking.countDocuments();
  try { assert.equal((await call(port,'/bookings',anotherToken,{gigId:gig.id,requestKey:randomUUID()})).status,500); }
  finally { Transaction.create = create; }
  assert.equal(await Booking.countDocuments(),before);
  const jwt = require('jsonwebtoken');
  const claims = { role: client.role };
  for (const options of [{expiresIn:-1,issuer:'hustlehub-plus-api',audience:'hustlehub-plus-client'},
    {expiresIn:60,issuer:'wrong',audience:'hustlehub-plus-client'},
    {expiresIn:60,issuer:'hustlehub-plus-api',audience:'wrong'}]) {
    const token = jwt.sign(claims, process.env.JWT_SECRET, { subject:client.id, ...options });
    assert.equal((await call(port,'/gigs',token)).status,401);
  }
  await User.updateOne({_id:freelancer.id},{$set:{role:'client'}});
  assert.equal((await call(port,'/gigs',freelancerToken)).status,401);
  await User.updateOne({_id:freelancer.id},{$set:{role:'freelancer'}});
  // Start the actual server.js in a fresh process against the same database.
  await new Promise(resolve => server.close(resolve));
  application = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: String(port) }, stdio: 'inherit' });
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try { ready = (await call(port, '/health')).status === 200; } catch { /* Waiting for the restarted API. */ }
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, 'Actual server.js must start');
  const afterRestart = await call(port,'/bookings',anotherToken);
  assert.equal(afterRestart.status,200);
  assert.equal(afterRestart.body.data.bookings.length,1);
  fs.writeFileSync(path.join(evidence,'verification.json'), JSON.stringify({
    node:process.version, requests:summary.run.stats.requests.total, assertions:summary.run.stats.assertions.total,
    newmanFailures:0, additionalChecks:['admin provisioning and duplicate protection','bcrypt persisted','concurrent retry deduplication','transaction rollback','expired JWT','wrong issuer','wrong audience','changed role invalidates JWT','API restart persistence']
  },null,2));
  console.log('All additional integration checks passed.');
  if (process.argv.includes('--serve')) {
    const { hashPassword } = require('../src/utils/password');
    await User.create({name:'Browser Freelancer',email:'browser-free@example.com',role:'freelancer',passwordHash:await hashPassword('BrowserPass!12345')});
    await User.create({name:'Browser Client',email:'browser-client@example.com',role:'client',passwordHash:await hashPassword('BrowserPass!12345')});
    console.log(`BROWSER_URL=https://localhost:${port}`);
    await new Promise(resolve => process.once('SIGINT',resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode=1; }).finally(async () => {
  if (application && application.exitCode === null) {
    const exited = new Promise(resolve => application.once('exit', resolve));
    application.kill(); await exited;
  }
  if (server?.listening) await new Promise(resolve=>server.close(resolve));
  await mongoose.disconnect(); if (repl) await repl.stop();
});
