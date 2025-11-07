import React, { useEffect, useState } from "react";
import {
  Box, Paper, Typography, Button, TextField, Table, TableHead, TableBody,
  TableRow, TableCell, Pagination, Select, MenuItem, FormControl, InputLabel,
  Chip, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import { Add, Delete, Edit, Search } from "@mui/icons-material";
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

  const [form, setForm] = useState({
    email: "",
    password: "",
    personalEmail: "",
    role: "student",
  });

  const navigate = useNavigate();

  const loadData = async (pageNum = 1, q = "", r = "all") => {
    try {
      const res = await adminAPI.getAll({ page: pageNum, limit: 10, q, role: r });
      setAccounts(res.data.data);
      setPage(pageNum);
      setPages(res.data.pagination.pages);
    } catch {
      notifyError("Không thể tải danh sách tài khoản");
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSearch = () => loadData(1, query, role);
  const handlePageChange = (e, value) => loadData(value, query, role);

  const handleOpenDialog = (item = null) => {
    setSelected(item);
    if (item) {
      setForm({
        email: item.email,
        personalEmail: item.personalEmail,
        role: item.role,
        password: "", // Không cần update password
      });
    } else {
      setForm({ email: "", password: "", personalEmail: "", role: "student" });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelected(null);
  };

  const handleSave = async () => {
    if (!form.personalEmail) {
      notifyError("Email cá nhân không hợp lệ");
      return;
    }

    try {
      if (selected) {
        // CẬP NHẬT (không gửi email/password)
        await adminAPI.update(selected._id, {
          personalEmail: form.personalEmail,
          role: form.role,
        });
        notifySuccess("Cập nhật tài khoản thành công");
      } else {
        // TẠO MỚI (bắt buộc có email + password)
        if (!form.email || !form.password) {
          notifyError("Email và mật khẩu là bắt buộc khi tạo tài khoản.");
          return;
        }
        await adminAPI.create(form);
        notifySuccess("Tạo tài khoản thành công");
      }

      handleCloseDialog();
      loadData(page, query, role);
    } catch (err) {
      notifyError(err.response?.data?.message || "Lưu thông tin thất bại");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa tài khoản này?")) return;
    try {
      await adminAPI.delete(id);
      notifySuccess("Xóa tài khoản thành công");
      loadData(page, query, role);
    } catch {
      notifyError("Xóa tài khoản thất bại");
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await adminAPI.toggleStatus(id);
      notifySuccess(res.data.message);
      loadData(page, query, role);
    } catch {
      notifyError("Cập nhật trạng thái thất bại");
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h5" fontWeight="bold">👤 Quản Lý Tài Khoản</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Tạo tài khoản
        </Button>
      </Box>

      <Stack direction="row" spacing={2} mb={2}>
        <TextField fullWidth label="Tìm kiếm email" size="small" value={query} onChange={(e) => setQuery(e.target.value)} />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Role</InputLabel>
          <Select value={role} label="Role" onChange={(e) => setRole(e.target.value)}>
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="student">Sinh viên</MenuItem>
            <MenuItem value="lecturer">Giảng viên</MenuItem>
            <MenuItem value="staff">Nhân viên</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" startIcon={<Search />} onClick={handleSearch}>
          Lọc
        </Button>
      </Stack>

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
              <TableCell>{acc.role}</TableCell>
              <TableCell>{acc.personalEmail}</TableCell>
              <TableCell>
                <Chip label={acc.status ? "Hoạt động" : "Bị khóa"} color={acc.status ? "success" : "default"} />
              </TableCell>
              <TableCell>
                <Stack direction="row" justifyContent="center" spacing={1}>
                  <Button size="small" color={acc.status ? "error" : "success"} onClick={() => handleToggleStatus(acc._id)}>
                    {acc.status ? "Chặn" : "Mở khóa"}
                  </Button>
                  <Button size="small" startIcon={<Edit />} onClick={() => handleOpenDialog(acc)}>Sửa</Button>
                  <Button size="small" color="error" startIcon={<Delete />} onClick={() => handleDelete(acc._id)}>Xóa</Button>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Box mt={2} display="flex" justifyContent="center">
        <Pagination count={pages} page={page} onChange={handlePageChange} />
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{selected ? "Chỉnh sửa tài khoản" : "Tạo tài khoản mới"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {!selected && (
              <>
                <TextField label="Email (đăng nhập)" fullWidth value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />

                <TextField label="Mật khẩu" type="password" fullWidth value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </>
            )}

            <TextField label="Email cá nhân" fullWidth value={form.personalEmail}
              onChange={(e) => setForm({ ...form, personalEmail: e.target.value })} />

            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select value={form.role} label="Role"
                onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <MenuItem value="student">Sinh viên</MenuItem>
                <MenuItem value="lecturer">Giảng viên</MenuItem>  {/* ✅ sửa đúng */}
                <MenuItem value="staff">Nhân viên</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>

          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog}>Hủy</Button>
          <Button variant="contained" onClick={handleSave}>Lưu</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AdminAccountList;
