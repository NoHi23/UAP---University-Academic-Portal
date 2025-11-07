import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  TablePagination,
  Chip,
  Stack,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import announcementAPI from "../../api/annoucementAPI";
import { notifyError, notifySuccess } from "../../services/notificationService";
import JoditEditor from "jodit-react";

const STATUS_COLOR = {
  published: { label: "Đã đăng", color: "success" },
  scheduled: { label: "Lên lịch", color: "warning" },
  draft: { label: "Nháp", color: "default" },
};

export default function AnnouncementList() {
  const editor = useRef(null);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [keyword, setKeyword] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  // Form Create
  const [title, setTitle] = useState("");
  const [audience, setAudience] = useState("all");
  const [content, setContent] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  // Dialog xem chi tiết
  const [selected, setSelected] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await announcementAPI.getAll({
        page: page + 1,
        limit,
        status,
        q: keyword,
      });
      setAnnouncements(res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch (e) {
      notifyError(e?.response?.data?.message || "Không tải được danh sách thông báo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page, limit, status]);

  const handleCreate = async () => {
    if (!title.trim() || !content.trim()) {
      return notifyError("Vui lòng nhập đầy đủ tiêu đề và nội dung!");
    }

    try {
      const payload = {
        title,
        content,
        audience,
        scheduledAt: scheduledAt || null,
        status: "published",
      };
      await announcementAPI.create(payload);
      notifySuccess("Tạo thông báo thành công!");
      setShowCreate(false);
      setTitle("");
      setContent("");
      setAudience("all");
      setScheduledAt("");
      load();
    } catch (error) {
      console.error(error);
      notifyError(error?.response?.data?.message || "Không thể tạo thông báo!");
    }
  };

  if (loading)
    return (
      <Box sx={{ textAlign: "center", py: 10 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Đang tải danh sách...</Typography>
      </Box>
    );

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
        📢 Quản Lý Thông Báo
      </Typography>

      {/* === Danh sách === */}
      {!showCreate && (
        <Paper variant="outlined" sx={{ mt: 3, p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">Danh sách thông báo</Typography>
            <Button variant="contained" onClick={() => setShowCreate(true)}>
              + Tạo thông báo
            </Button>
          </Stack>

          {/* Bộ lọc */}
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <TextField
              label="Tìm kiếm"
              size="small"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
            />
            <TextField
              label="Trạng thái"
              size="small"
              select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="">Tất cả</MenuItem>
              <MenuItem value="published">Đã đăng</MenuItem>
              <MenuItem value="scheduled">Lên lịch</MenuItem>
              <MenuItem value="draft">Nháp</MenuItem>
            </TextField>
            <Button variant="contained" onClick={load}>
              Lọc
            </Button>
          </Stack>

          {/* Bảng danh sách */}
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tiêu đề</TableCell>
                <TableCell>Đối tượng</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Ngày tạo</TableCell>
                <TableCell align="center">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {announcements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Không có thông báo nào.
                  </TableCell>
                </TableRow>
              ) : (
                announcements.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>{item.audience || "Tất cả"}</TableCell>
                    <TableCell>
                      <Chip
                        label={
                          STATUS_COLOR[item.status]?.label || "Đã đăng"
                        }
                        color={STATUS_COLOR[item.status]?.color || "success"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString("vi-VN")
                        : "—"}
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => setSelected(item)}
                      >
                        Xem chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={limit}
            onRowsPerPageChange={(e) => {
              setLimit(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 20]}
          />
        </Paper>
      )}

      {/* === Form tạo thông báo === */}
      {showCreate && (
        <Paper variant="outlined" sx={{ mt: 3, p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">📝 Tạo thông báo mới</Typography>
            <Button variant="outlined" color="secondary" onClick={() => setShowCreate(false)}>
              ← Quay lại danh sách
            </Button>
          </Stack>

          <Stack spacing={2}>
            <TextField
              label="Tiêu đề"
              fullWidth
              size="small"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <TextField
              label="Đối tượng nhận"
              select
              fullWidth
              size="small"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            >
              <MenuItem value="all">Tất cả</MenuItem>
              <MenuItem value="student">Sinh viên</MenuItem>
              <MenuItem value="lecturer">Giảng viên</MenuItem>
              <MenuItem value="staff">Nhân viên</MenuItem>
            </TextField>

            <TextField
              label="Lên lịch đăng (tuỳ chọn)"
              type="datetime-local"
              fullWidth
              size="small"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <Typography variant="subtitle1">✍️ Nội dung thông báo:</Typography>
            <JoditEditor
              ref={editor}
              value={content}
              tabIndex={1}
              onBlur={(newContent) => setContent(newContent)}
              config={{
                height: 300,
                placeholder: "Nhập nội dung thông báo tại đây...",
              }}
            />

            <Box sx={{ textAlign: "right", mt: 2 }}>
              <Button variant="contained" color="primary" onClick={handleCreate}>
                Gửi thông báo
              </Button>
            </Box>
          </Stack>
        </Paper>
      )}

      {/* === Popup xem chi tiết === */}
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="md" fullWidth>
        <DialogTitle>{selected?.title}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Đối tượng: {selected?.audience || "Tất cả"} | Người đăng: {selected?.postBy || "—"} |{" "}
            {selected?.createdAt
              ? new Date(selected.createdAt).toLocaleString("vi-VN")
              : "—"}
          </Typography>
          <Box
            sx={{
              "& img": { maxWidth: "100%" },
              "& p": { lineHeight: 1.8 },
            }}
            dangerouslySetInnerHTML={{ __html: selected?.content }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
