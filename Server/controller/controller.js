const { validationResult } = require('express-validator');

const socket = require('../socket');
const calc = require('./calc');
const Driver = require('../model/driver');

let timer, info, count = 0;

const distArr = [];

const notifyDriver = () => {
    const io = socket.getIO();
    if (distArr[count]) {
        const driver = distArr[count];
        const id = driver[0];
        io.to(id).emit('newNotification', {
            clientId: info.clientId,
            coordinate: info.coordinate
        })
        count++;
        return true;
    }
    else {
        return false;
    }
};

const notifyClient = (clientId, driverId, coordinates) => {
    const io = socket.getIO();
    io.to(clientId).emit('driverFound', {
        driverId,
        coordinates
    });
};

const sortFunction = (a, b) => {
    if (a[1] === b[1]) {
        return 0;
    }
    else {
        return (a[1] < b[1]) ? -1 : 1;
    }
};

exports.connect = (req, res, next) => {
    const io = socket.getIO();
    io.emit('test', {
        msg: 'Connected'
    });
    res.status(200).json({
        msg: ''
    });
};

exports.fetch = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error(errors.array()[0].msg);
        error.statusCode = 403;
        return next(error);
    }
    const io = socket.getIO();
    const clientId = req.body.clientId;
    await io.once('connection', socket => {
        socket.join(clientId);
        console.log('client connected. ID: ' + clientId);
    });
    const coordinate = req.body.coordinate;
    const lat = coordinate.split(',')[0];
    const lon = coordinate.split(',')[1];
    const driverArr = await Driver.find({ available: true }).catch(err => next(err));
    n = driverArr.length;
    if (n === 0) {
        const err = new Error('no drivers available');
        return next(err);
    }
    for (let i = 0; i < n; i++) {
        const dist = await calc(lat, lon, driverArr[i].lat, driverArr[i].lon);
        if (dist == 'no route found') {
            continue;
        }
        if (isNaN(dist)) {
            return next(dist);
        }
        distArr.push([driverArr[i]._id, dist]);
    }
    const m = distArr.length;
    if (m === 0) {
        res.status(404).json({
            msg: 'no route possible for any available drivers'
        });
    }
    else {
        distArr.sort(sortFunction);
        info = {
            clientId: clientId,
            coordinate: coordinate
        };
        const send = notifyDriver();
        if (send) {
            res.status(200).json({
                msg: 'drivers notified'
            });
        }
    }

};

exports.postAddDriver = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error(errors.array()[0].msg);
        return next(error);
    }
    const id = req.body.id;
    const driver = new Driver({
        _id: id,
        available: false,
        lat: null,
        lon: null
    });
    try {
        await driver.save();
        res.status(200).json({
            msg: 'driver added'
        });

    }
    catch (err) {
        return next(err);
    }
};

exports.patchAvailable = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error(errors.array()[0].msg);
        return next(error);
    }
    const id = req.body.id;
    const driver = await Driver.findById(id).catch(err => next(err));
    if (!driver) {
        const err = new Error('invalid id');
        err.statusCode = 401;
        return next(err);
    }
    const io = socket.getIO();
    await io.once('connection', socket => {
        socket.join(id);
    });
    const available = true;
    const coordinate = req.body.coordinate;
    const lat = parseFloat(coordinate.split(',')[0]);
    const lon = parseFloat(coordinate.split(',')[1]);
    driver.available = available;
    driver.lat = lat;
    driver.lon = lon;
    await driver.save().catch(err => next(err));
    res.status(200).json({
        msg: 'availability updated'
    });
};

exports.patchNotAvailable = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error(errors.array()[0].msg);
        return next(error);
    }
    const id = req.body.id;
    const driver = await Driver.findById(id).catch(err => next(err));
    if (!driver) {
        const err = new Error('invalid id');
        err.statusCode = 401;
        return next(err);
    }
    driver.available = false;
    driver.lat = null;
    driver.lon = null;
    await driver.save().catch(err => next(err));
    res.status(200).json({
        msg: 'availability updated'
    });
};

exports.postAccepted = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error(errors.array()[0].msg);
        error.statusCode = 403;
        return next(error);
    }
    if (timer) {
        clearInterval(timer);
    }
    const driverId = req.body.driverId;
    const driver = await Driver.findById(driverId).catch(err => next(err));
    if (!driver) {
        const err = new Error('invalid id');
        err.statusCode = 401;
        return next(err);
    }
    const clientId = req.body.clientId;
    const coordinate = `${driver.lat},${driver.lon}`;
    driver.available = false;
    driver.lat = null;
    driver.lon = null;
    notifyClient(clientId, driverId, coordinate);
    await driver.save().catch(err => next(err));
    res.status(200).json({
        msg: 'successful'
    });
};

exports.postDecline = async (req, res, next) => {
    const check = notifyDriver();
    if (check) {
        res.status(200).json({
            msg: 'next notification sent'
        });
    }
    else {
        res.status(503).json({
            msg: 'no drivers left'
        });
    }
}

exports.patchUpdateLocation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error(errors.array()[0].msg);
        return next(error);
    }
    const id = req.body.id;
    Driver.findById(id)
        .then(driver => {
            if (!driver) {
                const err = new Error('invalid id');
                err.statusCode = 401;
                return next(err);
            }
            const coordinate = req.body.coordinate;
            const lat = parseFloat(coordinate.split(',')[0]);
            const lon = parseFloat(coordinate.split(',')[1]);
            const old_lat = driver.lat;
            const old_lon = driver.lon;
            if (lat == old_lat && lon == old_lon) {
                res.status(200).json({
                    msg: 'no change reqd'
                });
            }
            else {
                driver.lat = lat;
                driver.lon = lon;
                driver.save()
                    .then(() => {
                        res.status(200).json({
                            msg: 'coordinates updated'
                        });
                    })
                    .catch(err => next(err));
            }
        })
        .catch(err => next(err));
};