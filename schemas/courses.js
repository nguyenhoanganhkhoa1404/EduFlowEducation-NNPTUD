let mongoose = require('mongoose');
let courseSchema = new mongoose.Schema({
    courseCode: {
        type: String,
        unique: [true, "courseCode khong duoc trung"],
        required: [true, "courseCode khong duoc rong"]
    },
    courseName: {
        type: String,
        unique: [true, "courseName khong duoc trung"],
        required: [true, "courseName khong duoc rong"]
    },
    slug: {
        type: String,
        unique: [true, "slug khong duoc trung"],
        required: [true, "slug khong duoc rong"]
    },
    price: {
        type: Number,
        default: 0,
        min: [0, "gia khong duoc nho hon 0"],
    },
    description: {
        type: String,
        default: ""
    },
    instructor: {
        type: String,
        default: "Academy Instructor"
    },
    images: {
        type: [String],
        default: ["https://i.imgur.com/ZANVnHE.jpeg"]
    },
    subject: {
        type: mongoose.Types.ObjectId,
        ref: 'subject',
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

//hook
courseSchema.pre('save', async function () {
    let Course = this.constructor;
    let courses = await Course.find({
        slug: new RegExp(this.slug, 'i')
    });
    if (courses.length > 0) {
        this.slug = this.slug + "-" + courses.length
    }
})
module.exports = new mongoose.model(
    'course', courseSchema
)

