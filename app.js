require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'frontend')));

// DB Connection
const DB_URI = process.env.MONGODB_URI;
mongoose.connect(DB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ DB Connection Error:', err));

// Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/courses', require('./routes/courses'));
app.use('/api/v1/subjects', require('./routes/subjects'));
app.use('/api/v1/roles', require('./routes/roles'));
app.use('/api/v1/carts', require('./routes/carts'));
app.use('/api/v1/enrollments', require('./routes/enrollments'));
app.use('/api/v1/coupons', require('./routes/coupons'));
app.use('/api/v1/reviews', require('./routes/reviews'));
app.use('/api/v1/payments', require('./routes/payments'));
app.use('/api/v1/notifications', require('./routes/notifications'));
app.use('/api/v1/capacities', require('./routes/capacities'));

// Error handling (JSON only)
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: app.get('env') === 'development' ? err : {}
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app;
