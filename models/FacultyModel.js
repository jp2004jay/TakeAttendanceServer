const mongoose = require('mongoose');

const facultySchema = mongoose.Schema({
    image: String,
    name: String,
    email: String,
    contact: String,
    sitting: String,
    designation: String,
    education: String,
    isAdmin: {
        type: Boolean,
        default: false
    }
}, { versionKey: '' });

module.exports = mongoose.model('Faculty', facultySchema);