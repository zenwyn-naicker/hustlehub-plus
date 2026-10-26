/*Code Attribution: */
/**************************************************************************************************************
 * Author: Node.js Contributors
 * Date: 2026
 * Title: Node.js
 * Type: [Source Code]
 * Available at: <https://github.com/nodejs/node> [Accessed 28 August 2026]
 **************************************************************************************************************/
/**************************************************************************************************************
 * Author: Mot
 * Date: 2026
 * Title: dotenv
 * Type: [Source Code]
 * Available at: <https://github.com/motdotla/dotenv> [Accessed 28 August 2026]
 **************************************************************************************************************/
/**************************************************************************************************************
 * Author: Mongoose Contributors
 * Date: 2026
 * Title: Mongoose
 * Type: [Source Code]
 * Available at: <https://github.com/Automattic/mongoose> [Accessed 15 September 2026]
 **************************************************************************************************************/


require('dotenv').config();

const https = require('node:https');
const mongoose = require('mongoose');

const app = require('./src/app');

const { audit, flushAudit, validateLogConfiguration } = require('./src/utils/audit');
const { loadHttpsCredentials } = require('./src/config/https');
const { validateJwtConfiguration } = require('./src/utils/jwt');
const { connectDatabase } = require('./src/config/database');

async function start() {
    const port = Number(process.env.PORT || 3443);

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error('Invalid PORT.');
    }

    validateJwtConfiguration();
    validateLogConfiguration();

    const credentials = loadHttpsCredentials();

    await connectDatabase();

    const server = https.createServer(credentials, app);

    server.on('error', async () => {
        console.error('HTTPS server could not start.');

        await mongoose.disconnect();

        process.exitCode = 1;
    });

    const host = process.env.HOST || 'localhost';

    server.listen(port, host, () => {
        console.log(`HustleHub+ listening on https://${host}:${port}`);

        audit('server.started');
    });

    const stop = () => {
        server.close(async () => {
            audit('server.stopped');

            await flushAudit();
            await mongoose.disconnect();
        });
    };

    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
}

start().catch(async () => {
    console.error(
        'Startup failed. Check MongoDB replica set, JWT, HTTPS and logging configuration.'
    );

    await mongoose.disconnect();

    process.exitCode = 1;
});
