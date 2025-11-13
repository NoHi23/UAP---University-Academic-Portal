import React, { useState, useMemo, useEffect } from "react";
import { Box, Paper, Typography, CircularProgress, Button, Stack, Divider, TextField, MenuItem } from "@mui/material";
import { useNavigate } from "react-router-dom";
import absenceAPI from "../../api/absenceAPI";
import { notifySuccess, notifyError, showConfirmDialog } from "../../services/notificationService";
import JoditEditor from "jodit-react";
export default function RequestAbsenceCreate() {
  const navigate = useNavigate();
  const [semesterId, setSemesterId] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [semesters, setSemesters] = useState([]);

  // Lấy danh sách kỳ học
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const res = await absenceAPI.getSemesters();  // Gọi API lấy danh sách kỳ học
        console.log(res);  // Debug thông tin trả về
        if (res && res.data) {
          setSemesters(res.data);  // Cập nhật danh sách kỳ học
        } else {
          notifyError("Không tải được danh sách kỳ học.");
        }
      } catch (e) {
        console.error("Lỗi khi gọi API:", e);
        notifyError("Không tải được danh sách kỳ học.");
      } finally {
        setLoading(false);  // Dừng loading sau khi có kết quả
      }
    };
    fetchSemesters();
  }, []);




  const onSubmit = async () => {
    if (!semesterId) {
      notifyError("Vui lòng chọn kỳ học.");
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
      await absenceAPI.createRequest({ semesterId, reason }); // POST yêu cầu với semesterId
      notifySuccess("Gửi đơn xin nghỉ học thành công!");
      navigate("/student/absence", { replace: true });
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
        <Typography variant="h5" sx={{ fontWeight: 600 }}>Gửi đơn xin nghỉ học</Typography>
        <Button variant="outlined" onClick={() => navigate(-1)}>Quay lại</Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
        {/* chọn kỳ học */}
        <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>Chọn kỳ học</Typography>
        <TextField
          select
          value={semesterId}
          onChange={(e) => setSemesterId(e.target.value)}
          fullWidth
          size="small"
          sx={{ mb: 2 }}
        >
          <MenuItem value="">-- Chọn kỳ học --</MenuItem>
          {semesters.map((s) => (
            <MenuItem key={s._id} value={s._id}>
              {s.semesterName} ({new Date(s.startDate).toLocaleDateString()} - {new Date(s.endDate).toLocaleDateString()})
            </MenuItem>
          ))}
        </TextField>


        {/* nhập lý do */}
        <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>Lý do xin nghỉ học</Typography>
        <JoditEditor
          value={reason}
          onBlur={(newContent) => setReason(newContent)}
          config={{
            readonly: false,
            minHeight: 220,
            toolbarAdaptive: false,
            placeholder: "Nhập lý do xin nghỉ học...",
            uploader: { insertImageAsBase64URI: true },
          }}
        />

        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button variant="contained" onClick={onSubmit} disabled={submitting}>
            {submitting ? "Đang gửi..." : "Gửi đơn"}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
