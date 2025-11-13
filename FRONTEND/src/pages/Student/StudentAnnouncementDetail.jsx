import React, { useEffect, useState, useCallback } from "react";
import {
    Box,
    Container,
    Typography,
    CircularProgress,
    Card,
    CardContent,
    Divider,
    Button
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import announcementAPI from "../../api/annoucementAPI";

const fmtVN = (v) => {
    if (!v) return "Không rõ thời gian";
    const d = new Date(v);
    return isNaN(d.getTime()) ? "Không rõ thời gian" : d.toLocaleString("vi-VN");
};

const StudentAnnouncementDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const fetchDetail = useCallback(async () => {
        setLoading(true);
        setErr("");
        try {
            const res = await announcementAPI.getById(id);
            const data = res?.data?.data ?? res?.data ?? null;
            setItem(data);
        } catch (e) {
            console.error(e);
            setErr("Không tải được chi tiết thông báo.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Button variant="outlined" size="small" onClick={() => navigate(-1)} sx={{ mb: 2 }}>
                ← Quay lại
            </Button>

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                    <CircularProgress />
                </Box>
            ) : err ? (
                <Typography color="error" textAlign="center">{err}</Typography>
            ) : !item ? (
                <Typography color="text.secondary" textAlign="center">Không có dữ liệu.</Typography>
            ) : (
                <Card sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, boxShadow: 1 }}>
                    <Typography
                        variant="h5"
                        fontWeight={700}
                        textAlign="center"
                        sx={{ mb: 1, wordBreak: "break-word" }}
                    >
                        {item?.title || "Không có tiêu đề"}
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        textAlign="center"
                        sx={{ mb: 2 }}
                    >
                        {item?.postBy ? `Người đăng: ${item.postBy}` : "Người đăng: Không rõ"} · {item?.createdAt ? fmtVN(item.createdAt) : "Không rõ thời gian"}
                    </Typography>

                    <Divider sx={{ mb: 2 }} />

                    <CardContent sx={{ p: 0 }}>
                        {item?.picture ? (
                            <Box sx={{ mb: 2 }}>
                                <Box
                                    component="img"
                                    src={item.picture}
                                    alt={item?.title || "announcement-image"}
                                    sx={{
                                        width: "100%",
                                        height: "auto",
                                        borderRadius: 2,
                                        display: "block",
                                        objectFit: "cover"
                                    }}
                                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                                />
                            </Box>
                        ) : null}

                        {item?.content ? (
                            <Box
                                sx={{
                                    "& img": { maxWidth: "100%" },
                                    "& p": { lineHeight: 1.8 }
                                }}
                                dangerouslySetInnerHTML={{ __html: item.content }}
                            />
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                Không có mô tả.
                            </Typography>
                        )}
                    </CardContent>
                </Card>
            )}
        </Container>
    );
};

export default StudentAnnouncementDetail;
