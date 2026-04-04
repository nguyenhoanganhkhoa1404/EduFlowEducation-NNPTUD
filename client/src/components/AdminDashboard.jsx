import React, { useState, useEffect } from 'react';
import SubjectManagement from './SubjectManagement';
import CourseManagement from './CourseManagement';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalCourses: 0,
        totalEnrollments: 0
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('stats'); // stats, courses, subjects

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { 'Authorization': `Bearer ${token}` };

                const [usersRes, coursesRes, enrollmentsRes] = await Promise.all([
                    fetch('http://localhost:3000/api/v1/users', { headers }),
                    fetch('http://localhost:3000/api/v1/courses', { headers }),
                    fetch('http://localhost:3000/api/v1/enrollments', { headers })
                ]);

                const usersData = await usersRes.json();
                const coursesData = await coursesRes.json();
                const enrollmentsData = await enrollmentsRes.json();

                setStats({
                    totalUsers: usersData.data?.length || 0,
                    totalCourses: coursesData.data?.length || 0,
                    totalEnrollments: enrollmentsData.data?.length || 0
                });
            } catch (err) {
                console.error('Failed to fetch admin stats:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="admin-dashboard">
            <header className="admin-header">
                <h2>Bảng điều khiển Admin</h2>
                <nav className="admin-tabs">
                    <button className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
                        Thống kê
                    </button>
                    <button className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => setActiveTab('courses')}>
                        Khóa học
                    </button>
                    <button className={`tab-btn ${activeTab === 'subjects' ? 'active' : ''}`} onClick={() => setActiveTab('subjects')}>
                        Chuyên ngành
                    </button>
                </nav>
            </header>

            {activeTab === 'stats' && (
                <>
                    {loading ? (
                        <div className="loading">Đang tải thống kê...</div>
                    ) : (
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon"><i className="fas fa-users"></i></div>
                                <div className="stat-info">
                                    <h3>Tổng người dùng</h3>
                                    <p className="stat-value">{stats.totalUsers}</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon"><i className="fas fa-book"></i></div>
                                <div className="stat-info">
                                    <h3>Tổng khóa học</h3>
                                    <p className="stat-value">{stats.totalCourses}</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon"><i className="fas fa-check-circle"></i></div>
                                <div className="stat-info">
                                    <h3>Tổng đơn đăng ký</h3>
                                    <p className="stat-value">{stats.totalEnrollments}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="admin-actions">
                        <h3>Thao tác nhanh</h3>
                        <div className="action-buttons">
                            <button className="btn btn-secondary" onClick={() => setActiveTab('courses')}>Quản lý khóa học</button>
                            <button className="btn btn-secondary" onClick={() => setActiveTab('subjects')}>Quản lý chuyên ngành</button>
                            <button className="btn btn-secondary">Cài đặt hệ thống</button>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'courses' && <CourseManagement />}
            {activeTab === 'subjects' && <SubjectManagement />}

            <style dangerouslySetInnerHTML={{ __html: `
                .admin-dashboard {
                    padding: 2rem 0;
                }
                .admin-header {
                    margin-bottom: 3rem;
                    text-align: left;
                }
                .admin-header h2 {
                    font-size: 2.5rem;
                    color: #1e293b;
                    margin-bottom: 1.5rem;
                }
                .admin-tabs {
                    display: flex;
                    gap: 1rem;
                    border-bottom: 2px solid #f1f5f9;
                    padding-bottom: 1rem;
                }
                .tab-btn {
                    padding: 0.75rem 1.5rem;
                    border: none;
                    background: none;
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #64748b;
                    cursor: pointer;
                    border-radius: 8px;
                    transition: all 0.2s;
                }
                .tab-btn:hover {
                    background: #f1f5f9;
                    color: #1e293b;
                }
                .tab-btn.active {
                    background: #3b82f6;
                    color: white;
                }
                .admin-header p {
                    color: #64748b;
                    font-size: 1.1rem;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 1.5rem;
                    margin-bottom: 3rem;
                }
                .stat-card {
                    background: white;
                    padding: 2rem;
                    border-radius: 16px;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    transition: transform 0.2s;
                }
                .stat-card:hover {
                    transform: translateY(-4px);
                }
                .stat-icon {
                    width: 60px;
                    height: 60px;
                    background: #f1f5f9;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    color: #3b82f6;
                }
                .stat-info h3 {
                    font-size: 0.875rem;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 0.25rem;
                }
                .stat-value {
                    font-size: 1.875rem;
                    font-weight: 700;
                    color: #1e293b;
                }
                .admin-actions {
                    background: white;
                    padding: 2rem;
                    border-radius: 16px;
                    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                }
                .admin-actions h3 {
                    margin-bottom: 1.5rem;
                    color: #1e293b;
                }
                .action-buttons {
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;
                }
                .btn-secondary {
                    background: #f1f5f9;
                    color: #1e293b;
                    border: 1px solid #e2e8f0;
                }
                .btn-secondary:hover {
                    background: #e2e8f0;
                }
            `}} />
        </div>
    );
};

export default AdminDashboard;
