// Only allowlisted fields enter logs. Never pass bodies, headers, passwords or JWTs.
const allowed = ['requestId', 'userId', 'role', 'status', 'method', 'route', 'durationMs',
  'bookingId', 'transactionId', 'amountCents', 'outcome'];
const pending = new Set();
let dropped = 0;
function buildEvent(event, details = {}) {
  const record = { dt: new Date().toISOString(), service: 'hustlehub-api', event };
  for (const key of allowed) {
    // eslint-disable-next-line security/detect-object-injection -- key comes only from the fixed allowlist above.
    const value = details[key];
    if (typeof value === 'string' || typeof value === 'number') {
      // eslint-disable-next-line security/detect-object-injection -- fixed schema; bounded strings cannot add fields or log lines.
      record[key] = typeof value === 'string' ? value.slice(0, 160) : value;
    }
  }
  return record;
}
function validateLogConfiguration() {
  const { LOKI_HOST: host, LOKI_USERNAME: username, LOKI_PASSWORD: password } = process.env;
  if (!host && !username && !password) return;
  if (!host || !username || !password)
    throw new Error('Configure LOKI_HOST, LOKI_USERNAME and LOKI_PASSWORD together.');
  const target = new URL(host);
  if (target.protocol !== 'https:' || target.username || target.password || target.search || target.hash ||
      target.pathname !== '/' || !/^\d+$/.test(username))
    throw new Error('Loki requires an HTTPS base URL without credentials and a numeric instance ID.');
}
function audit(event, details) {
  const record = buildEvent(event, details);
  console.log(JSON.stringify(record));
  const { LOKI_HOST: host, LOKI_USERNAME: username, LOKI_PASSWORD: password } = process.env;
  if (!host || !username || !password) return;
  if (pending.size >= 50) {
    if (++dropped === 1) console.error(JSON.stringify(buildEvent('logging.queue_full')));
    return;
  }
  // Operator-configured URL only; request data cannot select the destination.
  const body = JSON.stringify({ streams: [{
    stream: { app: record.service, environment: process.env.NODE_ENV || 'development' },
    values: [[(BigInt(Date.parse(record.dt)) * 1000000n).toString(), JSON.stringify(record)]]
  }] });
  const send = Promise.resolve().then(() => fetch(new URL('/loki/api/v1/push', host), {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(3000),
    headers: { 'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}` },
    body
  })).then(response => {
    if (!response.ok) throw new Error('Ingestion rejected');
  }).catch(() => console.error(JSON.stringify(buildEvent('logging.delivery_failed'))))
    .finally(() => pending.delete(send));
  pending.add(send);
}
async function flushAudit() { await Promise.allSettled([...pending]); }
module.exports = { audit, buildEvent, flushAudit, validateLogConfiguration };
