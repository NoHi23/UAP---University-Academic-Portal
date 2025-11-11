import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Grid, Chip, CircularProgress, Alert, Button } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '../../services/api';

// Lightweight local fallback when there are no evaluations to show
const mockEvaluations = [
  {
    _id: 'mock1',
    classId: { className: 'Lập trình nâng cao' },
    criteria: [ { name: 'Phương pháp giảng dạy', score: 5 }, { name: 'Tương tác', score: 4 } ],
    comment: 'Giảng viên truyền đạt rõ ràng, bài tập thực tế.',
    createdAt: new Date().toISOString()
  },
  {
    _id: 'mock2',
    classId: { className: 'Cơ sở dữ liệu' },
    criteria: [ { name: 'Phương pháp giảng dạy', score: 4 }, { name: 'Tương tác', score: 3 } ],
    comment: 'Nội dung hay nhưng tốc độ hơi nhanh.',
    createdAt: new Date().toISOString()
  }
];

const Evaluations = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchEvaluations = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.get('lecturer/evaluations');
      const data = res?.data || {};
      setEvaluations(Array.isArray(data.data) ? data.data : (data || []));
    } catch (err) {
      console.error('Failed to load evaluations', err);
      setError(err?.response?.data?.message || err.message || 'Không thể tải đánh giá');
      setEvaluations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const list = evaluations && evaluations.length ? evaluations : mockEvaluations;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Xem đánh giá từ sinh viên (Ẩn danh)</Typography>
        <Box>
          <Button startIcon={<RefreshIcon />} onClick={fetchEvaluations} disabled={loading}>Tải lại</Button>
        </Box>
      </Box>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Paper sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : list.length === 0 ? (
          <Typography>Chưa có đánh giá nào.</Typography>
        ) : (
          <Grid container spacing={2}>
            {list.map((ev, idx) => (
              <Grid item xs={12} key={ev._id || idx}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ fontWeight: 600 }}>{`Đánh giá #${idx + 1}`}</Typography>
                    <Typography variant="caption" color="text.disabled">{ev.createdAt ? new Date(ev.createdAt).toLocaleString() : ''}</Typography>
                  </Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>{ev.classId?.className || 'Lớp không xác định'}</Typography>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    {Array.isArray(ev.criteria) && ev.criteria.length > 0 ? ev.criteria.map((c, i) => (
                      <Chip key={i} label={`${c.name}: ${c.score}`} color="primary" size="small" />
                    )) : <Chip label="Không có tiêu chí" size="small" />}
                  </Box>

                  {ev.comment ? (
                    <Typography variant="body2" sx={{ fontStyle: 'italic', mb: 1 }}>{ev.comment}</Typography>
                  ) : null}

                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Box>
  );
};

export default Evaluations;
