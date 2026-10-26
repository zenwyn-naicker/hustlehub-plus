/*Code Attribution: */
/**************************************************************************************************************
 * Author: Node.js Contributors
 * Date: 2026
 * Title: Node.js
 * Type: [Source Code]
 * Available at: <https://github.com/nodejs/node> [Accessed 28 August 2026]
 **************************************************************************************************************/
/**************************************************************************************************************
 * Author: Express.js Contributors
 * Date: 2026
 * Title: Express
 * Type: [Source Code]
 * Available at: <https://github.com/expressjs/express> [Accessed 28 August 2026]
 **************************************************************************************************************/
/**************************************************************************************************************
 * Author: Helmet Contributors
 * Date: 2026
 * Title: Helmet
 * Type: [Source Code]
 * Available at: <https://github.com/helmetjs/helmet> [Accessed 15 September 2026]
 **************************************************************************************************************/


const { randomUUID } = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs');

const express = require('express');
const helmet = require('helmet');

const { audit } = require('./utils/audit');

const authRoutes = require('./routes/authRoutes');
const protectedRoutes = require('./routes/protectedRoutes');
const marketplaceRoutes = require('./routes/marketplaceRoutes');

const { errorMiddleware, notFoundMiddleware } = require('./middleware/errorMiddleware');

const app = express();

app.disable('x-powered-by');

app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: false,
        directives: {
            defaultSrc: ["'none'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'"],
            imgSrc: ["'self'"],
            fontSrc: ["'self'"],
            connectSrc: ["'self'"],
            baseUri: ["'none'"],
            formAction: ["'self'"],
            frameAncestors: ["'none'"],
            objectSrc: ["'none'"]
        }
    }
}));

app.use((req, res, next) => {
    req.id = randomUUID();

    res.set('X-Request-Id', req.id);

    next();
});

app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');

    next();
});

app.use('/api', (req, res, next) => {
    const start = Date.now();

    res.once('finish', () => {
        audit('http.request', {
            requestId: req.id,
            userId: req.user?.id,
            method: req.method,
            route: req.route?.path || 'unmatched',
            status: res.statusCode,
            durationMs: Date.now() - start
        });
    });

    next();
});

app.use(express.json({
    limit: '10kb',
    strict: true
}));

app.get('/api/health', (_req, res) => {
    res.json({
        success: true,
        message: 'HustleHub+ API is running securely.'
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes);
app.use('/api', marketplaceRoutes);
app.use('/api/finance', require('./routes/financeRoutes'));

// The built React client shares the HTTPS origin and receives the same CSP.
const clientDist = path.resolve(__dirname, '../../client/dist');

if (process.env.CONTAINER_FRONTEND === 'true') {
    app.use(require('./middleware/frontendProxy').frontendProxy);
} else if (fs.existsSync(path.join(clientDist, 'index.html'))) {
    app.use(express.static(clientDist));
}

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
