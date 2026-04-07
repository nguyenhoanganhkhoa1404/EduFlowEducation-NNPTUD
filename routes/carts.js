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
                res.status(400).send({ message: "Khóa học đã hết chỗ" });
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
                res.status(400).send({ message: "Khóa học đã hết chỗ" });
            }
        }
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
})

router.post('/remove', CheckLogin, async function (req, res, next) {
    try {
        let { courseCode, courseId, quantity } = req.body;

        if (!courseCode && !courseId) {
            return res.status(400).send({ message: "Vui lòng cung cấp courseCode hoặc courseId" });
        }

        let query = courseId ? { _id: courseId } : { courseCode: courseCode };
        const courseDoc = await require('../schemas/courses').findOne(query);
        if (!courseDoc) {
            return res.status(404).send({ message: "Mã khóa học không tồn tại" });
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
                return e.course.toString() == courseDoc._id.toString()
            }
        )
        console.log('Cart removal debug - Index found:', index);
        if (index > -1) {
            console.log('Cart removal debug - Removing item:', cart.items[index]);
            if (cart.items[index].quantity > quantity) {
                cart.items[index].quantity -= quantity;
                await cart.save()
                await cart.populate(['user', 'items.course']);
                res.send(cart);
            } else {
                cart.items.splice(index, 1);
                await cart.save();
                await cart.populate(['user', 'items.course']);
                res.send(cart);
            }
        } else {
            console.log('Cart removal debug - Course not found in cart. CourseID:', courseDoc._id, 'Cart items:', cart.items.map(i => i.course));
            res.status(404).send("Khóa học không tồn tại trong giỏ hàng");
        }
    } catch (error) {
        console.error('Cart removal error:', error);
        res.status(500).send({ message: error.message });
    }
})

router.delete('/', CheckLogin, async function (req, res, next) {
    try {
        let user = req.user;
        await cartModel.findOneAndDelete({ user: user._id });
        res.send({ success: true, message: "Đã xóa toàn bộ giỏ hàng" });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
})

module.exports = router;