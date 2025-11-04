import React, { useState, useEffect, useRef } from 'react';
import { Container, Paper, Box, TextField, IconButton, CircularProgress, Typography, Avatar } from '@mui/material';
import { FaPaperPlane, FaRobot, FaUser } from 'react-icons/fa';
import api from '../../services/api';
import './AiChatPage.css'; 
import dayjs from 'dayjs';

const AiChatPage = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(true); 
    const [isReplying, setIsReplying] = useState(false); 
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const fetchHistory = async () => {
            setIsLoading(true);
            try {
                const response = await api.get('/ai/chat/history');
                setMessages(response.data.data || []);
            } catch (error) {
                setMessages([{ role: 'model', content: 'Chào bạn, tôi là trợ lý AI. Tôi gặp lỗi khi tải lịch sử chat.' }]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, []);

    useEffect(scrollToBottom, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsReplying(true);

        try {
            const response = await api.post('/ai/chat', { message: userMessage.content });
            const modelMessage = { role: 'model', content: response.data.reply };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            const errorMessage = { role: 'model', content: 'Tôi gặp lỗi rồi, bạn thử lại sau nhé.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsReplying(false);
        }
    };

    return (
        <Container maxWidth="md" className="chat-page-container">
            <Paper elevation={3} className="chat-paper">
                <Box className="chat-body">
                    {isLoading ? (
                        <Box className="loading-container">
                            <CircularProgress />
                            <Typography>Đang tải lịch sử trò chuyện...</Typography>
                        </Box>
                    ) : (
                        messages.map((msg, index) => (
                            <Box key={index} className={`chat-message-row ${msg.role}`}>
                                <Avatar className="chat-avatar">
                                    {msg.role === 'user' ? <FaUser /> : <FaRobot />}
                                </Avatar>
                                <Box className="chat-message-bubble">
                                    {/* TODO: Thêm Markdown parser ở đây để hiển thị định dạng */}
                                    <Typography>{msg.content}</Typography>
                                </Box>
                            </Box>
                        ))
                    )}
                    {isReplying && (
                        <Box className="chat-message-row model">
                            <Avatar className="chat-avatar"><FaRobot /></Avatar>
                            <Box className="chat-message-bubble loading-bubble">
                                <span></span><span></span><span></span>
                            </Box>
                        </Box>
                    )}
                    <div ref={messagesEndRef} />
                </Box>
                
                <Box className="chat-footer" component="form" onSubmit={handleSend}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        size="small"
                        placeholder="Hỏi tôi bất cứ điều gì..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isReplying}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '25px',
                                backgroundColor: '#f0f2f5',
                            },
                        }}
                    />
                    <IconButton type="submit" color="primary" disabled={isReplying}>
                        <FaPaperPlane />
                    </IconButton>
                </Box>
            </Paper>
        </Container>
    );
};

export default AiChatPage;