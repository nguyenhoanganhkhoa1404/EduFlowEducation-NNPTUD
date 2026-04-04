import React, { useState, useEffect } from 'react';

const SubjectManagement = () => {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingSubject, setEditingSubject] = useState(null);
    const [formData, setFormData] = useState({ name: '' });
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/v1/subjects');
            const data = await res.json();
            setSubjects(data);
        } catch (err) {
            console.error('Failed to fetch subjects:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const url = editingSubject 
            ? `http://localhost:3000/api/v1/subjects/${editingSubject._id}` 
            : 'http://localhost:3000/api/v1/subjects';
        const method = editingSubject ? 'PUT' : 'POST';

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
            if (res.ok) {
                setMessage(editingSubject ? 'Updated successfully' : 'Created successfully');
                setFormData({ name: '' });
                setEditingSubject(null);
                fetchSubjects();
            } else {
                setMessage(data.message || 'Error occurred');
            }
        } catch (err) {
            setMessage('Failed to save subject');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this subject?')) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`http://localhost:3000/api/v1/subjects/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setMessage('Deleted successfully');
                fetchSubjects();
            }
        } catch (err) {
            setMessage('Failed to delete subject');
        }
    };

    return (
        <div className="management-container">
            <header className="mgmt-header">
                <h3>Quản lý Chuyên ngành</h3>
                <p>Thêm, sửa hoặc xóa các chuyên ngành đào tạo.</p>
            </header>

            <div className="form-section">
                <h4>{editingSubject ? 'Sửa Chuyên ngành' : 'Thêm Chuyên ngành mới'}</h4>
                <form onSubmit={handleSubmit} className="mgmt-form">
                    <input 
                        type="text" 
                        placeholder="Tên chuyên ngành" 
                        value={formData.name}
                        onChange={e => setFormData({ name: e.target.value })}
                        required
                    />
                    <div className="form-buttons">
                        <button type="submit" className="btn btn-primary">
                            {editingSubject ? 'Cập nhật' : 'Thêm mới'}
                        </button>
                        {editingSubject && (
                            <button type="button" className="btn btn-secondary" onClick={() => {
                                setEditingSubject(null);
                                setFormData({ name: '' });
                            }}>Hủy</button>
                        )}
                    </div>
                </form>
                {message && <p className="status-msg">{message}</p>}
            </div>

            <div className="list-section">
                {loading ? (
                    <p>Loading subjects...</p>
                ) : (
                    <table className="mgmt-table">
                        <thead>
                            <tr>
                                <th>Tên Chuyên ngành</th>
                                <th>Slug</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subjects.filter(s => !s.isDeleted).map(subject => (
                                <tr key={subject._id}>
                                    <td>{subject.name}</td>
                                    <td>{subject.slug}</td>
                                    <td>
                                        <button className="btn-icon" onClick={() => {
                                            setEditingSubject(subject);
                                            setFormData({ name: subject.name });
                                        }}><i className="fas fa-edit"></i></button>
                                        <button className="btn-icon btn-delete" onClick={() => handleDelete(subject._id)}>
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .management-container { background: white; padding: 2rem; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
                .mgmt-header { margin-bottom: 2rem; }
                .mgmt-form { display: flex; gap: 1rem; margin-top: 1rem; margin-bottom: 2rem; }
                .mgmt-form input { flex: 1; padding: 0.75rem; border-radius: 8px; border: 1px solid #e2e8f0; }
                .mgmt-table { width: 100%; border-collapse: collapse; }
                .mgmt-table th, .mgmt-table td { text-align: left; padding: 1rem; border-bottom: 1px solid #f1f5f9; }
                .btn-icon { background: none; border: none; cursor: pointer; padding: 0.5rem; font-size: 1rem; color: #64748b; }
                .btn-icon:hover { color: #3b82f6; }
                .btn-delete:hover { color: #ef4444; }
                .status-msg { margin-top: 1rem; font-size: 0.875rem; color: #10b981; }
            `}} />
        </div>
    );
};

export default SubjectManagement;
