var express = require('express');
var router = express.Router();
let subjectModel = require('../schemas/subjects');
const { default: slugify } = require('slugify');

/* GET users listing. */
router.get('/', async function (req, res, next) {
  try {
    let result = await subjectModel.find({
      isDeleted: false
    })
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: error.message });
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
      res.send(result);
    } else {
      res.status(404).send({ message: "ID NOT FOUND" });
    }
  } catch (error) {
    res.status(404).send({ message: error.message });
  }
});
router.post('/', async function (req, res, next) {
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
    res.send(newCate)
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
})
router.put('/:id', async function (req, res, next) {
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
    res.send(updatedItem)
  } catch (error) {
    res.status(404).send({ message: error.message });
  }
});

router.delete('/:id', async function (req, res, next) {
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
    res.send(updatedItem)
  } catch (error) {
    res.status(404).send({ message: error.message });
  }
});

module.exports = router;
