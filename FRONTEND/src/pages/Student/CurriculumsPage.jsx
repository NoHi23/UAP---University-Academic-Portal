import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Box, Typography, Grid, Card, CardContent, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

const CurriculumsPage = () => {
    const [curriculums, setCurriculums] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const location = useLocation();

    useEffect(() => {
        const fetch = async () => {
            try {
                const params = new URLSearchParams(location.search);
                const majorId = params.get('majorId');
                const url = majorId ? `curriculums?majorId=${majorId}` : 'curriculums';
                const res = await api.get(url);
                setCurriculums(res.data || []);
            } catch (err) {
                console.error('Failed to load curriculums', err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [location.search]);

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Chương trình đào tạo</Typography>
            {loading ? (
                <Typography>Đang tải...</Typography>
            ) : (
                <Grid container spacing={2}>
                    {curriculums.length === 0 && (
                        <Grid item xs={12}><Typography>Không có chương trình nào.</Typography></Grid>
                    )}
                    {curriculums.map((c) => (
                        <Grid item xs={12} md={6} lg={4} key={c.curriculumId || c._id}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6">{c.curriculumName}</Typography>
                                    <Typography variant="body2" color="text.secondary">{c.major}</Typography>
                                    <Typography variant="body2">{c.totalSemester} kỳ · Áp dụng: {c.yearApplied || '—'}</Typography>
                                    <Typography variant="body2" sx={{ mt: 1 }}>{c.description}</Typography>
                                    <Button sx={{ mt: 2 }} variant="outlined" onClick={() => navigate(`/student/curriculums/${c.curriculumId || c._id}`)}>Xem chi tiết</Button>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
};

export default CurriculumsPage;
