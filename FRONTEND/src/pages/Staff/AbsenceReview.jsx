import React, { useState, useEffect, useMemo, useRef } from "react";
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
import absenceAPI from "../../api/absenceAPI";
import {
  notifySuccess,
  notifyError,
  showConfirmDialog,
} from "../../services/notificationService";

export default function AbsenceReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editor = useRef(null);

  const [loading, setLoading] = useState(true);
  const [absence, setAbsence] = useState(null);
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const editorConfig = useMemo(
    () => ({
      readonly: false,
      height: 250,
      placeholder: "Nhập nội dung phản hồi...",
      uploader: { insertImageAsBase64URI: true },
      toolbarAdaptive: false,
    }),
    []
  );

  useEffect(() => {
    const loadAbsence = async () => {
      try {
        const res = await absenceAPI.getById(id);
        setAbsence(res.data);
      } catch (e) {
        notifyError("Không tải được thông tin đơn xin nghỉ.");
      } finally {
        setLoading(false);
      }
    };
    loadAbsence();
  }, [id]);

  const handleReview = async (status) => {
    const confirm = await showConfirmDialog({
      title: status === "approved" ? "Duyệt đơn?" : "Từ chối đơn?",
      text:
        status === "approved"
          ? "Xác nhận duyệt đơn xin nghỉ học này?"
          : "Bạn chắc chắn muốn từ chối đơn này?",
      icon: status === "approved" ? "success" : "warning",
      confirmButtonText: status === "approved" ? "Duyệt" : "Từ chối",
      cancelButtonText: "Hủy",
    });
    if (!confirm.isConfirmed) return;

    try {
      setSubmitting(true);
      await absenceAPI.review(id, status);
      notifySuccess(
        status === "approved"
          ? "Đơn xin nghỉ học đã được duyệt."
          : "Đơn xin nghỉ học đã bị từ chối."
      );
      navigate("/staff/absence", { replace: true });
    } catch (e) {
      notifyError("Không thể cập nhật trạng thái đơn.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <Box sx={{ textAlign: "center", py: 10 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Đang tải thông tin đơn...</Typography>
      </Box>
    );

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Duyệt đơn xin nghỉ học
        </Typography>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Quay lại
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          <strong>Sinh viên:</strong>{" "}
          {absence?.studentId?.fullName || "(chưa có thông tin)"}
        </Typography>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          <strong>Buổi học:</strong>{" "}
          {absence?.slotId || "(Mã buổi học không xác định)"}
        </Typography>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          <strong>Trạng thái hiện tại:</strong>{" "}
          <span
            style={{
              color:
                absence?.status === "approved"
                  ? "green"
                  : absence?.status === "rejected"
                  ? "red"
                  : "#f5a623",
            }}
          >
            {absence?.status === "pending"
              ? "Chờ duyệt"
              : absence?.status === "approved"
              ? "Đã duyệt"
              : "Từ chối"}
          </span>
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Nội dung đơn
        </Typography>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mb: 3,
            minHeight: 100,
            backgroundColor: "#fafafa",
          }}
        >
          <div
            dangerouslySetInnerHTML={{ __html: absence?.reason }}
            style={{ color: "#333" }}
          />
        </Paper>

        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Phản hồi của phòng học vụ
        </Typography>
        <JoditEditor
          ref={editor}
          value={reply}
          config={editorConfig}
          onBlur={(newContent) => setReply(newContent)}
        />

        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
          <Button
            variant="outlined"
            color="error"
            disabled={submitting}
            onClick={() => handleReview("rejected")}
          >
            Từ chối
          </Button>
          <Button
            variant="contained"
            color="success"
            disabled={submitting}
            onClick={() => handleReview("approved")}
          >
            Duyệt đơn
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
