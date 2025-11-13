import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Chip, CircularProgress, Alert, Button,
  Card, CardContent, Divider
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import StarIcon from '@mui/icons-material/Star';
import api from '../../services/api'; 

const Evaluations = () => {
  const [summary, setSummary] = useState(null);
  const [comments, setComments] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchEvaluations = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.get('/lecturer/evaluations');

      setSummary(res.data.summary || {});
      setComments(res.data.comments || []);

      if (res.data.summary?.totalEvaluations === 0) {
        setError('Chưa có sinh viên nào nộp đánh giá cho bạn.');
      }
    } catch (err) {
      console.error('Failed to load evaluations', err);
      setError(err?.response?.data?.message || err.message || 'Không thể tải đánh giá');
      setSummary(null);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" fontWeight={600}>Đánh giá từ Sinh viên (Ẩn danh)</Typography>
        <Button startIcon={<RefreshIcon />} onClick={fetchEvaluations} disabled={loading}>Tải lại</Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity={summary?.totalEvaluations === 0 ? "info" : "error"} sx={{ mb: 2 }}>{error}</Alert>
      ) : summary && (
        <>
          {/* --- KHU VỰC TÓM TẮT ĐIỂM TRUNG BÌNH --- */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Tổng quan</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight={700} color="primary.main">{summary.totalEvaluations}</Typography>
                    <Typography variant="body2" color="textSecondary">Tổng lượt đánh giá</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={8}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>1. Kiến thức & Chuyên môn</Typography>
                      <Typography variant="h6" fontWeight={600}>{summary.averageKnowledge} <StarIcon sx={{ fontSize: 16, color: '#faaf00' }} /></Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', my: 1 }}>
                      <Typography>2. Kỹ năng Truyền đạt</Typography>
                      <Typography variant="h6" fontWeight={600}>{summary.averageTeaching} <StarIcon sx={{ fontSize: 16, color: '#faaf00' }} /></Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                      <Typography>3. Thái độ Tôn trọng</Typography>
                      <Typography variant="h6" fontWeight={600}>{summary.averageRespect} <StarIcon sx={{ fontSize: 16, color: '#faaf00' }} /></Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>

          {/* --- KHU VỰC BÌNH LUẬN --- */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Bình luận chi tiết</Typography>
            {comments.length === 0 ? (
              <Typography>Không có bình luận nào.</Typography>
            ) : (
              <Grid container spacing={2}>
                {comments.map((ev, idx) => (
                  <Grid item xs={12} key={idx}>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f9f9f9' }}>
                      <Typography variant="body2" sx={{ fontStyle: 'italic' }}>"{ev.comment}"</Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Chip label={`Lớp: ${ev.class} (${ev.subject})`} size="small" />
                        <Typography variant="caption" color="text.disabled">
                          {ev.createdAt ? new Date(ev.createdAt).toLocaleString() : ''}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
};

export default Evaluations;