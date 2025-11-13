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
  IconButton,
} from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Link } from 'react-router-dom';
import { useNavigate } from "react-router-dom";
import absenceAPI from "../../api/absenceAPI";
import { notifySuccess, notifyError, showConfirmDialog } from "../../services/notificationService";

const STATUS_COLOR = {
  pending: { label: "Chờ duyệt", color: "warning" },
  approved: { label: "Đã duyệt", color: "success" },
  rejected: { label: "Từ chối", color: "error" },
};

export default function RequestAbsenceList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await absenceAPI.getMyAbsences();
        setList(res.data || []);
      } catch (e) {
        notifyError(e?.response?.data?.message || "Không tải được danh sách đơn nghỉ học.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading)
    return (
      <Box sx={{ textAlign: "center", py: 10 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Đang tải danh sách...</Typography>
      </Box>
    );

  return (
    <Box sx={{ position: 'relative' }}>
      <IconButton component={Link} to="/student/dashboard" sx={{ position: 'absolute', top: 12, left: 12 }}>
        <ArrowBackIcon />
      </IconButton>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Danh sách đơn xin nghỉ học
        </Typography>
        <Button variant="contained" onClick={() => navigate("/student/absence/new")}>
          + Gửi đơn mới
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              
              <TableCell>Kỳ học</TableCell>  
              <TableCell>Lý do</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Ngày gửi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Chưa có đơn xin nghỉ nào.
                </TableCell>
              </TableRow>
            ) : (
              list.map((item) => (
                <TableRow key={item._id}>

                  {/* Hiển thị thông tin Kỳ học */}
                  <TableCell>{item.semesterId?.semesterName || "--"}</TableCell> {/* Tên kỳ học */}

                  <TableCell>
                    <div
                      style={{
                        maxWidth: 300,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      dangerouslySetInnerHTML={{ __html: item.reason }}
                    />
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={STATUS_COLOR[item.status]?.label || item.status}
                      color={STATUS_COLOR[item.status]?.color || "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(item.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}

