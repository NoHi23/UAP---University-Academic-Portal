import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    Container,
    CircularProgress,
    Breadcrumbs,
    Link,
    Divider,
    Card,
    Button,
} from "@mui/material";
import { AccessTime as AccessTimeIcon, ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import NavbarLecturer from "../../../components/NavBar/NavbarLecturer";
import announcementAPI from "../../../api/annoucementAPI";

const LecturerAnnouncementDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [announcement, setAnnouncement] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            setLoading(true);
            try {
                const res = await announcementAPI.getById(id);
                setAnnouncement(res.data);
            } catch (err) {
                console.error("❌ Lỗi khi tải chi tiết thông báo:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    return (
        <>
            {/* 🔹 Navbar */}
            <NavbarLecturer />

            {/* 🔹 Nội dung chi tiết */}
            <Container maxWidth="md" sx={{ py: 4 }}>
                {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                        <CircularProgress />
                    </Box>
                ) : !announcement ? (
                    <Typography align="center" color="text.secondary" sx={{ py: 6 }}>
                        Không tìm thấy thông báo.
                    </Typography>
                ) : (
                    <>
                        {/* Breadcrumb */}
                        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
                            <Link
                                underline="hover"
                                color="inherit"
                                onClick={() => navigate("/lecturer/announcements")}
                                sx={{ cursor: "pointer" }}
                            >
                                Tin tức
                            </Link>
                            <Typography color="text.primary">
                                {announcement.title || "Chi tiết thông báo"}
                            </Typography>
                        </Breadcrumbs>

                        <Card sx={{ p: 3, borderRadius: 2, boxShadow: 1 }}>
                            {/* Tiêu đề */}
                            <Typography
                                variant="h6"
                                fontWeight={700}
                                color="primary"
                                sx={{ mb: 1 }}
                            >
                                {announcement.title}
                            </Typography>

                            {/* Meta info */}
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    mb: 3,
                                    flexWrap: "wrap",
                                }}
                            >
                                <Typography variant="body2" color="text.secondary">
                                    {announcement.author || "Phòng Quản lý Đào tạo"}
                                </Typography>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.5,
                                        color: "text.secondary",
                                    }}
                                >
                                    <AccessTimeIcon sx={{ fontSize: 16 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        Đăng lúc {new Date(announcement.createdAt).toLocaleString("vi-VN")}
                                    </Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ mb: 3 }} />

                            {/* Nội dung chính */}
                            <Box
                                sx={{
                                    fontSize: "0.95rem",
                                    color: "#1e293b",
                                    lineHeight: 1.7,
                                    "& p": { mb: 2 },
                                    "& strong": { fontWeight: 600 },
                                    "& ul": { pl: 3 },
                                    "& li": { mb: 0.5 },
                                }}
                                dangerouslySetInnerHTML={{
                                    __html: announcement.content || "<p>Không có nội dung.</p>",
                                }}
                            />

                            <Divider sx={{ mt: 3, mb: 2 }} />

                            {/* Nút quay lại */}
                            <Button
                                startIcon={<ArrowBackIcon />}
                                variant="outlined"
                                onClick={() => navigate("/lecturer/announcements")}
                            >
                                Quay lại tin tức
                            </Button>
                        </Card>
                    </>
                )}
            </Container>
        </>
    );
};

export default LecturerAnnouncementDetail;
