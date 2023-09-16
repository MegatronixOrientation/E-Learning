const mongoose = require('mongoose');

const studentsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email:{
        type: String,
        required: true,
        unique: [true, "Email ID already exists"]
    },
    password:{
        type: String,
        required: true
    }
});

const Student = new mongoose.model('Student', studentsSchema);

module.exports = Student;