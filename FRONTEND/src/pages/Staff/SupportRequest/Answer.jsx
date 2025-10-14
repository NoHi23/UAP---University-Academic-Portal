// src/pages/support/AnswerSupport.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Box,
    Paper,
    Typography,
    CircularProgress,
    Button,
    Stack,
    Divider,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import JoditEditor from "jodit-react";
import supportAPI, { SUPPORT_STATUS } from "../../../api/supportAPI";
import {
    notifySuccess,
    notifyError,
    showConfirmDialog,
} from "../../../services/notificationService";

// Màu nền theo trạng thái
const STATUS_BG = {
    [SUPPORT_STATUS.OPEN]: { bg: "#fee2e2", text: "#991b1b", border: "#fecaca" },      // đỏ nhạt
    [SUPPORT_STATUS.IN_PROGRESS]: { bg: "#ffedd5", text: "#9a3412", border: "#fed7aa" },// cam nhạt
    [SUPPORT_STATUS.CLOSED]: { bg: "#dcfce7", text: "#166534", border: "#bbf7d0" },     // xanh nhạt
};

export default function AnswerSupport() {
    const { id } = useParams(); // route: /staff/support/:id
    const navigate = useNavigate();
    const editorRef = useRef(null);

    const [detail, setDetail] = useState(null);
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(true);

    // Editor soạn câu trả lời (memo để tránh re-init)
    const editorConfig = useMemo(
        () => ({
            readonly: false,
            minHeight: 220,
            toolbarAdaptive: false,
            placeholder: "Nhập câu trả lời...",
            uploader: { insertImageAsBase64URI: true },
        }),
        []
    );

    // Viewer cho phần hiển thị request (readonly)
    const viewerConfig = useMemo(
        () => ({
            readonly: true,
            toolbar: false,
            statusbar: false,
            minHeight: 80,
            iframe: false,
            showCharsCounter: false,
            showWordsCounter: false,
            askBeforePasteHTML: false,
            askBeforePasteFromWord: false,
            defaultActionOnPaste: "insert_clear_html",
        }),
        []
    );

    const loadDetail = async () => {
        try {
            setLoading(true);
            const res = await supportAPI.getById(id);
            setDetail(res.data?.data || null);
            setAnswer(res.data?.data?.answer || "");
        } catch (e) {
            notifyError(e?.response?.data?.message || "Không tải được chi tiết yêu cầu hỗ trợ.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const headerStyle = useMemo(() => {
        return (
            STATUS_BG[detail?.status] || {
                bg: "#f1f5f9",
                text: "#0f172a",
                border: "#e2e8f0",
            }
        );
    }, [detail?.status]);

    // Debounce onChange để không re-render liên tục khi đang gõ
    const typingRef = useRef(null);
    const handleEditorChange = (content) => {
        clearTimeout(typingRef.current);
        typingRef.current = setTimeout(() => setAnswer(content), 250);
    };

    const onSubmit = async () => {
        if (!answer || !answer.trim()) {
            notifyError("Vui lòng nhập nội dung trả lời.");
            return;
        }

        const ok = await showConfirmDialog({
            title: "Xác nhận gửi trả lời?",
            text: "Trạng thái sẽ chuyển thành In Progress.",
            icon: "question",
            confirmButtonText: "Gửi ngay",
            cancelButtonText: "Hủy",
        });
        if (!ok.isConfirmed) return;

        try {
            await supportAPI.answer(id, answer);
            notifySuccess("Gửi câu trả lời thành công và cập nhật trạng thái.");
            await loadDetail();
        } catch (e) {
            notifyError(e?.response?.data?.message || "Gửi câu trả lời thất bại.");
        }
    };

    if (loading) {
        return (
            <Box sx={{ textAlign: "center", py: 10 }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Đang tải chi tiết yêu cầu...</Typography>
            </Box>
        );
    }

    if (!detail) {
        return (
            <Box>
                <Typography color="error">Không tìm thấy yêu cầu hỗ trợ.</Typography>
                <Button sx={{ mt: 2 }} onClick={() => navigate(-1)}>
                    Quay lại
                </Button>
            </Box>
        );
    }

    return (
        <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Trả lời yêu cầu hỗ trợ
                </Typography>
                <Button variant="outlined" onClick={() => navigate(-1)}>
                    Quay lại
                </Button>
            </Stack>

            {/* Hộp request (2 hàng) */}
            <Paper
                variant="outlined"
                sx={{ borderColor: headerStyle.border, overflow: "hidden", mb: 3, borderRadius: 2 }}
            >
                {/* Hàng 1: header có nền theo trạng thái */}
                <Box
                    sx={{
                        px: 2.5,
                        py: 1.5,
                        bgcolor: headerStyle.bg,
                        color: headerStyle.text,
                        borderBottom: `1px solid ${headerStyle.border}`,
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                    }}
                >
                    <Typography sx={{ fontWeight: 700 }}>
                        Trạng thái:{" "}
                        {detail.status === "in_progress"
                            ? "In Progress"
                            : (detail.status || "").replace("_", " ")}
                    </Typography>
                    <Divider orientation="vertical" flexItem />
                    <Typography variant="body2">
                        Mã yêu cầu: <b>{detail._id}</b>
                    </Typography>
                    <Divider orientation="vertical" flexItem />
                    <Typography variant="body2">
                        Người gửi: <b>{detail.accountId?.email || "N/A"}</b>
                    </Typography>
                    <Divider orientation="vertical" flexItem />
                    <Typography variant="body2">
                        Tạo lúc: {new Date(detail.createdAt).toLocaleString()}
                    </Typography>
                </Box>

                {/* Hàng 2: nội dung request (viewer) */}
                <Box sx={{ px: 2.5, py: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
                        Nội dung yêu cầu
                    </Typography>
                    <Box
                        sx={{
                            "& .jodit-container": { border: "1px solid #e5e7eb", borderRadius: 1 },
                            "& .jodit-wysiwyg": { minHeight: 80 },
                        }}
                    >
                        <JoditEditor
                            value={detail.request || ""}
                            config={viewerConfig}
                            onChange={() => { }}
                        />
                    </Box>
                </Box>
            </Paper>

            {/* Ô nhập câu trả lời (Jodit) */}
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
                    Nội dung trả lời
                </Typography>

                <JoditEditor
                    ref={editorRef}
                    value={answer}
                    config={editorConfig}
                    onBlur={(newContent) => setAnswer(newContent)}
                    onChange={handleEditorChange}
                />

                <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
                    <Button variant="contained" onClick={onSubmit}>
                        Gửi
                    </Button>
                </Stack>
            </Paper>
        </Box>
    );
}
