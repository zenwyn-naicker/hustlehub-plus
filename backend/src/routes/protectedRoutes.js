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
    authenticateToken
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
    "/profile",
    authenticateToken,
    (req, res) => {
        return res.status(200).json({
            success: true,
            message:
                "Protected profile accessed successfully.",
            data: {
                user: req.user
            }
        });
    }
);

module.exports = router;