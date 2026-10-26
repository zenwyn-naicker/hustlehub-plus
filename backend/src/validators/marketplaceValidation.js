/*Code Attribution: */
/**************************************************************************************************************
 * Author: express-validator Contributors
 * Date: 2026
 * Title: express-validator
 * Type: [Source Code]
 * Available at: <https://github.com/express-validator/express-validator> [Accessed 28 August 2026]
 **************************************************************************************************************/

const { body, param, checkExact } = require('express-validator');

const { validateRequest } = require('../middleware/validationMiddleware');

const text = (field, max) =>
  body(field)
    .isString()
    .bail()
    .trim()
    .isLength({ min: 3, max })
    .bail()
    .not()
    // eslint-disable-next-line no-control-regex -- Deliberately reject control characters in user text.
    .matches(/[<>\x00-\x1f\x7f]/)
    .withMessage('Use plain text without markup or control characters.');

const gigInput = [
  checkExact(
    [
      text('title', 100),
      text('description', 1000),
      body('priceCents')
        .custom((v) => Number.isSafeInteger(v) && v >= 100 && v <= 100000000)
        .withMessage(
          'Price must be an integer between 100 and 100000000 cents.'
        ),
    ],
    {
      locations: ['body'],
    }
  ),
  validateRequest,
];

const bookingInput = [
  checkExact(
    [
      body('gigId').isUUID(4),
      body('requestKey').isUUID(4),
      body('requirements')
        .optional()
        .isString()
        .withMessage('Describe your project using plain text.')
        .bail()
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage('Project requirements must contain 10 to 2000 characters.')
        .bail()
        .not()
        // eslint-disable-next-line no-control-regex -- Allow line breaks but reject markup and other control characters.
        .matches(/[<>\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/)
        .withMessage('Use plain text without markup or control characters.'),
      body('expectedPriceCents')
        .optional()
        .custom(
          (value) =>
            Number.isSafeInteger(value) && value >= 100 && value <= 100000000
        )
        .withMessage('The reviewed price must be a valid amount in cents.'),
    ],
    {
      locations: ['body'],
    }
  ),
  validateRequest,
];

const idInput = [param('id').isUUID(4), validateRequest];

module.exports = {
  gigInput,
  bookingInput,
  idInput,
};
