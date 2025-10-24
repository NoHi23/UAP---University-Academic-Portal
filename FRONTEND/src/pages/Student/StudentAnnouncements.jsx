import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, CardActions, Button, Grid } from '@mui/material';
import announcementAPI from '../../api/annoucementAPI';

export default function StudentAnnouncements() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        let mounted = true;
        announcementAPI
            .getAll()
            .then((res) => {
                if (mounted) {
                    setAnnouncements(res.data || []);
                }
            })
            .catch((err) => {
                console.error('Failed to load announcements', err);
            })
            .finally(() => mounted && setLoading(false));
        return () => (mounted = false);
    }, []);

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                Thông báo từ trường
            </Typography>
            {loading && <Typography>Đang tải...</Typography>}
            {!loading && announcements.length === 0 && (
                <Typography>Không có thông báo nào.</Typography>
            )}

            <Grid container spacing={2} sx={{ mt: 1 }}>
                {announcements.map((a) => (
                    <Grid item xs={12} md={6} lg={4} key={a._id}>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="h6">{a.title}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    {a.content && String(a.content).slice(0, 160)}{a.content && a.content.length > 160 ? '...' : ''}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                    {a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}
                                </Typography>
                            </CardContent>
                            <CardActions>
                                <Button size="small" onClick={() => navigate(`/student/announcements/${a._id}`)}>
                                    Xem chi tiết
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
