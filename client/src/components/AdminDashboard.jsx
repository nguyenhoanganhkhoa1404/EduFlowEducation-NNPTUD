import React, { useState, useEffect } from 'react';
import SubjectManagement from './SubjectManagement';
import CourseManagement from './CourseManagement';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalCourses: 0,
        totalEnrollments: 0,
        totalRevenue: 0
    });
    const [loading, setLoading] = useState(true);
    const [enrollments, setEnrollments] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [activeTab, setActiveTab] = useState('stats'); // stats, courses, subjects, enrollments, coupons

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { 'Authorization': `Bearer ${token}` };

                const [usersRes, coursesRes, enrollmentsRes, couponsRes] = await Promise.all([
                    fetch('http://localhost:3000/api/v1/users', { headers }),
                    fetch('http://localhost:3000/api/v1/courses', { headers }),
                    fetch('http://localhost:3000/api/v1/enrollments', { headers }),
                    fetch('http://localhost:3000/api/v1/coupons', { headers })
                ]);

                const usersData = await usersRes.json();
                const coursesData = await coursesRes.json();
                const enrollmentsData = await enrollmentsRes.json();
                const couponsData = await couponsRes.json();

                const totalRev = (enrollmentsData.data || [])
                    .filter(enr => enr.paymentStatus === 'Paid')
                    .reduce((sum, enr) => sum + (enr.finalAmount || 0), 0);

                setStats({
                    totalUsers: usersData.data?.length || 0,
                    totalCourses: coursesData.data?.length || 0,
                    totalEnrollments: enrollmentsData.data?.length || 0,
                    totalCoupons: couponsData.data?.length || 0,
                    totalRevenue: totalRev
                });
                setEnrollments(enrollmentsData.data || []);
                setCoupons(couponsData.data || []);
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
                    <button className={`tab-btn ${activeTab === 'enrollments' ? 'active' : ''}`} onClick={() => setActiveTab('enrollments')}>
                        Đơn đăng ký
                    </button>
                    <button className={`tab-btn ${activeTab === 'coupons' ? 'active' : ''}`} onClick={() => setActiveTab('coupons')}>
                        Mã giảm giá
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
                                <div className="stat-icon" style={{ color: '#ec4899', background: '#fdf2f8' }}><i className="fas fa-ticket-alt"></i></div>
                                <div className="stat-info">
                                    <h3>Mã giảm giá</h3>
                                    <p className="stat-value">{stats.totalCoupons}</p>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon" style={{ color: '#10b981', background: '#ecfdf5' }}><i className="fas fa-hand-holding-usd"></i></div>
                                <div className="stat-info">
                                    <h3>Tổng doanh thu</h3>
                                    <p className="stat-value">{stats.totalRevenue.toLocaleString()}đ</p>
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
            {activeTab === 'enrollments' && (
                <div className="enrollments-view">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3>Danh sách học viên đăng ký</h3>
                        <span style={{ background: '#eef2ff', color: '#4f46e5', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: '600' }}>
                            {enrollments.length} Đơn hàng
                        </span>
                    </div>

                    <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                                <tr>
                                    <th style={{ padding: '1rem' }}>Mã đơn</th>
                                    <th style={{ padding: '1rem' }}>Học viên</th>
                                    <th style={{ padding: '1rem' }}>Khóa học</th>
                                    <th style={{ padding: '1rem' }}>Tạm tính</th>
                                    <th style={{ padding: '1rem', color: '#10b981' }}>Giảm giá</th>
                                    <th style={{ padding: '1rem' }}>Thanh toán</th>
                                    <th style={{ padding: '1rem' }}>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {enrollments.map(enr => (
                                    <tr key={enr._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '1rem', fontVariantNumeric: 'tabular-nums' }}>#{enr._id.substring(enr._id.length - 6)}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: '600' }}>{enr.user?.fullName || 'N/A'}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{enr.user?.username}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ maxWidth: '300px' }}>
                                                {enr.items?.map((item, idx) => (
                                                    <div key={idx} style={{ fontSize: '0.875rem' }}>
                                                        • {item.course?.courseName || 'N/A'}
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{enr.totalAmount?.toLocaleString()}đ</td>
                                        <td style={{ padding: '1rem', color: '#10b981' }}>{enr.discount > 0 ? `-${enr.discount?.toLocaleString()}đ` : '-'}</td>
                                        <td style={{ padding: '1rem', fontWeight: '700', color: '#4f46e5' }}>{enr.finalAmount?.toLocaleString()}đ</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ 
                                                padding: '0.25rem 0.75rem', 
                                                borderRadius: '999px', 
                                                fontSize: '0.75rem', 
                                                background: enr.paymentStatus === 'Paid' ? '#dcfce7' : '#fef9c3',
                                                color: enr.paymentStatus === 'Paid' ? '#166534' : '#854d0e'
                                            }}>
                                                {enr.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chờ xử lý'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'coupons' && (
                <div className="coupons-view">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3>Quản lý mã giảm giá</h3>
                        <button className="btn" style={{ width: 'auto', marginTop: 0 }}>+ Tạo mã mới</button>
                    </div>

                    <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}>
                                <tr>
                                    <th style={{ padding: '1rem' }}>Mã Code</th>
                                    <th style={{ padding: '1rem' }}>Loại</th>
                                    <th style={{ padding: '1rem' }}>Giá trị</th>
                                    <th style={{ padding: '1rem' }}>Hết hạn</th>
                                    <th style={{ padding: '1rem' }}>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coupons.map(cpn => (
                                    <tr key={cpn._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '1rem' }}><span style={{ fontWeight: '700', color: '#4f46e5', background: '#eef2ff', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>{cpn.code}</span></td>
                                        <td style={{ padding: '1rem' }}>{cpn.discountType}</td>
                                        <td style={{ padding: '1rem', fontWeight: '600' }}>
                                            {cpn.discountType === 'Percentage' ? `${cpn.discountValue}%` : `${cpn.discountValue.toLocaleString()} VND`}
                                        </td>
                                        <td style={{ padding: '1rem' }}>{new Date(cpn.expiryDate).toLocaleDateString('vi-VN')}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ 
                                                padding: '0.25rem 0.75rem', 
                                                borderRadius: '999px', 
                                                fontSize: '0.75rem', 
                                                background: cpn.isActive ? '#dcfce7' : '#fee2e2',
                                                color: cpn.isActive ? '#166534' : '#991b1b'
                                            }}>
                                                {cpn.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

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
