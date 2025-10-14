import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import  api  from '../../services/api';
import FullScreenLoader from '../../components/Common/FullScreenLoader';
import { FaSave, FaUserCheck, FaUserTimes, FaUserClock } from 'react-icons/fa';
import './AttendancePage.css';
import { notifySuccess, notifyError } from '../../services/notificationService';

const AttendancePage = () => {
  const { scheduleId } = useParams(); // Lấy ID của buổi học từ URL
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [scheduleInfo, setScheduleInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        // Giả sử API trả về { scheduleInfo: {...}, students: [...] }
        const response = await api.get(`/lecturer/schedules/${scheduleId}/attendance`);
        setScheduleInfo(response.data.scheduleInfo);
        setStudents(response.data.students);
      } catch (err) {
        notifyError('Không thể tải dữ liệu điểm danh.');
      } finally {
        setLoading(false);
      }
    };
    fetchAttendanceData();
  }, [scheduleId]);

  const handleStatusChange = (studentId, newStatus) => {
    setStudents(prevStudents =>
      prevStudents.map(student =>
        student._id === studentId ? { ...student, status: newStatus } : student
      )
    );
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const attendanceData = students.map(({ _id, status }) => ({ studentId: _id, status }));
      await api.post(`/lecturer/schedules/${scheduleId}/attendance`, { attendance: attendanceData });
      notifySuccess('Lưu điểm danh thành công!');
      navigate('/lecturer/schedule'); // Quay lại trang lịch dạy
    } catch (err) {
      notifyError('Lưu điểm danh thất bại.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <FullScreenLoader loading={true} />;

  return (
    <div className="attendance-page-container">
      <header className="attendance-header">
        <h1>Điểm danh</h1>
        {scheduleInfo && (
          <div className="attendance-class-info">
            <p><strong>Môn học:</strong> {scheduleInfo.subject.subjectName}</p>
            <p><strong>Lớp:</strong> {scheduleInfo.class.className}</p>
            <p><strong>Ngày:</strong> {new Date(scheduleInfo.date).toLocaleDateString('vi-VN')}</p>
          </div>
        )}
      </header>

      <div className="student-list-container">
        {students.map(student => (
          <div key={student._id} className="student-row">
            <div className="student-info">
              <span className="student-name">{student.lastName} {student.firstName}</span>
              <span className="student-code">{student.studentCode}</span>
            </div>
            <div className="attendance-controls">
              <button
                className={`btn-status ${student.status === 'Present' ? 'active' : ''}`}
                onClick={() => handleStatusChange(student._id, 'Present')}>
                <FaUserCheck /> Có mặt
              </button>
              <button
                className={`btn-status btn-absent ${student.status === 'Absent' ? 'active' : ''}`}
                onClick={() => handleStatusChange(student._id, 'Absent')}>
                <FaUserTimes /> Vắng
              </button>
              <button
                className={`btn-status btn-excused ${student.status === 'Excused' ? 'active' : ''}`}
                onClick={() => handleStatusChange(student._id, 'Excused')}>
                <FaUserClock /> Có phép
              </button>
            </div>
          </div>
        ))}
      </div>

      <footer className="attendance-footer">
        <button className="btn-save-attendance" onClick={handleSubmit} disabled={isSaving}>
          <FaSave /> {isSaving ? 'Đang lưu...' : 'Lưu Điểm Danh'}
        </button>
      </footer>
    </div>
  );
};

export default AttendancePage;