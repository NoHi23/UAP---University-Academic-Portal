
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom'; // Dùng navigate để chuyển trang
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import FullScreenLoader from '../../components/Common/FullScreenLoader';
import { FaBook, FaUserEdit, FaLink, FaDownload } from 'react-icons/fa';
import { IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Link } from 'react-router-dom';
import './MaterialsPage.css';

const MaterialsPage = () => {
    // State mới: Chỉ lưu danh sách các môn học (không phải tài liệu)
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useContext(AuthContext);
    const navigate = useNavigate(); // Khởi tạo navigate

    useEffect(() => {
        const fetchMaterialsAndExtractSubjects = async () => {
            setLoading(true);
            setError(null);
            try {
                // 1. Vẫn gọi API cũ
                const response = await api.get('/student/materials/me');
                const allMaterials = response.data.data || [];

                // 2. Trích xuất danh sách các môn học DUY NHẤT
                const subjectMap = new Map();
                allMaterials.forEach(material => {
                    // Chỉ thêm nếu có subjectId và chưa có trong Map
                    if (material.subjectId && material.subjectId._id) {
                        if (!subjectMap.has(material.subjectId._id)) {
                            subjectMap.set(material.subjectId._id, material.subjectId);
                        }
                    }
                });

                // 3. Chuyển Map thành Mảng để set state
                const uniqueSubjects = Array.from(subjectMap.values());
                setSubjects(uniqueSubjects);

            } catch (err) {
                const message = err.response?.data?.message || 'Không thể tải dữ liệu.';
                setError(message);
            } finally {
                setLoading(false);
            }
        };

        fetchMaterialsAndExtractSubjects();
    }, []); // Chỉ chạy 1 lần khi component mount

    // Hàm xử lý khi bấm vào thẻ môn học
    const handleSubjectClick = (subjectId) => {
        // Chuyển đến trang chi tiết với ID của môn học
        navigate(`/student/materials/${subjectId}`);
    };

    if (loading) {
        return <FullScreenLoader loading={true} />;
    }

    if (error) {
        return <div className="error-message">Lỗi: {error}</div>;
    }

    // Render ra danh sách CÁC MÔN HỌC
    return (
        <div className="materials-page-container" style={{ position: 'relative' }}>
            <IconButton component={Link} to="/student/dashboard" sx={{ position: 'absolute', top: 12, left: 12 }}>
                <ArrowBackIcon />
            </IconButton>
            <header className="materials-header">
                <h1>📚 Tài liệu học tập</h1>
                <p>Chào {user?.name}, đây là danh sách các môn học của bạn.</p>
            </header>

            {subjects.length === 0 ? (
                <div className="no-materials">
                    <p>Hiện tại chưa có tài liệu nào cho các môn học của bạn.</p>
                </div>
            ) : (
                // Dùng materials-grid để hiển thị các môn học
                <div className="materials-grid">
                    {subjects.map((subject) => (
                        <div
                            key={subject._id}
                            // Tái sử dụng CSS `material-card`, thêm `subject-card` để tuỳ biến
                            className="material-card subject-card"
                            onClick={() => handleSubjectClick(subject._id)}
                            style={{ cursor: 'pointer' }} // Thêm con trỏ chuột
                        >
                            <div className="material-card-header">
                                <FaBook className="material-icon" />
                                <h3>{subject.subjectName}</h3>
                            </div>
                            <div className="material-card-body">
                                <p><strong>Mã môn: </strong> {subject.subjectCode}</p>
                            </div>
                            <div className="material-card-footer">
                                {/* Bạn có thể tạo style cho class này */}
                                <span className="btn-view-details">
                                    Xem chi tiết tài liệu
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MaterialsPage;