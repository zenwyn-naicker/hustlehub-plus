/*Code Attribution: */
/**************************************************************************************************************
 * Author: Node.js Contributors
 * Date: 2026
 * Title: Node.js
 * Type: [Source Code]
 * Available at: <https://github.com/nodejs/node> [Accessed 28 August 2026]
 **************************************************************************************************************/
/**************************************************************************************************************
 * Author: express-validator Contributors
 * Date: 2026
 * Title: express-validator
 * Type: [Source Code]
 * Available at: <https://github.com/express-validator/express-validator> [Accessed 28 August 2026]
 **************************************************************************************************************/

const {
  body,
  checkExact
} = require("express-validator");

const registerValidation =
  checkExact([
    body("name")
      .exists({ checkFalsy: true })
      .withMessage("Name is required.")
      .bail()
      .isString()
      .withMessage(
        "Name must be text."
      )
      .bail()
      .trim()
      .isLength({
        min: 2,
        max: 60
      })
      .withMessage(
        "Name must be between 2 and 60 characters."
      )
      .bail()
      .matches(
        /^[\p{L}][\p{L}\s'-]*$/u
      )
      .withMessage(
        "Name contains unsupported characters."
      ),

    body("email")
      .exists({ checkFalsy: true })
      .withMessage("Email is required.")
      .bail()
      .isString()
      .withMessage(
        "Email must be text."
      )
      .bail()
      .trim()
      .isLength({ max: 254 })
      .withMessage(
        "Email is too long."
      )
      .bail()
      .isEmail()
      .withMessage(
        "Enter a valid email address."
      )
      .normalizeEmail(),

    body("password")
      .exists({ checkFalsy: true })
      .withMessage(
        "Password is required."
      )
      .bail()
      .isString()
      .withMessage(
        "Password must be text."
      )
      .bail()
      .isStrongPassword({
        minLength: 12,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
      })
      .withMessage(
        "Password must be at least 12 characters and include uppercase, lowercase, number, and symbol characters."
      )
      .bail()
      .custom(
        (password) =>
          Buffer.byteLength(
            password,
            "utf8"
          ) <= 72
      )
      .withMessage(
        "Password must not exceed 72 UTF-8 bytes."
      ),

    body("role")
      .exists({ checkFalsy: true })
      .withMessage("Role is required.")
      .bail()
      .isString()
      .withMessage(
        "Role must be text."
      )
      .bail()
      .trim()
      .toLowerCase()
      .isIn([
        "client",
        "freelancer"
      ])
      .withMessage(
        "Role must be either client or freelancer."
      )
  ]);

const loginValidation =
  checkExact([
    body("email")
      .exists({ checkFalsy: true })
      .withMessage("Email is required.")
      .bail()
      .isString()
      .withMessage(
        "Email must be text."
      )
      .bail()
      .trim()
      .isLength({ max: 254 })
      .withMessage(
        "Email is too long."
      )
      .bail()
      .isEmail()
      .withMessage(
        "Enter a valid email address."
      )
      .normalizeEmail(),

    body("password")
      .exists({ checkFalsy: true })
      .withMessage(
        "Password is required."
      )
      .bail()
      .isString()
      .withMessage(
        "Password must be text."
      )
      .bail()
      .custom(
        (password) =>
          Buffer.byteLength(
            password,
            "utf8"
          ) <= 72
      )
      .withMessage(
        "Password must not exceed 72 UTF-8 bytes."
      )
  ]);

module.exports = {
  loginValidation,
  registerValidation
};