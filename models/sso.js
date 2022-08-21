const mongoose = require('mongoose'),
Schema = mongoose.Schema

const ssoSchema = new Schema({
    user_saasden_id:{
        type: Schema.Types.ObjectId, 
        ref: 'USER',
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

module.exports = mongoose.model('ssoSchema', ssoSchema)