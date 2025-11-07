import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";
import { toast } from "react-toastify";
import examScheduleAPI from "../../api/examScheduleAPI";

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from "@mui/material";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ExamSchedulePage() {

  /** ----------------------- STATE ------------------------ */
  const [open, setOpen] = useState(false);          // Modal Add / Edit
  const [openDetail, setOpenDetail] = useState(false); // Modal Detail

  const [detailData, setDetailData] = useState(null);

  const [form, setForm] = useState({
    courseName: "",
    examDate: "",
    time: "",
    room: "",
    note: ""
  });

  const [schedules, setSchedules] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [courses, setCourses] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [editMode, setEditMode] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState(null);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [filterRoom, setFilterRoom] = useState("");
  const [filterDate, setFilterDate] = useState("");


  /** ----------------------- API CALLS ------------------------ */
  const fetchData = async () => {
    try {
      const res = await examScheduleAPI.getAll({ limit: 1000 });
      setSchedules(res.data.data || []);
      setFiltered(res.data.data || []);
    } catch {
      toast.error("Không thể tải danh sách lịch thi.");
    }
  };

  const fetchSelectData = async () => {
    try {
      const [courseRes, roomRes] = await Promise.all([
        examScheduleAPI.getCourses(),
        examScheduleAPI.getRooms()
      ]);

      setCourses(courseRes.data || []);
      setRooms(roomRes.data || []);
    } catch {
      toast.error("Không thể tải danh sách môn học hoặc phòng học.");
    }
  };

  useEffect(() => {
    fetchData();
    fetchSelectData();
  }, []);


  /** ----------------------- SEARCH + FILTER ------------------------ */
  useEffect(() => {
    let list = [...schedules];

    if (search.trim() !== "") {
      list = list.filter(s => s.courseName.toLowerCase().includes(search.toLowerCase()));
    }

    if (filterCourse !== "") list = list.filter(s => s.courseName === filterCourse);
    if (filterRoom !== "") list = list.filter(s => s.room === filterRoom);
    if (filterDate !== "") list = list.filter(s => s.examDate.split("T")[0] === filterDate);

    setFiltered(list);
  }, [search, filterCourse, filterRoom, filterDate, schedules]);


  /** ----------------------- CRUD HANDLERS ------------------------ */

  const handleSubmit = async () => {
    if (!form.courseName || !form.examDate || !form.time || !form.room) {
      toast.error("Vui lòng nhập đủ các trường bắt buộc.");
      return;
    }

    try {
      if (editMode) {
        await examScheduleAPI.update(currentSchedule._id, form);
        toast.success("Cập nhật lịch thi thành công!");
      } else {
        await examScheduleAPI.create(form);
        toast.success("Tạo lịch thi thành công!");
      }

      setOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Không thể tạo hoặc cập nhật lịch thi!");
    }
  };

  const handleDelete = async (id) => {
    try {
      await examScheduleAPI.delete(id);
      toast.success("Xóa lịch thi thành công!");
      fetchData();
    } catch {
      toast.error("Không thể xóa lịch thi.");
    }
  };

  const handleViewDetails = async (id) => {
    try {
      const res = await examScheduleAPI.getById(id);
      setDetailData(res.data);
      setOpenDetail(true);
    } catch {
      toast.error("Không thể tải chi tiết lịch thi.");
    }
  };


  /** ----------------------- EXPORT & COPY ------------------------ */

  const handleCopyStudentList = (students) => {
    navigator.clipboard.writeText(
      students.map((s, i) => `${i + 1}. ${s.studentCode} - ${s.name}`).join("\n")
    );
    toast.success("Đã copy danh sách!");
  };

  const handleExportExcel = (students) => {
    const data = students.map(s => ({ "Mã SV": s.studentCode, "Tên": s.name }));
    const sheet = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, "Students");

    saveAs(new Blob([XLSX.write(wb, { type: "array", bookType: "xlsx" })]), "DanhSachSinhVien.xlsx");
  };

  const handleExportPDF = (students) => {
    const doc = new jsPDF();
    doc.text("Danh sách sinh viên", 14, 15);

    autoTable(doc, {
      startY: 20,
      head: [["Mã SV", "Tên"]],
      body: students.map(s => [s.studentCode, s.name]),
    });

    doc.save("DanhSachSinhVien.pdf");
  };


  /** ----------------------- RENDER ------------------------ */
  return (
    <Box>

      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <h2>Quản lý lịch thi</h2>
        <Button
          variant="contained"
          onClick={() => {
            setEditMode(false);
            setForm({ courseName: "", examDate: "", time: "", room: "", note: "" });
            setOpen(true);
          }}
        >
          Thêm lịch thi
        </Button>
      </Box>

      {/* SEARCH + FILTER */}
      <Box display="flex" gap={2} mb={3}>
        <FormControl sx={{ width: "20%" }}>
          <InputLabel>Môn thi</InputLabel>
          <Select value={filterCourse} label="Môn thi" onChange={(e) => setFilterCourse(e.target.value)}>
            <MenuItem value="">Tất cả</MenuItem>
            {courses.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl sx={{ width: "20%" }}>
          <InputLabel>Phòng thi</InputLabel>
          <Select value={filterRoom} label="Phòng thi" onChange={(e) => setFilterRoom(e.target.value)}>
            <MenuItem value="">Tất cả</MenuItem>
            {rooms.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
          </Select>
        </FormControl>

        <TextField
          label="Ngày thi"
          type="date"
          sx={{ width: "20%" }}
          InputLabelProps={{ shrink: true }}
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />

        <TextField
          label="Tìm kiếm môn thi"
          sx={{ width: "30%" }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Box>


      {/* BẢNG LỊCH THI */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Môn thi</TableCell>
              <TableCell>Ngày thi</TableCell>
              <TableCell>Giờ thi</TableCell>
              <TableCell>Phòng thi</TableCell>
              <TableCell>Ghi chú</TableCell>
              <TableCell>Hành động</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s._id}>
                <TableCell>{s.courseName}</TableCell>
                <TableCell>{new Date(s.examDate).toLocaleDateString()}</TableCell>
                <TableCell>{s.time}</TableCell>
                <TableCell>{s.room}</TableCell>
                <TableCell>{s.note}</TableCell>
                <TableCell>
                  <Button onClick={() => handleViewDetails(s._id)}>XEM</Button>

                  <Button
                    onClick={() => {
                      setCurrentSchedule(s);
                      setForm({
                        courseName: s.courseName,
                        examDate: s.examDate.split("T")[0],
                        time: s.time,
                        room: s.room,
                        note: s.note
                      });
                      setEditMode(true);
                      setOpen(true);
                    }}
                  >
                    SỬA
                  </Button>

                  <Button onClick={() => handleDelete(s._id)}>XÓA</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>

        </Table>
      </TableContainer>



      {/* FORM ADD / EDIT */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? "Sửa lịch thi" : "Tạo lịch thi"}</DialogTitle>
        <DialogContent>

          <FormControl fullWidth margin="dense">
            <InputLabel>Môn thi</InputLabel>
            <Select
              value={form.courseName}
              label="Môn thi"
              onChange={(e) => setForm({ ...form, courseName: e.target.value })}
            >
              {courses.map((course) => (
                <MenuItem key={course.value} value={course.value}>
                  {course.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="dense">
            <InputLabel>Phòng thi</InputLabel>
            <Select
              value={form.room}
              label="Phòng thi"
              onChange={(e) => setForm({ ...form, room: e.target.value })}
            >
              {rooms.map((room) => (
                <MenuItem key={room.value} value={room.value}>
                  {room.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            margin="dense"
            label="Ngày thi"
            fullWidth
            type="date"
            InputLabelProps={{ shrink: true }}
            value={form.examDate}
            onChange={(e) => setForm({ ...form, examDate: e.target.value })}
          />

          <TextField
            margin="dense"
            label="Giờ thi"
            fullWidth
            type="time"
            InputLabelProps={{ shrink: true }}
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
          />

          <TextField
            margin="dense"
            label="Ghi chú"
            fullWidth
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />

          <Button variant="contained" fullWidth sx={{ mt: 2 }} onClick={handleSubmit}>
            Lưu lịch thi
          </Button>
        </DialogContent>
      </Dialog>



      {/* MODAL DETAIL */}
      <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="md" fullWidth>
        <DialogTitle>Chi tiết lịch thi</DialogTitle>
        <DialogContent>
          {detailData && (
            <>
              <p><b>Môn:</b> {detailData.exam.courseName}</p>
              <p><b>Phòng:</b> {detailData.exam.room}</p>
              <p><b>Ngày:</b> {new Date(detailData.exam.examDate).toLocaleDateString()}</p>
              <p><b>Giờ:</b> {detailData.exam.time}</p>

              <h4>Danh sách sinh viên</h4>

              <Box display="flex" gap={2} mb={2}>
                <Button variant="outlined" onClick={() => handleCopyStudentList(detailData.students)}>📋 Copy</Button>
                <Button variant="contained" color="success" onClick={() => handleExportExcel(detailData.students)}>📥 Excel</Button>
                <Button variant="contained" color="error" onClick={() => handleExportPDF(detailData.students)}>📄 PDF</Button>
              </Box>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Mã SV</TableCell>
                      <TableCell>Tên</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detailData.students.map((sv) => (
                      <TableRow key={sv._id}>
                        <TableCell>{sv.studentCode}</TableCell>
                        <TableCell>{sv.name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
      </Dialog>

    </Box>
  );
}
