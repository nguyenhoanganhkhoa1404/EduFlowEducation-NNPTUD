const express = require('express');
const router = express.Router();
const reviewModel = require('../schemas/reviews');

const { CheckLogin } = require('../utils/authHandler');
const courseModel = require('../schemas/courses');

router.get('/', async (req, res) => {
  const reviews = await reviewModel.find().populate('user').populate('course');
  res.status(200).json({ success: true, data: reviews });
});

router.post('/', CheckLogin, async (req, res) => {
    try {
        const { courseCode, rating, comment } = req.body;
        const course = await courseModel.findOne({ courseCode });
        if (!course) return res.status(400).send("Khóa học không tồn tại");

        const review = new reviewModel({
            user: req.user._id,
            course: course._id,
            rating,
            comment
        });
        await review.save();
        res.status(201).json({ success: true, data: review });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

module.exports = router;
