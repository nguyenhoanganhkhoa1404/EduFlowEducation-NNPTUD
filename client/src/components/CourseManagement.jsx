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
            setSubjects(subjectsData.data || []);
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
                                        <td><span className="course-code-badge">{course.courseCode}</span></td>
                                        <td>{course.courseName}</td>
                                        <td><span className="price-tag">{course.price.toLocaleString()} VND</span></td>
                                        <td>
                                            <div className="actions-cell">
                                                <button className="btn-icon" title="Sửa" onClick={() => {
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
                                                <button className="btn-icon btn-delete" title="Xóa" onClick={() => handleDelete(course._id)}>
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .management-container {
                    background: white;
                    padding: 2.5rem;
                    border-radius: 24px;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
                    border: 1px solid #f1f5f9;
                }
                .mgmt-header h3 {
                    font-size: 1.75rem;
                    color: #0f172a;
                    margin-bottom: 0.5rem;
                    font-weight: 700;
                }
                .mgmt-header p {
                    color: #64748b;
                    font-size: 1rem;
                    margin-bottom: 2rem;
                }
                .course-form-card {
                    background: #f8fafc;
                    padding: 2.5rem;
                    border-radius: 20px;
                    border: 1px solid #e2e8f0;
                    margin-bottom: 3rem;
                }
                .mgmt-grid-form {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1.5rem;
                    margin-top: 1.5rem;
                }
                .form-group { display: flex; flex-direction: column; gap: 0.625rem; }
                .form-group label { font-size: 0.875rem; font-weight: 600; color: #334155; }
                .form-group input, .form-group select, .form-group textarea {
                    padding: 0.875rem;
                    border-radius: 12px;
                    border: 1px solid #cbd5e1;
                    font-family: inherit;
                    font-size: 0.95rem;
                    transition: all 0.2s;
                    background: white;
                }
                .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
                }
                .full-width { grid-column: span 2; }
                .form-buttons { display: flex; gap: 1rem; margin-top: 1rem; }
                .btn {
                    padding: 0.875rem 1.75rem;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 0.95rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                }
                .btn-primary { background: #2563eb; color: white; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); }
                .btn-primary:hover { background: #1d4ed8; transform: translateY(-1px); }
                .btn-secondary { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
                .btn-secondary:hover { background: #e2e8f0; color: #1e293b; }
                
                .table-responsive {
                    background: white;
                    border-radius: 16px;
                    border: 1px solid #f1f5f9;
                    overflow: hidden;
                }
                .mgmt-table { width: 100%; border-collapse: separate; border-spacing: 0; }
                .mgmt-table th {
                    background: #f8fafc;
                    padding: 1.25rem 1.5rem;
                    text-align: left;
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #475569;
                    border-bottom: 1px solid #f1f5f9;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .mgmt-table td {
                    padding: 1.25rem 1.5rem;
                    color: #1e293b;
                    border-bottom: 1px solid #f1f5f9;
                    font-size: 1rem;
                    vertical-align: middle;
                }
                .mgmt-table tr:last-child td { border-bottom: none; }
                .mgmt-table tr:hover { background-color: #f8fafc; }
                
                .course-code-badge {
                    background: #eff6ff;
                    color: #2563eb;
                    padding: 0.375rem 0.75rem;
                    border-radius: 8px;
                    font-weight: 700;
                    font-size: 0.875rem;
                    font-family: monospace;
                }
                .price-tag { font-weight: 700; color: #0f172a; }
                
                .actions-cell { display: flex; gap: 0.5rem; }
                .btn-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid #e2e8f0;
                    background: white;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-icon:hover { background: #eff6ff; color: #3b82f6; border-color: #3b82f6; }
                .btn-icon.btn-delete:hover { background: #fef2f2; color: #ef4444; border-color: #fecaca; }
                
                .status-msg {
                    margin-top: 1.5rem;
                    padding: 1rem;
                    border-radius: 12px;
                    background: #f0fdf4;
                    color: #166534;
                    font-weight: 500;
                    border: 1px solid #bbf7d0;
                    text-align: center;
                }
            `}} />
        </div>
    );
};

export default CourseManagement;
