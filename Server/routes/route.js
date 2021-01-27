const express = require('express');
const { check } = require('express-validator');

const controller = require('../controller/controller');

const router = express.Router();

router.post('/fetch',
    [
        check('clientId')
            .custom(value => {
                if (!value) {
                    throw new Error('clientId required');
                }
                return true;
            })
            .matches('^[a-zA-Z0-9-]*$')
            .withMessage('invalid clientId'),
        check('coordinate')
            .custom(value => {
                if (!value) {
                    throw new Error('coordinates required');
                }
                return true;
            })
            .isLatLong()
            .withMessage('Invalid format of coordinates')
    ],
    controller.fetch
);

router.post('/add-driver',
    [
        check('id')
            .custom(value => {
                if (!value) {
                    throw new Error('id required');
                }
                return true;
            })
            .isAlphanumeric()
            .withMessage('id can contain only alphabets and numbers')
    ],
    controller.postAddDriver
);

router.patch('/availability-true',
    [
        check('id')
            .custom(value => {
                if (!value) {
                    throw new Error('id required');
                }
                return true;
            })
            .isAlphanumeric()
            .withMessage('id can contain only alphabets and numbers'),
        check('coordinate')
            .custom(value => {
                if (!value) {
                    throw new Error('coordinates are required');
                }
                return true;
            })
            .isLatLong()
            .withMessage('Invalid format of coordinates')
    ],
    controller.patchAvailable
);

router.patch('/availability-false',
    [
        check('id')
            .custom(value => {
                if (!value) {
                    throw new Error('id required');
                }
                return true;
            })
            .isAlphanumeric()
            .withMessage('id can contain only alphabets and numbers')
    ],
    controller.patchNotAvailable
);

router.post('/accept',
    [
        check('id')
            .custom(value => {
                if (!value) {
                    throw new Error('id required');
                }
                return true;
            })
            .isAlphanumeric()
            .withMessage('id can contain only alphabets and numbers')
    ],
    controller.postAccepted
);

router.patch('/update-location',
    [
        check('id')
            .custom(value => {
                if (!value) {
                    throw new Error('id required');
                }
                return true;
            })
            .isAlphanumeric()
            .withMessage('id can contain only alphabets and numbers'),
        check('coordinate')
            .custom(value => {
                if (!value) {
                    throw new Error('coordinates required');
                }
                return true;
            })
            .isLatLong()
            .withMessage('Invalid format of coordinates')
    ],
    controller.patchUpdateLocation
);

router.post('/decline', controller.postDecline);

router.post('/connect', controller.connect);

module.exports = router;