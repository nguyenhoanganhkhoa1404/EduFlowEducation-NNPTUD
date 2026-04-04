import React, { useState, useEffect } from 'react';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('home'); // home, course, enrollments, login, admin
  const [user, setUser] = useState(null);
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
  }, []);

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
                  <button className="btn">Enroll Now</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="App">
      <header>
        <div className="container nav-container">
          <a href="#" className="logo" onClick={() => setView('home')}>
            <i className="fas fa-book-open"></i> EduFlow
          </a>
          <nav className="nav-links">
            <a href="#" onClick={() => setView('home')}>Courses</a>
            {user && <a href="#" onClick={() => setView('enrollments')}>My Learning</a>}
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
        {view === 'home' && renderHome()}
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
                  <div key={enr._id} className="enrollment-card" style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ marginBottom: '0.25rem' }}>Enrollment #{enr._id.substring(enr._id.length - 6)}</h4>
                      <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Total: {enr.finalAmount.toLocaleString()} VND</p>
                      <span style={{ 
                        display: 'inline-block', 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '999px', 
                        fontSize: '0.75rem', 
                        background: enr.paymentStatus === 'Paid' ? '#dcfce7' : '#fef9c3',
                        color: enr.paymentStatus === 'Paid' ? '#166534' : '#854d0e',
                        marginTop: '0.5rem'
                      }}>
                        {enr.paymentStatus}
                      </span>
                    </div>
                    {enr.paymentStatus === 'Unpaid' && (
                      <button 
                        className="btn" 
                        onClick={() => handlePay(enr._id)}
                        disabled={user?.role?.name?.toLowerCase() === 'admin'}
                        style={{ opacity: user?.role?.name?.toLowerCase() === 'admin' ? 0.5 : 1, cursor: user?.role?.name?.toLowerCase() === 'admin' ? 'not-allowed' : 'pointer' }}
                      >
                        {user?.role?.name?.toLowerCase() === 'admin' ? 'Admin Restricted' : 'Pay Now'}
                      </button>
                    )}
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
