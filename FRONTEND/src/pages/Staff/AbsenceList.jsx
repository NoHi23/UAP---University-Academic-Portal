import React, { useEffect, useState } from "react";
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
  Chip,
  Stack,
  Button,
  TablePagination,
  TextField,
  MenuItem,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import absenceAPI from "../../api/absenceAPI";
import { notifyError } from "../../services/notificationService";

const STATUS_COLOR = {
  pending: { label: "Chờ duyệt", color: "warning" },
  approved: { label: "Đã duyệt", color: "success" },
  rejected: { label: "Từ chối", color: "error" },
};

export default function AbsenceList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [keyword, setKeyword] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const res = await absenceAPI.getAll({
        page: page + 1,
        limit,
        status,
        q: keyword,
      });
      setList(res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch (e) {
      notifyError(e?.response?.data?.message || "Không tải được danh sách đơn xin nghỉ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [page, limit, status]);

  if (loading)
    return (
      <Box sx={{ textAlign: "center", py: 10 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Đang tải danh sách...</Typography>
      </Box>
    );

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Danh sách đơn xin nghỉ học
        </Typography>
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
          <MenuItem value="pending">Chờ duyệt</MenuItem>
          <MenuItem value="approved">Đã duyệt</MenuItem>
          <MenuItem value="rejected">Từ chối</MenuItem>
        </TextField>
        <Button variant="contained" onClick={load}>
          Lọc
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Sinh viên</TableCell>
              <TableCell>Buổi học</TableCell>
              <TableCell>Lý do</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Ngày gửi</TableCell>
              <TableCell align="center">Thao tác</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Không có đơn xin nghỉ nào.
                </TableCell>
              </TableRow>
            ) : (
              list.map((item) => (
                <TableRow key={item._id} hover>
                  <TableCell>
                    {item.studentId
                      ? `${item.studentId.lastName || ""} ${item.studentId.firstName || ""}`
                      : "—"}
                  </TableCell>
                  <TableCell>{item.slotId || "—"}</TableCell>
                  <TableCell>
                    <div
                      style={{
                        maxWidth: 280,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {
                        item.reason
                          ? item.reason
                            // Xóa thẻ HTML
                            .replace(/<[^>]*>/g, "")
                            // Xóa &nbsp; và các entity HTML khác
                            .replace(/&nbsp;/g, " ")
                            .replace(/&[a-z]+;/gi, " ")
                            // Loại bỏ khoảng trắng đầu cuối
                            .trim()
                            // Giới hạn ký tự
                            .substring(0, 100)
                          : "—"
                      }
                    </div>
                  </TableCell>


                  <TableCell>
                    <Chip
                      label={STATUS_COLOR[item.status]?.label || item.status}
                      color={STATUS_COLOR[item.status]?.color || "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(item.createdAt).toLocaleString("vi-VN")}
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => navigate(`/staff/absence/${item._id}`)}
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
    </Box>
  );
}
