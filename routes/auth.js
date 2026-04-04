const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const { CheckLogin } = require('../utils/authHandler');
const { RegisterValidator, validatedResult } = require('../utils/validator');

router.post('/register', RegisterValidator, validatedResult, authController.register);
router.post('/login', authController.login);
router.get('/me', CheckLogin, authController.getMe);

module.exports = router;