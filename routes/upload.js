let express = require('express')
let router = express.Router()
let { uploadImage, uploadExcel } = require('../utils/uploadHandler')
let path = require('path')
let exceljs = require('exceljs')
let fs = require('fs')

const User = require('../schemas/users');
const Role = require('../schemas/roles');
const { sendPasswordMail } = require('../utils/sendMail');
const crypto = require('crypto');
let subjectsModel = require('../schemas/subjects')
let coursesModel = require('../schemas/courses')
let capacitiesModel = require('../schemas/capacities')
let mongoose = require('mongoose')
let slugify = require('slugify')

router.post('/one_image', uploadImage.single('file'), function (req, res, next) {
    if (!req.file) {
        res.status(404).send({
            message: "file not found"
        })
    } else {
        console.log(req.body);
        res.send({
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size
        })
    }
})
router.post('/multiple_images', uploadImage.array('files', 5), function (req, res, next) {
    if (!req.files) {
        res.status(404).send({
            message: "file not found"
        })
    } else {
        console.log(req.body);
        res.send(req.files.map(f => ({
            filename: f.filename,
            path: f.path,
            size: f.size
        })))
    }
})
router.get('/:filename', function (req, res, next) {
    let pathFile = path.join(
        __dirname, '../uploads', req.params.filename
    )
    res.sendFile(pathFile)
})

router.post('/excel', uploadExcel.single('file'), async function (req, res, next) {
    if (!req.file) {
        res.status(404).send({
            message: "file not found"
        })
    } else {
        //workbook->worksheet->column/row->cell
        let workbook = new exceljs.Workbook();
        let pathFile = path.join(
            __dirname, '../uploads', req.file.filename
        )
        await workbook.xlsx.readFile(pathFile)
        let worksheet = workbook.worksheets[0];
        let result = []
        let subjects = await subjectsModel.find({
        });
        let subjectsMap = new Map();
        for (const subject of subjects) {
            subjectsMap.set(subject.name, subject._id)
        }
        let courses = await coursesModel.find({})
        let getCourseName = courses.map(p => p.courseName)
        let getCourseCode = courses.map(p => p.courseCode)

        for (let index = 2; index <= worksheet.rowCount; index++) {
            let errorsInRow = []
            const element = worksheet.getRow(index);
            let courseCode = element.getCell(1).value;
            let courseName = element.getCell(2).value;
            let subject = element.getCell(3).value;

            let price = Number.parseInt(element.getCell(4).value)
            let maxStudents = Number.parseInt(element.getCell(5).value)

            if (price < 0 || isNaN(price)) {
                errorsInRow.push("price khong hop le")
            }
            if (maxStudents < 0 || isNaN(maxStudents)) {
                errorsInRow.push("maxStudents khong hop le")
            }
            if (!subjectsMap.has(subject)) {
                errorsInRow.push('subject khong hop le')
            }
            if (getCourseCode.includes(courseCode)) {
                errorsInRow.push('courseCode bi trung')
            }
            if (getCourseName.includes(courseName)) {
                errorsInRow.push('courseName khong hop le')
            }
            if (errorsInRow.length > 0) {
                result.push({
                    success: false,
                    data: errorsInRow
                });
                continue;
            }

            let session = await mongoose.startSession();
            session.startTransaction()
            try {
                let newCourse = new coursesModel({
                    courseCode: courseCode,
                    courseName: courseName,
                    slug: slugify(courseName, {
                        replacement: '-',
                        remove: undefined,
                        lower: true,
                        strict: false,
                    }),
                    price: price,
                    description: courseName,
                    subject: subjectsMap.get(subject)
                });
                newCourse = await newCourse.save({ session });
                let newCapacity = new capacitiesModel({
                    course: newCourse._id,
                    maxStudents: maxStudents
                })
                newCapacity = await newCapacity.save({ session });
                newCapacity = await newCapacity.populate('course')
                await session.commitTransaction();
                await session.endSession()
                getCourseName.push(courseName);
                getCourseCode.push(courseCode)
                result.push({
                    success: true,
                    data: newCapacity
                })
            } catch (error) {
                await session.abortTransaction();
                await session.endSession()
                result.push({
                    success: false,
                    data: error.message
                })
            }

        }
        fs.unlinkSync(pathFile)
        res.send(result.map(function (r, index) {
            if (r.success) {
                return { [index + 1]: r.data }
            } else {
                return { [index + 1]: r.data.join(',') }
            }
        }))
    }
})

router.post('/users-excel', uploadExcel.single('file'), async function (req, res, next) {
    if (!req.file) {
        return res.status(404).send({ message: "file not found" });
    }
    try {
        let workbook = new exceljs.Workbook();
        let pathFile = path.join(__dirname, '../uploads', req.file.filename);
        await workbook.xlsx.readFile(pathFile);
        let worksheet = workbook.worksheets[0];

        let userRole = await Role.findOne({ name: "user" });
        if (!userRole) {
            return res.status(500).send({ message: "Role 'user' not found in database." });
        }

        // Tự động xóa các user có tên bắt đầu bằng "user" để tránh lỗi trùng lặp bọc Object lần trước
        await User.deleteMany({ username: { $regex: /^user/i } });
        
        let createdUsers = [];
        let errors = [];

        for (let index = 2; index <= worksheet.rowCount; index++) {
            const element = worksheet.getRow(index);
            let unameVal = element.getCell(1).value;
            let emailVal = element.getCell(2).value;

            function extractText(val) {
                if (!val) return "";
                if (typeof val !== 'object') return val.toString().trim();
                if (val.richText) return val.richText.map(r => r.text).join('').trim();
                if (val.text) return val.text.toString().trim();
                if (val.hyperlink) return val.hyperlink.toString().trim();
                if (val.result) return val.result.toString().trim();
                return val.toString().trim();
            }

            let username = extractText(unameVal);
            let email = extractText(emailVal);

            if (email.startsWith('mailto:')) {
                email = email.replace('mailto:', '');
            }

            if (!username || !email) continue;

            try {
                let generatedPassword = crypto.randomBytes(8).toString('hex');

                let newUser = new User({
                    username: username,
                    email: email,
                    password: generatedPassword,
                    role: userRole._id
                });
                
                await newUser.save();
                await sendPasswordMail(email, username, generatedPassword);
                
                createdUsers.push(username);
            } catch (err) {
                errors.push({ username, error: err.message });
            }
        }
        res.send({ message: "Import completed", createdUsers, errors });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

module.exports = router;