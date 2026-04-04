let mongoose = require('mongoose')
let capacitySchema = mongoose.Schema({
    course: {
        type: mongoose.Types.ObjectId,
        ref: 'course',
        required: true,
        unique: true
    },
    maxStudents: {
        type: Number,
        min: 0,
        default: 0
    },
    reserved: {
        type: Number,
        min: 0,
        default: 0
    },
    enrolledCount: {
        type: Number,
        min: 0,
        default: 0
    }
}, {
    timestamps: true
})
module.exports = new mongoose.model('capacity', capacitySchema)
