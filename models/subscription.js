import mongoose from 'mongoose'
const Schema = mongoose.Schema

const subModel = new Schema({
  ID: {
    type: String,
    unique: true,
    required: true
  },
  apps: [{
    name: String,
    ssoID: String,
    emsID: String,
    emps: [{
      id: String,
      email: String,
      firstname: String,
      username: String,
      lastname: String
    }],
    licences: Number,
    currentCost: Number,
    amountSaved: Number,
    dueDate: String
  }],
  amtSaved: { type: Number },
  amtSpent: { type: Number }
})

const subSchema = mongoose.model('subSchema', subModel)
export default subSchema
