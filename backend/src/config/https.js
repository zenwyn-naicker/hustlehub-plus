/*Code Attribution: */
/**************************************************************************************************************
 * Author: Node.js Contributors
 * Date: 2026
 * Title: Node.js
 * Type: [Source Code]
 * Available at: <https://github.com/nodejs/node> [Accessed 28 August 2026]
 **************************************************************************************************************/

/* eslint-disable security/detect-non-literal-fs-filename -- Certificate paths are trusted startup configuration, never HTTP input; absolute paths support mounted Docker secrets. */
const fs = require("node:fs");
const path = require("node:path");

const backendRoot = path.resolve(
  __dirname,
  "../.."
);

function resolveCertificatePath(
  configuredPath,
  fallbackPath
) {
  const target =
    configuredPath ||
    fallbackPath;

  return path.isAbsolute(target)
    ? target
    : path.resolve(
        backendRoot,
        target
      );
}

function loadHttpsCredentials() {
  const keyPath =
    resolveCertificatePath(
      process.env.SSL_KEY_PATH,
      "certs/localhost-key.pem"
    );

  const certPath =
    resolveCertificatePath(
      process.env.SSL_CERT_PATH,
      "certs/localhost-cert.pem"
    );

  if (
    !fs.existsSync(keyPath) ||
    !fs.existsSync(certPath)
  ) {
    throw new Error(
      "HTTPS certificate files were not found. Generate the local certificate before starting the API."
    );
  }

  return {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
    minVersion: "TLSv1.2"
  };
}

module.exports = {
  loadHttpsCredentials
};