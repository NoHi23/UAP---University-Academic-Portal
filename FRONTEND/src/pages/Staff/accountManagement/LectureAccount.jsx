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
import majorAPI from "../../../api/majorAPI";
import CreateLecturerModal from "./CreateLectureModal"; // ✅ modal riêng cho giảng viên

export default function LectureAccount() {
    const [lecturers, setLecturers] = useState([]);
    const [majors, setMajors] = useState([]);
    const [search, setSearch] = useState("");
    const [filterMajor, setFilterMajor] = useState("");
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCreate = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    const reloadLecturers = async () => {
        try {
            const res = await staffAPI.listLecturers();
            setLecturers(res.data.data || []);
        } catch (err) {
            console.error("Lỗi reload danh sách giảng viên:", err);
        }
    };

    //  Lấy danh sách giảng viên
    useEffect(() => {
        const fetchLecturers = async () => {
            try {
                const res = await staffAPI.listLecturers();
                setLecturers(res.data.data || []);
            } catch (err) {
                console.error("Lỗi khi tải danh sách giảng viên:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLecturers();
    }, []);

    // 🎓 Lấy danh sách chuyên ngành
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
    const filteredLecturers = lecturers.filter((l) => {
        const fullName = `${l.firstName} ${l.lastName}`.toLowerCase();
        const matchesName = fullName.includes(search.toLowerCase());
        const matchesMajor = filterMajor ? l.majorId?.majorName === filterMajor : true;
        return matchesName && matchesMajor;
    });

    const handleEdit = (id) => alert("Open Edit Form cho lecturer ID: " + id);

    return (
        <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                Quản lý giảng viên
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Quản lý tài khoản giảng viên: tìm kiếm, lọc và chỉnh sửa thông tin.
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

            {/* Bảng danh sách giảng viên */}
            {loading ? (
                <Box sx={{ textAlign: "center", py: 10 }}>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                        Đang tải danh sách giảng viên...
                    </Typography>
                </Box>
            ) : filteredLecturers.length === 0 ? (
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
                        Không có giảng viên nào
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Hãy thử thay đổi bộ lọc hoặc thêm giảng viên mới bằng nút +
                    </Typography>
                </Paper>
            ) : (
                <Paper sx={{ borderRadius: 2, overflow: "hidden" }}>
                    <Table>
                        <TableHead sx={{ bgcolor: "#f1f5f9" }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600 }}>Lecturer Code</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Last Name</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>First Name</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Major</TableCell>
                                <TableCell align="center" sx={{ fontWeight: 600 }}>
                                    Action
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredLecturers.map((l) => (
                                <TableRow key={l._id}>
                                    <TableCell>{l.lecturerCode}</TableCell>
                                    <TableCell>{l.lastName}</TableCell>
                                    <TableCell>{l.firstName}</TableCell>
                                    <TableCell>{l.accountId?.email}</TableCell>
                                    <TableCell>{l.majorId?.majorName}</TableCell>
                                    <TableCell align="center">
                                        <IconButton
                                            color="primary"
                                            size="small"
                                            onClick={() => handleEdit(l._id)}
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
            <Tooltip title="Thêm giảng viên mới">
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

            <CreateLecturerModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSuccess={reloadLecturers}
            />
        </Box>
    );
}
