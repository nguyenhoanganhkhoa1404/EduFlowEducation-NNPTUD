import React, { useState, useEffect } from 'react';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('home'); // home, course, enrollments, login, admin
  const [user, setUser] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showEnrollPopup, setShowEnrollPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [cart, setCart] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [authData, setAuthData] = useState({ username: '', password: '' });
  const [regData, setRegData] = useState({ username: '', email: '', password: '', fullName: '' });
  const [authView, setAuthView] = useState('login'); // login or register
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      if (parsedUser.role?.name?.toLowerCase() === 'admin') {
        setView('admin');
      }
    }
    fetchCourses();
    fetchCoupons();
    if (localStorage.getItem('token')) {
      fetchCart();
    }
  }, []);

  const fetchCart = async () => {
    setCartLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/v1/carts', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      // Backend returns items array or cart object? 
      // Based on routes/carts.js line 17: res.send(cart.items)
      setCart(Array.isArray(data) ? data : (data.items || []));
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    } finally {
      setCartLoading(false);
    }
  };

  const addToCart = async (courseCode) => {
    if (!user) {
      alert('Vui lòng đăng nhập để thêm vào giỏ hàng.');
      setView('login');
      return;
    }

    // Duplicate check
    const isAlreadyInCart = cart.some(item => item.course?.courseCode === courseCode);
    if (isAlreadyInCart) {
      alert('Khóa học này đã có trong giỏ hàng của bạn.');
      return;
    }

    const isAlreadyEnrolled = myEnrollments.some(enr => enr.items.some(item => item.course?.courseCode === courseCode));
    if (isAlreadyEnrolled) {
      alert('Bạn đã đăng ký khóa học này rồi.');
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/api/v1/carts/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ courseCode, quantity: 1 })
      });
      const data = await res.json();
      if (res.ok) {
        setCart(data.items || []);
        setToastMessage('Đã thêm vào giỏ hàng thành công!');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } else {
        alert(data.message || 'Không thể thêm vào giỏ hàng');
      }
    } catch (err) {
      console.error('Add to cart error:', err);
    }
  };

  const fetchCoupons = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/v1/coupons');
      const data = await res.json();
      if (data.success) {
        // Only show active and non-expired coupons
        const activeCoupons = data.data.filter(c => c.isActive && new Date(c.expiryDate) > new Date());
        setAvailableCoupons(activeCoupons);
      }
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
    }
  };

  useEffect(() => {
    if (view === 'enrollments' && user) {
      fetchMyEnrollments();
    }
  }, [view, user]);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/v1/courses');
      const data = await res.json();
      if (data.success) {
        setCourses(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyEnrollments = async () => {
    setEnrollmentLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/v1/enrollments/my', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setMyEnrollments(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch enrollments:', err);
    } finally {
      setEnrollmentLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3000/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData)
      });
      const data = await res.json();
      if (data.success) {
        alert('Đăng ký thành công! Hãy đăng nhập.');
        setAuthView('login');
        setAuthData({ username: regData.username, password: '' });
      } else {
        alert(data.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      alert('An error occurred during registration');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authData)
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        // Get full user info
        const meRes = await fetch('http://localhost:3000/api/v1/auth/me', {
          headers: { 'Authorization': `Bearer ${data.token}` }
        });
        const meData = await meRes.json();
        if (meData.success) {
          const userData = meData.data;
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          setView(userData.role?.name?.toLowerCase() === 'admin' ? 'admin' : 'home');
        }
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      alert('An error occurred during login');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setView('home');
  };

  const handleDeleteEnrollment = async (enrollmentId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn đăng ký này?')) return;
    try {
      const res = await fetch(`http://localhost:3000/api/v1/enrollments/${enrollmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        alert('Đã hủy đơn đăng ký thành công');
        fetchMyEnrollments();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handlePay = async (enrollmentId) => {
    if (user?.role?.name?.toLowerCase() === 'admin') {
      alert('Administrator không thể thực hiện thanh toán');
      return;
    }

    try {
      const res = await fetch(`http://localhost:3000/api/v1/enrollments/${enrollmentId}/pay`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        alert('Thanh toán thành công!');
        fetchMyEnrollments();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error('Payment error:', err);
    }
  };

  const handleCouponValidate = async (codeToUse) => {
    const code = (codeToUse || couponCode).trim();
    if (!code) return;
    setCouponError('');
    try {
      const res = await fetch(`http://localhost:3000/api/v1/coupons/validate/${code}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        if (selectedCourse.price < data.data.minEnrollmentAmount) {
          setCouponError(`Đơn hàng tối thiểu ${data.data.minEnrollmentAmount.toLocaleString()} VNĐ mới được áp dụng.`);
          setAppliedCoupon(null);
        } else {
          setAppliedCoupon(data.data);
          setCouponCode(code); // Ensure input shows the code
        }
      } else {
        setCouponError(data.message);
        setAppliedCoupon(null);
      }
    } catch (err) {
      setCouponError('Lỗi kiểm tra mã giảm giá');
    }
  };

  const renderEnrollPopup = () => {
    if (!showEnrollPopup || !selectedCourse) return null;

    let discount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discountType === 'Percentage') {
        discount = (selectedCourse.price * appliedCoupon.discountValue) / 100;
      } else {
        discount = appliedCoupon.discountValue;
      }
    }
    const finalPrice = selectedCourse.price - discount;

    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', maxWidth: '500px', width: '90%', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}>
          <h3 style={{ marginBottom: '1rem', color: '#1e293b' }}>Xác nhận đăng ký học</h3>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Kiểm tra lại thông tin và áp dụng mã giảm giá (nếu có):</p>
          
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: '600' }}>{selectedCourse.isCart ? 'Danh sách khóa học:' : 'Khóa học:'}</span>
              <div style={{ textAlign: 'right' }}>
                {selectedCourse.isCart ? (
                  selectedCourse.items.map(item => (
                    <div key={item._id} style={{ fontSize: '0.875rem' }}>• {item.course?.courseName}</div>
                  ))
                ) : (
                  <span>{selectedCourse.courseName}</span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: '600' }}>Giá gốc:</span>
              <span style={{ textDecoration: discount > 0 ? 'line-through' : 'none', color: discount > 0 ? '#94a3b8' : 'inherit' }}>
                {selectedCourse.price.toLocaleString()} VND
              </span>
            </div>
            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#10b981' }}>
                <span style={{ fontWeight: '600' }}>Giảm giá:</span>
                <span>-{discount.toLocaleString()} VND</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
              <span style={{ fontWeight: '700' }}>Tổng thanh toán:</span>
              <span style={{ color: '#4f46e5', fontWeight: '800', fontSize: '1.2rem' }}>{finalPrice.toLocaleString()} VND</span>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: '#1e293b' }}>Mã giảm giá (Coupon):</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                placeholder="Nhập mã..." 
                value={couponCode}
                onChange={e => setCouponCode(e.target.value)}
                style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <button 
                className="btn" 
                onClick={() => handleCouponValidate()}
                style={{ marginTop: 0, width: 'auto', padding: '0 1rem' }}
              >
                Áp dụng
              </button>
            </div>
            {couponError && <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{couponError}</p>}
            
            {/* Coupon Suggestions */}
            {availableCoupons.length > 0 && !appliedCoupon && (
              <div style={{ marginTop: '0.75rem' }}>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>Mã giảm giá khả dụng (nhấn để chọn):</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {availableCoupons.map(cpn => (
                    <span 
                      key={cpn._id}
                      onClick={() => handleCouponValidate(cpn.code)}
                      style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.25rem 0.6rem', 
                        background: '#f1f5f9', 
                        color: '#4f46e5', 
                        borderRadius: '999px', 
                        cursor: 'pointer',
                        border: '1px solid #e2e8f0',
                        fontWeight: '600'
                      }}
                    >
                      {cpn.code} ({cpn.discountType === 'Percentage' ? `-${cpn.discountValue}%` : `-${cpn.discountValue.toLocaleString()}đ`})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              className="btn" 
              onClick={() => { setShowEnrollPopup(false); setCouponCode(''); setAppliedCoupon(null); setCouponError(''); }}
              style={{ background: 'white', color: '#64748b', border: '1px solid #e2e8f0', marginTop: 0 }}
            >
              Hủy bỏ
            </button>
            <button 
              className="btn" 
              onClick={() => { setShowEnrollPopup(false); handleEnroll(selectedCourse); }}
              style={{ marginTop: 0 }}
            >
              Xác nhận & Thanh toán
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCourseDetail = () => {
    if (!selectedCourse) return null;
    return (
      <div className="container" style={{ padding: '4rem 0' }}>
        <button onClick={() => setView('home')} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className="fas fa-arrow-left"></i> Quay lại
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '3rem', background: 'white', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
          <div style={{ background: '#f1f5f9', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyItems: 'center', height: '300px', justifyContent: 'center' }}>
             <i className="fas fa-graduation-cap" style={{ fontSize: '5rem', color: '#cbd5e1' }}></i>
          </div>
          <div>
            <span style={{ color: '#4f46e5', fontWeight: '700', textTransform: 'uppercase', fontSize: '0.875rem' }}>{selectedCourse.subject?.name || 'General'}</span>
            <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>{selectedCourse.courseName}</h2>
            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', marginBottom: '1.5rem' }}>{selectedCourse.price.toLocaleString()} VND</p>
            <div style={{ marginBottom: '2rem', color: '#64748b' }}>
              <h4 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>Mô tả khóa học</h4>
              <p>{selectedCourse.description || 'Chưa có mô tả cho khóa học này.'}</p>
            </div>
            <button 
              className="btn" 
              style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}
              onClick={() => setShowEnrollPopup(true)}
            >
              Đăng ký học ngay
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderToast = () => {
    if (!showToast) return null;
    return (
      <div style={{
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        background: '#10b981',
        color: 'white',
        padding: '1rem 2rem',
        borderRadius: '12px',
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        animation: 'slideIn 0.3s ease-out'
      }}>
        <i className="fas fa-check-circle" style={{ fontSize: '1.25rem' }}></i>
        <span style={{ fontWeight: '600' }}>{toastMessage}</span>
      </div>
    );
  };

  const renderSuccessPopup = () => {
    if (!showSuccessPopup) return null;

    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }}>
        <div style={{ background: 'white', padding: '2.5rem', borderRadius: '16px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)' }}>
          <div style={{ width: '60px', height: '60px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: '#22c55e', fontSize: '2rem' }}>
            <i className="fas fa-check"></i>
          </div>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#1e293b' }}>Chúc mừng!</h3>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>Bạn đã đăng ký khóa học <strong style={{ color: '#1e293b' }}>{selectedCourse?.courseName}</strong> thành công. Hãy bắt đầu học ngay nhé!</p>
          <button 
            className="btn" 
            onClick={() => { setShowSuccessPopup(false); setView('enrollments'); }}
            style={{ marginTop: 0 }}
          >
            Đến trang học tập
          </button>
        </div>
      </div>
    );
  };

  const handleEnroll = async (course) => {
    if (!user) {
      alert('Vui lòng đăng nhập để đăng ký khóa học.');
      setView('login');
      return;
    }

    if (user.role?.name?.toLowerCase() === 'admin') {
      alert('Administrator không thể đăng ký khóa học.');
      return;
    }

    try {
      const items = selectedCourse.isCart 
        ? selectedCourse.items.map(item => ({ course: item.course._id, quantity: item.quantity }))
        : [{ course: selectedCourse._id, quantity: 1 }];

      const res = await fetch('http://localhost:3000/api/v1/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          items,
          couponCode: appliedCoupon ? appliedCoupon.code : undefined,
          paymentMethod: 'COD'
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowSuccessPopup(true);
        setCouponCode('');
        setAppliedCoupon(null);
        if (selectedCourse.isCart) {
          // Clear cart on backend and local state
          await fetch('http://localhost:3000/api/v1/carts', {
             method: 'DELETE', // Assuming DELETE /api/v1/carts clears it
             headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          setCart([]);
        }
      } else {
        alert(data.message || 'Đăng ký thất bại');
      }
    } catch (err) {
      console.error('Enrollment error:', err);
      alert('Có lỗi xảy ra khi đăng ký');
    }
  };

  const renderHome = () => (
    <>
      <section className="hero">
        <div className="container">
          <h1>Learn New Skills Online</h1>
          <p>Accessible, expert-led courses designed to help you succeed.</p>
        </div>
      </section>
      <div className="container">
        <h2 style={{ marginBottom: '2rem' }}>Featured Courses</h2>
        {loading ? (
          <p>Loading courses...</p>
        ) : (
          <div className="course-grid">
            {courses.map(course => (
              <div key={course._id} className="course-card">
                <div className="course-image">
                  <i className="fas fa-graduation-cap"></i>
                </div>
                <div className="course-content">
                  <span className="course-subject">{course.subject?.name || 'General'}</span>
                  <h3 className="course-name">{course.courseName}</h3>
                  <p className="course-price">{course.price.toLocaleString()} VND</p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn" style={{ flex: 1 }} onClick={() => { setSelectedCourse(course); setView('course'); }}>Chi tiết</button>
                    <button 
                      className="btn" 
                      style={{ background: '#f1f5f9', color: '#4f46e5', flex: 1 }} 
                      onClick={() => addToCart(course.courseCode)}
                    >
                      <i className="fas fa-cart-plus"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
  
  const renderCart = () => {
    const total = cart.reduce((sum, item) => sum + (item.course?.price || 0) * item.quantity, 0);
    
    return (
      <div className="container" style={{ padding: '4rem 0' }}>
        <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>Giỏ hàng của bạn</h2>
        {cartLoading ? (
          <p style={{ textAlign: 'center' }}>Đang tải giỏ hàng...</p>
        ) : cart.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748b' }}>
            <i className="fas fa-shopping-basket" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}></i>
            <p>Giỏ hàng của bạn đang trống.</p>
            <button className="btn" onClick={() => setView('home')} style={{ width: 'auto', marginTop: '1rem' }}>Khám phá khóa học </button>
          </div>
        ) : (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8fafc' }}>
                  <tr>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Khóa học</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Số lượng</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Thành tiền</th>
                    <th style={{ padding: '1rem' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map(item => (
                    <tr key={item._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: '600' }}>{item.course?.courseName}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.course?.price.toLocaleString()} VND</div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>
                        {((item.course?.price || 0) * item.quantity).toLocaleString()} VND
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <button 
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                          onClick={async () => {
                            await fetch('http://localhost:3000/api/v1/carts/remove', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                              body: JSON.stringify({ courseId: item.course._id, quantity: item.quantity })
                            });
                            fetchCart();
                          }}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '1.5rem', background: '#f8fafc', textAlign: 'right' }}>
                <div style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
                  Tổng cộng: <strong style={{ fontSize: '1.5rem', color: '#4f46e5' }}>{total.toLocaleString()} VND</strong>
                </div>
                <button 
                  className="btn" 
                  style={{ width: 'auto' }}
                  onClick={() => {
                    setSelectedCourse({
                      _id: 'multiple',
                      courseName: `${cart.length} khóa học`,
                      price: total,
                      isCart: true,
                      items: cart
                    });
                    setShowEnrollPopup(true);
                  }}
                >
                  Xác nhận đăng ký ({cart.length} khóa)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="App">
      <header>
        <div className="container nav-container">
          <a href="#" className="logo" onClick={() => setView('home')}>
            <i className="fas fa-book-open"></i> EduFlow
          </a>
          <nav className="nav-links">
            <a href="#" onClick={() => setView('home')}>Courses</a>
            {user && (
              <>
                <a href="#" onClick={() => setView('enrollments')}>My Learning</a>
                <a href="#" onClick={() => setView('cart')} style={{ position: 'relative' }}>
                  <i className="fas fa-shopping-cart"></i> Giỏ hàng
                  {cart.length > 0 && (
                    <span style={{ 
                      position: 'absolute', 
                      top: '-10px', 
                      right: '-15px', 
                      background: '#ef4444', 
                      color: 'white', 
                      fontSize: '0.7rem', 
                      padding: '2px 6px', 
                      borderRadius: '999px',
                      fontWeight: 'bold'
                    }}>
                      {cart.length}
                    </span>
                  )}
                </a>
              </>
            )}
            {user?.role?.name?.toLowerCase() === 'admin' && <a href="#" onClick={() => setView('admin')} style={{ color: '#ef4444', fontWeight: 'bold' }}>Admin</a>}
            {!user ? (
              <a href="#" onClick={() => setView('login')}>Login</a>
            ) : (
              <a href="#" onClick={handleLogout}>Logout ({user.username})</a>
            )}
          </nav>
        </div>
      </header>

      <main>
        {renderToast()}
        {renderEnrollPopup()}
        {renderSuccessPopup()}
        {view === 'home' && renderHome()}
        {view === 'course' && renderCourseDetail()}
        {view === 'cart' && renderCart()}
        {view === 'enrollments' && (
          <div className="container" style={{ padding: '4rem 0' }}>
            <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>My Enrollments</h2>
            {enrollmentLoading ? (
              <p style={{ textAlign: 'center' }}>Loading enrollments...</p>
            ) : myEnrollments.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center' }}>You haven't enrolled in any courses yet.</p>
            ) : (
              <div className="enrollment-list">
                {myEnrollments.map(enr => (
                  <div key={enr._id} className="enrollment-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1rem' }}>
                      <div>
                        <h4 style={{ color: '#1e293b' }}>Enrollment #{enr._id.substring(enr._id.length - 6)}</h4>
                        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Status: {enr.paymentStatus}</p>
                      </div>
                      <span style={{ 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '999px', 
                        fontSize: '0.75rem', 
                        height: 'fit-content',
                        background: enr.paymentStatus === 'Paid' ? '#dcfce7' : '#fef9c3',
                        color: enr.paymentStatus === 'Paid' ? '#166534' : '#854d0e'
                      }}>
                        {enr.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                      </span>
                    </div>

                    <div className="enrollment-items">
                      {enr.items.map(item => (
                        <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                          <span>{item.course?.courseName || 'Khóa học không xác định'}</span>
                          <span style={{ fontWeight: '500' }}>{item.price.toLocaleString()} VND</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                      {enr.discount > 0 && (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.875rem', color: '#64748b' }}>
                            <span>Tạm tính:</span>
                            <span>{enr.totalAmount.toLocaleString()} VND</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#10b981' }}>
                            <span>Giảm giá:</span>
                            <span>-{enr.discount.toLocaleString()} VND</span>
                          </div>
                        </>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontWeight: '700', fontSize: '1.2rem', color: '#4f46e5' }}>
                          Tổng cộng: {enr.finalAmount.toLocaleString()} VND
                        </div>
                      </div>
                    </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {enr.paymentStatus === 'Unpaid' && (
                          <>
                            <button 
                              className="btn" 
                              onClick={() => handleDeleteEnrollment(enr._id)}
                              style={{ background: 'transparent', color: '#ef4444', border: '1px solid #feb2b2', marginTop: 0, width: 'auto' }}
                            >
                              Hủy
                            </button>
                            <button 
                              className="btn" 
                              onClick={() => handlePay(enr._id)}
                              disabled={user?.role?.name?.toLowerCase() === 'admin'}
                              style={{ marginTop: 0, width: 'auto', opacity: user?.role?.name?.toLowerCase() === 'admin' ? 0.5 : 1 }}
                            >
                              {user?.role?.name?.toLowerCase() === 'admin' ? 'Admin Restricted' : 'Thanh toán'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
            )}
          </div>
        )}
        {view === 'login' && (
          <div className="auth-container">
            {authView === 'login' ? (
              <>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Đăng nhập</h2>
                <form onSubmit={handleLogin}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Tên đăng nhập</label>
                    <input 
                      type="text" 
                      value={authData.username}
                      onChange={e => setAuthData({...authData, username: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} 
                      required
                    />
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Mật khẩu</label>
                    <input 
                      type="password" 
                      value={authData.password}
                      onChange={e => setAuthData({...authData, password: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} 
                      required
                    />
                  </div>
                  <button className="btn" type="submit">Đăng nhập</button>
                </form>
                <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
                  Chưa có tài khoản? <a href="#" onClick={() => setAuthView('register')} style={{ color: '#4f46e5', fontWeight: 'bold' }}>Đăng ký ngay</a>
                </p>
              </>
            ) : (
              <>
                <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Đăng ký tài khoản</h2>
                <form onSubmit={handleRegister}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Họ và tên</label>
                    <input 
                      type="text" 
                      value={regData.fullName}
                      onChange={e => setRegData({...regData, fullName: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} 
                      required
                    />
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
                    <input 
                      type="email" 
                      value={regData.email}
                      onChange={e => setRegData({...regData, email: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} 
                      required
                    />
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Tên đăng nhập</label>
                    <input 
                      type="text" 
                      value={regData.username}
                      onChange={e => setRegData({...regData, username: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} 
                      required
                    />
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Mật khẩu</label>
                    <input 
                      type="password" 
                      value={regData.password}
                      onChange={e => setRegData({...regData, password: e.target.value})}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} 
                      required
                    />
                  </div>
                  <button className="btn" type="submit">Đăng ký</button>
                </form>
                <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
                  Đã có tài khoản? <a href="#" onClick={() => setAuthView('login')} style={{ color: '#4f46e5', fontWeight: 'bold' }}>Đăng nhập</a>
                </p>
              </>
            )}
          </div>
        )}
        {view === 'admin' && (
          <div className="container">
            <AdminDashboard />
          </div>
        )}
      </main>

      <footer style={{ marginTop: '4rem', padding: '4rem 0', background: '#1e293b', color: 'white', textAlign: 'center' }}>
        <p>&copy; 2026 EduFlow. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
