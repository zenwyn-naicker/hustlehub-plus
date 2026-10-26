const router = require('express').Router();
const { query, checkExact } = require('express-validator');
const { authenticateToken, allowRoles } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validationMiddleware');
const { finance } = require('../controllers/financeController');

router.get('/', authenticateToken, allowRoles('freelancer'), checkExact([query('year').optional().isString().bail().matches(/^\d{4}$/).bail().isInt({ min: 2000, max: 2100 })], { locations: ['query'] }), validateRequest, finance);
module.exports = router;