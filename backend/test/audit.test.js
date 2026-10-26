const { test } = require('node:test');
const assert = require('node:assert/strict');
const { audit, buildEvent, flushAudit, validateLogConfiguration } = require('../src/utils/audit');
test('logs accept only the bounded schema, not secrets or arbitrary fields', () => {
  const event = buildEvent('test', { requestId: 'x', userId: 'a'.repeat(1000), password: 'secret', token: 'jwt',
    headers: { Authorization: 'secret' }, email: 'private@example.com', body: { secret: true } });
  assert.equal(event.userId.length, 160);
  assert.equal(event.password, undefined); assert.equal(event.headers, undefined);
  assert.equal(event.token, undefined); assert.equal(event.email, undefined); assert.equal(event.body, undefined);
});
function mockLogging(t) {
  const previous = Object.fromEntries(Object.entries(process.env).filter(([key]) => key.startsWith('LOKI_')));
  t.after(async () => {
    await flushAudit();
    delete process.env.LOKI_HOST; delete process.env.LOKI_USERNAME; delete process.env.LOKI_PASSWORD;
    Object.assign(process.env, previous);
  });
  process.env.LOKI_HOST = 'https://example.invalid';
  process.env.LOKI_USERNAME = '123456'; process.env.LOKI_PASSWORD = 'test-only-token';
  const records = [];
  t.mock.method(console, 'log', line => records.push(JSON.parse(line)));
  t.mock.method(console, 'error', line => records.push(JSON.parse(line)));
  return records;
}

test('Loki configuration rejects partial credentials and unsafe destinations', t => {
  mockLogging(t);
  validateLogConfiguration();
  for (const host of ['http://example.invalid', 'https://user:pass@example.invalid',
    'https://example.invalid/path', 'https://example.invalid?token=secret', 'https://example.invalid#secret']) {
    process.env.LOKI_HOST = host;
    assert.throws(validateLogConfiguration);
  }
  process.env.LOKI_HOST = 'https://example.invalid';
  process.env.LOKI_USERNAME = 'not-an-instance-id'; assert.throws(validateLogConfiguration);
  process.env.LOKI_USERNAME = ''; assert.throws(validateLogConfiguration);
  process.env.LOKI_USERNAME = '123456';
  process.env.LOKI_PASSWORD = ''; assert.throws(validateLogConfiguration);
  process.env.LOKI_PASSWORD = 'test-only-token';
  process.env.LOKI_HOST = ''; assert.throws(validateLogConfiguration);
});

test('console-only logging makes no cloud requests', async t => {
  const records = mockLogging(t);
  delete process.env.LOKI_HOST; delete process.env.LOKI_USERNAME; delete process.env.LOKI_PASSWORD;
  validateLogConfiguration();
  const request = t.mock.method(global, 'fetch', async () => { throw new Error('Unexpected cloud request'); });
  audit('test.local'); await flushAudit();
  assert.equal(request.mock.callCount(), 0);
  assert.equal(records[0].event, 'test.local');
});

test('Loki receives authenticated timestamped JSON without secrets or high-cardinality labels', async t => {
  const records = mockLogging(t);
  const request = t.mock.method(global, 'fetch', async (url, options) => {
    assert.equal(String(url), 'https://example.invalid/loki/api/v1/push');
    assert.equal(options.method, 'POST'); assert.equal(options.redirect, 'error');
    assert.equal(options.headers['Content-Type'], 'application/json');
    assert.equal(options.headers.Authorization, `Basic ${Buffer.from('123456:test-only-token').toString('base64')}`);
    assert.ok(options.signal instanceof AbortSignal);
    const { streams } = JSON.parse(options.body);
    assert.equal(streams.length, 1);
    assert.deepEqual(streams[0].stream, { app: 'hustlehub-api', environment: process.env.NODE_ENV || 'development' });
    const [[timestamp, line]] = streams[0].values;
    assert.match(timestamp, /^\d{19}$/);
    assert.equal(BigInt(timestamp), BigInt(Date.parse(JSON.parse(line).dt)) * 1000000n);
    assert.deepEqual(JSON.parse(line), records[0]);
    assert.equal(JSON.parse(line).requestId, 'request-123');
    assert.ok(!options.body.includes('secret'));
    assert.ok(!options.body.includes('test-only-token'));
    return { ok: true, status: 204 };
  });
  audit('test.delivered', { requestId: 'request-123', password: 'secret', token: 'secret' });
  await flushAudit();
  assert.equal(request.mock.callCount(), 1);
  assert.equal(records.length, 1);
});

test('HTTP rejection, network failure and synchronous failure never expose upstream errors', async t => {
  const records = mockLogging(t);
  t.mock.method(global, 'fetch', async () => ({ ok: false, status: 401 }));
  audit('test.rejected'); await flushAudit();
  t.mock.method(global, 'fetch', async () => { throw new Error('secret upstream response'); });
  audit('test.failed'); await flushAudit();
  t.mock.method(global, 'fetch', () => { throw new Error('secret synchronous failure'); });
  assert.doesNotThrow(() => audit('test.sync_failed')); await flushAudit();
  assert.equal(records.filter(record => record.event === 'logging.delivery_failed').length, 3);
  assert.ok(!JSON.stringify(records).includes('secret'));
  assert.ok(!JSON.stringify(records).includes('test-only-token'));
});

test('slow cloud delivery bounds the queue and keeps console logging available', async t => {
  const records = mockLogging(t);
  let release;
  const response = new Promise(resolve => { release = resolve; });
  const request = t.mock.method(global, 'fetch', () => response);
  for (let index = 0; index < 55; index++) audit('test.queued');
  release({ ok: true }); await flushAudit();
  assert.equal(request.mock.callCount(), 50);
  assert.equal(records.filter(record => record.event === 'test.queued').length, 55);
  assert.equal(records.filter(record => record.event === 'logging.queue_full').length, 1);
  audit('test.recovered'); await flushAudit();
  assert.equal(request.mock.callCount(), 51);
});
