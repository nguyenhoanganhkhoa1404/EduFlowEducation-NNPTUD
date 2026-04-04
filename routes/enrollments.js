const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollments');
const { CheckLogin, checkRole } = require('../utils/authHandler');

router.post('/', CheckLogin, enrollmentController.createEnrollment);
router.get('/my', CheckLogin, enrollmentController.getMyEnrollments);
router.patch('/:id/pay', CheckLogin, enrollmentController.payEnrollment);
router.delete('/:id', CheckLogin, enrollmentController.deleteEnrollment);
router.delete('/:id/items/:courseCode', CheckLogin, enrollmentController.removeItemFromEnrollment);
router.get('/', CheckLogin, checkRole('admin'), enrollmentController.getAllEnrollments);

module.exports = router;
