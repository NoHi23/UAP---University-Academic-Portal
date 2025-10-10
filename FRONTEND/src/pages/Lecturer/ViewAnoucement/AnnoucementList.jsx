import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Container,
    Card,
    CardActionArea,
    CardContent,
    CircularProgress,
    Divider,
    Button,
} from "@mui/material";
import { AccessTime as AccessTimeIcon } from "@mui/icons-material";
import NavbarLecturer from "../../../components/NavBar/NavbarLecturer";
import announcementAPI from "../../../api/annoucementAPI";

const LecturerAnnouncements = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            setLoading(true);
            try {
                const res = await announcementAPI.getAll();
                setAnnouncements(res.data || []);
            } catch (err) {
                console.error("❌ Lỗi khi tải danh sách thông báo:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnnouncements();
    }, []);

    return (
        <>

            {/* 🔹 Nội dung trang */}
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                    Thông báo
                </Typography>
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 3 }}
                >
                    Cổng thông tin học vụ
                </Typography>

                <Card sx={{ p: 3, borderRadius: 2, boxShadow: 1 }}>
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 2,
                        }}
                    >
                        <Typography variant="h6" fontWeight={600}>
                            Thông báo mới nhất
                        </Typography>
                        <Button variant="outlined" size="small">
                            Xem tất cả
                        </Button>
                    </Box>

                    {loading ? (
                        <Box
                            sx={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                py: 4,
                            }}
                        >
                            <CircularProgress />
                        </Box>
                    ) : announcements.length > 0 ? (
                        announcements.map((item, index) => (
                            <Box key={item._id || index}>
                                <CardActionArea
                                    sx={{
                                        p: 1,
                                        borderRadius: 1,
                                        "&:hover": { backgroundColor: "#f1f5f9" },
                                    }}
                                >
                                    <CardContent sx={{ py: 1.5 }}>
                                        <Typography
                                            variant="subtitle1"
                                            color="primary"
                                            fontWeight={600}
                                            sx={{ cursor: "pointer" }}
                                        >
                                            {item.title || "Không có tiêu đề"}
                                        </Typography>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 0.5,
                                                mt: 0.5,
                                            }}
                                        >
                                            <AccessTimeIcon sx={{ fontSize: 16, color: "gray" }} />
                                            <Typography variant="caption" color="text.secondary">
                                                Đăng lúc{" "}
                                                {new Date(item.createdAt).toLocaleString("vi-VN")}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </CardActionArea>
                                {index < announcements.length - 1 && (
                                    <Divider sx={{ my: 0.5 }} />
                                )}
                            </Box>
                        ))
                    ) : (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            textAlign="center"
                            sx={{ py: 3 }}
                        >
                            Không có thông báo nào.
                        </Typography>
                    )}
                </Card>
            </Container>
        </>
    );
};

export default LecturerAnnouncements;
