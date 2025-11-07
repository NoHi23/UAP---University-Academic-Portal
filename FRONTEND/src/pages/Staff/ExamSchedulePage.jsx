import React, { useState, useEffect } from "react";
import { Box, Button, Dialog, DialogContent, DialogTitle, TextField, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { toast } from "react-toastify";
import examScheduleAPI from "../../api/examScheduleAPI";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
export default function ExamSchedulePage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    courseName: "",
    examDate: "",
    time: "",
    room: "",
    note: "",
  });
  const [schedules, setSchedules] = useState([]);
  const [courses, setCourses] = useState([]);
  const [rooms, setRooms] = useState([]);

  // Fetch dữ liệu lịch thi
  const fetchData = async () => {
    try {
      const res = await examScheduleAPI.getAll({ limit: 1000 });
      setSchedules(res.data.data || []);
    } catch {
      toast.error("Không thể tải danh sách lịch thi.");
    }
  };

  // Fetch dữ liệu môn học và phòng thi
  const fetchSelectData = async () => {
    try {
      const [courseRes, roomRes] = await Promise.all([
        examScheduleAPI.getCourses(),
        examScheduleAPI.getRooms(),
      ]);

      // Kiểm tra dữ liệu môn học
      console.log("Courses:", courseRes.data);  // Kiểm tra
      setCourses(courseRes.data || []);
      setRooms(roomRes.data || []);
    } catch {
      toast.error("Không thể tải danh sách môn học hoặc phòng học.");
    }
  };

  useEffect(() => {
    fetchData();       // Lấy danh sách lịch thi
    fetchSelectData(); // Lấy danh sách môn học và phòng thi
  }, []);

  // Xử lý khi gửi form tạo lịch thi
  const handleSubmit = async () => {
    if (!form.courseName || !form.examDate || !form.time || !form.room) {
      toast.error("Vui lòng nhập đủ các trường bắt buộc.");
      return;
    }

    try {
      await examScheduleAPI.create(form);  // Gửi dữ liệu tạo lịch thi
      toast.success("Tạo lịch thi thành công!");
      setOpen(false);
      fetchData();  // Lấy lại danh sách lịch thi mới
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không thể tạo lịch thi!");
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <h2>Quản lý lịch thi</h2>
        <Button variant="contained" onClick={() => setOpen(true)}>Thêm lịch thi</Button>
      </Box>

      {/* Bảng lịch thi */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Môn thi</TableCell>
              <TableCell>Ngày thi</TableCell>
              <TableCell>Giờ thi</TableCell>
              <TableCell>Phòng thi</TableCell>
              <TableCell>Ghi chú</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {schedules.map((s) => (
              <TableRow key={s._id}>
                <TableCell>{s.courseName}</TableCell>
                <TableCell>{new Date(s.examDate).toLocaleDateString()}</TableCell>
                <TableCell>{s.time}</TableCell>
                <TableCell>{s.room}</TableCell>
                <TableCell>{s.note || ""}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Form thêm lịch thi */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tạo lịch thi</DialogTitle>
        <DialogContent>
          {/* Môn thi */}
          <FormControl fullWidth margin="dense">
            <InputLabel>Môn thi</InputLabel>
            <Select
              value={form.courseName}
              onChange={(e) => setForm({ ...form, courseName: e.target.value })}
            >
              {courses.map((course) => (
                <MenuItem key={course.value} value={course.value}>
                  {course.label} {/* Hiển thị môn học */}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Phòng thi */}
          <FormControl fullWidth margin="dense">
            <InputLabel>Phòng thi</InputLabel>
            <Select
              value={form.room}
              onChange={(e) => setForm({ ...form, room: e.target.value })}
            >
              {rooms.map((room) => (
                <MenuItem key={room.value} value={room.value}>
                  {room.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Ngày thi */}
          <TextField
            label="Ngày thi"
            type="date"
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
            value={form.examDate}
            onChange={(e) => setForm({ ...form, examDate: e.target.value })}
          />

          {/* Giờ thi */}
          <TextField
            label="Giờ thi"
            type="time"
            fullWidth
            margin="dense"
            InputLabelProps={{ shrink: true }}
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
          />

          {/* Ghi chú */}
          <TextField
            label="Ghi chú"
            fullWidth
            margin="dense"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />

          <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={handleSubmit}>
            Lưu lịch thi
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
