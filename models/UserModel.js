const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    email: String,
    password: String,
}, { versionKey: '' })

module.exports = mongoose.model('User', userSchema);