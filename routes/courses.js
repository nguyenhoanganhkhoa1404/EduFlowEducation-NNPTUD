const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courses');
const { CheckLogin, checkRole } = require('../utils/authHandler');
const { uploadImage } = require('../utils/uploadHandler');

router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);

// Protected routes (Admin only)
router.post('/', CheckLogin, checkRole('admin'), uploadImage.array('images', 5), courseController.createCourse);
router.put('/:id', CheckLogin, checkRole('admin'), uploadImage.array('images', 5), courseController.updateCourse);
router.delete('/:id', CheckLogin, checkRole('admin'), courseController.deleteCourse);

module.exports = router;
