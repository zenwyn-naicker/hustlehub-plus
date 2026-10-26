/*Code Attribution: */
/**************************************************************************************************************
 * Author: Express.js Contributors
 * Date: 2026
 * Title: Express
 * Type: [Source Code]
 * Available at: <https://github.com/expressjs/express> [Accessed 28 August 2026]
 **************************************************************************************************************/


const { audit } = require('../utils/audit');

function notFoundMiddleware(_req, _res, next) {
    next(Object.assign(
        new Error('The requested API route does not exist.'),
        {
            statusCode: 404,
            isOperational: true
        }
    ));
}

function errorMiddleware(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    let status = 500;
    let message = 'An unexpected error occurred.';

    if (err.type === 'entity.parse.failed') {
        status = 400;
        message = 'Request body contains invalid JSON.';
    } else if (err.type === 'entity.too.large') {
        status = 413;
        message = 'Request body is too large.';
    } else if (
        err.isOperational &&
        Number.isInteger(err.statusCode) &&
        err.statusCode >= 400 &&
        err.statusCode <= 599
    ) {
        status = err.statusCode;
        message = err.message;
    }

    // No raw errors, URLs, request bodies or stacks: these can contain submitted secrets.
    audit('request.error', {
        requestId: req.id,
        userId: req.user?.id,
        status,
        method: req.method,
        route: req.route?.path || 'unmatched'
    });

    res.status(status).json({
        success: false,
        message,
        errors: [],
        requestId: req.id
    });
}

module.exports = {
    errorMiddleware,
    notFoundMiddleware
};
