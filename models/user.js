const mongoose = require('mongoose')
Schema = mongoose.Schema
passportLocalMongoose = require('passport-local-mongoose')

const User = new Schema({
    name : {
        type: String,
        required: true,
    },
    companyName : {
        type: String,
        required: true,
        unique: true
    },
    workEmail : {
        type: String,
        required: true,
        unique: true
    },
    oktaDomain : {
        type: String,
        unique: true
    },
    oktaAPIKey : {
        type: String,
        unique: true
    }
});

User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User);