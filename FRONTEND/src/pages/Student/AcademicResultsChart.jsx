import React, { useEffect, useState } from 'react';
import { Paper, Box, Typography, CircularProgress, Alert } from '@mui/material';
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

export default function AcademicResultsChart() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState([]);

    useEffect(() => {
        const fetchGrades = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:9999/api/student/grades', {
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
                });
                if (!res.ok) throw new Error(`Status ${res.status}`);
                const body = await res.json();
                const grades = body.grades || body.data || [];

                // Group by subject and compute average
                const bySubject = {};
                grades.forEach(g => {
                    const subj = (g.subjectId && (g.subjectId.subjectName || g.subjectId.subjectCode)) || g.subjectName || g.subjectCode || 'Unknown';
                    if (!bySubject[subj]) bySubject[subj] = { total: 0, count: 0 };
                    const score = typeof g.score === 'number' ? g.score : Number(g.score || 0);
                    bySubject[subj].total += isNaN(score) ? 0 : score;
                    bySubject[subj].count += 1;
                });

                const arr = Object.keys(bySubject).map(subj => ({
                    subject: subj,
                    avg: bySubject[subj].count ? (bySubject[subj].total / bySubject[subj].count) : 0,
                    count: bySubject[subj].count
                }));

                // Sort by average descending
                arr.sort((a, b) => b.avg - a.avg);

                setData(arr);
            } catch (err) {
                console.error('Failed to load grades:', err);
                setError(err.message || 'Lỗi khi tải kết quả học tập');
            } finally {
                setLoading(false);
            }
        };
        fetchGrades();
    }, []);

    if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight={140}><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;

    if (!data || data.length === 0) return <Typography variant="body2">Chưa có kết quả để hiển thị.</Typography>;

    const labels = data.map(d => d.subject);
    const values = data.map(d => Number(d.avg.toFixed(2)));

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Điểm trung bình',
                data: values,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Kết quả học tập (trung bình theo môn)' }
        },
        scales: {
            y: {
                beginAtZero: true,
                suggestedMax: 10
            }
        }
    };

    return (
        <Paper sx={{ p: 2, minHeight: 260 }}>
            <Box sx={{ height: 260 }}>
                <Bar data={chartData} options={options} />
            </Box>
        </Paper>
    );
}
