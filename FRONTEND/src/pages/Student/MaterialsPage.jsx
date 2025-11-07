import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import FullScreenLoader from '../../components/Common/FullScreenLoader';
import { FaBook, FaUserEdit, FaLink, FaDownload } from 'react-icons/fa';
import './MaterialsPage.css';

const MaterialsPage = () => {
    const [materialsBySubject, setMaterialsBySubject] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        const fetchMaterials = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get('/student/materials/me');

                const groupedMaterials = response.data.data.reduce((acc, material) => {
                    const subjectName = material.subjectId?.subjectName || 'Môn học không xác định';
                    if (!acc[subjectName]) {
                        acc[subjectName] = [];
                    }
                    acc[subjectName].push(material);
                    return acc;
                }, {});

                setMaterialsBySubject(groupedMaterials);

            } catch (err) {
                const message = err.response?.data?.message || 'Không thể tải tài liệu.';
                setError(message);
            } finally {
                setLoading(false);
            }
        };

        fetchMaterials();
    }, []);

    if (loading) {
        return <FullScreenLoader loading={true} />;
    }

    if (error) {
        return <div className="error-message">Lỗi: {error}</div>;
    }

    return (
        <div className="materials-page-container">
            <header className="materials-header">
                <h1>📚 Tài liệu học tập</h1>
                <p>Chào {user?.name}, đây là danh sách tài liệu các môn học của bạn.</p>
            </header>

            {Object.keys(materialsBySubject).length === 0 ? (
                <div className="no-materials">
                    <p>Hiện tại chưa có tài liệu nào cho các môn học của bạn.</p>
                </div>
            ) : (
                Object.entries(materialsBySubject).map(([subjectName, materials]) => (
                    <section key={subjectName} className="subject-group">
                        <h2>{subjectName}</h2>
                        <div className="materials-grid">
                            {materials.map((material) => (
                                <div key={material._id} className="material-card">
                                    <div className="material-card-header">
                                        <FaBook className="material-icon" />
                                        <h3>{material.materialDescription}</h3>
                                    </div>
                                    <div className="material-card-body">
                                        <p><FaUserEdit /> <strong>Tác giả:</strong> {material.author}</p>
                                        <p><strong>Loại:</strong>
                                            {material.isMainMaterial ? ' Tài liệu chính' : ' Tài liệu tham khảo'}
                                        </p>
                                    </div>
                                    <div className="material-card-footer">
                                        <a href="#" className="btn-download">
                                            <FaDownload /> Tải xuống
                                        </a>
                                        {material.isOnline && (
                                            <a href="#" className="btn-view-online">
                                                <FaLink /> Xem trực tuyến
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                ))
            )}
        </div>
    );
};

export default MaterialsPage;