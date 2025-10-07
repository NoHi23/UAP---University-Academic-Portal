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

const CreateLecturerModal = ({ isOpen, onClose, onSuccess }) => {
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        gender: "true",
        phone: "",
        majorId: "",
        lecturerAvatar: "",
    });

    const [majors, setMajors] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchMajors = async () => {
            try {
                const res = await majorAPI.getAll();
                setMajors(res.data?.data || res.data || []);
            } catch (err) {
                console.error("❌ Lỗi khi tải chuyên ngành:", err);
            }
        };
        fetchMajors();
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () =>
            setForm((prev) => ({ ...prev, lecturerAvatar: reader.result }));
        reader.readAsDataURL(file);
    };

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
                gender: form.gender === "true",
            };
            await staffAPI.createLecturerAccount(payload);
            alert("✅ Tạo giảng viên thành công!");
            onSuccess?.();
            onClose();
        } catch (err) {
            console.error("❌ Lỗi tạo giảng viên:", err);
            alert("Tạo giảng viên thất bại!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Thêm giảng viên mới">
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
                    <FormControl fullWidth size="small">
                        <InputLabel>Giới tính</InputLabel>
                        <Select
                            name="gender"
                            value={form.gender}
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

                    <FormControl fullWidth size="small">
                        <InputLabel>Chuyên ngành</InputLabel>
                        <Select
                            name="majorId"
                            value={form.majorId}
                            label="Chuyên ngành"
                            onChange={handleChange}
                        >
                            {majors.map((m) => (
                                <MenuItem key={m._id} value={m._id}>
                                    {m.majorName}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <div style={{ gridColumn: "1 / span 2" }}>
                        <label>Ảnh đại diện:</label>
                        <input type="file" accept="image/*" onChange={handleFileChange} />
                        {form.lecturerAvatar && (
                            <img
                                src={form.lecturerAvatar}
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
                    {loading ? "Đang lưu..." : "Thêm giảng viên"}
                </Button>
            </form>
        </Modal>
    );
};

export default CreateLecturerModal;
