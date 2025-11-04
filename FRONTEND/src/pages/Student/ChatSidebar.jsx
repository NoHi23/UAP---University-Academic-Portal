import React, { useState, useEffect } from 'react';
import { Box, Button, List, ListItemButton, ListItemText, Typography, CircularProgress } from '@mui/material';
import { FaPlus, FaCommentDots } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import dayjs from 'dayjs';

const ChatSidebar = () => {
    const navigate = useNavigate();
    const { chatId } = useParams(); 
    const [histories, setHistories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistories = async () => {
            setLoading(true);
            try {
                const response = await api.get('/ai/chat/histories');
                setHistories(response.data.data);
            } catch (error) {
                console.error("Không thể tải lịch sử chat", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistories();
    }, [chatId]); 

    return (
        <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Button
                variant="contained"
                startIcon={<FaPlus />}
                onClick={() => navigate('/student/chat')} 
                sx={{ mb: 2 }}
            >
                Cuộc trò chuyện mới
            </Button>
            <Typography variant="overline" color="textSecondary" sx={{ mt: 2, mb: 1 }}>
                Gần đây
            </Typography>
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}><CircularProgress size={24} /></Box>
                ) : (
                    <List dense>
                        {histories.map(chat => (
                            <ListItemButton
                                key={chat._id}
                                selected={chat._id === chatId} // Highlight mục đang chọn
                                onClick={() => navigate(`/student/chat/${chat._id}`)}
                            >
                                <ListItemText 
                                    primary={chat.title} 
                                    secondary={dayjs(chat.updatedAt).fromNow()}
                                    primaryTypographyProps={{ noWrap: true, fontSize: '0.9rem' }}
                                />
                            </ListItemButton>
                        ))}
                    </List>
                )}
            </Box>
        </Box>
    );
};

export default ChatSidebar;