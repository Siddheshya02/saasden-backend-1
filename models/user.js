const mongoose = require('mongoose')
Schema = mongoose.Schema
passportLocalMongoose = require('passport-local-mongoose')

const userSchema = new Schema({
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
});

User.plugin(passportLocalMongoose);
module.exports = mongoose.model('userSchema', userSchema);