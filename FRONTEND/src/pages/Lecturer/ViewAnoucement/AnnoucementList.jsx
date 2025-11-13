// src/pages/lecturer/LecturerAnnouncements.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
    Box, Typography, Container, Card, CardActionArea, CardContent,
    CircularProgress, Divider, Button, Stack
} from "@mui/material";
import { AccessTime as AccessTimeIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import announcementAPI from "../../../api/annoucementAPI";

const fmt = (v) => {
    if (!v) return "Không rõ thời gian";
    const d = new Date(v);
    return isNaN(d.getTime()) ? "Không rõ thời gian" : d.toLocaleString("vi-VN");
};

const LecturerAnnouncements = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await announcementAPI.getAll();
            const raw = Array.isArray(res?.data?.data) ? res.data.data : [];

            // Giữ id, title, createdAt, status để lọc và điều hướng
            const list = raw.map(x => ({
                _id: x?._id,
                title: x?.title ?? "Không có tiêu đề",
                createdAt: x?.createdAt ?? x?.created_at ?? x?.updatedAt ?? null,
                // backend uses string statuses: 'published' | 'scheduled' | 'draft'
                isPublished: String(x?.status) === 'published',
                audience: x?.audience || 'all'
            }))
                // Chỉ hiển thị những thông báo đã đăng và đúng đối tượng (lecturer/all)
                .filter(x => x.isPublished && (x.audience === 'all' || x.audience === 'lecturer'));

            setItems(list);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>Thông báo</Typography>

            <Card sx={{ p: 2, borderRadius: 2, boxShadow: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>Danh sách</Typography>
                    <Button size="small" variant="outlined" onClick={fetchData} disabled={loading}>Làm mới</Button>
                </Stack>

                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : items.length ? (
                    items.map((it, idx) => (
                        <Box key={it._id || idx}>
                            <CardActionArea
                                sx={{ p: 1, borderRadius: 1 }}
                                onClick={() => navigate(`/lecturer/announcements/${it._id}`)} // ← điều hướng sang detail
                            >
                                <CardContent sx={{ py: 1 }}>
                                    <Typography variant="subtitle1" fontWeight={600}>
                                        {it.title}
                                    </Typography>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                        <AccessTimeIcon sx={{ fontSize: 16, color: "gray" }} />
                                        <Typography variant="caption" color="text.secondary">
                                            {fmt(it.createdAt)}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </CardActionArea>
                            {idx < items.length - 1 && <Divider sx={{ my: 0.5 }} />}
                        </Box>
                    ))
                ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }} textAlign="center">
                        Không có thông báo nào.
                    </Typography>
                )}
            </Card>
        </Container>
    );
};

export default LecturerAnnouncements;
