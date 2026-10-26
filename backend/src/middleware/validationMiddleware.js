/*Code Attribution: */
/**************************************************************************************************************
 * Author: Express.js Contributors
 * Date: 2026
 * Title: Express
 * Type: [Source Code]
 * Available at: <https://github.com/expressjs/express> [Accessed 28 August 2026]
 **************************************************************************************************************/
/**************************************************************************************************************
 * Author: express-validator Contributors
 * Date: 2026
 * Title: express-validator
 * Type: [Source Code]
 * Available at: <https://github.com/express-validator/express-validator> [Accessed 28 August 2026]
 **************************************************************************************************************/

const {
  validationResult
} = require("express-validator");

function validateRequest(
  req,
  res,
  next
) {
  const result =
    validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const errors = result
    .array({
      onlyFirstError: true
    })
    .map((error) => ({
      field: error.path || "body",
      message:
        typeof error.msg === "string"
          ? error.msg
          : "Invalid request value."
    }));

  return res.status(400).json({
    success: false,
    message: "Validation failed.",
    errors
  });
}

module.exports = {
  validateRequest
};