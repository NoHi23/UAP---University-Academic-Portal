import React, { useState, useEffect, useRef } from 'react';
import './Chat.css';
import { FaPaperPlane, FaTimes } from 'react-icons/fa';
import api from '../../services/api';

const ChatModal = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Tự động cuộn xuống khi có tin nhắn mới
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    // Lấy lịch sử chat khi modal mở (bạn có thể thêm API này sau)
    // useEffect(() => {
    //     if (isOpen) {
    //         const fetchHistory = async () => {
    //             // const response = await api.get('/ai/chat/history');
    //             // setMessages(response.data.messages);
    //             setMessages([{ role: 'model', content: 'Chào bạn, tôi có thể giúp gì cho bạn?' }]);
    //         };
    //         fetchHistory();
    //     }
    // }, [isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Gọi API backend
            const response = await api.post('/ai/chat', { message: input });
            const modelMessage = { role: 'model', content: response.data.reply };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            const errorMessage = { role: 'model', content: 'Tôi gặp lỗi rồi, bạn thử lại sau nhé.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="chat-modal-overlay">
            <div className="chat-modal-container">
                <div className="chat-modal-header">
                    <h3>AI Support</h3>
                    <button onClick={onClose} className="chat-close-btn"><FaTimes /></button>
                </div>
                <div className="chat-modal-body">
                    {messages.map((msg, index) => (
                        <div key={index} className={`chat-message ${msg.role}`}>
                            {msg.content}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="chat-message model loading">
                            <span></span><span></span><span></span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                <form className="chat-modal-footer" onSubmit={handleSend}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Hỏi tôi bất cứ điều gì..."
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading}><FaPaperPlane /></button>
                </form>
            </div>
        </div>
    );
};

export default ChatModal;