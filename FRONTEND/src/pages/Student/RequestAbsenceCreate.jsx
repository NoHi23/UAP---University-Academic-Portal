import React, { useState, useMemo, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Stack,
  Divider,
  TextField,
  MenuItem,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import JoditEditor from "jodit-react";
import absenceAPI from "../../api/absenceAPI";
import {
  notifySuccess,
  notifyError,
  showConfirmDialog,
} from "../../services/notificationService";

export default function RequestAbsenceCreate() {
  const navigate = useNavigate();
  const editorRef = useRef(null);

  const [slotId, setSlotId] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Jodit config (soạn nội dung)
  const editorConfig = useMemo(
    () => ({
      readonly: false,
      minHeight: 220,
      toolbarAdaptive: false,
      placeholder: "Nhập lý do xin nghỉ học...",
      uploader: { insertImageAsBase64URI: true },
    }),
    []
  );

  // giả lập danh sách slot học (thực tế bạn fetch từ API /schedules/my-week)
  const mockSlots = [
    { id: "SLOT001", subject: "Lập trình Java", time: "07:30 - 09:50" },
    { id: "SLOT002", subject: "Cơ sở dữ liệu", time: "10:00 - 12:20" },
  ];

  const onSubmit = async () => {
    if (!slotId) {
      notifyError("Vui lòng chọn buổi học muốn xin nghỉ.");
      return;
    }
    if (!reason || !reason.trim()) {
      notifyError("Vui lòng nhập lý do xin nghỉ học.");
      return;
    }

    const ok = await showConfirmDialog({
      title: "Xác nhận gửi đơn xin nghỉ?",
      text: "Đơn sẽ được gửi cho phòng học vụ duyệt.",
      icon: "question",
      confirmButtonText: "Gửi ngay",
      cancelButtonText: "Hủy",
    });
    if (!ok.isConfirmed) return;

    try {
      setSubmitting(true);
      await absenceAPI.createRequest({ slotId, reason }); // POST /api/absence
      notifySuccess("Gửi đơn xin nghỉ học thành công!");
      navigate("/student/absences", { replace: true });
    } catch (e) {
      notifyError(e?.response?.data?.message || "Gửi đơn thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", py: 10 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Đang tải dữ liệu...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Gửi đơn xin nghỉ học
        </Typography>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Quay lại
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        {/* chọn slot */}
        <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
          Chọn buổi học (slot)
        </Typography>
        <TextField
          select
          value={slotId}
          onChange={(e) => setSlotId(e.target.value)}
          fullWidth
          size="small"
          sx={{ mb: 2 }}
        >
          <MenuItem value="">-- Chọn buổi học --</MenuItem>
          {mockSlots.map((s) => (
            <MenuItem key={s.id} value={s.id}>
              {s.subject} ({s.time})
            </MenuItem>
          ))}
        </TextField>

        {/* nhập lý do */}
        <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
          Lý do xin nghỉ học
        </Typography>
        <JoditEditor
          ref={editorRef}
          value={reason}
          config={editorConfig}
          onBlur={(newContent) => setReason(newContent)}
        />

        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button
            variant="contained"
            onClick={onSubmit}
            disabled={submitting}
          >
            {submitting ? "Đang gửi..." : "Gửi đơn"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
