// src/pages/lecturer/SupportListLecturer.jsx
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
    Box, Paper, Typography, CircularProgress, Button, Stack,
    ToggleButton, ToggleButtonGroup, Chip, Alert, Divider,
    Dialog, DialogTitle, DialogContent, DialogActions, IconButton
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";
import JoditEditor from "jodit-react";
import supportAPI, { SUPPORT_STATUS } from "../../../api/supportAPI";
import { AuthContext } from "../../../context/AuthContext";
import SupportCreateModal from "./CreateRequest";
import { notifySuccess, notifyError, showConfirmDialog } from "../../../services/notificationService";

// Màu nền/chip theo trạng thái
const STATUS_BG = {
    [SUPPORT_STATUS.OPEN]: { bg: "#fee2e2", text: "#991b1b", border: "#fecaca", chipColor: "error" },
    [SUPPORT_STATUS.IN_PROGRESS]: { bg: "#ffedd5", text: "#9a3412", border: "#fed7aa", chipColor: "warning" },
    [SUPPORT_STATUS.CLOSED]: { bg: "#dcfce7", text: "#166534", border: "#bbf7d0", chipColor: "success" },
};
const STATUS_ORDER = { open: 0, in_progress: 1, closed: 2 };

export default function SupportListLecturer() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // sort: newest | oldest | status
    const [sortBy, setSortBy] = useState("newest");

    // Modal tạo yêu cầu
    const [openCreate, setOpenCreate] = useState(false);
    const openCreateModal = () => setOpenCreate(true);
    const closeCreateModal = () => setOpenCreate(false);

    // Modal xem câu trả lời
    const [openView, setOpenView] = useState(false);
    const [current, setCurrent] = useState(null);

    const accountId = user?._id || user?.id || user?.accountId || null;

    const loadData = async () => {
        try {
            setLoading(true);
            setErr("");
            if (!accountId) throw new Error("Không tìm thấy accountId từ AuthContext. Vui lòng đăng nhập lại.");
            const res = await supportAPI.getByAccount(accountId);
            setItems(res.data?.data || []);
        } catch (e) {
            setErr(e?.response?.data?.message || e?.message || "Không thể tải danh sách hỗ trợ.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (accountId) loadData();
        else {
            setLoading(false);
            setErr("Không tìm thấy accountId từ AuthContext. Vui lòng đăng nhập lại.");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accountId]);

    const sorted = useMemo(() => {
        const arr = [...items];
        if (sortBy === "newest") return arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        if (sortBy === "oldest") return arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        return arr.sort((a, b) => {
            const sa = STATUS_ORDER[a.status] ?? 99;
            const sb = STATUS_ORDER[b.status] ?? 99;
            if (sa !== sb) return sa - sb;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    }, [items, sortBy]);

    // Config Jodit viewer (readonly)
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

    const openAnswerModal = async (id) => {
        try {
            const res = await supportAPI.getById(id); // lấy bản mới nhất có answer
            setCurrent(res.data?.data || null);
            setOpenView(true);
        } catch (e) {
            notifyError(e?.response?.data?.message || "Không lấy được chi tiết yêu cầu.");
        }
    };

    const closeAnswerModal = () => {
        setOpenView(false);
        setCurrent(null);
    };

    const handleMarkClosed = async () => {
        if (!current?._id) return;
        const ok = await showConfirmDialog({
            title: "Đánh dấu đã xử lý?",
            text: "Trạng thái yêu cầu sẽ chuyển sang Closed.",
            icon: "question",
            confirmButtonText: "Xác nhận",
            cancelButtonText: "Hủy",
        });
        if (!ok.isConfirmed) return;
        try {
            await supportAPI.updateStatus(current._id, "closed");
            notifySuccess("Yêu cầu đã được đánh dấu là đã xử lý.");
            closeAnswerModal();
            await loadData();
        } catch (e) {
            notifyError(e?.response?.data?.message || "Cập nhật trạng thái thất bại.");
        }
    };

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc" }}>
            <Box sx={{ maxWidth: 960, mx: "auto", px: 2, py: 3 }}>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" sx={{ mb: 2 }} spacing={2}>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        Yêu cầu hỗ trợ
                    </Typography>

                    <Stack direction="row" spacing={1} alignItems="center">
                        <ToggleButtonGroup exclusive size="small" value={sortBy} onChange={(_, v) => v && setSortBy(v)}>
                            <ToggleButton value="newest">Mới nhất</ToggleButton>
                            <ToggleButton value="oldest">Cũ nhất</ToggleButton>
                            <ToggleButton value="status">Theo trạng thái</ToggleButton>
                        </ToggleButtonGroup>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateModal}>
                            Tạo yêu cầu hỗ trợ
                        </Button>
                    </Stack>
                </Stack>

                {!accountId && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Không tìm thấy accountId từ AuthContext. Vui lòng đăng nhập lại.
                    </Alert>
                )}

                {loading ? (
                    <Box sx={{ textAlign: "center", py: 10 }}>
                        <CircularProgress />
                        <Typography sx={{ mt: 2 }} color="text.secondary">
                            Đang tải danh sách...
                        </Typography>
                    </Box>
                ) : err ? (
                    <Paper sx={{ p: 3, borderRadius: 2, border: "1px solid #e2e8f0", bgcolor: "#fff5f5" }}>
                        <Typography color="error">{err}</Typography>
                    </Paper>
                ) : sorted.length === 0 ? (
                    <Paper sx={{ p: 4, textAlign: "center", borderRadius: 2 }}>
                        <Typography>Chưa có yêu cầu hỗ trợ nào.</Typography>
                        <Button sx={{ mt: 2 }} variant="contained" onClick={openCreateModal}>
                            Tạo yêu cầu hỗ trợ
                        </Button>
                    </Paper>
                ) : (
                    <Stack spacing={2}>
                        {sorted.map((s) => {
                            const colors = STATUS_BG[s.status] || {
                                bg: "#f1f5f9",
                                text: "#0f172a",
                                border: "#e2e8f0",
                                chipColor: "default",
                            };
                            return (
                                <Paper key={s._id} variant="outlined" sx={{ borderColor: colors.border, overflow: "hidden", borderRadius: 2 }}>
                                    {/* Hàng 1: trạng thái + ngày tạo */}
                                    <Box
                                        sx={{
                                            px: 2,
                                            py: 1.25,
                                            bgcolor: colors.bg,
                                            color: colors.text,
                                            borderBottom: `1px solid ${colors.border}`,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1.5,
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <Chip
                                            size="small"
                                            color={colors.chipColor}
                                            label={s.status === "in_progress" ? "In Progress" : (s.status || "").replace("_", " ")}
                                            sx={{ fontWeight: 600 }}
                                        />
                                        <Divider orientation="vertical" flexItem sx={{ borderColor: colors.border }} />
                                        <Typography variant="body2">
                                            Tạo lúc: <b>{new Date(s.createdAt).toLocaleString()}</b>
                                        </Typography>
                                    </Box>

                                    {/* Hàng 2: nội dung + nút xem */}
                                    <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                                        <Box sx={{ flex: 1, pr: 2, "& .jodit-container": { border: "none" }, "& .jodit-wysiwyg": { padding: 0 } }}>
                                            <JoditEditor value={s.request || ""} config={{
                                                readonly: true, toolbar: false, statusbar: false, minHeight: 80
                                            }} onChange={() => { }} />
                                        </Box>

                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<VisibilityIcon />}
                                            onClick={() => openAnswerModal(s._id)}
                                        >
                                            Xem câu trả lời
                                        </Button>
                                    </Box>
                                </Paper>
                            );
                        })}
                    </Stack>
                )}
            </Box>

            {/* Modal tạo yêu cầu */}
            <SupportCreateModal open={openCreate} onClose={closeCreateModal} onSuccess={loadData} />

            {/* Modal xem câu trả lời */}
            <Dialog open={openView} onClose={closeAnswerModal} fullWidth maxWidth="md">
                <DialogTitle sx={{ fontWeight: 600, pr: 6 }}>
                    Chi tiết yêu cầu hỗ trợ
                    <IconButton onClick={closeAnswerModal} size="small" sx={{ position: "absolute", right: 12, top: 12 }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    {current ? (
                        <Stack spacing={3}>
                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                                    Câu hỏi
                                </Typography>
                                <Box sx={{ "& .jodit-container": { border: "1px solid #e5e7eb", borderRadius: 1 }, "& .jodit-wysiwyg": { minHeight: 80 } }}>
                                    <JoditEditor value={current.request || ""} config={{ readonly: true, toolbar: false, statusbar: false, minHeight: 80 }} onChange={() => { }} />
                                </Box>
                            </Box>

                            <Box>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                                    Câu trả lời
                                </Typography>
                                {current.answer ? (
                                    <Box sx={{ "& .jodit-container": { border: "1px solid #e5e7eb", borderRadius: 1 }, "& .jodit-wysiwyg": { minHeight: 80 } }}>
                                        <JoditEditor value={current.answer || ""} config={{ readonly: true, toolbar: false, statusbar: false, minHeight: 80 }} onChange={() => { }} />
                                    </Box>
                                ) : (
                                    <Paper variant="outlined" sx={{ p: 2, bgcolor: "#fffdf0" }}>
                                        <Typography>Chưa có câu trả lời từ bộ phận hỗ trợ.</Typography>
                                    </Paper>
                                )}
                            </Box>
                        </Stack>
                    ) : (
                        <Typography>Đang tải…</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeAnswerModal}>Đóng</Button>
                    <Button
                        variant="contained"
                        onClick={handleMarkClosed}
                        disabled={!current || current.status === "closed" || !current.answer}
                    >
                        Yêu cầu đã được xử lý
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
