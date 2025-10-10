import React, { useState, useEffect, useContext } from 'react';
import '../../components/Student/Dashboard.css';
import { FaUser, FaCalendarAlt, FaChartBar, FaBook, FaMoneyBillWave, FaHistory, FaBookOpen } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import StudentProfile from '../../components/Student/StudentProfile';

const mockStudentInfo = {
    fullName: 'Nguyễn Văn A',
    studentCode: 'HE123456',
    dob: '01/01/2003',
    pob: 'Hà Nội',
    major: 'Kỹ thuật phần mềm',
    avatarUrl: 'https://i.pravatar.cc/150'
};

const mockDashboardStats = {
    weeklySchedules: 4,
    weeklyExams: 0
};
// -------------------------------------------------


const Dashboard = () => {
    const [studentInfo, setStudentInfo] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showProfile, setShowProfile] = useState(false);
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    useEffect(() => {
        // Hàm này sẽ gọi API backend để lấy dữ liệu cho dashboard
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');

                // Gọi API để lấy thông tin student
                const studentRes = await fetch('http://localhost:9999/api/student/profile', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (studentRes.ok) {
                    const studentData = await studentRes.json();
                    setStudentInfo({
                        fullName: `${studentData.firstName} ${studentData.lastName}`,
                        studentCode: studentData.studentCode,
                        dob: new Date(studentData.createdAt).toLocaleDateString('vi-VN'),
                        pob: 'Việt Nam', // Tạm thời
                        major: 'Kỹ thuật phần mềm', // Tạm thời
                        avatarUrl: studentData.studentAvatar || 'https://i.pravatar.cc/150',
                        phone: studentData.phone,
                        gender: studentData.gender
                    });
                } else {
                    // Nếu chưa có student record, sử dụng dữ liệu mock
                    setStudentInfo(mockStudentInfo);
                }

                // TODO: Gọi API để lấy thống kê dashboard
                setStats(mockDashboardStats);

            } catch (error) {
                console.error("Lỗi khi tải dữ liệu dashboard:", error);
                // Fallback to mock data
                setStudentInfo(mockStudentInfo);
                setStats(mockDashboardStats);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Listen for profile updates dispatched from StudentProfile so we can refresh UI immediately
    useEffect(() => {
        const handler = (e) => {
            const s = e?.detail?.student;
            if (!s) return;
            setStudentInfo(prev => ({
                ...prev,
                fullName: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
                studentCode: s.studentCode || prev?.studentCode,
                dob: prev?.dob,
                pob: prev?.pob,
                major: prev?.major,
                avatarUrl: s.studentAvatar || prev?.avatarUrl,
                phone: s.phone || prev?.phone,
                gender: typeof s.gender !== 'undefined' ? s.gender : prev?.gender
            }));
        };

        window.addEventListener('studentProfileUpdated', handler);
        return () => window.removeEventListener('studentProfileUpdated', handler);
    }, []);

    if (loading) {
        return <div className="loading">Đang tải dữ liệu...</div>;
    }

    return (
        <div className="dashboard-container">
            {/* Phần Header */}
            <header className="dashboard-header">
                <h1>UAP - University Academic Portal</h1>
                <div className="user-profile">
                    <span>{user?.name || studentInfo?.fullName} ({studentInfo?.studentCode})</span>
                </div>
            </header>

            {/* Phần nội dung chính */}
            <main className="dashboard-main">
                <div className="main-grid">
                    {/* Thẻ thông tin cá nhân */}
                    <div className="card profile-card">
                        <img src={studentInfo?.avatarUrl} alt="Avatar" className="avatar" />
                        <div className="profile-details">
                            <p><strong>Họ và tên:</strong> {studentInfo?.fullName}</p>
                            <p><strong>Ngày sinh:</strong> {studentInfo?.dob}</p>
                            <p><strong>Nơi Sinh:</strong> {studentInfo?.pob}</p>
                            <p><strong>Chuyên Ngành:</strong> {studentInfo?.major}</p>
                        </div>
                        <button
                            className="btn-detail"
                            onClick={() => {
                                console.log('Bấm nút Xem chi tiết');
                                setShowProfile(true);
                                console.log('showProfile set to true');
                            }}
                        >
                            Xem chi tiết
                        </button>
                    </div>

                    {/* Thẻ thống kê lịch học */}
                    <div className="card stat-card">
                        <h3>Lịch học trong tuần</h3>
                        <div className="stat-number">{stats?.weeklySchedules}</div>
                        <span onClick={() => navigate('/student/timetable')} style={{ cursor: 'pointer', color: '#007bff' }}>Xem chi tiết</span>
                    </div>

                    {/* Thẻ thống kê lịch thi */}
                    <div className="card stat-card">
                        <h3>Lịch thi trong tuần</h3>
                        <div className="stat-number">{stats?.weeklyExams}</div>
                        <a href="/exams">Xem chi tiết</a>
                    </div>
                </div>

                {/* Lưới các chức năng */}
                <div className="features-grid">
                    <div className="feature-card"><FaUser /><span>Thông tin Sinh viên</span></div>
                    <div className="feature-card" onClick={() => navigate('/student/timetable')}>
                        <FaCalendarAlt /><span>Thời khóa biểu</span>
                    </div>
                    <div className="feature-card"><FaChartBar /><span>Báo cáo điểm</span></div>
                    <div className="feature-card"><FaBook /><span>Khung chương trình</span></div>
                    <div className="feature-card" onClick={() => navigate('/student/materials')}>
                        <FaBookOpen /><span>Tài liệu học tập</span>
                    </div>
                    <div className="feature-card"><FaMoneyBillWave /><span>Thanh toán học phí</span></div>
                    <div className="feature-card"><FaHistory /><span>Lịch sử thanh toán</span></div>
                </div>


                {/* Biểu đồ */}
                <div className="charts-grid">
                    <div className="card chart-card">
                        <h3>Kết quả học tập</h3>
                        <div className="chart-placeholder">[Biểu đồ kết quả học tập]</div>
                    </div>
                    <div className="card chart-card">
                        <h3>Tiến độ học tập</h3>
                        <div className="chart-placeholder">[Biểu đồ tiến độ học tập]</div>
                    </div>
                </div>
            </main>

            {/* Student Profile Modal */}
            <StudentProfile
                isOpen={showProfile}
                onClose={() => setShowProfile(false)}
            />
        </div>
    );
};

export default Dashboard;