const enrollmentModel = require('../schemas/enrollments');
const enrollmentDetailModel = require('../schemas/enrollmentDetails');
const courseModel = require('../schemas/courses');
const capacityModel = require('../schemas/capacities');
const couponModel = require('../schemas/coupons');
const notificationModel = require('../schemas/notifications');
const paymentModel = require('../schemas/payments');
const mongoose = require('mongoose');

module.exports = {
  createEnrollment: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { items, additionalNotes, couponCode } = req.body;
      const user = req.user._id;

      let totalAmount = 0;
      let enrollmentItems = [];

      // 1. Validate items and calculate total
      for (const item of items) {
        let course;
        if (item.courseCode) {
            course = await courseModel.findOne({ courseCode: item.courseCode }).session(session);
        } else {
            course = await courseModel.findById(item.course).session(session);
        }
        
        if (!course) throw new Error(`Course ${item.courseCode || item.course} not found`);

        // Check Capacity
        const capacity = await capacityModel.findOne({ course: course._id }).session(session);
        if (!capacity || capacity.maxStudents < capacity.enrolledCount + (item.quantity || 1)) {
          throw new Error(`Insufficient capacity for course ${course.courseName}`);
        }

        totalAmount += course.price * (item.quantity || 1);
        enrollmentItems.push({
          course: course._id,
          quantity: item.quantity || 1,
          price: course.price
        });
      }

      // 2. Handle Coupon
      let discount = 0;
      let couponDoc = null;
      if (couponCode) {
        const code = couponCode.trim();
        couponDoc = await couponModel.findOne({ 
          code: { $regex: new RegExp("^" + code + "$", "i") }, 
          isActive: true, 
          expiryDate: { $gt: new Date() } 
        }).session(session);
        if (couponDoc) {
          if (totalAmount >= couponDoc.minEnrollmentAmount) {
            if (couponDoc.discountType === 'Percentage') {
              discount = (totalAmount * couponDoc.discountValue) / 100;
            } else {
              discount = couponDoc.discountValue;
            }
          }
        }
      }

      const finalAmount = totalAmount - discount;

      // 3. Create Enrollment
      const newEnrollment = new enrollmentModel({
        user,
        totalAmount,
        additionalNotes,
        coupon: couponDoc ? couponDoc._id : undefined,
        discount,
        finalAmount,
        status: req.body.paymentMethod === 'COD' ? 'Enrolled' : 'Pending',
        paymentStatus: req.body.paymentMethod === 'COD' ? 'Paid' : 'Unpaid'
      });
      await newEnrollment.save({ session });

      // 4. Create Enrollment Details and Update Capacity
      for (const item of enrollmentItems) {
        const enrollmentDetail = new enrollmentDetailModel({
          enrollment: newEnrollment._id,
          course: item.course,
          quantity: item.quantity,
          price: item.price
        });
        await enrollmentDetail.save({ session });

        // Update Enrollment items list
        newEnrollment.items.push(enrollmentDetail._id);

        // Update Capacity
        await capacityModel.findOneAndUpdate(
          { course: item.course },
          { $inc: { enrolledCount: item.quantity } },
          { session }
        );
      }
      await newEnrollment.save({ session });

      await session.commitTransaction();
      session.endSession();

      // Create notification without slowing down response
      try {
        await new notificationModel({
          user,
          title: "Đăng ký thành công",
          message: `Bạn đã đăng ký thành công ${enrollmentItems.length} khóa học. Tổng tiền: ${finalAmount.toLocaleString()} VNĐ`,
          type: 'Enrollment'
        }).save();

        // Create payment record
        await new paymentModel({
          enrollment: newEnrollment._id,
          user,
          paymentMethod: req.body.paymentMethod || 'COD',
          amount: finalAmount,
          status: req.body.paymentMethod === 'COD' ? 'Completed' : 'Pending'
        }).save();
      } catch (notifyError) {
        console.error('Notification/Payment Error:', notifyError);
      }

      res.status(201).json({ success: true, data: newEnrollment });
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      session.endSession();
      res.status(400).json({ success: false, message: error.message });
    }
  },

  getAllEnrollments: async (req, res) => {
    try {
      const enrollments = await enrollmentModel.find().populate('user').populate({
        path: 'items',
        populate: { path: 'course' }
      });
      res.status(200).json({ success: true, data: enrollments });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getMyEnrollments: async (req, res) => {
    try {
      const enrollments = await enrollmentModel.find({ user: req.user._id }).populate({
        path: 'items',
        populate: { path: 'course' }
      });
      res.status(200).json({ success: true, data: enrollments });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  payEnrollment: async (req, res) => {
    try {
      const enrollment = await enrollmentModel.findById(req.params.id);
      if (!enrollment) return res.status(404).json({ success: false, message: 'Enrollment not found' });
      
      // Check ownership and role
      const roleName = req.user.role ? req.user.role.name : "";
      if (roleName.toLowerCase() === 'admin') {
        return res.status(403).json({ success: false, message: 'Administrator không thể thực hiện thanh toán' });
      }

      if (enrollment.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền thanh toán đơn đăng ký này' });
      }

      if (enrollment.paymentStatus === 'Paid') {
        return res.status(400).json({ success: false, message: 'Đơn đăng ký đã được thanh toán' });
      }

      enrollment.paymentStatus = 'Paid';
      enrollment.status = 'Enrolled';
      await enrollment.save();

      // Update payment record
      await paymentModel.findOneAndUpdate(
        { enrollment: enrollment._id },
        { status: 'Completed' },
        { upsert: true }
      );

      // Create notification
      await new notificationModel({
        user: req.user._id,
        title: "Thanh toán thành công",
        message: `Đơn đăng ký #${enrollment._id} đã được thanh toán thành công.`,
        type: 'Enrollment'
      }).save();

      res.status(200).json({ success: true, data: enrollment });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  deleteEnrollment: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const enrollment = await enrollmentModel.findById(req.params.id).session(session);
      if (!enrollment) throw new Error('Enrollment not found');

      // Check ownership
      if (enrollment.user.toString() !== req.user._id.toString()) {
        throw new Error('Bạn không có quyền xóa đơn đăng ký này');
      }

      if (enrollment.paymentStatus === 'Paid') {
        throw new Error('Không thể xóa đơn đăng ký đã thanh toán');
      }

      // Revert Capacity
      const details = await enrollmentDetailModel.find({ enrollment: enrollment._id }).session(session);
      for (const detail of details) {
        await capacityModel.findOneAndUpdate(
          { course: detail.course },
          { $inc: { enrolledCount: -detail.quantity } },
          { session }
        );
      }

      // Delete details and enrollment
      await enrollmentDetailModel.deleteMany({ enrollment: enrollment._id }).session(session);
      await enrollmentModel.findByIdAndDelete(enrollment._id).session(session);

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({ success: true, message: 'Đã xóa đơn đăng ký thành công' });
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      session.endSession();
      res.status(400).json({ success: false, message: error.message });
    }
  },

  removeItemFromEnrollment: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { id, courseCode } = req.params;
      const enrollment = await enrollmentModel.findById(id).populate('items').session(session);
      if (!enrollment) throw new Error('Enrollment not found');

      // Check ownership
      if (enrollment.user.toString() !== req.user._id.toString()) {
        throw new Error('Bạn không có quyền chỉnh sửa đơn đăng ký này');
      }

      // Check status
      if (enrollment.paymentStatus === 'Paid') {
        throw new Error('Không thể xóa sản phẩm từ đơn đăng ký đã thanh toán');
      }

      // Find course
      const course = await courseModel.findOne({ courseCode }).session(session);
      if (!course) throw new Error(`Không tìm thấy khóa học với mã ${courseCode}`);

      // Find enrollment detail for this course
      const detailIndex = enrollment.items.findIndex(item => item.course.toString() === course._id.toString());
      if (detailIndex === -1) throw new Error(`Khóa học ${courseCode} không có trong đơn đăng ký này`);

      const detail = enrollment.items[detailIndex];

      // 1. Revert Capacity
      await capacityModel.findOneAndUpdate(
        { course: course._id },
        { $inc: { enrolledCount: -detail.quantity } },
        { session }
      );

      // 2. Remove item from enrollment items array
      enrollment.items.splice(detailIndex, 1);

      // 3. Delete enrollment detail record
      await enrollmentDetailModel.findByIdAndDelete(detail._id).session(session);

      // 4. Recalculate Totals
      if (enrollment.items.length === 0) {
        // If no items left, delete the enrollment
        await enrollmentModel.findByIdAndDelete(enrollment._id).session(session);
        await session.commitTransaction();
        session.endSession();
        return res.status(200).json({ success: true, message: 'Đơn đăng ký được xóa hoàn toàn vì không còn sản phẩm nào' });
      }

      // Update totals
      let newTotalAmount = 0;
      // Re-fetch remaining details to be safe or use what's left in enrollment.items (which are populated)
      for (const item of enrollment.items) {
        newTotalAmount += item.price * item.quantity;
      }
      
      enrollment.totalAmount = newTotalAmount;
      
      // Handle Discount (pro-rated or simple re-calculation if needed)
      // For simplicity, let's just subtract the removed item's pro-rated discount if coupon was used
      // Or if the new total doesn't meet the minEnrollmentAmount, remove coupon
      if (enrollment.coupon) {
        const couponDoc = await couponModel.findById(enrollment.coupon).session(session);
        if (couponDoc && newTotalAmount < couponDoc.minEnrollmentAmount) {
          enrollment.coupon = undefined;
          enrollment.discount = 0;
        } else if (couponDoc) {
          if (couponDoc.discountType === 'Percentage') {
            enrollment.discount = (newTotalAmount * couponDoc.discountValue) / 100;
          } else {
            enrollment.discount = couponDoc.discountValue;
          }
        }
      } else {
        enrollment.discount = 0;
      }

      enrollment.finalAmount = enrollment.totalAmount - enrollment.discount;
      await enrollment.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({ success: true, data: enrollment, message: `Đã xóa khóa học ${courseCode} khỏi đơn đăng ký` });
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      session.endSession();
      res.status(400).json({ success: false, message: error.message });
    }
  }
};
