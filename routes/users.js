var express = require("express");
var router = express.Router();
let bcrypt = require('bcrypt')
let userModel = require("../schemas/users");
let { validatedResult, CreateAnUserValidator, ModifyAnUserValidator } = require('../utils/validator')
let userController = require('../controllers/users')
let { CheckLogin, checkRole } = require('../utils/authHandler')


router.get("/", CheckLogin, checkRole("ADMIN","MODERATOR"), async function (req, res, next) {//ADMIN
  let users = await userController.GetAllUser()
  res.status(200).json({ success: true, count: users.length, data: users });
});

router.get("/:id", async function (req, res, next) {
  let result = await userController.GetUserById(
    req.params.id
  )
  if (result) {
    res.status(200).json({ success: true, data: result });
  } else {
    res.status(404).json({ success: false, message: "id not found" })
  }
});

router.post("/", CreateAnUserValidator, validatedResult, async function (req, res, next) {
  
  try {
    let user = await userController.CreateAnUser(
      req.body.username, req.body.password,
      req.body.email, req.body.role
    )
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put("/:id", ModifyAnUserValidator, validatedResult, async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await userModel.findByIdAndUpdate
      (id, req.body, { new: true });

    if (!updatedItem) return res.status(404).send({ message: "id not found" });

    let populated = await userModel
      .findById(updatedItem._id)
    res.status(200).json({ success: true, data: populated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete("/:id", async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await userModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    if (!updatedItem) {
      return res.status(404).json({ success: false, message: "id not found" });
    }
    res.status(200).json({ success: true, data: updatedItem, message: "User deleted successfully" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;