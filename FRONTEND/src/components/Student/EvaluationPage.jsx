import React, { useState, useEffect } from 'react';
import api  from '../../services/api';
import FullScreenLoader from '../Common/FullScreenLoader';
import { FaChalkboardTeacher, FaPlus, FaStar, FaTimes } from 'react-icons/fa';
import './EvaluationPage.css';
import { notifySuccess, notifyError } from '../../services/notificationService';

// Modal component for the evaluation form
const EvaluationModal = ({ isOpen, onClose, classInfo, onSubmit }) => {
    // Giả sử có 3 tiêu chí đánh giá
    const [criteria, setCriteria] = useState([
        { name: 'Kiến thức chuyên môn', score: 0 },
        { name: 'Phương pháp giảng dạy', score: 0 },
        { name: 'Sự nhiệt tình & hỗ trợ', score: 0 }
    ]);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleStarClick = (criterionIndex, score) => {
        const newCriteria = [...criteria];
        newCriteria[criterionIndex].score = score;
        setCriteria(newCriteria);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Kiểm tra xem đã đánh giá hết các tiêu chí chưa
        if (criteria.some(c => c.score === 0)) {
            notifyError('Vui lòng cho điểm tất cả các tiêu chí.');
            return;
        }
        setIsSubmitting(true);
        try {
            await onSubmit({ classId: classInfo._id, criteria, comment });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content evaluation-modal">
                <button onClick={onClose} className="btn-close-modal"><FaTimes /></button>
                <h2>Đánh giá lớp: {classInfo.subjectId?.subjectName}</h2>
                <p>Giảng viên: {classInfo.lecturerId?.lastName} {classInfo.lecturerId?.firstName}</p>
                <form onSubmit={handleSubmit}>
                    {criteria.map((criterion, index) => (
                        <div key={criterion.name} className="criterion-group">
                            <label>{criterion.name}</label>
                            <div className="stars-container">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <FaStar
                                        key={star}
                                        className={star <= criterion.score ? 'star-selected' : 'star-empty'}
                                        onClick={() => handleStarClick(index, star)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                    <div className="form-group">
                        <label>Góp ý thêm (không bắt buộc)</label>
                        <textarea rows="4" value={comment} onChange={(e) => setComment(e.target.value)}></textarea>
                    </div>
                    <div className="modal-actions">
                        <button type="submit" className="btn-submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const EvaluationPage = () => {
    const [classesToReview, setClassesToReview] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedClass, setSelectedClass] = useState(null);

    const fetchEvaluableClasses = async () => {
        setLoading(true);
        try {
            const response = await api.get('/student/evaluations/classes-to-review');
            setClassesToReview(response.data.data);
        } catch (err) {
            setError('Không thể tải danh sách lớp cần đánh giá.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvaluableClasses();
    }, []);

    const handleSubmitEvaluation = async (formData) => {
        try {
            await api.post('/student/evaluations', formData);
            notifySuccess('Cảm ơn bạn đã gửi đánh giá!');
            setSelectedClass(null); // Đóng modal
            fetchEvaluableClasses(); // Tải lại danh sách, lớp vừa đánh giá sẽ biến mất
        } catch (err) {
            notifyError(err.response?.data?.message || 'Gửi đánh giá thất bại.');
        }
    };

    if (loading) return <FullScreenLoader loading={true} />;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="evaluation-page-container">
            {selectedClass && (
                <EvaluationModal
                    isOpen={!!selectedClass}
                    onClose={() => setSelectedClass(null)}
                    classInfo={selectedClass}
                    onSubmit={handleSubmitEvaluation}
                />
            )}
            <header className="evaluation-header">
                <h1><FaChalkboardTeacher /> Đánh giá giảng viên</h1>
            </header>

            {classesToReview.length === 0 ? (
                <div className="info-message">Bạn không có lớp nào cần đánh giá hiện tại.</div>
            ) : (
                <div className="classes-list">
                    <p>Vui lòng chọn lớp học bạn muốn gửi phản hồi và đánh giá.</p>
                    {classesToReview.map(cls => (
                        <div key={cls._id} className="class-card">
                            <div className="class-info">
                                <h3>{cls.subjectId?.subjectName} ({cls.subjectId?.subjectCode})</h3>
                                <p>GV: {cls.lecturerId?.lastName} {cls.lecturerId?.firstName}</p>
                            </div>
                            <button onClick={() => setSelectedClass(cls)} className="btn-evaluate">
                                <FaPlus /> Đánh giá
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EvaluationPage;