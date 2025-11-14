import React, { useContext, useState, useEffect } from 'react';
import './Chat.css';
import { Fab, Tooltip } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
const ChatBubble = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useContext(AuthContext);
    const userRole = localStorage.getItem('userRole') || 'student';

    const handleChatClick = () => {
        if (user?.role === 'lecturer') {
            navigate('/lecturer/chat');
        } else if (user?.role === 'student') {
            navigate('/student/chat');
        }
    };
    if (!user || (user.role !== 'student' && user.role !== 'lecturer')) {
        return null;
    }
    return (
        <Tooltip title="AI Support">
            <Fab
                color="primary"
                sx={{ position: 'fixed', bottom: 40, right: 40, zIndex: 1100 }}
                onClick={handleChatClick}
            >
                <SmartToyIcon />
            </Fab>
        </Tooltip>
    );
};

export default ChatBubble;
