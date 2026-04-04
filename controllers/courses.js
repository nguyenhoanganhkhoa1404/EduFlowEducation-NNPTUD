const courseModel = require('../schemas/courses');
const capacityModel = require('../schemas/capacities');
const slugify = require('slugify');

module.exports = {
  getAllCourses: async (req, res) => {
    try {
      const courses = await courseModel.find({ isDeleted: false }).populate('subject');
      res.status(200).json({ success: true, count: courses.length, data: courses });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getCourseById: async (req, res) => {
    try {
      const course = await courseModel.findOne({ _id: req.params.id, isDeleted: false }).populate('subject');
      if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
      res.status(200).json({ success: true, data: course });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  createCourse: async (req, res) => {
    try {
      const { courseCode, courseName, price, description, subject, instructor, maxStudents } = req.body;
      const slug = slugify(courseName, { lower: true });
      
      const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

      const newCourse = new courseModel({
        courseCode,
        courseName,
        slug,
        price,
        description,
        subject,
        instructor,
        images: images.length > 0 ? images : undefined
      });

      await newCourse.save();

      // Auto-create capacity record
      const newCapacity = new capacityModel({
        course: newCourse._id,
        maxStudents: maxStudents || 50, // Default to 50 if not specified
        enrolledCount: 0
      });
      await newCapacity.save();

      res.status(201).json({ success: true, data: newCourse, capacity: newCapacity });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  updateCourse: async (req, res) => {
    try {
      const { courseName, price, description, subject, instructor } = req.body;
      const updateData = { courseName, price, description, subject, instructor };
      
      if (courseName) updateData.slug = slugify(courseName, { lower: true });
      if (req.files && req.files.length > 0) {
        updateData.images = req.files.map(file => `/uploads/${file.filename}`);
      }

      const course = await courseModel.findByIdAndUpdate(req.params.id, updateData, { new: true });
      if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
      
      res.status(200).json({ success: true, data: course });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  deleteCourse: async (req, res) => {
    try {
      const course = await courseModel.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
      if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
      res.status(200).json({ success: true, message: 'Course deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
