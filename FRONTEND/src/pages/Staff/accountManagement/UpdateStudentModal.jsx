import React, { useState, useEffect } from "react";
import {
    TextField,
    MenuItem,
    Button,
    Select,
    FormControl,
    InputLabel,
    CircularProgress,
    ToggleButton,
    ToggleButtonGroup,
    Box,
    Typography,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import Modal from "../../../components/Modal/Modal";
import staffAPI from "../../../api/staffAPI";
import majorAPI from "../../../api/majorAPI";
import { notifySuccess, notifyError } from "../../../services/notificationService";
import { useParams } from "react-router-dom";

const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
const isGmail = (v) => gmailRegex.test((v || "").trim());

const UpdateStudentModal = ({ isOpen, onClose, onSuccess }) => {
    const { studentId } = useParams();  // Get student ID from the URL
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        citizenID: "",
        gender: "true",
        phone: "",
        majorId: "",
        curriculumId: "",
        avatarBase64: "",
        personalEmail: "",
    });
    const [majors, setMajors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMajors, setLoadingMajors] = useState(false);

    // Fetch student data on modal open
    useEffect(() => {
        const fetchStudentData = async () => {
            setLoading(true);
            try {
                const res = await staffAPI.getStudentById(studentId);  // API call to get student data
                const studentData = res?.data || {};

                setForm({
                    firstName: studentData.firstName || "",
                    lastName: studentData.lastName || "",
                    citizenID: studentData.citizenID || "",
                    gender: studentData.gender === true ? "true" : "false",
                    phone: studentData.phone || "",
                    majorId: studentData.majorId || "",
                    curriculumId: studentData.curriculumId || "",
                    personalEmail: studentData.personalEmail || "",
                    avatarBase64: studentData.avatarBase64 || "",
                });
            } catch (err) {
                console.error("❌ Error fetching student data:", err);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            fetchStudentData();
        }
    }, [isOpen, studentId]);

    // Fetch majors list
    useEffect(() => {
        const fetchMajors = async () => {
            setLoadingMajors(true);
            try {
                const res = await majorAPI.getAll();
                const majorList = res?.data?.data || res?.data || (Array.isArray(res) ? res : []);
                setMajors(majorList);
            } catch (err) {
                console.error("❌ Error fetching majors:", err);
            } finally {
                setLoadingMajors(false);
            }
        };
        fetchMajors();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...form,
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                personalEmail: form.personalEmail.trim().toLowerCase(),
                gender: form.gender === "true",
            };
            await staffAPI.updateStudent(studentId, payload);  // API call to update student
            notifySuccess("Cập nhật sinh viên thành công!");
            onSuccess?.();
            onClose();
        } catch (err) {
            console.error("❌ Error updating student:", err);
            notifyError("Cập nhật sinh viên thất bại!");
        } finally {
            setLoading(false);
        }
    };

    // Reset password
    const handleResetPassword = async () => {
        setLoading(true);
        try {
            await staffAPI.resetPassword(studentId);  // API call to reset password
            notifySuccess("Mật khẩu đã được reset và gửi vào email!");
        } catch (err) {
            console.error("❌ Error resetting password:", err);
            notifyError("Reset mật khẩu thất bại!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Cập nhật thông tin sinh viên">
            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                    <TextField
                        label="Họ"
                        name="lastName"
                        value={form.lastName}
                        onChange={handleChange}
                        required
                        size="small"
                    />
                    <TextField
                        label="Tên"
                        name="firstName"
                        value={form.firstName}
                        onChange={handleChange}
                        required
                        size="small"
                    />
                    <TextField
                        label="CCCD"
                        name="citizenID"
                        value={form.citizenID}
                        onChange={handleChange}
                        required
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
                        label="Email cá nhân"
                        name="personalEmail"
                        value={form.personalEmail}
                        onChange={handleChange}
                        required
                        size="small"
                        placeholder="ten@gmail.com"
                        error={!!form.personalEmail && !isGmail(form.personalEmail)}
                        helperText={!!form.personalEmail && !isGmail(form.personalEmail)
                            ? "Chỉ chấp nhận email đuôi @gmail.com"
                            : ""}
                    />

                    <FormControl fullWidth size="small" variant="outlined">
                        <InputLabel id="major-label">Chuyên ngành</InputLabel>
                        <Select
                            labelId="major-label"
                            name="majorId"
                            value={form.majorId}
                            onChange={handleChange}
                            disabled={loadingMajors}
                        >
                            {loadingMajors ? (
                                <MenuItem disabled>
                                    <CircularProgress size={20} sx={{ mr: 1 }} /> Đang tải...
                                </MenuItem>
                            ) : (
                                majors.map((m) => (
                                    <MenuItem key={m._id} value={m._id}>
                                        {m.majorName}
                                    </MenuItem>
                                ))
                            )}
                        </Select>
                    </FormControl>

                    <TextField
                        label="Curriculum ID"
                        name="curriculumId"
                        value={form.curriculumId}
                        onChange={handleChange}
                        required
                        size="small"
                    />

                    <div style={{ gridColumn: "1 / span 2" }}>
                        <label>Ảnh đại diện:</label>
                        <input type="file" accept="image/*" onChange={handleFileChange} />
                        {form.avatarBase64 && (
                            <img
                                src={form.avatarBase64}
                                alt="Preview"
                                style={{
                                    width: 90,
                                    height: 90,
                                    marginTop: 10,
                                    borderRadius: 10,
                                    objectFit: "cover",
                                    border: "2px solid #c8bdb0",
                                }}
                            />
                        )}
                    </div>
                </div>

                <Box sx={{ mt: 2 }}>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={loading}
                        fullWidth
                    >
                        {loading ? "Đang lưu..." : "Cập nhật thông tin"}
                    </Button>
                </Box>
            </form>

            {/* Reset password button */}
            <Box sx={{ mt: 2 }}>
                <Button
                    variant="contained"
                    color="secondary"
                    fullWidth
                    onClick={handleResetPassword}
                    disabled={loading}
                >
                    {loading ? "Đang reset..." : "Reset mật khẩu"}
                </Button>
            </Box>
        </Modal>
    );
};

export default UpdateStudentModal;
