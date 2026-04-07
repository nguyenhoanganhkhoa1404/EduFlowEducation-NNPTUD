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
            setSubjects(data.data || []);
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
            if (res.ok && data.success) {
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
            const data = await res.json();
            if (res.ok && data.success) {
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
                                    <td><span className="slug-badge">{subject.slug}</span></td>
                                    <td>
                                        <div className="actions-cell">
                                            <button className="btn-icon" title="Sửa" onClick={() => {
                                                setEditingSubject(subject);
                                                setFormData({ name: subject.name });
                                            }}><i className="fas fa-edit"></i></button>
                                            <button className="btn-icon btn-delete" title="Xóa" onClick={() => handleDelete(subject._id)}>
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
                .form-section {
                    background: #f8fafc;
                    padding: 2.5rem;
                    border-radius: 20px;
                    border: 1px solid #e2e8f0;
                    margin-bottom: 3rem;
                }
                .form-section h4 { margin-top: 0; margin-bottom: 1.5rem; color: #334155; }
                .mgmt-form { display: flex; gap: 1rem; align-items: flex-end; }
                .mgmt-form input { 
                    flex: 1; 
                    padding: 0.875rem; 
                    border-radius: 12px; 
                    border: 1px solid #cbd5e1; 
                    font-family: inherit;
                    transition: all 0.2s;
                    background: white;
                }
                .mgmt-form input:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
                }
                
                .form-buttons { display: flex; gap: 0.75rem; }
                .btn {
                    padding: 0.875rem 1.5rem;
                    border-radius: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                }
                .btn-primary { background: #2563eb; color: white; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); }
                .btn-primary:hover { background: #1d4ed8; transform: translateY(-1px); }
                
                .list-section {
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
                
                .slug-badge {
                    background: #f1f5f9;
                    color: #64748b;
                    padding: 0.25rem 0.625rem;
                    border-radius: 6px;
                    font-family: monospace;
                    font-size: 0.8125rem;
                }
                
                .actions-cell { display: flex; gap: 0.5rem; }
                .btn-icon {
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
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

export default SubjectManagement;
