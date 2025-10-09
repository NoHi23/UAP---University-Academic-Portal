import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import './Auth.css';
import { notifySuccess, notifyError } from '../../services/notificationService';

import FullScreenLoader from '../../components/Common/FullScreenLoader';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', phone: '', address: ''
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');
    
    const [isLoading, setIsLoading] = useState(false); 

    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password.length < 8) {
            notifyError('Mật khẩu phải có ít nhất 8 ký tự.');
            return;
        }

        setIsLoading(true); 
        try {
            let avatarUrl = '';
            if (avatarFile) {
                const uploadData = new FormData();
                uploadData.append('file', avatarFile);
                uploadData.append('upload_preset', 'dakk_unsigned_preset');

                const uploadRes = await axios.post(
                    'https://api.cloudinary.com/v1_1/dpnycqrxe/image/upload',
                    uploadData
                );
                avatarUrl = uploadRes.data.secure_url;
            }

            const finalData = { ...formData, avatar: avatarUrl };
            await register(finalData);

            notifySuccess('Đăng ký thành công! Bạn sẽ được chuyển đến trang đăng nhập.');
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (err) {
            console.error(err);
            if (err.response && err.response.status === 409) {
                notifyError('Email này đã được sử dụng.');
            } else {
                notifyError('Đã có lỗi xảy ra. Vui lòng thử lại.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            {/* 5. Gọi component FullScreenLoader và truyền state loading vào */}
            <FullScreenLoader loading={isLoading} />

            <form onSubmit={handleSubmit} className="auth-form">
                <h2>Đăng ký tài khoản</h2>
                {/* Các trường input và avatar preview giữ nguyên */}
                <div className="form-group avatar-group">
                    <label htmlFor="avatar">Ảnh đại diện</label>
                    <input type="file" id="avatar" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                    <div className="avatar-preview" onClick={() => document.getElementById('avatar').click()}>
                        {avatarPreview ? (
                            <img src={avatarPreview} alt="Xem trước avatar" />
                        ) : (
                            <i className="fa-solid fa-camera"></i>
                        )}
                    </div>
                </div>
                {/* ... Các trường input khác ... */}
                <div className="form-group">
                    <label htmlFor="name">Họ và tên</label>
                    <input type="text" id="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Mật khẩu</label>
                    <input type="password" id="password" value={formData.password} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="phone">Số điện thoại</label>
                    <input type="tel" id="phone" value={formData.phone} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="address">Địa chỉ</label>
                    <input type="text" id="address" value={formData.address} onChange={handleChange} required />
                </div>

                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Đang xử lý...' : 'Đăng ký'}
                </button>
                <p className="auth-switch">
                    Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
                </p>
            </form>
        </div>
    );
};

export default RegisterPage;