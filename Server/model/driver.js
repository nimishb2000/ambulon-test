const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
    _id: String,
    available: Boolean,
    lat: String,
    lon: String
});

module.exports = mongoose.model('Driver', driverSchema);