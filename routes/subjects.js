var express = require('express');
var router = express.Router();
let subjectModel = require('../schemas/subjects');
const { default: slugify } = require('slugify');
const { CheckLogin, checkRole } = require('../utils/authHandler');

/* GET users listing. */
router.get('/', async function (req, res, next) {
  try {
    let result = await subjectModel.find({
      isDeleted: false
    })
    res.status(200).json({ success: true, count: result.length, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let result = await subjectModel.findOne({
      isDeleted: false,
      _id: id
    })
    if (result) {
      res.status(200).json({ success: true, data: result });
    } else {
      res.status(404).json({ success: false, message: "ID NOT FOUND" });
    }
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
});

router.post('/', CheckLogin, checkRole('admin'), async function (req, res, next) {
  try {
    let newCate = new subjectModel({
      name: req.body.name,
      slug: slugify(req.body.name, {
        replacement: '-',
        remove: undefined,
        lower: true,
        strict: false,
      })
    });
    await newCate.save();
    res.status(201).json({ success: true, data: newCate });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/:id', CheckLogin, checkRole('admin'), async function (req, res, next) {
  try {
    let id = req.params.id;
    //c1
    // let result = await subjectModel.findOne({
    //   isDeleted: false,
    //   _id: id
    // })
    // if (result) {
    //   let keys = Object.keys(req.body);
    //   for (const key of keys) {
    //     result[key] = req.body[key]
    //   }
    //   await result.save()
    //   res.send(result)
    // }
    // else {
    //   res.status(404).send({ message: "ID NOT FOUND" });
    // }
    //c2
    let updatedItem = await subjectModel.findByIdAndUpdate(id, req.body, {
      new: true
    });
    if (!updatedItem) return res.status(404).json({ success: false, message: "ID NOT FOUND" });
    res.status(200).json({ success: true, data: updatedItem });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
});

router.delete('/:id', CheckLogin, checkRole('admin'), async function (req, res, next) {
  try {
    let id = req.params.id;
    //c1
    // let result = await subjectModel.findOne({
    //   isDeleted: false,
    //   _id: id
    // })
    // if (result) {
    //   let keys = Object.keys(req.body);
    //   for (const key of keys) {
    //     result[key] = req.body[key]
    //   }
    //   await result.save()
    //   res.send(result)
    // }
    // else {
    //   res.status(404).send({ message: "ID NOT FOUND" });
    // }
    //c2
    let updatedItem = await subjectModel.findByIdAndUpdate(id, {
      isDeleted: true
    }, {
      new: true
    });
    if (!updatedItem) return res.status(404).json({ success: false, message: "ID NOT FOUND" });
    res.status(200).json({ success: true, message: "Subject deleted successfully" });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
});

module.exports = router;
