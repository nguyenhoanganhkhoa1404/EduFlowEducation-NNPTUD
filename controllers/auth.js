const userController = require('./users');
const roleModel = require('../schemas/roles');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = {
  register: async (req, res) => {
    try {
      const { username, password, email, fullName, roleName } = req.body;
      
      // Get role
      let role = await roleModel.findOne({ name: roleName || 'user' });
      if (!role) {
        role = await roleModel.findOne({ name: 'user' });
        if (!role) {
          role = new roleModel({ name: 'user' });
          await role.save();
        }
      }

      const newUser = await userController.CreateAnUser(
        username,
        password,
        email,
        role._id,
        null,
        fullName || username,
        [],
        'active',
        0
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: newUser
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      const token = await userController.QueryLogin(username, password);

      if (token) {
        res.cookie('TOKEN_NNPTUD_C3', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
        res.status(200).json({
          success: true,
          message: 'Login successful',
          token: token
        });
      } else {
        res.status(401).json({ success: false, message: 'Invalid credentials or account locked' });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getMe: async (req, res) => {
    res.status(200).json({ success: true, data: req.user });
  }
};
