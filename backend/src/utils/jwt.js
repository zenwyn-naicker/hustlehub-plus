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

const jwt = require("jsonwebtoken");
const { randomUUID } = require("node:crypto");

const ISSUER = "hustlehub-plus-api";
const AUDIENCE =
    "hustlehub-plus-client";

function getJwtSecret() {
    const secret = process.env.JWT_SECRET;

    if (
        !secret ||
        Buffer.byteLength(secret, "utf8") < 32
    ) {
        throw new Error(
            "JWT_SECRET must contain at least 32 bytes."
        );
    }

    return secret;
}

function validateJwtConfiguration() {
    getJwtSecret();
}

function generateToken(user) {
    return jwt.sign(
        {
            role: user.role
        },
        getJwtSecret(),
        {
            algorithm: "HS256",
            jwtid: randomUUID(),
            subject: user.id,
            issuer: ISSUER,
            audience: AUDIENCE,
            expiresIn:
                process.env.JWT_EXPIRES_IN ||
                "1h"
        }
    );
}

function verifyToken(token) {
    return jwt.verify(
        token,
        getJwtSecret(),
        {
            algorithms: ["HS256"],
            issuer: ISSUER,
            audience: AUDIENCE
        }
    );
}

module.exports = {
    generateToken,
    validateJwtConfiguration,
    verifyToken
};