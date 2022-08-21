const mongoose = require('mongoose'),
Schema = mongoose.Schema
const userSchema = require('./user')

const empSchema = new Schema({
    user_saasden_id:{
        type: Schema.Types.ObjectId, 
        ref: userSchema,
        required : true
    },
    emps:[{
        id:String,
        email:String,
        firstname:String,
        userName:String,
        lastname:String,
        apps:[{
            id:String,
            name:String
        }]
    }]
})

module.exports = mongoose.model('empSchema', empSchema)