/*Code Attribution: */
/**************************************************************************************************************
 * Author: kelektiv
 * Date: 2026
 * Title: node.bcrypt.js
 * Type: [Source Code]
 * Available at: <https://github.com/kelektiv/node.bcrypt.js/> [Accessed 28 August 2026]
 **************************************************************************************************************/

const bcrypt = require("bcrypt");

const DEFAULT_ROUNDS = 12;
const MIN_ROUNDS = 10;
const MAX_ROUNDS = 14;

function getRounds() {
    const rounds = Number.parseInt(
        process.env.BCRYPT_ROUNDS ||
        DEFAULT_ROUNDS,
        10
    );

    if (
        !Number.isInteger(rounds) ||
        rounds < MIN_ROUNDS ||
        rounds > MAX_ROUNDS
    ) {
        throw new Error(
            `BCRYPT_ROUNDS must be between ${MIN_ROUNDS} and ${MAX_ROUNDS}.`
        );
    }

    return rounds;
}

async function hashPassword(password) {
    return bcrypt.hash(
        password,
        getRounds()
    );
}

async function verifyPassword(
    password,
    passwordHash
) {
    return bcrypt.compare(
        password,
        passwordHash
    );
}

module.exports = {
    hashPassword,
    verifyPassword
};