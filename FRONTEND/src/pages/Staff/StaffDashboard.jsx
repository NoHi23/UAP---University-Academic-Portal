import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AccountBox as AccountBoxIcon,
  School as SchoolIcon,
  Groups as GroupsIcon,
  LibraryBooks as LibraryBooksIcon,
  Notifications as NotificationsIcon,
  SupportAgent as SupportAgentIcon,
  AttachMoney as AttachMoneyIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  EventNote as EventNoteIcon,
  MenuBook as MenuBookIcon,
  Assessment as AssessmentIcon,
  PlaylistAdd as PlaylistAddIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  SmartToy as SmartToyIcon,
  CalendarMonth as CalendarMonthIcon,
} from '@mui/icons-material';
import FullScreenLoader from '../../components/Common/FullScreenLoader';
import { AuthContext } from '../../context/AuthContext';

const API = (process.env.REACT_APP_API_URL || 'http://localhost:9999').replace(/\/+$/, '');

export default function StaffDashboard() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalStudents: 0, totalLecturers: 0, pendingApprovals: 0 });
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();

    const fetchDashboardData = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

      try {
        // Lấy thông tin nhân sự (profile)
        const profileRes = await fetch(`${API}/api/staff/profile`, { headers, signal: controller.signal });
        if (profileRes.ok) {
          const s = await profileRes.json();
          setProfile({
            fullName: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
            staffCode: s.staffCode,
            phone: s.phone,
            gender: s.gender,
            status: s.status,
            createdAt: s.createdAt,
          });
        }

        // Lấy số liệu thống kê (stats)
        const statsRes = await fetch(`${API}/api/stats/dashboard`, { headers, signal: controller.signal });
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats({
            totalStudents: data.totalStudents ?? 0,
            totalLecturers: data.totalLecturers ?? 0,
            pendingApprovals: data.pendingApprovals ?? 0,
          });
        } else {
          setStats({ totalStudents: 0, totalLecturers: 0, pendingApprovals: 0 });
        }
      } catch (e) {
        if (e.name !== 'AbortError') console.error('Load staff dashboard failed:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    return () => controller.abort();
  }, []);

  if (loading) return <FullScreenLoader />;

  const features = [
    { icon: <AccountBoxIcon />, label: 'Thông tin cá nhân', path: '/staff/profile' },
    { icon: <SchoolIcon />, label: 'Quản lý Sinh viên', path: '/staff/students' },
    { icon: <GroupsIcon />, label: 'Quản lý Giảng viên', path: '/staff/lecturers' },
    { icon: <LibraryBooksIcon />, label: 'Quản lý lớp học', path: '/staff/class' },
    { icon: <NotificationsIcon />, label: 'Quản lý thông báo', path: '/staff/announcements' },
    { icon: <SupportAgentIcon />, label: 'Hỗ trợ', path: '/staff/supports' },
    { icon: <EventNoteIcon />, label: 'Quản lý TKB', path: '/staff/schedule' },
    { icon: <MenuBookIcon />, label: 'Quản lý tài liệu', path: '/staff/material' },
    { icon: <AssessmentIcon />, label: 'Quản lý Học kỳ', path: '/staff/semesters' },
    { icon: <CalendarMonthIcon />, label: 'Tạo lịch thi', path: '/staff/exam-schedule' },
    { icon: <PlaylistAddIcon />, label: 'Xếp lớp thủ công', path: '/staff/manual-class' },
    { icon: <AssignmentTurnedInIcon />, label: 'Duyệt đơn học vụ', path: '/staff/absence' },
    { icon: <SmartToyIcon />, label: 'Quản lý AI Tools', path: '/staff/ai-tools' },
    { icon: <AttachMoneyIcon />, label: 'Bảng giá học phí', path: '/staff/tuition-config' },
    { icon: <PaymentIcon />, label: 'Tạo khoản thu', path: '/staff/tuition-generate' },
    { icon: <ReceiptIcon />, label: 'Quản lý học phí', path: '/staff/tuition-manage' },
  ];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>UAP - University Academic Portal</h1>
        <div className="user-profile">
          <span>
            {(user?.name || profile?.fullName || '—')}
            {profile?.staffCode ? ` (${profile.staffCode})` : ''}
          </span>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="main-grid">
          <div className="card stat-card">
            <h3>TOTAL STUDENTS</h3>
            <div className="stat-number">{stats.totalStudents.toLocaleString('vi-VN')}</div>
          </div>
          <div className="card stat-card">
            <h3>TOTAL LECTURERS</h3>
            <div className="stat-number">{stats.totalLecturers.toLocaleString('vi-VN')}</div>
          </div>
          <div className="card stat-card">
            <h3>PENDING APPROVALS</h3>
            <div className="stat-number">{stats.pendingApprovals.toLocaleString('vi-VN')}</div>
          </div>
        </div>

        <div className="features-grid">
          {features.map((f) => (
            <div key={f.path} className="feature-card" onClick={() => navigate(f.path)}>
              {f.icon}
              <span>{f.label}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
