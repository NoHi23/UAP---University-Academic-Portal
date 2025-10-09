import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import {
  FaUser, FaCalendarAlt, FaChartBar, FaBook, FaMoneyBillWave,
  FaHistory, FaBookOpen, FaPaperPlane, FaStar, FaBullhorn
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  useEffect(() => {
    // Hàm này sẽ gọi API backend để lấy dữ liệu cho dashboard
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // TODO: Thay thế các hàm gọi API giả lập bằng API thật
        // const studentRes = await fetch('/api/student/me');
        // const studentData = await studentRes.json();
        // setStudentInfo(studentData.data);

        // const statsRes = await fetch('/api/dashboard/stats');
        // const statsData = await statsRes.json();
        // setStats(statsData.data);

        // --- Sử dụng dữ liệu giả lập ---
        setStudentInfo(mockStudentInfo);
        setStats(mockDashboardStats);
        // -----------------------------

      } catch (error) {
        console.error("Lỗi khi tải dữ liệu dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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
          <span>{studentInfo?.fullName} ({studentInfo?.studentCode})</span>
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
            <button className="btn-detail">Xem chi tiết</button>
          </div>

          {/* Thẻ thống kê lịch học */}
          <div className="card stat-card">
            <h3>Lịch học trong tuần</h3>
            <div className="stat-number">{stats?.weeklySchedules}</div>
            <a href="/schedules">Xem chi tiết</a>
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
          <div className="feature-card"><FaCalendarAlt /><span>Thời khóa biểu</span></div>
          <div className="feature-card"><FaChartBar /><span>Báo cáo điểm</span></div>
          <div className="feature-card"><FaBook /><span>Khung chương trình</span></div>
          <div className="feature-card" onClick={() => navigate('/student/materials')}>
            <FaBookOpen /><span>Tài liệu học tập</span>
          </div>
          <div className="feature-card" onClick={() => navigate('/student/payment')}>
            <FaMoneyBillWave /><span>Thanh toán học phí</span>
          </div>
          <div className="feature-card" onClick={() => navigate('/student/transactions')}>
            <FaHistory /><span>Lịch sử thanh toán</span>
          </div>
          <div className="feature-card" onClick={() => navigate('/student/requests')}><FaPaperPlane /><span>Đơn từ & Yêu cầu</span></div>
          <div className="feature-card" onClick={() => navigate('/student/evaluation')}><FaStar /><span>Đánh giá giảng viên</span></div>
          <div className="feature-card" onClick={() => navigate('/student/notifications')}><FaBullhorn /><span>Thông báo</span></div>
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
    </div>
  );
};

export default Dashboard;