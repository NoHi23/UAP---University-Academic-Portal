import React, { useState, useEffect, useContext } from 'react';
import './Dashboard.css';
import {
  FaUser, FaCalendarAlt, FaChartBar, FaBook, FaMoneyBillWave,
  FaHistory, FaBookOpen, FaPaperPlane, FaStar, FaBullhorn, FaFileAlt,
  FaClock
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import StudentProfile from './StudentProfile';
import AcademicResultsChart from './AcademicResultsChart';
import StudyProgressChart from './StudyProgressChart';
import FullScreenLoader from '../../components/Common/FullScreenLoader';

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
  weeklyExams: 999
};
// -------------------------------------------------


const Dashboard = () => {
  const [studentInfo, setStudentInfo] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Hàm này sẽ gọi API backend để lấy dữ liệu cho dashboard
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');

        // Lấy profile sinh viên (backend đã populate majorId)
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
            dob: studentData.dateOfBirth ? new Date(studentData.dateOfBirth).toLocaleDateString('vi-VN') : new Date(studentData.createdAt).toLocaleDateString('vi-VN'),
            pob: 'Việt Nam',
            major: studentData.majorId ? studentData.majorId.majorName : 'Chưa có chuyên ngành',
            majorId: studentData.majorId ? (studentData.majorId._id || studentData.majorId) : null,
            avatarUrl: studentData.studentAvatar || 'https://i.pravatar.cc/150',
            phone: studentData.phone,
            gender: studentData.gender,
            semester: studentData.semester || null,
            semesterNo: studentData.semesterNo || null
          });
        } else {
          setStudentInfo(mockStudentInfo);
        }

        // Fetch weekly schedule and exam stats and set to the stat cards
        try {
          const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

          // Run both requests in parallel
          const [weekRes, examsRes] = await Promise.all([
            fetch('http://localhost:9999/api/student/schedules/my-week', { method: 'GET', headers }),
            fetch('http://localhost:9999/api/student/exams', { method: 'GET', headers })
          ]);

          let weeklyTotal = mockDashboardStats.weeklySchedules;
          if (weekRes.ok) {
            const weekJson = await weekRes.json();
            const weekData = weekJson.data || weekJson;
            if (Array.isArray(weekData)) {
              weeklyTotal = weekData.length;
            } else if (Array.isArray(weekData?.days)) {
              weeklyTotal = weekData.days.reduce((s, d) => s + (d.count || 0), 0);
            }
          }

          let examsTotal = mockDashboardStats.weeklyExams;
          if (examsRes.ok) {
            const examsJson = await examsRes.json();
            const examsArr = examsJson.examSchedule || examsJson.data || examsJson;
            if (Array.isArray(examsArr)) examsTotal = examsArr.length;
          }

          setStats({ weeklySchedules: weeklyTotal, weeklyExams: examsTotal });
        } catch (err) {
          console.error('Lỗi khi lấy thống kê tuần/thi:', err);
          setStats(mockDashboardStats);
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu dashboard:", error);
        setStudentInfo(mockStudentInfo);
        setStats(mockDashboardStats);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Open curriculum handler: fetch curriculum for student's major and navigate to its details
  const handleOpenCurriculum = async () => {
    if (!studentInfo?.majorId) {
      navigate(`/student/curriculums`);
      return;
    }
    try {
      const res = await api.get(`curriculums?majorId=${studentInfo.majorId}`);
      const list = res.data || [];
      if (list.length === 0) {
        // fallback to listing page
        navigate(`/student/curriculums?majorId=${studentInfo.majorId}`);
        return;
      }
      const selected = list[0];
      const id = selected.curriculumId || selected._id;
      if (id) {
        navigate(`/student/curriculums/${id}`);
      } else {
        navigate(`/student/curriculums?majorId=${studentInfo.majorId}`);
      }
    } catch (err) {
      console.error('Failed to fetch curriculum for major:', err);
      navigate(`/student/curriculums?majorId=${studentInfo.majorId}`);
    }
  };

  // refresh when profile updated elsewhere
  useEffect(() => {
    const handler = () => {
      // refetch profile
      const fetchProfile = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch('http://localhost:9999/api/student/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const studentData = await res.json();
            setStudentInfo({
              fullName: `${studentData.firstName} ${studentData.lastName}`,
              studentCode: studentData.studentCode,
              dob: studentData.dateOfBirth ? new Date(studentData.dateOfBirth).toLocaleDateString('vi-VN') : new Date(studentData.createdAt).toLocaleDateString('vi-VN'),
              pob: 'Việt Nam',
              major: studentData.majorId ? studentData.majorId.majorName : 'Chưa có chuyên ngành',
              avatarUrl: studentData.studentAvatar || 'https://i.pravatar.cc/150',
              phone: studentData.phone,
              gender: studentData.gender,
              semester: studentData.semester || null,
              semesterNo: studentData.semesterNo || null
            });
          }
        } catch (e) {
          console.error(e);
        }
      };

      fetchProfile();
    };

    window.addEventListener('studentProfileUpdated', handler);
    return () => window.removeEventListener('studentProfileUpdated', handler);
  }, []);

  if (loading) {
    return <FullScreenLoader />;
  }

  return (
    <div className="dashboard-container">
      {/* Phần Header */}
      <header className="dashboard-header">
        <h1>UAP - University Academic Portal</h1>
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
              {studentInfo?.semester && (
                <p><strong>Kỳ hiện tại:</strong> Học Kỳ {studentInfo.semester}</p>
              )}
            </div>
          </div>

          {/* Thẻ thống kê lịch học */}
          <div className="card stat-card">
            <h3>Lịch học trong tuần</h3>
            <div className="stat-number">{stats?.weeklySchedules}</div>
            <span onClick={() => navigate('/student/schedule')} style={{ cursor: 'pointer', color: 'black' }}>Xem chi tiết</span>
          </div>

          {/* Thẻ thống kê lịch thi */}
          <div className="card stat-card">
            <h3>Lịch thi trong tuần</h3>
            <div className="stat-number">{stats?.weeklyExams}</div>
            <a href="/student/scheduleExam">Xem chi tiết</a>
          </div>
        </div>

        <StudentProfile isOpen={showProfile} onClose={() => setShowProfile(false)} />

        {/* Lưới các chức năng */}
        <div className="features-grid">

          <div onClick={() => setShowProfile(true)} className="feature-card"><FaUser /><span>Thông tin Sinh viên</span></div>
          <div className="feature-card" onClick={() => navigate('/student/schedule')}>
            <FaCalendarAlt /><span>Thời khóa biểu</span>
          </div>
          <div className="feature-card" onClick={() => navigate('/student/attendance')}><FaChartBar /><span>Báo cáo điểm danh</span></div>
          <div className="feature-card" onClick={handleOpenCurriculum} style={{ cursor: 'pointer' }}>
            <FaBook /><span>Khung chương trình</span>
          </div>
          <div className="feature-card" onClick={() => navigate('/student/materials')}>
            <FaBookOpen /><span>Tài liệu học tập</span>
          </div>
          <div className="feature-card" onClick={() => navigate('/student/payment')}>
            <FaMoneyBillWave /><span>Thanh toán học phí</span>
          </div>
          <div className="feature-card" onClick={() => navigate('/student/transactions')}>
            <FaHistory /><span>Lịch sử thanh toán</span>
          </div>
          <div className="feature-card" onClick={() => navigate('/student/absence')}>
            <FaFileAlt /><span>Đơn học vụ</span>
          </div>
          <div className="feature-card" onClick={() => navigate('/student/requests')}><FaPaperPlane /><span>Đơn từ & Yêu cầu</span></div>
          <div className="feature-card" onClick={() => navigate('/student/evaluation')}><FaStar /><span>Đánh giá giảng viên</span></div>
          <div className="feature-card" onClick={() => navigate('/student/announcements')}><FaBullhorn /><span>Thông báo</span></div>
          <div className="feature-card" onClick={() => navigate('/student/scheduleExam')}><FaClock /><span>Lịch thi</span></div>


        </div>


        {/* Biểu đồ */}
        <div className="charts-grid">
          <div className="card chart-card">
            <h3>Kết quả học tập</h3>
            <AcademicResultsChart />
          </div>
          <div className="card chart-card">
            <h3>Tiến độ học tập</h3>
            <StudyProgressChart />
          </div>
        </div>

        {/* Khung chương trình navigates to list page (CurriculumsPage) */}
      </main>
    </div>
  );
};

export default Dashboard;