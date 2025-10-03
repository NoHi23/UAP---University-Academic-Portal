import React from 'react';
import './FullScreenLoader.css';

const FullScreenLoader = ({ loading }) => {
    if (!loading) return null;

    return (
        <div className="loader-overlay">
            <div className="loader-content">
                <img src="/UAP.png" alt="Loading..." className="loader-logo" />
                <p>Đang xử lý...</p>
            </div>
        </div>
    );
};

export default FullScreenLoader;