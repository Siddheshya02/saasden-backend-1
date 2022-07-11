const mongoose = require('mongoose'),
Schema = mongoose.Schema

const subsSchema = new Schema({
    appID: {
        type: String,
        required: true
    },
    contactID:{
        type: String,
        required: true
    },
    appName: {
        type: String,
        required: true,
        unique: true,
    },
    status:{
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        required: true,
    },
    assignedUsers: [{
        userID: {type: String},
        name: {type: String},
    }]
})

module.exports = mongoose.model('subscriptions', subsSchema)