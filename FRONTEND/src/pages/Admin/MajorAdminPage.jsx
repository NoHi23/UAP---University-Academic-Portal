import React, { useEffect, useState } from "react";
import {
  Box, Button, Dialog, DialogTitle, DialogContent,
  TextField, FormControlLabel, Switch, Table, TableHead,
  TableBody, TableRow, TableCell, TableContainer, Paper,
  Pagination, FormControl, InputLabel, Select, MenuItem
} from "@mui/material";
import { toast } from "react-toastify";
import majorAdminAPI from "../../api/majorAdminAPI";

export default function AdminMajorPage() {
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [current, setCurrent] = useState(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "", "true", "false"
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  const [form, setForm] = useState({
    majorCode: "",
    majorName: "",
    description: "",
    status: true,
  });

  const loadData = async (page = 1) => {
    try {
      const res = await majorAdminAPI.list({
        q,
        page,
        limit: meta.limit || 10,
        status: statusFilter,
      });
      setData(res.data.data || []);
      setMeta(res.data.meta || { page: 1, limit: 10, total: 0, totalPages: 0 });
    } catch (err) {
      toast.error("Không thể tải danh sách chuyên ngành.");
    }
  };

  useEffect(() => {
    loadData(1);
    // eslint-disable-next-line
  }, [q, statusFilter]);

  const openCreate = () => {
    setEditMode(false);
    setCurrent(null);
    setForm({ majorCode: "", majorName: "", description: "", status: true });
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditMode(true);
    setCurrent(row);
    setForm({
      majorCode: row.majorCode || "",
      majorName: row.majorName || "",
      description: row.description || "",
      status: !!row.status,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.majorCode || !form.majorName) {
      toast.error("Vui lòng nhập Mã & Tên chuyên ngành");
      return;
    }
    try {
      if (editMode && current?._id) {
        await majorAdminAPI.update(current._id, form);
        toast.success("Cập nhật thành công");
      } else {
        await majorAdminAPI.create(form);
        toast.success("Tạo chuyên ngành thành công");
      }
      setOpen(false);
      loadData(meta.page || 1);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Lưu thất bại");
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Xác nhận xoá chuyên ngành: ${row.majorCode} - ${row.majorName}?`)) return;
    try {
      await majorAdminAPI.delete(row._id);
      toast.success("Đã xoá");
      loadData(meta.page || 1);
    } catch {
      toast.error("Không thể xoá chuyên ngành");
    }
  };

  const handleToggle = async (row) => {
    try {
      await majorAdminAPI.toggle(row._id);
      loadData(meta.page || 1);
    } catch {
      toast.error("Không thể đổi trạng thái");
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <h2>Quản lý Chuyên ngành</h2>
        <Button variant="contained" onClick={openCreate}>Thêm chuyên ngành</Button>
      </Box>

      {/* Filters */}
      <Box display="flex" gap={2} mb={2}>
        <TextField
          label="Tìm kiếm (Mã/Tên)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{ width: "40%" }}
        />
        {/* Thêm Select để lọc trạng thái */}
        <FormControl sx={{ width: "30%" }}>
          <InputLabel>Trạng thái</InputLabel>
          <Select
            value={statusFilter}
            label="Trạng thái"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">Tất cả</MenuItem>
            <MenuItem value="true">Đang hoạt động</MenuItem>
            <MenuItem value="false">Ngừng</MenuItem>
          </Select>
        </FormControl>
        <Button variant="outlined" onClick={() => { setQ(""); setStatusFilter(""); }}>Xoá lọc</Button>
      </Box>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Mã</TableCell>
              <TableCell>Tên chuyên ngành</TableCell>
              <TableCell>Mô tả</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell width={220}>Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row._id}>
                <TableCell>{row.majorCode}</TableCell>
                <TableCell>{row.majorName}</TableCell>
                <TableCell>{row.description}</TableCell>
                <TableCell>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!!row.status}
                        onChange={() => handleToggle(row)}
                      />
                    }
                    label={row.status ? "Đang hoạt động" : "Ngừng"}
                  />
                </TableCell>
                <TableCell>
                  <Button size="small" onClick={() => openEdit(row)}>Sửa</Button>
                  <Button size="small" color="error" onClick={() => handleDelete(row)}>Xoá</Button>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">Không có dữ liệu</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paging */}
      <Box mt={2} display="flex" justifyContent="center">
        <Pagination
          page={meta.page || 1}
          count={meta.totalPages || 1}
          onChange={(_, p) => loadData(p)}
        />
      </Box>

      {/* Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? "Sửa chuyên ngành" : "Thêm chuyên ngành"}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Mã chuyên ngành"
            fullWidth
            value={form.majorCode}
            onChange={(e) => setForm({ ...form, majorCode: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Tên chuyên ngành"
            fullWidth
            value={form.majorName}
            onChange={(e) => setForm({ ...form, majorName: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Mô tả"
            fullWidth
            multiline
            minRows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.checked })}
              />
            }
            label="Kích hoạt"
          />
          <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={handleSave}>
            Lưu
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
