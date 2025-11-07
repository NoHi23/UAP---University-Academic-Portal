import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Add,
  Delete,
  Edit,
 
  Search,
} from "@mui/icons-material";
import adminAPI from "../../api/adminAPI";
import { useNavigate } from "react-router-dom";
import { notifyError, notifySuccess } from "../../services/notificationService";

const AdminAccountList = () => {
  const [accounts, setAccounts] = useState([]);
  const [role, setRole] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: "", personalEmail: "", role: "student" });

  const navigate = useNavigate();

  // 🧩 Load danh sách account
  const loadData = async (pageNum = 1, q = "", r = "all") => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const res = await adminAPI.getAll({ page: pageNum, limit: 10, q, role: r });
      setAccounts(res.data.data);
      setPage(pageNum);
      setPages(res.data.pagination.pages);
    } catch (error) {
      console.error(error);
      notifyError("Không thể tải danh sách tài khoản");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = () => loadData(1, query, role);
  const handlePageChange = (e, value) => loadData(value, query, role);

  // 🧩 Dialog: Mở / Đóng
  const handleOpenDialog = (item = null) => {
    setSelected(item);
    if (item) {
      setForm({
        name: item.name || "",
        personalEmail: item.personalEmail || "",
        role: item.role || "student",
      });
    } else {
      setForm({ name: "", personalEmail: "", role: "student" });
    }
    setOpenDialog(true);
  };
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelected(null);
  };

  // 🧩 Lưu tài khoản (tạo mới / cập nhật)
 const handleSave = async () => {
  // Kiểm tra trường personalEmail
  if (!form.personalEmail || form.personalEmail === "undefined") {
    notifyError("Email cá nhân không hợp lệ.");
    return;
  }

  try {
    if (selected) {
      await adminAPI.update(selected._id, form);
      notifySuccess("Cập nhật tài khoản thành công");
    } else {
      await adminAPI.create(form); // Gửi dữ liệu lên backend để tạo tài khoản
      notifySuccess("Tạo tài khoản thành công");
    }
    handleCloseDialog();
    loadData(page, query, role);
  } catch (error) {
    notifyError("Lưu thông tin thất bại");
  }
};


  // 🧩 Xóa tài khoản
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tài khoản này?")) return;
    try {
      await adminAPI.delete(id);
      notifySuccess("Xóa tài khoản thành công");
      loadData(page, query, role);
    } catch (error) {
      notifyError("Xóa tài khoản thất bại");
    }
  };

  
  // 🧩 Chặn / Mở khóa tài khoản
  const handleToggleStatus = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn thay đổi trạng thái tài khoản này?")) return;
    try {
      const res = await adminAPI.toggleStatus(id);
      notifySuccess(res.data.message || "Cập nhật trạng thái thành công");
      loadData(page, query, role);
    } catch (error) {
      notifyError("Cập nhật trạng thái thất bại");
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          👤 Quản Lý Tài Khoản Toàn Hệ Thống
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Tạo tài khoản
        </Button>
      </Box>

      {/* 🔍 Tìm kiếm + Lọc */}
      <Stack direction="row" spacing={2} mb={2}>
        <TextField
          label="Tìm kiếm theo email"
          variant="outlined"
          size="small"
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Role</InputLabel>
          <Select value={role} label="Role" onChange={(e) => setRole(e.target.value)}>
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="student">Sinh viên</MenuItem>
            <MenuItem value="lecturer">Giảng viên</MenuItem>
            <MenuItem value="staff">Nhân viên</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" color="secondary" startIcon={<Search />} onClick={handleSearch}>
          Lọc
        </Button>
      </Stack>

      {/* 📋 Bảng dữ liệu */}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Personal Email</TableCell>
            <TableCell>Trạng thái</TableCell>
            <TableCell align="center">Thao tác</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {accounts.map((acc) => (
            <TableRow key={acc._id}>
              <TableCell>{acc.email}</TableCell>
              <TableCell>
                <Chip
                  label={
                    acc.role === "student"
                      ? "Sinh viên"
                      : acc.role === "lecturer"
                        ? "Giảng viên"
                        : acc.role === "staff"
                          ? "Nhân viên"
                          : "Khác"
                  }
                  color={
                    acc.role === "student"
                      ? "primary"
                      : acc.role === "lecturer"
                        ? "secondary"
                        : "success"
                  }
                  size="small"
                />
              </TableCell>
              <TableCell>{acc.personalEmail}</TableCell>
              <TableCell>
                {acc.status ? (
                  <Chip label="Hoạt động" color="success" size="small" />
                ) : (
                  <Chip label="Bị khóa" color="default" size="small" />
                )}
              </TableCell>
              <TableCell align="center">
                <Stack direction="row" spacing={1} justifyContent="center">
                  <Button
                    variant="outlined"
                    size="small"
                    color={acc.status ? "error" : "success"}
                    onClick={() => handleToggleStatus(acc._id)}
                  >
                    {acc.status ? "Chặn" : "Mở khóa"}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    color="secondary"
                    startIcon={<Edit />}
                    onClick={() => handleOpenDialog(acc)}
                  >
                    Sửa
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => handleDelete(acc._id)}
                  >
                    Xóa
                  </Button>
                 
                </Stack>

              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* 📄 Phân trang */}
      <Box display="flex" justifyContent="center" mt={3}>
        <Pagination count={pages} page={page} onChange={handlePageChange} color="primary" />
      </Box>

      {/* 💬 Dialog Tạo/Sửa */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{selected ? "Chỉnh sửa tài khoản" : "Tạo tài khoản mới"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Email cá nhân"
              fullWidth
              value={form.personalEmail}
              onChange={(e) => setForm({ ...form, personalEmail: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={form.role}
                label="Role"
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <MenuItem value="student">Sinh viên</MenuItem>
                <MenuItem value="lecture">Giảng viên</MenuItem>
                <MenuItem value="staff">Nhân viên</MenuItem>
              </Select>
            </FormControl>


          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button variant="contained" onClick={handleSave}>
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AdminAccountList;
