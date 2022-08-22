const mongoose = require('mongoose'),
Schema = mongoose.Schema
const userSchema = require("./user")


const emsSchema = new Schema({
    user_saasden_id:{
        type: Schema.Types.ObjectId, 
        ref: userSchema,
        required : true
    },
    domain:{
        type: String,
    },
    envID:{
        type: String,
    },
    clientID: {
        type: String,
    },
    clientSecret:{
        type: String,
    },
    apiToken:{
        type: String,
    }
})

module.exports = mongoose.model('emsSchema', emsSchema)