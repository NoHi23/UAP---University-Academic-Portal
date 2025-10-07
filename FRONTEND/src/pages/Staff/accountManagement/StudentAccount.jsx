import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    TextField,
    InputAdornment,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Paper,
    MenuItem,
    Select,
    FormControl,
    Fab,
    Tooltip,
    CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import staffAPI from "../../../api/staffAPI";
import majorAPI from "../../../api/majorAPI"; // ✅ thêm dòng này
import CreateStudentModal from "./CreateStudentModal";


export default function StudentAccount() {
    const [students, setStudents] = useState([]);
    const [majors, setMajors] = useState([]); // ✅ lưu danh sách chuyên ngành
    const [search, setSearch] = useState("");
    const [filterMajor, setFilterMajor] = useState("");
    const [filterCourse, setFilterCourse] = useState("");
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCreate = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    const reloadStudents = async () => {
        try {
            const res = await staffAPI.listStudents();
            setStudents(res.data.data || []);
        } catch (err) {
            console.error("Lỗi reload danh sách:", err);
        }
    };


    // 🧩 Lấy danh sách sinh viên
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await staffAPI.listStudents();
                setStudents(res.data.data || []); // ✅ Lấy đúng mảng trong res.data.data
                console.log("Danh sách sinh viên:", res.data.data);
            } catch (err) {
                console.error("Lỗi khi tải danh sách sinh viên:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, []);


    // 🎓 Lấy danh sách chuyên ngành từ API
    useEffect(() => {
        const fetchMajors = async () => {
            try {
                const res = await majorAPI.getAll();
                setMajors(res.data || []);
            } catch (err) {
                console.error("Lỗi khi tải danh sách chuyên ngành:", err);
            }
        };
        fetchMajors();
    }, []);

    // 🔍 Lọc dữ liệu
    const filteredStudents = students.filter((s) => {
        const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
        const matchesName = fullName.includes(search.toLowerCase());
        const matchesMajor = filterMajor ? s.majorId?.majorName === filterMajor : true;
        const matchesCourse = filterCourse ? s.semester === filterCourse : true;
        return matchesName && matchesMajor && matchesCourse;
    });

    const handleEdit = (id) => alert("Open Edit Form cho student ID: " + id);

    return (
        <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                Quản lý sinh viên
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Quản lý tài khoản sinh viên: tìm kiếm, lọc và chỉnh sửa thông tin.
            </Typography>

            {/* Bộ lọc */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 2,
                    mb: 3,
                }}
            >
                <TextField
                    placeholder="Tìm kiếm theo tên..."
                    size="small"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ width: 300 }}
                />

                {/* Dropdown chuyên ngành */}
                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <Select
                        displayEmpty
                        value={filterMajor}
                        onChange={(e) => setFilterMajor(e.target.value)}
                    >
                        <MenuItem value="">Chuyên ngành</MenuItem>
                        {majors.map((m) => (
                            <MenuItem key={m._id} value={m.majorName}>
                                {m.majorName}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {/* Bảng danh sách sinh viên */}
            {loading ? (
                <Box sx={{ textAlign: "center", py: 10 }}>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                        Đang tải danh sách sinh viên...
                    </Typography>
                </Box>
            ) : filteredStudents.length === 0 ? (
                <Paper
                    sx={{
                        p: 5,
                        textAlign: "center",
                        bgcolor: "#f8fafc",
                        borderRadius: 2,
                        border: "1px solid #e2e8f0",
                    }}
                >
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                        Không có sinh viên nào
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Hãy thử thay đổi bộ lọc hoặc thêm sinh viên mới bằng nút +
                    </Typography>
                </Paper>
            ) : (
                <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
                    <Table>
                        <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600 }}>Student Code</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Last Name</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>First Name</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Major</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Semester</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>
                                    Action
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredStudents.map((s) => (
                                <TableRow key={s._id}>
                                    <TableCell>{s.studentCode}</TableCell>
                                    <TableCell>{s.lastName}</TableCell>
                                    <TableCell>{s.firstName}</TableCell>
                                    <TableCell>{s.accountId?.email}</TableCell>
                                    <TableCell>{s.majorId?.majorName}</TableCell>
                                    <TableCell>{s.semester || "N/A"}</TableCell>
                                    <TableCell align="center">
                                        <IconButton
                                            color="primary"
                                            size="small"
                                            onClick={() => handleEdit(s._id)}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Paper>
            )}

            {/* Nút tạo mới */}
            <Tooltip title="Thêm sinh viên mới">
                <Fab
                    color="primary"
                    aria-label="add"
                    onClick={handleCreate}
                    sx={{
                        position: "fixed",
                        bottom: 40,
                        right: 40,
                        boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                    }}
                >
                    <AddIcon />
                </Fab>
            </Tooltip>
            <CreateStudentModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSuccess={reloadStudents}
            />
        </Box>
    );
}
