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
        emps:[{
            id:String,
            email:String,
            firstname:String,
            username:String,
            lastname:String
        }],
        licences: Number,
        currentCost: Number, 
        amountSaved: Number
    }] 
})

module.exports = mongoose.model('subSchema', subsSchema)