import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import FullScreenLoader from '../../../components/Common/FullScreenLoader';
import { FaCogs, FaPlayCircle } from 'react-icons/fa';
import './SchedulingPage.css';
import { notifySuccess, notifyError } from '../../../services/notificationService';

const SchedulingPage = () => {
  const [semesters, setSemesters] = useState([]);
  const [majors, setMajors] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [semestersRes, majorsRes] = await Promise.all([
          api.get('/staff/semesters'),
          api.get('/staff/majors')
        ]);
        setSemesters(semestersRes.data.data);
        setMajors(majorsRes.data.data);
        if (semestersRes.data.data.length > 0) {
          setSelectedSemester(semestersRes.data.data[0]._id);
        }
        if (majorsRes.data.data.length > 0) {
          setSelectedMajor(majorsRes.data.data[0]._id);
        }
      } catch (err) {
        notifyError('Không thể tải dữ liệu học kỳ hoặc chuyên ngành.');
      }
    };
    fetchInitialData();
  }, []);

  const handleGenerate = async () => {
    if (!selectedSemester || !selectedMajor) {
      notifyError('Vui lòng chọn cả học kỳ và chuyên ngành.');
      return;
    }

    setIsGenerating(true);
    setLogs(['Bắt đầu quá trình xếp lịch...']);

    try {
      const response = await api.post('/scheduling/generate', {
        semesterId: selectedSemester,
        majorId: selectedMajor
      });

      setLogs(prev => [...prev, 'Quá trình phân tích và xếp lịch đã hoàn tất!', `Kết quả: ${response.data.message}`]);
      notifySuccess('Xếp lịch thành công!');

    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Có lỗi xảy ra trong quá trình xếp lịch.';
      setLogs(prev => [...prev, `LỖI: ${errorMessage}`]);
      notifyError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="scheduling-page-container">
      {isGenerating && <FullScreenLoader loading={true} text="Hệ thống đang xử lý, vui lòng không rời khỏi trang..." />}
      <header className="scheduling-header">
        <h1><FaCogs /> Xếp lịch học tự động</h1>
        <p>Chọn học kỳ và chuyên ngành để hệ thống tự động tạo lịch học.</p>
      </header>

      <div className="scheduling-controls">
        <div className="control-group">
          <label>Chọn học kỳ</label>
          <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
            {semesters.map(s => <option key={s._id} value={s._id}>{s.semesterName}</option>)}
          </select>
        </div>
        <div className="control-group">
          <label>Chọn chuyên ngành</label>
          <select value={selectedMajor} onChange={(e) => setSelectedMajor(e.target.value)}>
            {majors.map(m => <option key={m._id} value={m._id}>{m.majorName}</option>)}
          </select>
        </div>
        <button className="btn-generate" onClick={handleGenerate} disabled={isGenerating}>
          <FaPlayCircle /> Bắt đầu Xếp lịch
        </button>
      </div>

      <div className="scheduling-logs">
        <h3>Nhật ký xử lý:</h3>
        <pre>
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </pre>
      </div>
    </div>
  );
};

export default SchedulingPage;