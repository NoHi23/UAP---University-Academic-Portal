import React from 'react';
import { Link } from 'react-router-dom';
import { FaClock, FaChalkboardTeacher, FaMapMarkerAlt, FaBookReader } from 'react-icons/fa';
import './Timetable.css';

const Timetable = ({ scheduleByDay, isLecturerView = false }) => {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayLabels = {
    Monday: 'Thứ Hai', Tuesday: 'Thứ Ba', Wednesday: 'Thứ Tư',
    Thursday: 'Thứ Năm', Friday: 'Thứ Sáu', Saturday: 'Thứ Bảy'
  };

  return (
    <div className="timetable-grid">
      {daysOfWeek.map(day => (
        <div key={day} className="day-column">
          <div className="day-header"><h3>{dayLabels[day]}</h3></div>
          <div className="sessions-list">
            {scheduleByDay[day] ? (
              scheduleByDay[day].map(session => (
                <Link
                  to={isLecturerView ? `/lecturer/attendance/${session._id}` : '#'}
                  key={session._id}
                  className={`session-card-link ${isLecturerView ? '' : 'disabled-link'}`}
                >
                  <div className="session-card">
                    <div className="session-subject">
                      <FaBookReader />
                      <div>
                        <strong>{session.subject.subjectCode}</strong>
                        <p>{session.subject.subjectName}</p>
                      </div>
                    </div>
                    <div className="session-details">
                      <p><FaClock /> Slot {session.slot} ({new Date(session.date).toLocaleDateString('vi-VN')})</p>
                      <p><FaChalkboardTeacher /> GV: {session.lecturer.lastName} {session.lecturer.firstName}</p>
                      <p><FaMapMarkerAlt /> Phòng: {session.room.roomName}</p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="no-session">Không có lịch</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Timetable;