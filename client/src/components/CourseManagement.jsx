import React, { useState, useEffect } from 'react';

const CourseManagement = () => {
    const [courses, setCourses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingCourse, setEditingCourse] = useState(null);
    const [formData, setFormData] = useState({
        courseCode: '',
        courseName: '',
        slug: '',
        price: 0,
        description: '',
        instructor: '',
        subject: ''
    });
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [cRes, sRes] = await Promise.all([
                fetch('http://localhost:3000/api/v1/courses'),
                fetch('http://localhost:3000/api/v1/subjects')
            ]);
            const coursesData = await cRes.json();
            const subjectsData = await sRes.json();
            setCourses(coursesData.data || []);
            setSubjects(subjectsData || []);
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'price' ? Number(value) : value,
            slug: name === 'courseName' ? value.toLowerCase().replace(/ /g, '-') : prev.slug
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const url = editingCourse 
            ? `http://localhost:3000/api/v1/courses/${editingCourse._id}` 
            : 'http://localhost:3000/api/v1/courses';
        const method = editingCourse ? 'PUT' : 'POST';

        // Note: The original backend uses multipart/form-data for images, 
        // but for simplicity here we'll use JSON if images aren't being uploaded 
        // OR we adapt to the backend requirements if needed.
        // Given complexity, let's try JSON first or use FormData if it fails.
        
        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                setMessage(editingCourse ? 'Updated successfully' : 'Created successfully');
                resetForm();
                fetchInitialData();
            } else {
                setMessage(data.message || 'Error occurred');
            }
        } catch (err) {
            setMessage('Failed to save course');
        }
    };

    const resetForm = () => {
        setFormData({
            courseCode: '',
            courseName: '',
            slug: '',
            price: 0,
            description: '',
            instructor: '',
            subject: ''
        });
        setEditingCourse(null);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this course?')) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:3000/api/v1/courses/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setMessage('Deleted successfully');
                fetchInitialData();
            }
        } catch (err) {
            setMessage('Failed to delete course');
        }
    };

    return (
        <div className="management-container">
            <header className="mgmt-header">
                <h3>Quản lý Khóa học</h3>
                <p>Quản lý nội dung, giá cả và giảng viên của các khóa học.</p>
            </header>

            <div className="form-section course-form-card">
                <h4>{editingCourse ? 'Sửa Khóa học' : 'Thêm Khóa học mới'}</h4>
                <form onSubmit={handleSubmit} className="mgmt-grid-form">
                    <div className="form-group">
                        <label>Mã khóa học</label>
                        <input name="courseCode" value={formData.courseCode} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                        <label>Tên khóa học</label>
                        <input name="courseName" value={formData.courseName} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                        <label>Slug</label>
                        <input name="slug" value={formData.slug} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                        <label>Giá (VND)</label>
                        <input type="number" name="price" value={formData.price} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                        <label>Giảng viên</label>
                        <input name="instructor" value={formData.instructor} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Chuyên ngành</label>
                        <select name="subject" value={formData.subject} onChange={handleInputChange} required>
                            <option value="">Chọn chuyên ngành</option>
                            {subjects.filter(s => !s.isDeleted).map(s => (
                                <option key={s._id} value={s._id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group full-width">
                        <label>Mô tả</label>
                        <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3"></textarea>
                    </div>
                    <div className="form-buttons full-width">
                        <button type="submit" className="btn btn-primary">{editingCourse ? 'Cập nhật' : 'Thêm mới'}</button>
                        <button type="button" className="btn btn-secondary" onClick={resetForm}>Làm mới</button>
                    </div>
                </form>
                {message && <p className="status-msg">{message}</p>}
            </div>

            <div className="list-section" style={{ marginTop: '2rem' }}>
                {loading ? (
                    <p>Loading courses...</p>
                ) : (
                    <div className="table-responsive">
                        <table className="mgmt-table">
                            <thead>
                                <tr>
                                    <th>Mã</th>
                                    <th>Tên</th>
                                    <th>Giá</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courses.filter(c => !c.isDeleted).map(course => (
                                    <tr key={course._id}>
                                        <td>{course.courseCode}</td>
                                        <td>{course.courseName}</td>
                                        <td>{course.price.toLocaleString()} VND</td>
                                        <td>
                                            <button className="btn-icon" onClick={() => {
                                                setEditingCourse(course);
                                                setFormData({
                                                    courseCode: course.courseCode,
                                                    courseName: course.courseName,
                                                    slug: course.slug,
                                                    price: course.price,
                                                    description: course.description,
                                                    instructor: course.instructor,
                                                    subject: course.subject?._id || course.subject
                                                });
                                            }}><i className="fas fa-edit"></i></button>
                                            <button className="btn-icon btn-delete" onClick={() => handleDelete(course._id)}>
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .mgmt-grid-form { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; }
                .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
                .form-group label { font-size: 0.875rem; font-weight: 600; color: #475569; }
                .form-group input, .form-group select, .form-group textarea { padding: 0.75rem; border-radius: 8px; border: 1px solid #e2e8f0; font-family: inherit; }
                .full-width { grid-column: span 2; }
                .course-form-card { background: #f8fafc; padding: 2rem; border-radius: 12px; }
                .table-responsive { overflow-x: auto; }
            `}} />
        </div>
    );
};

export default CourseManagement;
