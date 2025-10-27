import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, IconButton, Box, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import api from '../../../../services/api';
import { notifySuccess, notifyError } from '../../../../services/notificationService';

const SlotNotificationModal = ({ open, onClose, scheduleId }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async () => {
    if (!scheduleId) return setError('Schedule ID missing');
    if (!title.trim()) return setError('Vui lòng nhập tiêu đề');
    if (!content.trim()) return setError('Vui lòng nhập nội dung');

    try {
      setLoading(true);
      setError(null);
      const payload = { scheduleId, title: title.trim(), content: content.trim() };
      // Use lecturer endpoint so lecturers post as themselves and avoid staff-only checks
      await api.post('/lecturer/notifications/slots', payload);
      // show toast success and clear + close
      notifySuccess('Gửi thông báo thành công');
      setTitle('');
      setContent('');
      // close the modal after short delay so user sees toast
      setTimeout(() => onClose && onClose(), 300);
    } catch (err) {
      console.error('send notification', err);
      const msg = err.response?.data?.message || 'Không thể gửi thông báo';
      setError(msg);
      notifyError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Gửi thông báo cho buổi học</Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField label="Tiêu đề" value={title} onChange={e => setTitle(e.target.value)} fullWidth />
          <TextField label="Nội dung" value={content} onChange={e => setContent(e.target.value)} fullWidth multiline minRows={4} />

          {error && <Typography color="error">{error}</Typography>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Hủy</Button>
        <Button variant="contained" onClick={handleSend} disabled={loading}>{loading ? 'Đang gửi...' : 'Gửi'}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SlotNotificationModal;
