import React, { useState, useEffect } from "react";
import {
    TextField,
    MenuItem,
    Button,
    Select,
    FormControl,
    InputLabel,
    CircularProgress,
} from "@mui/material";
import Modal from "../../../components/Modal/Modal";
import staffAPI from "../../../api/staffAPI";
import majorAPI from "../../../api/majorAPI";

const CreateStudentModal = ({ isOpen, onClose, onSuccess }) => {
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        citizenID: "",
        gender: "true",
        phone: "",
        majorId: "",
        curriculumId: "",
        avatarBase64: "",
    });

    const [majors, setMajors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMajors, setLoadingMajors] = useState(false);

    // 🧩 Lấy danh sách chuyên ngành
    useEffect(() => {
        const fetchMajors = async () => {
            setLoadingMajors(true);
            try {
                const res = await majorAPI.getAll();
                const majorList =
                    res?.data?.data || res?.data || (Array.isArray(res) ? res : []);
                setMajors(majorList);
            } catch (err) {
                console.error("❌ Lỗi khi tải danh sách chuyên ngành:", err);
            } finally {
                setLoadingMajors(false);
            }
        };
        fetchMajors();
    }, []);

    // 🧠 Chuyển file ảnh sang base64
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () =>
            setForm((prev) => ({ ...prev, avatarBase64: reader.result }));
        reader.readAsDataURL(file);
    };

    // 📝 Xử lý nhập liệu & validate
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

        setForm((prev) => ({ ...prev, [name]: value }));
    };

    // 🚀 Gửi API tạo sinh viên
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...form,
                gender: form.gender === "true",
            };

            await staffAPI.createStudentAccount(payload);
            alert("✅ Tạo sinh viên thành công!");
            onSuccess?.();
            onClose();
        } catch (err) {
            console.error("❌ Lỗi tạo sinh viên:", err);
            alert("Tạo sinh viên thất bại!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Thêm sinh viên mới">
            <form onSubmit={handleSubmit} className="create-student-form">
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

                    {/* ✅ Số điện thoại */}
                    <TextField
                        label="Số điện thoại"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        required
                        size="small"
                        helperText={`${form.phone.length}/10 chữ số`}
                    />

                    {/* ✅ Dropdown chuyên ngành */}
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

                    {/* Ảnh đại diện */}
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
        </Modal>
    );
};

export default CreateStudentModal;
