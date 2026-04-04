let express = require('express')
let router = express.Router()
let cartModel = require('../schemas/carts')
let { CheckLogin } = require('../utils/authHandler')
let capacityModel = require('../schemas/capacities')

router.get('/', CheckLogin, async function (req, res, next) {
    try {
        let user = req.user;
        let cart = await cartModel.findOne({
            user: user._id
        })
        if (!cart) {
            return res.send([]);
        }
        await cart.populate(['user', 'items.course']);
        res.send(cart.items)
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
})
router.post('/add', CheckLogin, async function (req, res, next) {
    try {
        let { courseCode, quantity } = req.body;
        
        if (!courseCode) {
            return res.status(400).send({ message: "Vui lòng nhập courseCode" });
        }

        const courseDoc = await require('../schemas/courses').findOne({ courseCode: courseCode });
        if (!courseDoc) {
            return res.status(404).send({ message: "Mã khóa học không tồn tại" });
        }

        let getCourse = await capacityModel.findOne({
            course: courseDoc._id
        })
        if (!getCourse) {
            res.status(404).send("course khong ton tai");
            return;
        }
        let user = req.user;
        let cart = await cartModel.findOne({
            user: user._id
        })
        if (!cart) {
            cart = new cartModel({ user: user._id, items: [] });
        }
        let index = cart.items.findIndex(
            function (e) {
                return e.course == courseDoc._id
            }
        )
        if (index > -1) {
            if (getCourse.maxStudents >= (cart.items[index].quantity + quantity)) {
                cart.items[index].quantity += quantity
                await cart.save();
                await cart.populate(['user', 'items.course']);
                res.send(cart)
            } else {
                res.status(404).send("course da het cho");
            }
        } else {
            if (getCourse.maxStudents >= quantity) {
                cart.items.push({
                    course: courseDoc._id,
                    quantity: quantity
                })
                await cart.save();
                await cart.populate(['user', 'items.course']);
                res.send(cart)
            } else {
                res.status(404).send("course da het cho");
            }
        }
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
})
router.post('/remove', CheckLogin, async function (req, res, next) {
    try {
        let { courseCode, quantity } = req.body;

        if (!courseCode) {
            return res.status(400).send({ message: "Vui lòng nhập courseCode" });
        }

        const courseDoc = await require('../schemas/courses').findOne({ courseCode: courseCode });
        if (!courseDoc) {
            return res.status(404).send({ message: "Mã khóa học không tồn tại" });
        }

        let getCourse = await capacityModel.findOne({
            course: courseDoc._id
        })
        if (!getCourse) {
            res.status(404).send("course khong ton tai");
            return;
        }
        let user = req.user;
        let cart = await cartModel.findOne({
            user: user._id
        })
        if (!cart) {
            return res.status(404).send("Giỏ hàng trống");
        }
        let index = cart.items.findIndex(
            function (e) {
                return e.course == courseDoc._id
            }
        )
        if (index > -1) {
            if (cart.items[index].quantity > quantity) {
                cart.items[index].quantity -= quantity;
                await cart.save()
                await cart.populate(['user', 'items.course']);
                res.send(cart);
            } else {
                if (cart.items[index].quantity == quantity) {
                    cart.items.splice(index, 1);
                    await cart.save();
                    await cart.populate(['user', 'items.course']);
                    res.send(cart);
                } else {
                    res.status(404).send("khong duoc xoa ve am");
                }
            }
        } else {
            res.status(404).send("course khong ton tai trong gio hang");
        }
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
})

module.exports = router;