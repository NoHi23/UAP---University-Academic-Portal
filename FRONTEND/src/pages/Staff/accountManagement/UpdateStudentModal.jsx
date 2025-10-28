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
    Button,
    InputLabel
} from "@mui/material";
import Modal from "../../../components/Modal/Modal";
import staffAPI from "../../../api/staffAPI";
import majorAPI from "../../../api/majorAPI";
import curriculumAPI from "../../../api/curriculumAPI";  // import curriculumAPI
import { notifySuccess, notifyError } from "../../../services/notificationService";
import { showConfirmDialog } from "../../../services/confirmationService";

const UpdateStudentModal = ({ isOpen, onClose, studentId, onSuccess }) => {
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        citizenID: "",
        gender: "true",
        phone: "",
        majorId: "",
        curriculumId: "",
        personalEmail: "",
        address: "",
        dateOfBirth: "", // Added dateOfBirth to form state
    });
    const [majors, setMajors] = useState([]);
    const [curriculums, setCurriculums] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMajors, setLoadingMajors] = useState(false);
    const [loadingCurriculums, setLoadingCurriculums] = useState(false);

    // Fetch Majors
    useEffect(() => {
        const fetchMajors = async () => {
            setLoadingMajors(true);
            try {
                const res = await majorAPI.getAll();
                const majorList = res?.data?.data || res?.data || [];
                setMajors(majorList);
            } catch (err) {
                console.error("❌ Lỗi khi tải danh sách chuyên ngành:", err);
            } finally {
                setLoadingMajors(false);
            }
        };
        fetchMajors();
    }, []);

    // Fetch Curriculum
    useEffect(() => {
        const fetchCurriculums = async () => {
            setLoadingCurriculums(true);
            try {
                const res = await curriculumAPI.getAll();
                const curriculumList = res?.data?.data || res?.data || [];
                setCurriculums(curriculumList);
            } catch (err) {
                console.error("❌ Lỗi khi tải danh sách khung chương trình:", err);
            } finally {
                setLoadingCurriculums(false);
            }
        };
        fetchCurriculums();
    }, []);

    // Fetch Student Data (For Update)
    // Fetch Student Data (For Update)
    useEffect(() => {
        if (studentId) {
            const fetchStudent = async () => {
                try {
                    const res = await staffAPI.getStudentById(studentId);
                    const studentData = res.data;

                    // Set form state with student data including major, personal email and address
                    setForm({
                        firstName: studentData.firstName,
                        lastName: studentData.lastName,
                        citizenID: studentData.citizenID,
                        gender: studentData.gender ? "true" : "false",
                        phone: studentData.phone,
                        majorId: studentData.majorId?._id || "", // Ensure majorId is populated
                        curriculumId: studentData.curriculumId || "",
                        personalEmail: studentData.account?.personalEmail || "", // Retrieve email
                        address: studentData.address || "", // Retrieve address
                        accountId: studentData.account?._id || "", // Save accountId to the form
                        dateOfBirth: studentData.dateOfBirth ? new Date(studentData.dateOfBirth).toISOString().slice(0, 10) : "",
                    });
                } catch (err) {
                    console.error("❌ Lỗi khi lấy thông tin sinh viên:", err);
                }
            };
            fetchStudent();
        }
    }, [studentId]);


    // Handle form field changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    // Submit Update
    const handleSubmitUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Gửi chỉ những trường được phép cập nhật (không gửi citizenID, firstName, ...)
            const payload = {
                phone: form.phone,
                majorId: form.majorId,
                curriculumId: form.curriculumId,
                address: form.address,
                dateOfBirth: form.dateOfBirth
            };
            await staffAPI.updateStudent(studentId, payload);
            notifySuccess("Cập nhật sinh viên thành công!");
            onSuccess?.();
            onClose();
        } catch (err) {
            console.error("❌ Lỗi cập nhật sinh viên:", err);
            notifyError(err?.response?.data?.message || "Cập nhật sinh viên thất bại!");
        } finally {
            setLoading(false);
        }
    };


    // Reset Password with confirmation dialog
    const handleResetPassword = async () => {
        const result = await showConfirmDialog({
            title: "Xác nhận reset mật khẩu",
            text: "Bạn có chắc chắn muốn reset mật khẩu của sinh viên này? Hành động này không thể hoàn tác.",
            icon: "warning",
            confirmButtonText: "Đồng ý reset",
            cancelButtonText: "Hủy"
        });

        if (!result.isConfirmed) return;

        if (!form.accountId) {
            notifyError("Không tìm thấy accountId. Không thể reset mật khẩu!");
            return;
        }
        try {
            await staffAPI.resetPassword(form.accountId, form.personalEmail);
            notifySuccess("Mật khẩu đã được reset thành công!");
        } catch (err) {
            console.error("❌ Lỗi reset mật khẩu:", err);
            notifyError("Reset mật khẩu thất bại!");
        }
    };


    const renderForm = () => (
        <form onSubmit={handleSubmitUpdate} className="create-student-form">
            <div className="form-grid">
                <TextField
                    label="Họ"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                    disabled
                    size="small"
                />
                <TextField
                    label="Tên"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                    disabled
                    size="small"
                />
                <TextField
                    label="CCCD"
                    name="citizenID"
                    value={form.citizenID}
                    onChange={handleChange}
                    required
                    disabled
                    size="small"
                    helperText={`${form.citizenID.length}/12 chữ số`}
                />

                <FormControl fullWidth size="small" variant="outlined">
                    <InputLabel id="gender-label">Giới tính</InputLabel>
                    <Select
                        labelId="gender-label"
                        name="gender"
                        value={form.gender || "true"}
                        label="Giới tính"
                        onChange={handleChange}
                        disabled
                        MenuProps={{
                            disableEnforceFocus: true,
                            disablePortal: true,
                        }}
                    >
                        <MenuItem value="true">Nam</MenuItem>
                        <MenuItem value="false">Nữ</MenuItem>
                    </Select>
                </FormControl>

                <TextField
                    label="Số điện thoại"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    size="small"
                    helperText={`${form.phone.length}/10 chữ số`}
                />

                <TextField
                    label="Ngày sinh"
                    name="dateOfBirth"
                    type="date"
                    value={form.dateOfBirth}
                    onChange={handleChange}
                    required
                    size="small"
                    InputLabelProps={{ shrink: true }}
                />

                {/* Chọn chuyên ngành (Major) */}
                <FormControl fullWidth size="small" variant="outlined">
                    <InputLabel id="major-label">Chuyên ngành</InputLabel>
                    <Select
                        labelId="major-label"
                        name="majorId"
                        value={form.majorId}
                        label="Chuyên ngành"
                        onChange={handleChange}
                        MenuProps={{
                            disableEnforceFocus: true,
                            disablePortal: true,
                        }}
                    >
                        {loadingMajors ? (
                            <MenuItem disabled>
                                <CircularProgress size={20} sx={{ mr: 1 }} /> Đang tải...
                            </MenuItem>
                        ) : majors && majors.length > 0 ? (
                            majors.map((m) => (
                                <MenuItem key={m._id || m.id} value={m._id || m.id}>
                                    {m.name || m.title || m.majorName || "Untitled"}
                                </MenuItem>
                            ))
                        ) : (
                            <MenuItem disabled>Không có dữ liệu</MenuItem>
                        )}
                    </Select>
                </FormControl>

                {/* Email cá nhân (không chỉnh sửa) */}
                <TextField
                    label="Email cá nhân"
                    name="personalEmail"
                    type="email"
                    value={form.personalEmail}
                    onChange={handleChange}
                    required
                    size="small"
                    placeholder="ten@gmail.com"
                    disabled
                />

                {/* Chọn khung chương trình */}
                <FormControl fullWidth size="small" variant="outlined">
                    <InputLabel id="curriculum-label">Khung chương trình</InputLabel>
                    <Select
                        labelId="curriculum-label"
                        name="curriculumId"
                        value={form.curriculumId}
                        label="Khung chương trình"
                        onChange={handleChange}
                        MenuProps={{
                            disableEnforceFocus: true,
                            disablePortal: true,
                        }}
                    >
                        {loadingCurriculums ? (
                            <MenuItem disabled>
                                <CircularProgress size={20} sx={{ mr: 1 }} /> Đang tải...
                            </MenuItem>
                        ) : curriculums.length > 0 ? (
                            curriculums.map((c) => (
                                <MenuItem key={c._id || c.curriculumId || c.id} value={c._id || c.curriculumId || c.id}>
                                    {c.curriculumName || c.name || c.title || "Untitled"}
                                </MenuItem>
                            ))
                        ) : (
                            <MenuItem disabled>Không có dữ liệu</MenuItem>
                        )}
                    </Select>
                </FormControl>

                {/* Thêm địa chỉ */}
                <TextField
                    label="Địa chỉ"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    required
                    size="small"
                    multiline
                    rows={3}
                />
            </div>

            <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                fullWidth
                sx={{
                    mt: 2,
                    backgroundColor: "#282e4e",
                    "&:hover": { backgroundColor: "#3a4168" },
                    fontWeight: 600,
                }}
            >
                {loading ? "Đang lưu..." : "Cập nhật sinh viên"}
            </Button>

            {/* Button reset password */}
            <Button
                variant="outlined"
                color="secondary"
                fullWidth
                sx={{
                    mt: 2,
                    fontWeight: 600,
                }}
                onClick={handleResetPassword}
            >
                Reset Mật khẩu
            </Button>
        </form>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Cập nhật sinh viên">
            {renderForm()}
        </Modal>
    );
};

export default UpdateStudentModal;
