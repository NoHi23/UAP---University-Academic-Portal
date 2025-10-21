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

const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
const isGmail = (v) => gmailRegex.test((v || "").trim());

const CreateStudentModal = ({ isOpen, onClose, onSuccess }) => {
    const [mode, setMode] = useState("manual"); // "manual" | "excel"
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        citizenID: "",
        gender: "true",
        phone: "",
        majorId: "",
        curriculumId: "",
        avatarBase64: "",
        personalEmail: "", // 👈 NEW
    });
    const [file, setFile] = useState(null);
    const [majors, setMajors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMajors, setLoadingMajors] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Lấy danh sách chuyên ngành
    useEffect(() => {
        const fetchMajors = async () => {
            setLoadingMajors(true);
            try {
                const res = await majorAPI.getAll();
                const majorList = res?.data?.data || res?.data || (Array.isArray(res) ? res : []);
                setMajors(majorList);
            } catch (err) {
                console.error("❌ Lỗi khi tải danh sách chuyên ngành:", err);
            } finally {
                setLoadingMajors(false);
            }
        };
        fetchMajors();
    }, []);

    // Đọc file ảnh sang base64
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setForm((prev) => ({ ...prev, avatarBase64: reader.result }));
        reader.readAsDataURL(file);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "citizenID") {
            const regex = /^[0-9]*$/;
            if (!regex.test(value)) return; // chỉ cho phép số
            if (value.length > 12) return; // tối đa 12 số
        }

        if (name === "phone") {
            const regex = /^[0-9]*$/;
            if (!regex.test(value)) return;
            if (value.length > 10) return; // tối đa 10 chữ số
        }

        if (name === "personalEmail" && value.length > 100) {
            return; // tránh quá dài
        }

        setForm((prev) => ({ ...prev, [name]: value }));
    };

    // Gửi API tạo sinh viên thủ công
    const handleSubmitManual = async (e) => {
        e.preventDefault();

        // Validate gmail đuôi @gmail.com
        if (!isGmail(form.personalEmail)) {
            notifyError("Email cá nhân phải có đuôi @gmail.com");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...form,
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                personalEmail: form.personalEmail.trim().toLowerCase(),
                gender: form.gender === "true",
            };
            await staffAPI.createStudentAccount(payload);
            notifySuccess("Tạo sinh viên thành công!");
            onSuccess?.();
            onClose();
        } catch (err) {
            console.error(" Lỗi tạo sinh viên:", err);
            notifyError(err?.response?.data?.message || "Tạo sinh viên thất bại!");
        } finally {
            setLoading(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles && droppedFiles.length > 0) {
            const excelFile = droppedFiles[0];
            if (excelFile.name.endsWith(".xlsx") || excelFile.name.endsWith(".xls")) {
                setFile(excelFile);
            } else {
                notifyError("Vui lòng chỉ chọn tệp .xls hoặc .xlsx");
            }
        }
    };

    // Gửi file Excel để import
    const handleSubmitExcel = async (e) => {
        e.preventDefault();
        if (!file) {
            notifyError("Vui lòng chọn file Excel để tải lên!");
            return;
        }
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            await staffAPI.importStudentsExcel(formData);
            notifySuccess("Nhập sinh viên từ Excel thành công!");
            onSuccess?.();
            onClose();
        } catch (err) {
            console.error("❌ Lỗi nhập Excel:", err);
            notifyError("Nhập sinh viên thất bại!");
        } finally {
            setLoading(false);
        }
    };

    // Giao diện upload file Excel
    const renderExcelUpload = () => (
        <Box
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            sx={{
                border: "2px dashed #94a3b8",
                borderRadius: 3,
                p: 5,
                textAlign: "center",
                backgroundColor: isDragging ? "#eef2ff" : "#f8fafc",
                transition: "background-color .15s ease",
            }}
        >
            <CloudUploadIcon sx={{ fontSize: 60, color: "#64748b" }} />
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                Tải nguồn lên
            </Typography>
            <Typography variant="body2" sx={{ mb: 3 }}>
                Kéo và thả hoặc <strong>chọn tệp</strong> Excel để tải lên
            </Typography>
            <input
                id="excel-upload"
                type="file"
                accept=".xls,.xlsx"
                style={{ display: "none" }}
                onChange={(e) => {
                    if (e.target.files?.[0]) setFile(e.target.files[0]);
                }}
            />
            <Button
                variant="contained"
                onClick={() => document.getElementById("excel-upload").click()}
                sx={{
                    backgroundColor: "#1e293b",
                    "&:hover": { backgroundColor: "#334155" },
                }}
            >
                Chọn tệp
            </Button>
            {file && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    📄 {file.name}
                </Typography>
            )}
            <Typography variant="caption" display="block" sx={{ mt: 3, color: "#64748b" }}>
                Các loại tệp được hỗ trợ: .xls, .xlsx
            </Typography>
            <Button
                variant="contained"
                fullWidth
                sx={{
                    mt: 4,
                    backgroundColor: "#2563eb",
                    "&:hover": { backgroundColor: "#1d4ed8" },
                    fontWeight: 600,
                }}
                onClick={handleSubmitExcel}
                disabled={loading}
            >
                {loading ? "Đang nhập..." : "Nhập sinh viên từ Excel"}
            </Button>
        </Box>
    );

    // Form tạo sinh viên thủ công
    const renderManualForm = () => (
        <form onSubmit={handleSubmitManual} className="create-student-form">
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
                    helperText={`${form.citizenID.length}/12 chữ số`}
                />

                <FormControl fullWidth size="small" variant="outlined">
                    <InputLabel id="gender-label">Giới tính</InputLabel>
                    <Select
                        labelId="gender-label"
                        name="gender"
                        value={form.gender || "true"}
                        label="Giới tính"
                        onChange={(e) =>
                            setForm((prev) => ({
                                ...prev,
                                gender: e.target.value,
                            }))
                        }
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

                {/* NEW: Email cá nhân (chỉ chấp nhận @gmail.com) */}
                <TextField
                    label="Email cá nhân"
                    name="personalEmail"
                    type="email"
                    value={form.personalEmail}
                    onChange={handleChange}
                    required
                    size="small"
                    placeholder="ten@gmail.com"
                    error={!!form.personalEmail && !isGmail(form.personalEmail)}
                    helperText={
                        !!form.personalEmail && !isGmail(form.personalEmail)
                            ? "Chỉ chấp nhận email đuôi @gmail.com"
                            : ""
                    }
                />

                <FormControl fullWidth size="small" variant="outlined">
                    <InputLabel id="major-label">Chuyên ngành</InputLabel>
                    <Select
                        labelId="major-label"
                        name="majorId"
                        value={form.majorId}
                        label="Chuyên ngành"
                        onChange={handleChange}
                        disabled={loadingMajors}
                        MenuProps={{
                            disableEnforceFocus: true,
                            disablePortal: true,
                        }}
                    >
                        {loadingMajors ? (
                            <MenuItem disabled>
                                <CircularProgress size={20} sx={{ mr: 1 }} /> Đang tải...
                            </MenuItem>
                        ) : majors.length > 0 ? (
                            majors.map((m) => (
                                <MenuItem key={m._id} value={m._id}>
                                    {m.majorName}
                                </MenuItem>
                            ))
                        ) : (
                            <MenuItem disabled>Không có dữ liệu</MenuItem>
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
                {loading ? "Đang lưu..." : "Thêm sinh viên"}
            </Button>
        </form>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Thêm sinh viên mới">
            {/* Chọn chế độ */}
            <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
                <ToggleButtonGroup
                    value={mode}
                    exclusive
                    onChange={(e, newMode) => newMode && setMode(newMode)}
                >
                    <ToggleButton value="manual">Thêm thủ công</ToggleButton>
                    <ToggleButton value="excel">Nhập từ Excel</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            {mode === "manual" ? renderManualForm() : renderExcelUpload()}
        </Modal>
    );
};

export default CreateStudentModal;
