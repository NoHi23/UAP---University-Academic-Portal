import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const StudyProgressChart = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState({ passedCount: 0, totalCount: 0 });

    useEffect(() => {
        const fetchProgress = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:9999/api/student/study-progress', {
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
                });

                if (!res.ok) {
                    throw new Error(`Status ${res.status}`);
                }

                const data = await res.json();
                const passedCount = Number(data.passedCount ?? 0);
                const totalCount = Number(data.totalCount ?? 0);
                setProgress({
                    passedCount: Number.isFinite(passedCount) ? passedCount : 0,
                    totalCount: Number.isFinite(totalCount) ? totalCount : 0
                });
                setError(null);
            } catch (err) {
                console.error('Failed to load study progress:', err);
                setError(err.message || 'Không thể tải tiến độ học tập');
            } finally {
                setLoading(false);
            }
        };

        fetchProgress();
    }, []);

    if (loading) {
        return <Box display="flex" justifyContent="center" alignItems="center" minHeight={220}><CircularProgress size={28} /></Box>;
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    const { passedCount, totalCount } = progress;

    if (!totalCount) {
        return <Typography variant="body2">Chưa có khung chương trình để thống kê.</Typography>;
    }

    const remaining = Math.max(totalCount - passedCount, 0);
    const chartData = {
        labels: ['Hoàn thành', 'Chưa hoàn thành'],
        datasets: [
            {
                label: 'Số môn',
                data: [passedCount, remaining],
                backgroundColor: ['rgba(75, 192, 192, 0.7)', 'rgba(201, 203, 207, 0.7)'],
                borderColor: ['rgba(75, 192, 192, 1)', 'rgba(201, 203, 207, 1)'],
                borderWidth: 1
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom'
            },
            tooltip: {
                callbacks: {
                    label: context => {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        return `${label}: ${value} môn`;
                    }
                }
            }
        }
    };

    return (
        <Box display="flex" flexDirection="column" alignItems="center" sx={{ height: 260 }}>
            <Box sx={{ flex: 1, width: '100%' }}>
                <Doughnut data={chartData} options={options} />
            </Box>
            <Typography variant="body2" sx={{ mt: 2 }}>
                Đã hoàn thành {passedCount}/{totalCount} môn trong khung chương trình.
            </Typography>
        </Box>
    );
};

export default StudyProgressChart;
