import React, { useState, useRef } from 'react';
import { Box, Button, TextField, Typography, Paper, IconButton } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import LinkIcon from '@mui/icons-material/Link';
import ImageIcon from '@mui/icons-material/Image';
import SendIcon from '@mui/icons-material/Send';
import { notifySuccess, notifyError } from '../../services/notificationService';

const Feedback = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const editorRef = useRef(null);

  const validate = () => {
    if (!title.trim()) return 'Vui lòng nhập tiêu đề';
    if (!message.trim()) return 'Vui lòng nhập nội dung phản hồi';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return notifyError(err);

    setLoading(true);
    try {
      // Use simple JSON for now (backend should accept)
      const payload = {
        title,
        message,
      };

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Lưu phản hồi thất bại');

      notifySuccess('Gửi phản hồi thành công');
      setTitle('');
      setMessage('');
      if (editorRef.current) editorRef.current.innerHTML = '';
    } catch (error) {
      notifyError(error.message || 'Lỗi khi gửi phản hồi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3, position: 'relative', borderRadius: 2 }} elevation={1}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
        Gửi đóng góp ý kiến
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Bạn có thể gửi ý kiến về giảng dạy hoặc cơ sở vật chất.
      </Typography>

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2} alignItems="flex-start">
          {/* Title and toolbar on the same row */}
          <Grid item xs={12} md={8}>
            <TextField
              placeholder="Tiêu đề"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              size="small"
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', borderRadius: 1, bgcolor: '#fafafa', p: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <IconButton size="small"><FormatBoldIcon fontSize="small"/></IconButton>
              <IconButton size="small"><FormatItalicIcon fontSize="small"/></IconButton>
              <IconButton size="small"><FormatListBulletedIcon fontSize="small"/></IconButton>
              <IconButton size="small"><FormatListNumberedIcon fontSize="small"/></IconButton>
              <IconButton size="small"><LinkIcon fontSize="small"/></IconButton>
              <IconButton size="small"><ImageIcon fontSize="small"/></IconButton>
            </Box>
          </Grid>

          <Grid item xs={12}>
            {/* editor area (simple contentEditable styled) */}
            <Box
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => setMessage(e.currentTarget.textContent)}
              sx={{
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                minHeight: 220,
                p: 2,
                outline: 'none',
                bgcolor: 'white',
                width: '100%',
                overflow: 'auto'
              }}
            >
              {message}
            </Box>
          </Grid>
        </Grid>

        {/* floating submit button */}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading}
          sx={{
            position: 'absolute',
            right: 24,
            bottom: 24,
            borderRadius: '24px',
            px: 3,
            py: 1,
            boxShadow: '0px 6px 12px rgba(25, 118, 210, 0.2)'
          }}
          startIcon={<SendIcon />}
        >
          Gửi
        </Button>
      </Box>
    </Paper>
  );
};

export default Feedback;
