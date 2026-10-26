function frontendProxy(req, res, next) {
  if (!['GET', 'HEAD'].includes(req.method) || req.path.startsWith('/api')) return next();
  const origin = 'http://client:8080';
  const target = new URL(req.originalUrl, origin);
  
  if (target.origin !== origin) return res.status(400).end();
  fetch(target, { method: req.method, redirect: 'error', signal: AbortSignal.timeout(5000) })
    .then(async response => {
      const content = Buffer.from(await response.arrayBuffer());
      res.status(response.status);
      res.set('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
      res.send(content);
    }).catch(next);
}
module.exports = { frontendProxy };