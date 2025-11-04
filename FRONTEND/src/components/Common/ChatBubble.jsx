import React from 'react';
import './Chat.css'; 
import { FaRobot } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

const ChatBubble = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const userRole = localStorage.getItem('userRole') || 'student';

    const hiddenPaths = ['/', '/register'];

    if (hiddenPaths.includes(location.pathname)) {
        return null;
    }

    return (
        <button 
            className="chat-bubble" 
            onClick={() => navigate(`/${userRole}/chat`)} 
        >
            <FaRobot />
        </button>
    );
};

export default ChatBubble;
