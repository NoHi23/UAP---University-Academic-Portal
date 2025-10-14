// src/pages/support/SupportRequestList.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
    Box,
    Typography,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Chip,
    IconButton,
    Tooltip,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack,
} from "@mui/material";
import ReplyOutlinedIcon from "@mui/icons-material/ReplyOutlined";
import { useNavigate } from "react-router-dom";
import supportAPI, { SUPPORT_STATUS } from "../../../api/supportAPI";

const ORDER_PRIORITY = { open: 0, in_progress: 1, closed: 2 };

const STATUS_CHIP = {
    [SUPPORT_STATUS.OPEN]: { label: "Open", color: "error" },
    [SUPPORT_STATUS.IN_PROGRESS]: { label: "In Progress", color: "warning" },
    [SUPPORT_STATUS.CLOSED]: { label: "Closed", color: "success" },
};

export default function SupportRequestList() {
    const navigate = useNavigate();

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    // Filter theo trạng thái (dropdown)
    const [filterStatus, setFilterStatus] = useState("all"); // all | open | in_progress | closed

    const loadData = async () => {
        try {
            setLoading(true);
            setErr("");
            const res = await supportAPI.getAll(); // yêu cầu role=staff qua BE
            setRows(res.data?.data || []);
        } catch (e) {
            setErr(e?.response?.data?.message || "Không thể tải danh sách hỗ trợ.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Lọc theo status
    const filtered = useMemo(() => {
        if (filterStatus === "all") return rows;
        return rows.filter((r) => r.status === filterStatus);
    }, [rows, filterStatus]);

    // Luôn sắp xếp ưu tiên Open → In Progress → Closed; phụ theo createdAt (mới trước)
    const sorted = useMemo(() => {
        return [...filtered].sort((a, b) => {
            const sa = ORDER_PRIORITY[a.status] ?? 99;
            const sb = ORDER_PRIORITY[b.status] ?? 99;
            if (sa !== sb) return sa - sb;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    }, [filtered]);

    const goToAnswerPage = (id) => {
        navigate(`/staff/support/${id}`);
    };

    const fmtDate = (d) => {
        try {
            return d ? new Date(d).toLocaleString() : "—";
        } catch {
            return "—";
        }
    };

    return (
        <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                Quản lý Support Request
            </Typography>

            {/* Filter theo trạng thái */}
            <Box sx={{ mb: 3 }}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <FormControl size="small" sx={{ minWidth: 220 }}>
                        <InputLabel id="filter-status-label">Lọc theo trạng thái</InputLabel>
                        <Select
                            labelId="filter-status-label"
                            label="Lọc theo trạng thái"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <MenuItem value="all">Tất cả</MenuItem>
                            <MenuItem value="open">Open</MenuItem>
                            <MenuItem value="in_progress">In&nbsp;Progress</MenuItem>
                            <MenuItem value="closed">Closed</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>
            </Box>

            {loading ? (
                <Box sx={{ textAlign: "center", py: 10 }}>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                        Đang tải danh sách yêu cầu hỗ trợ...
                    </Typography>
                </Box>
            ) : err ? (
                <Paper sx={{ p: 3, borderRadius: 2, border: "1px solid #e2e8f0", bgcolor: "#fff5f5" }}>
                    <Typography color="error">{err}</Typography>
                </Paper>
            ) : sorted.length === 0 ? (
                <Paper
                    sx={{
                        p: 5,
                        textAlign: "center",
                        bgcolor: "#f8fafc",
                        borderRadius: 2,
                        border: "1px solid #e2e8f0",
                    }}
                >
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                        Chưa có yêu cầu hỗ trợ nào
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Khi có yêu cầu, hệ thống sẽ hiển thị tại đây.
                    </Typography>
                </Paper>
            ) : (
                <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
                    <Table>
                        <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, width: 120 }}>Request ID</TableCell>
                                <TableCell sx={{ fontWeight: 600, width: 240 }}>Email</TableCell>
                                {/* ✅ Cột mới: Created At */}
                                <TableCell sx={{ fontWeight: 600, width: 210 }}>Tạo lúc</TableCell>
                                <TableCell sx={{ fontWeight: 600, width: 170 }}>Status</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600, width: 120 }}>
                                    Trả lời
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sorted.map((it, idx) => {
                                const id = it._id || it.id;
                                const displayId = idx + 1; // STT bắt đầu từ 1
                                const chip = STATUS_CHIP[it.status] || { label: it.status, color: "default" };
                                return (
                                    <TableRow key={id} hover>
                                        <TableCell sx={{ fontFamily: "ui-monospace, monospace" }}>{displayId}</TableCell>
                                        <TableCell>{it.accountId?.email || "N/A"}</TableCell>
                                        {/* ✅ Hiển thị ngày tạo */}
                                        <TableCell>{fmtDate(it.createdAt)}</TableCell>
                                        <TableCell>
                                            <Chip label={chip.label} color={chip.color} size="small" sx={{ fontWeight: 600 }} />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Mở trang trả lời">
                                                <IconButton color="primary" size="small" onClick={() => goToAnswerPage(id)}>
                                                    <ReplyOutlinedIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </Paper>
            )}
        </Box>
    );
}
