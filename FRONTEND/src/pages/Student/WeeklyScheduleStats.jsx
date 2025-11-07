import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Alert, Paper } from '@mui/material';
import axios from 'axios';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function WeeklyScheduleStats() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');

                const res = await axios.get('http://localhost:9999/api/student/schedules/my-week', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const schedules = res.data.data || res.data || [];

                // Determine current week's Monday..Sunday
                const now = new Date();
                const day = now.getDay();
                const diffToMonday = (day === 0) ? -6 : (1 - day);
                const monday = new Date(now);
                monday.setDate(now.getDate() + diffToMonday);
                monday.setHours(0, 0, 0, 0);
                const sunday = new Date(monday);
                sunday.setDate(monday.getDate() + 6);
                sunday.setHours(23, 59, 59, 999);

                const labels = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
                const days = labels.map(label => ({ label, count: 0, items: [] }));

                schedules.forEach(sch => {
                    const dateVal = sch.date || sch.time || sch.startTime || (sch._doc && sch._doc.date);
                    const date = dateVal ? new Date(dateVal) : null;
                    if (!date || isNaN(date.getTime())) return;
                    if (date < monday || date > sunday) return;
                    const idx = date.getDay();
                    const item = {
                        scheduleId: sch._id || sch.id,
                        date: dateVal,
                        slot: sch.slot,
                        className: sch.classId?.className || sch.className || '',
                        subjectCode: sch.subjectId?.subjectCode || sch.subjectCode || sch.subjectName || '',
                        room: sch.roomId?.roomName || sch.room || ''
                    };
                    days[idx].items.push(item);
                    days[idx].count = days[idx].items.length;
                });

                setData({ weekStart: monday.toISOString(), weekEnd: sunday.toISOString(), days });
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

    const labels = data.days.map(d => d.label);
    const counts = data.days.map(d => d.count);

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Số buổi',
                data: counts,
                backgroundColor: 'rgba(25, 118, 210, 0.7)',
                borderColor: 'rgba(25, 118, 210, 1)',
                borderWidth: 1
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Thống kê số buổi trong tuần' }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { stepSize: 1 }
            }
        }
    };

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Thống kê lịch học trong tuần</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Tuần: {new Date(data.weekStart).toLocaleDateString()} - {new Date(data.weekEnd).toLocaleDateString()}
            </Typography>

            <Box sx={{ height: 260, mb: 2 }}>
                <Bar data={chartData} options={options} />
            </Box>

            <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Chi tiết:</Typography>
                {data.days.map(d => (
                    <Box key={d.label} sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{d.label} — {d.count} buổi</Typography>
                        {d.items.length === 0 ? (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Không có</Typography>
                        ) : (
                            d.items.map(it => (
                                <Box key={it.scheduleId} sx={{ pl: 1, py: 0.5 }}>
                                    <Typography variant="body2">{new Date(it.date).toLocaleDateString()} — {it.subjectCode} — {it.className} — Slot {it.slot} — {it.room || ''}</Typography>
                                </Box>
                            ))
                        )}
                    </Box>
                ))}
            </Box>
        </Paper>
    );
}
