/*Code Attribution: */
/**************************************************************************************************************
 * Author: Express.js Contributors
 * Date: 2026
 * Title: Express
 * Type: [Source Code]
 * Available at: <https://github.com/expressjs/express> [Accessed 28 August 2026]
 **************************************************************************************************************/

const express = require("express");

const {
  register
} = require("../controllers/registrationController");

const {
  login
} = require("../controllers/loginController");

const {
  validateRequest
} = require("../middleware/validationMiddleware");

const {
  loginValidation,
  registerValidation
} = require("../validators/authValidation");

const { loginLimiter, registerLimiter } = require('../middleware/rateLimits');
const router = express.Router();

router.post(
  "/register", registerLimiter,
  registerValidation,
  validateRequest,
  register
);

router.post(
  "/login", loginLimiter,
  loginValidation,
  validateRequest,
  login
);

const { authenticateToken } = require('../middleware/authMiddleware');
const { logout } = require('../controllers/logoutController');
router.post('/logout', authenticateToken, logout);
module.exports = router;