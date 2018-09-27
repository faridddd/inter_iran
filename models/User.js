const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const UserSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        required: true,
        type: String
    },
    email: {
        type: String,
        required: true
    }
})

const User = mongoose.model('users', UserSchema);

module.exports = User;