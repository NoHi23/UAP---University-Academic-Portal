import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Divider } from '@mui/material';

// Mock data to show when API returns empty/null
const mockEvaluations = [
  {
    _id: 'mock1',
    studentId: { firstName: 'Nguyễn', lastName: 'Văn A', studentCode: 'SV001' },
    classId: { className: 'Lập trình nâng cao' },
    criteria: [ { name: 'Phương pháp giảng dạy', score: 5 }, { name: 'Tương tác', score: 4 } ],
    comment: 'Giảng viên truyền đạt rõ ràng, bài tập thực tế.',
    createdAt: new Date().toISOString()
  },
  {
    _id: 'mock2',
    studentId: { firstName: 'Trần', lastName: 'Thị B', studentCode: 'SV002' },
    classId: { className: 'Cơ sở dữ liệu' },
    criteria: [ { name: 'Phương pháp giảng dạy', score: 4 }, { name: 'Tương tác', score: 3 } ],
    comment: 'Nội dung hay nhưng tốc độ hơi nhanh.',
    createdAt: new Date().toISOString()
  }
];

const Evaluations = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:9999/api/lecturer/evaluations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Không thể lấy đánh giá');
      const data = await res.json();
      setEvaluations(data.data || []);
    } catch (err) {
      console.error(err);
      setEvaluations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  return (
    <Box>
      <Typography variant="h5" mb={2}>Xem đánh giá từ sinh viên (Ẩn danh)</Typography>
      <Paper sx={{ p: 2 }}>
        {loading ? (
            <Typography>Đang tải...</Typography>
          ) : (
            // One-line fallback: nếu `evaluations` rỗng/null thì chuyển sang `mockEvaluations`
            <List>
              {(evaluations && evaluations.length ? evaluations : mockEvaluations).map((ev, idx) => (
              <React.Fragment key={ev._id}>
                <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={`${`Sinh viên ${idx + 1}`} — ${ev.classId?.className || ''}`}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {ev.criteria?.map(c => `${c.name}: ${c.score}`).join(' · ')}
                        </Typography>
                        <br />
                        <Typography variant="body2" color="text.secondary">{ev.comment}</Typography>
                        <Typography variant="caption" color="text.disabled">{new Date(ev.createdAt).toLocaleString()}</Typography>
                      </>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default Evaluations;
