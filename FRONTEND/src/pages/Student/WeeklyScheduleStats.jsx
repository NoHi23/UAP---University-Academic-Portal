import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Alert, Paper, Grid } from '@mui/material';
import axios from 'axios';

export default function WeeklyScheduleStats() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:9999/api/scheduling/student/weekly', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(res.data.data);
            } catch (err) {
                setError(err.response?.data?.message || err.message || 'Lỗi khi tải dữ liệu');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;

    // find max count to scale bars
    const max = Math.max(...(data.days.map(d => d.count)), 1);

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Thống kê lịch học trong tuần</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Tuần: {new Date(data.weekStart).toLocaleDateString()} - {new Date(data.weekEnd).toLocaleDateString()}
            </Typography>

            <Grid container spacing={2} alignItems="end">
                {data.days.map((d, idx) => (
                    <Grid item xs={12} sm={6} md={3} lg={1.714} key={d.label}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Box sx={{ height: 120, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                                <Box sx={{ width: '100%', height: `${Math.round((d.count / max) * 100)}%`, bgcolor: '#1976d2', borderRadius: 1, transition: 'height 300ms' }} />
                            </Box>
                            <Typography variant="subtitle2" sx={{ mt: 1 }}>{d.label}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{d.count} buổi</Typography>
                        </Box>
                    </Grid>
                ))}
            </Grid>

            <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Chi tiết:</Typography>
                {data.days.map(d => (
                    <Box key={d.label} sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{d.label} — {d.count} buổi</Typography>
                        {d.items.length === 0 ? (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Không có</Typography>
                        ) : (
                            d.items.map(it => (
                                <Box key={it.scheduleId} sx={{ pl: 1, py: 0.5 }}>
                                    <Typography variant="body2">{new Date(it.date).toLocaleDateString()} — {it.subjectCode || it.subjectName} — {it.className} — Slot {it.slot} — {it.room || ''}</Typography>
                                </Box>
                            ))
                        )}
                    </Box>
                ))}
            </Box>
        </Paper>
    );
}
