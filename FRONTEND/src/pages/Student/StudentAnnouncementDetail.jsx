import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button } from '@mui/material';
import announcementAPI from '../../api/annoucementAPI';

export default function StudentAnnouncementDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [announcement, setAnnouncement] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        if (!id) return;
        announcementAPI
            .getById(id)
            .then((res) => {
                if (mounted) setAnnouncement(res.data || null);
            })
            .catch((err) => console.error('Failed to load announcement', err))
            .finally(() => mounted && setLoading(false));
        return () => (mounted = false);
    }, [id]);

    if (loading) return <Typography sx={{ p: 3 }}>Đang tải...</Typography>;

    if (!announcement) return <Typography sx={{ p: 3 }}>Không tìm thấy thông báo.</Typography>;

    return (
        <Box sx={{ p: 3 }}>
            <Button variant="outlined" size="small" onClick={() => navigate(-1)} sx={{ mb: 2 }}>
                Quay lại
            </Button>
            <Paper sx={{ p: 3 }} elevation={1}>
                <Typography variant="h5" gutterBottom>
                    {announcement.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                    {announcement.createdAt ? new Date(announcement.createdAt).toLocaleString() : ''}
                </Typography>
                <Box sx={{ mt: 2 }}>
                    <Typography variant="body1" component="div">
                        {announcement.content}
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
}
