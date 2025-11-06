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
    Pagination,
    Stack,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import staffAPI from "../../../api/staffAPI";
import majorAPI from "../../../api/majorAPI"; // ✅ thêm dòng này
import CreateStudentModal from "./CreateStudentModal";
import UpdateStudentModal from "./UpdateStudentModal"; // Import modal update

export default function StudentAccount() {
    const [students, setStudents] = useState([]);
    const [majors, setMajors] = useState([]);
    const [search, setSearch] = useState("");
    const [filterMajor, setFilterMajor] = useState("");
    const [filterCourse, setFilterCourse] = useState("");
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10); // default 10, allow 15
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState(null); // To store the ID of the student to update

    const handleCreate = () => setIsCreateModalOpen(true);
    const handleCloseCreateModal = () => setIsCreateModalOpen(false);

    const handleUpdate = (studentId) => {
        setSelectedStudentId(studentId); // Set studentId for update
        setIsUpdateModalOpen(true); // Open the update modal
    };
    const handleCloseUpdateModal = () => setIsUpdateModalOpen(false); // Close the update modal

    const reloadStudents = async () => {
        try {
            const res = await staffAPI.listStudents();
            setStudents(res.data.data || []);
        } catch (err) {
            console.error("Lỗi reload danh sách:", err);
        }
    };

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await staffAPI.listStudents();
                setStudents(res.data.data || []);
                console.log("Danh sách sinh viên:", res.data.data);
            } catch (err) {
                console.error("Lỗi khi tải danh sách sinh viên:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, []);

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

    const filteredStudents = students.filter((s) => {
        const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
        const matchesName = fullName.includes(search.toLowerCase());
        const matchesMajor = filterMajor ? s.majorId?.majorName === filterMajor : true;
        const matchesCourse = filterCourse ? s.semester === filterCourse : true;
        const q = (search || "").toLowerCase().trim();
        const matchesCode = (s.studentCode || "").toLowerCase().includes(q);
        return (matchesName || matchesCode) && matchesMajor && matchesCourse;
    });

    // client-side pagination
    const total = filteredStudents.length;
    const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
    const startIndex = (page - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginated = filteredStudents.slice(startIndex, endIndex);

    // reset page when filters/search change
    useEffect(() => {
        setPage(1);
    }, [search, filterMajor, filterCourse, rowsPerPage]);

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
                    placeholder="Tìm kiếm theo tên hoặc mã sinh viên..."
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

            {/* Tổng số / Kết quả lọc */}
            <Box sx={{ mb: 2 }}>
                {(() => {
                    const totalStudents = students.length;
                    const isFiltered = Boolean(search || filterMajor || filterCourse);
                    return isFiltered ? (
                        <Typography variant="subtitle2" color="text.secondary">
                            {`Kết quả: ${filteredStudents.length} sinh viên (trên tổng ${totalStudents})`}
                        </Typography>
                    ) : (
                        <Typography variant="subtitle2" color="text.secondary">
                            {`Tổng số sinh viên: ${totalStudents}`}
                        </Typography>
                    );
                })()}
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
                            {paginated.map((s) => (
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
                                            onClick={() => handleUpdate(s._id)}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {/* Pagination controls */}
                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ p: 2 }}
                    >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <Typography variant="body2">số lượng/ trang:</Typography>
                            <FormControl size="small">
                                <Select
                                    value={rowsPerPage}
                                    onChange={(e) => {
                                        setRowsPerPage(Number(e.target.value));
                                    }}
                                >
                                    <MenuItem value={10}>10</MenuItem>
                                    <MenuItem value={15}>15</MenuItem>
                                </Select>
                            </FormControl>
                            <Typography variant="body2">{`Hiển thị ${Math.min(startIndex + 1, total)}-${Math.min(
                                endIndex,
                                total
                            )} of ${total}`}</Typography>
                        </Box>

                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={(_, value) => setPage(value)}
                            color="primary"
                        />
                    </Stack>
                </Paper>
            )}

            {/* Nút tạo mới */}
            <Tooltip title="Thêm sinh viên mới">
                <Fab
                    color="primary"
                    aria-label="add"
                    onClick={() => setIsCreateModalOpen(true)}
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

            {/* Modals */}
            <CreateStudentModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseCreateModal}
                onSuccess={reloadStudents}
            />
            <UpdateStudentModal
                isOpen={isUpdateModalOpen}
                onClose={handleCloseUpdateModal}
                studentId={selectedStudentId}
                onSuccess={reloadStudents}
            />
        </Box>
    );
}
