/*Code Attribution: */
/**************************************************************************************************************
 * Author: Express.js Contributors
 * Date: 2026
 * Title: Express
 * Type: [Source Code]
 * Available at: <https://github.com/expressjs/express> [Accessed 28 August 2026]
 **************************************************************************************************************/

const router = require('express').Router();
const { authenticateToken, allowRoles } = require('../middleware/authMiddleware');
const { bookingLimiter } = require('../middleware/rateLimits');
const { gigInput, bookingInput, idInput } = require('../validators/marketplaceValidation');
const gigs = require('../controllers/gigController');
const bookings = require('../controllers/bookingController');
const admin = require('../controllers/adminController');

router.use(['/gigs', '/bookings', '/transactions', '/income', '/admin'], authenticateToken);
router.get('/gigs', allowRoles('client', 'freelancer'), gigs.browse);
router.get('/gigs/mine', allowRoles('freelancer'), gigs.mine);
router.get('/gigs/:id', allowRoles('freelancer'), idInput, gigs.readOwn);
router.post('/gigs', allowRoles('freelancer'), gigInput, gigs.create);
router.put('/gigs/:id', allowRoles('freelancer'), idInput, gigInput, gigs.update);
router.delete('/gigs/:id', allowRoles('freelancer'), idInput, gigs.remove);
router.post('/bookings', allowRoles('client'), bookingLimiter, bookingInput, bookings.create);
router.get('/bookings', allowRoles('client', 'freelancer'), bookings.list);
router.get('/bookings/:id', allowRoles('client', 'freelancer'), idInput, bookings.read);
router.get('/transactions', allowRoles('client', 'freelancer'), bookings.transactions);
router.get('/income', allowRoles('freelancer'), bookings.income);
router.get('/admin/summary', allowRoles('admin'), admin.summary);
module.exports = router;