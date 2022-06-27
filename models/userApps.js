const mongoose = require('mongoose'),
Schema = mongoose.Schema

const userApps = new Schema({
    appName: {
        type: String,
        required: true,
        unique: true,
    },
    contactID: {
        type: String,
        required: true,
        required: true
    }
})

module.exports = mongoose.model('userApps', userApps)