const mongoose = require('mongoose'),
Schema = mongoose.Schema
const userSchema = require("./user")

const subsSchema = new Schema({
    user_saasden_id:{
        type: Schema.Types.ObjectId, 
        ref: userSchema,
        required : true
    },
    apps:[{
        name: String,
        id: String,
        emp:[{
            id:String,
            email:String,
            firstname:String,
            userName:String,
            lastname:String
        }]
    }] 
})

module.exports = mongoose.model('subSchema', subsSchema)