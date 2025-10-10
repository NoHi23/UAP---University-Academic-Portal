import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './StudentProfile.css';

const StudentProfile = ({ isOpen, onClose }) => {
    console.log('StudentProfile rendered, isOpen:', isOpen);

    const [studentData, setStudentData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        gender: true,
        citizenID: '',
        studentAvatar: '',
        semester: '',
        semesterNo: ''
    });
    const { user } = useContext(AuthContext);

    // Fetch student profile data
    const fetchStudentProfile = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:9999/api/student/profile', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setStudentData(data);
                setFormData({
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    phone: data.phone || '',
                    gender: data.gender !== undefined ? data.gender : true,
                    citizenID: data.citizenID || '',
                    studentAvatar: data.studentAvatar || '',
                    semester: data.semester || '',
                    semesterNo: data.semesterNo || ''
                });
            } else {
                console.error('Failed to fetch student profile');
            }
        } catch (error) {
            console.error('Error fetching student profile:', error);
        } finally {
            setLoading(false);
        }
    };

    // Update student profile
    const updateProfile = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:9999/api/student/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const data = await response.json();
                setStudentData(data.student);
                // notify parent / other parts to refresh
                window.dispatchEvent(new CustomEvent('studentProfileUpdated', { detail: { student: data.student } }));
                alert('Cập nhật thông tin thành công!');
                // close modal
                if (typeof onClose === 'function') onClose();
            } else {
                const errorData = await response.json();
                alert(`Lỗi: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Có lỗi xảy ra khi cập nhật thông tin');
        } finally {
            setLoading(false);
        }
    };

    // Handle file input and convert to Base64
    const handleFileChange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        // Basic type/size checks
        if (!file.type.startsWith('image/')) {
            alert('Vui lòng chọn file ảnh hợp lệ.');
            return;
        }
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            alert('Kích thước ảnh phải nhỏ hơn 2MB.');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result;
            setFormData(prev => ({ ...prev, studentAvatar: base64 }));
        };
        reader.readAsDataURL(file);
    };

    useEffect(() => {
        if (isOpen) {
            fetchStudentProfile();
        }
    }, [isOpen]);

    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? e.target.checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        updateProfile();
    };

    if (!isOpen) return null;

    return (
        <div className="profile-modal-overlay">
            <div className="profile-modal">
                <div className="profile-modal-header">
                    <h2>Thông tin sinh viên</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="profile-modal-content">
                    {loading ? (
                        <div className="loading">Đang tải...</div>
                    ) : studentData ? (
                        <form onSubmit={handleSubmit}>
                            <div className="profile-info-grid">
                                {/* Avatar */}
                                <div className="profile-avatar-section">
                                    <img
                                        src={
                                            formData.studentAvatar
                                                ? formData.studentAvatar
                                                : (studentData.studentAvatar || 'https://i.pravatar.cc/150')
                                        }
                                        alt="Avatar"
                                        className="profile-avatar"
                                    />
                                    <p><strong>Mã sinh viên:</strong> {studentData.studentCode}</p>
                                </div>

                                {/* Basic Info */}
                                <div className="profile-fields">
                                    <div className="field-row">
                                        <div className="field-group">
                                            <label>Họ:</label>
                                            <input
                                                type="text"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                placeholder="Nhập họ"
                                            />
                                        </div>
                                        <div className="field-group">
                                            <label>Tên:</label>
                                            <input
                                                type="text"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                placeholder="Nhập tên"
                                            />
                                        </div>
                                    </div>

                                    <div className="field-row">
                                        <div className="field-group">
                                            <label>Số điện thoại:</label>
                                            <input
                                                type="text"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                placeholder="Nhập số điện thoại"
                                            />
                                        </div>
                                        <div className="field-group">
                                            <label>Giới tính:</label>
                                            <select
                                                name="gender"
                                                value={formData.gender}
                                                onChange={handleInputChange}
                                            >
                                                <option value={true}>Nam</option>
                                                <option value={false}>Nữ</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="field-row">
                                        <div className="field-group">
                                            <label>CCCD:</label>
                                            <input
                                                type="number"
                                                name="citizenID"
                                                value={formData.citizenID}
                                                onChange={handleInputChange}
                                                placeholder="Nhập số CCCD"
                                            />
                                        </div>
                                        <div className="field-group">
                                            <label>Học kỳ hiện tại:</label>
                                            <input
                                                type="text"
                                                name="semester"
                                                value={formData.semester}
                                                onChange={handleInputChange}
                                                placeholder="Ví dụ: Fall 2025"
                                            />
                                        </div>
                                    </div>

                                    <div className="field-row">
                                        <div className="field-group">
                                            <label>Số học kỳ:</label>
                                            <input
                                                type="number"
                                                name="semesterNo"
                                                value={formData.semesterNo}
                                                onChange={handleInputChange}
                                                placeholder="Ví dụ: 5"
                                            />
                                        </div>
                                        <div className="field-group">
                                            <label>Tải ảnh đại diện (file) hoặc URL:</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                            />
                                            <div style={{ marginTop: 8 }}>
                                                <input
                                                    type="url"
                                                    name="studentAvatar"
                                                    value={typeof formData.studentAvatar === 'string' && formData.studentAvatar.startsWith('data:') ? '' : formData.studentAvatar}
                                                    onChange={handleInputChange}
                                                    placeholder="Hoặc nhập URL ảnh đại diện"
                                                    style={{ width: '100%' }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Account Info */}
                                    <div className="account-info">
                                        <h3>Thông tin tài khoản</h3>
                                        <div className="field-group">
                                            <label>Email:</label>
                                            <span>{user?.email}</span>
                                        </div>
                                        <div className="field-group">
                                            <label>Vai trò:</label>
                                            <span>{user?.role}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="profile-modal-actions">
                                <button type="submit" className="btn-save" disabled={loading}>
                                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </button>
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={onClose}
                                >
                                    Đóng
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="no-data">Không tìm thấy thông tin sinh viên</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentProfile;