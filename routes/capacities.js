const express = require('express');
const router = express.Router();
const capacitiesModel = require('../schemas/capacities');

router.get('/', async (req, res) => {
  const capacity = await capacitiesModel.find().populate('course');
  res.status(200).json({ success: true, data: capacity });
});

router.put('/:courseId', async (req, res) => {
  try {
    const { maxStudents } = req.body;
    const capacity = await capacitiesModel.findOneAndUpdate(
      { course: req.params.courseId },
      { maxStudents },
      { new: true, upsert: true }
    );
    res.status(200).json({ success: true, data: capacity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
