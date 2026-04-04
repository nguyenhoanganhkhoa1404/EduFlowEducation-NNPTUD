import React, { useState, useEffect } from 'react';

function App() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('home'); // home, course, enrollments, login

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
            <a href="#" onClick={() => setView('enrollments')}>My Learning</a>
            <a href="#" onClick={() => setView('login')}>Login</a>
          </nav>
        </div>
      </header>

      <main>
        {view === 'home' && renderHome()}
        {view === 'enrollments' && (
          <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
            <h2>My Enrollments</h2>
            <p style={{ color: '#64748b', marginTop: '1rem' }}>You haven't enrolled in any courses yet.</p>
          </div>
        )}
        {view === 'login' && (
          <div className="auth-container">
            <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Sign In</h2>
            <form onSubmit={e => e.preventDefault()}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Username</label>
                <input type="text" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
                <input type="password" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              </div>
              <button className="btn">Login</button>
            </form>
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
