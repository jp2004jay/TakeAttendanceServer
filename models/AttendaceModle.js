const mongoose = require('mongoose');

const attendaceSchema = mongoose.Schema({
    email: String,
    department: String,
    sem: String,
    class: String,
    absentStudents: Array,
    date: {
        type:Date,
        default: Date.now()
    }
}, { versionKey: '' })

module.exports = mongoose.model('Attendance', attendaceSchema);