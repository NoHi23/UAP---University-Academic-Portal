import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import curriculumAPI from "../../api/curriculumAPI"; // Bạn cần tạo API này
import { notifyError, notifySuccess } from "../../services/notificationService";

const CurriculumList = () => {
  const [curriculums, setCurriculums] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm] = useState({ curriculumName: "", majorId: "", totalSemester: "", description: "" });
  const [selected, setSelected] = useState(null);

  const navigate = useNavigate();

  // 🧩 Load danh sách khung chương trình
  const loadCurriculums = async (pageNum = 1) => {
    try {
      const res = await curriculumAPI.getAll({ page: pageNum, limit: 10 });
      setCurriculums(res.data.data);
      setPage(pageNum);
      setPages(res.data.pagination.pages);
    } catch (error) {
      console.error(error);
      notifyError("Không thể tải danh sách khung chương trình");
    }
  };

  useEffect(() => {
    loadCurriculums();
  }, []);

  // 🧩 Handle thay đổi trang
  const handlePageChange = (e, value) => loadCurriculums(value);

  // 🧩 Mở/Đóng dialog
  const handleOpenDialog = (item = null) => {
    setSelected(item);
    if (item) {
      setForm({ curriculumName: item.curriculumName, majorId: item.majorId, totalSemester: item.totalSemester, description: item.description });
    } else {
      setForm({ curriculumName: "", majorId: "", totalSemester: "", description: "" });
    }
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelected(null);
  };

  // 🧩 Handle lưu (tạo mới / cập nhật)
  const handleSave = async () => {
    try {
      if (selected) {
        await curriculumAPI.update(selected._id, form);
        notifySuccess("Cập nhật khung chương trình thành công");
      } else {
        await curriculumAPI.create(form);
        notifySuccess("Tạo khung chương trình thành công");
      }
      handleCloseDialog();
      loadCurriculums(page);
    } catch (error) {
      notifyError("Lưu thông tin thất bại");
    }
  };

  // 🧩 Handle xóa
  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa khung chương trình này?")) {
      try {
        await curriculumAPI.delete(id);
        notifySuccess("Xóa khung chương trình thành công");
        loadCurriculums(page);
      } catch (error) {
        notifyError("Xóa khung chương trình thất bại");
      }
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Quản Lý Khung Chương Trình
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Tạo Khung Chương Trình
        </Button>
      </Box>

      {/* 📋 Bảng danh sách khung chương trình */}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Tên Khung Chương Trình</TableCell>
            <TableCell>Chuyên Ngành</TableCell>
            <TableCell>Tổng Số Kỳ</TableCell>
            <TableCell>Trạng Thái</TableCell>
            <TableCell align="center">Thao Tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {curriculums.map((curriculum) => (
            <TableRow key={curriculum._id}>
              <TableCell>{curriculum.curriculumName}</TableCell>
              <TableCell>{curriculum.majorId}</TableCell>
              <TableCell>{curriculum.totalSemester}</TableCell>
              <TableCell>{curriculum.status}</TableCell>
              <TableCell align="center">
                <Button variant="outlined" color="secondary" startIcon={<Edit />} onClick={() => handleOpenDialog(curriculum)}>
                  Sửa
                </Button>
                <Button variant="outlined" color="error" startIcon={<Delete />} onClick={() => handleDelete(curriculum._id)}>
                  Xóa
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* 📄 Phân trang */}
      <Box display="flex" justifyContent="center" mt={3}>
        <Pagination count={pages} page={page} onChange={handlePageChange} color="primary" />
      </Box>

      {/* 💬 Dialog Tạo/Sửa Khung Chương Trình */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{selected ? "Chỉnh sửa khung chương trình" : "Tạo khung chương trình mới"}</DialogTitle>
        <DialogContent>
          <TextField
            label="Tên Khung Chương Trình"
            fullWidth
            value={form.curriculumName}
            onChange={(e) => setForm({ ...form, curriculumName: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Chuyên Ngành"
            fullWidth
            value={form.majorId}
            onChange={(e) => setForm({ ...form, majorId: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Tổng Số Kỳ"
            fullWidth
            value={form.totalSemester}
            onChange={(e) => setForm({ ...form, totalSemester: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Mô Tả"
            fullWidth
            multiline
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button variant="contained" onClick={handleSave}>Lưu</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default CurriculumList;
