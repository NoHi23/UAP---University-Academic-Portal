import React, { useEffect, useState } from "react";
import {
    Box,
    Typography,
    TextField,
    InputAdornment,
    IconButton,
    MenuItem,
    Select,
    FormControl,
    CircularProgress,
    Button,
    InputLabel,
} from "@mui/material";
import Modal from "../../../components/Modal/Modal";
import staffAPI from "../../../api/staffAPI";
import majorAPI from "../../../api/majorAPI";
import { notifySuccess, notifyError } from "../../../services/notificationService";
import { showConfirmDialog } from "../../../services/confirmationService";

const UpdateLectureModal = ({ isOpen, onClose, lecturerId, onSuccess }) => {
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        citizenID: "",
        gender: "true",
        phone: "",
        majorId: "",
        personalEmail: "",
        address: "",
        dateOfBirth: "",
        accountId: "",
    });
    const [majors, setMajors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMajors, setLoadingMajors] = useState(false);

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

    useEffect(() => {
        if (!lecturerId) return;
        const fetchLecturer = async () => {
            try {
                const res = await staffAPI.getLecturerById(lecturerId);
                const l = res.data;
                setForm({
                    firstName: l.firstName || "",
                    lastName: l.lastName || "",
                    citizenID: l.citizenID || "",
                    gender: l.gender ? "true" : "false",
                    phone: l.phone || "",
                    majorId: l.majorId?._id || "",
                    personalEmail: l.account?.personalEmail || "",
                    address: l.address || "",
                    dateOfBirth: l.dateOfBirth ? new Date(l.dateOfBirth).toISOString().slice(0, 10) : "",
                    accountId: l.account?._id || "",
                });
            } catch (err) {
                console.error("❌ Lỗi khi lấy thông tin giảng viên:", err);
            }
        };
        fetchLecturer();
    }, [lecturerId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmitUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                phone: form.phone,
                majorId: form.majorId,
                address: form.address,
                dateOfBirth: form.dateOfBirth,
            };
            await staffAPI.updateLecturer(lecturerId, payload);
            notifySuccess("Cập nhật giảng viên thành công!");
            onSuccess?.();
            onClose();
        } catch (err) {
            console.error("❌ Lỗi cập nhật giảng viên:", err);
            notifyError(err?.response?.data?.message || "Cập nhật giảng viên thất bại!");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        const result = await showConfirmDialog({
            title: "Xác nhận reset mật khẩu",
            text: "Bạn có chắc chắn muốn reset mật khẩu của giảng viên này? Hành động này không thể hoàn tác.",
            icon: "warning",
            confirmButtonText: "Đồng ý reset",
            cancelButtonText: "Hủy",
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
                {loading ? "Đang lưu..." : "Cập nhật giảng viên"}
            </Button>

            <Button
                variant="outlined"
                color="secondary"
                fullWidth
                sx={{ mt: 2, fontWeight: 600 }}
                onClick={handleResetPassword}
            >
                Reset Mật khẩu
            </Button>
        </form>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Cập nhật giảng viên">
            {renderForm()}
        </Modal>
    );
};

export default UpdateLectureModal;
