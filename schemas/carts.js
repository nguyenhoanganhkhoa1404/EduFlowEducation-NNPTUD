let mongoose = require('mongoose');
let itemCart = mongoose.Schema({
    course: {
        type: mongoose.Types.ObjectId,
        ref: 'course'
    },
    quantity: {
        type: Number,
        min: 1
    }
}, {
    _id: false
})

let cartSchema = mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'user',
        unique: true,
        required: true
    },
    items: {
        type: [itemCart],
        default:[]
    }
})
module.exports = new mongoose.model('cart',cartSchema)