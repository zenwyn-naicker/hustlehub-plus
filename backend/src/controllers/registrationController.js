/*Code Attribution: */
/**************************************************************************************************************
 * Author: Express.js Contributors
 * Date: 2026
 * Title: Express
 * Type: [Source Code]
 * Available at: <https://github.com/expressjs/express> [Accessed 28 August 2026]
 **************************************************************************************************************/

const {
  createUser,
  findUserByEmail
} = require("../models/userStore");

const {
  hashPassword
} = require("../utils/password");

async function register(req, res) {
  const {
    name,
    email,
    password,
    role
  } = req.body;

  if (await findUserByEmail(email)) {
    return res.status(409).json({
      success: false,
      message:
        "An account with this email already exists.",
      errors: []
    });
  }

  const passwordHash = await hashPassword(password);

  try {
    const user = await createUser({
      name,
      email,
      passwordHash,
      role
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    if (error.code === "DUPLICATE_EMAIL") {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
        errors: []
      });
    }

    throw error;
  }
}

module.exports = { register };