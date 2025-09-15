import React, { useState, useEffect } from 'react';
import './BackToTopButton.css';

const BackToTopButton = () => {
    const [isVisible, setIsVisible] = useState(false);

    // Hàm kiểm tra vị trí cuộn
    const toggleVisibility = () => {
        // Hiện nút khi cuộn xuống hơn 300px
        if (window.pageYOffset > 300) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    };

    // Hàm để cuộn lên đầu trang
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth' // Tạo hiệu ứng cuộn mượt
        });
    };

    useEffect(() => {
        // Thêm event listener khi component được mount
        window.addEventListener('scroll', toggleVisibility);

        // Xóa event listener khi component bị unmount
        return () => {
            window.removeEventListener('scroll', toggleVisibility);
        };
    }, []);

    return (
       <div className="back-to-top">
            <button 
                onClick={scrollToTop} 
                className={`top-btn ${isVisible ? 'visible' : ''}`}
            >
                <i className="fas fa-arrow-up"></i>
            </button>
        </div>
    );
};

export default BackToTopButton;