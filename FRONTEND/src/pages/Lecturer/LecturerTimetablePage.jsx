import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import FullScreenLoader from '../../components/Common/FullScreenLoader';
import Timetable from '../../components/Common/Timetable';
import { Link } from 'react-router-dom';

const LecturerTimetablePage = () => {
  const [scheduleByDay, setScheduleByDay] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await api.get('/lecturer/schedules/my-week');
        const groupedSchedule = response.data.data.reduce((acc, session) => {
          const day = new Date(session.date).toLocaleDateString('en-US', { weekday: 'long' });
          if (!acc[day]) acc[day] = [];
          acc[day].push(session);
          acc[day].sort((a, b) => a.slot - b.slot);
          return acc;
        }, {});
        setScheduleByDay(groupedSchedule);
      } catch (err) {
        setError('Không thể tải lịch dạy.');
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  if (loading) return <FullScreenLoader loading={true} />;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>🗓️ Lịch Dạy Của Bạn</h1>
      </header>
      <Timetable scheduleByDay={scheduleByDay} isLecturerView={true} />
    </div>
  );
};

export default LecturerTimetablePage;