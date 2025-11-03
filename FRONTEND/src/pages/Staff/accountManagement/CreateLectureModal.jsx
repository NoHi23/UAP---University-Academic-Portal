import React, { useState, useEffect } from "react";
import {
    TextField,
    MenuItem,
    Button,
    Select,
    FormControl,
    InputLabel,
    CircularProgress,
    LinearProgress,
    ToggleButton,
    ToggleButtonGroup,
    Box,
    Typography,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
} from "@mui/material";
import * as XLSX from 'xlsx';
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import Modal from "../../../components/Modal/Modal";
import staffAPI from "../../../api/staffAPI";
import majorAPI from "../../../api/majorAPI";
import { notifySuccess, notifyError } from "../../../services/notificationService"; // 👈 Thêm dòng này

const CreateLecturerModal = ({ isOpen, onClose, onSuccess }) => {
    const [mode, setMode] = useState("manual"); // "manual" | "excel"
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        citizenID: "",
        gender: "true",
        phone: "",
        majorId: "",
        curriculumId: "",
        lecturerAvatar: "",
        dateOfBirth: "",
    });

    const [file, setFile] = useState(null);
    const [previewRows, setPreviewRows] = useState([]);
    const [previewTransformed, setPreviewTransformed] = useState([]);
    const [majors, setMajors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMajors, setLoadingMajors] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [importProcessed, setImportProcessed] = useState(0);
    const [importTotal, setImportTotal] = useState(0);

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
                console.error("❌ Lỗi khi tải chuyên ngành:", err);
                notifyError("Không thể tải danh sách chuyên ngành!");
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
            setForm((prev) => ({ ...prev, lecturerAvatar: reader.result }));
        reader.readAsDataURL(file);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "citizenID" || name === "phone") {
            const regex = /^[0-9]*$/;
            if (!regex.test(value)) return;
        }
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    // 🚀 Gửi API tạo giảng viên thủ công
    const handleSubmitManual = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...form, gender: form.gender === "true", dateOfBirth: form.dateOfBirth };
            await staffAPI.createLecturerAccount(payload);
            notifySuccess("Tạo giảng viên thành công!");
            onSuccess?.();
            onClose();
        } catch (err) {
            console.error("❌ Lỗi tạo giảng viên:", err);
            notifyError("Tạo giảng viên thất bại!");
        } finally {
            setLoading(false);
        }
    };

    // 📂 Gửi file Excel để import
    const handleSubmitExcel = async () => {
        if (!file && (!previewTransformed || previewTransformed.length === 0)) {
            notifyError("Vui lòng chọn file Excel để tải lên!");
            return;
        }

        setImporting(true);
        setImportProgress(0);
        setImportProcessed(0);
        setImportTotal(0);

        try {
            // prefer sending previewTransformed (parsed client-side)
            let transformed = (previewTransformed && previewTransformed.length > 0) ? previewTransformed : [];
            if (!transformed || transformed.length === 0) {
                const data = await file.arrayBuffer();
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet);
                transformed = (rows || []).map(lecturerTransform).filter(Boolean);
            }

            if (!transformed || transformed.length === 0) {
                notifyError("Không có dòng hợp lệ để import!");
                setImporting(false);
                return;
            }

            const total = transformed.length;
            setImportTotal(total);

            let processed = 0;
            let failed = 0;

            if (total <= 200) {
                // send per-item for smooth progress
                for (let idx = 0; idx < total; idx++) {
                    const item = transformed[idx];
                    try {
                        await staffAPI.importLecturersExcel([item], { dedupe: true });
                        processed += 1;
                    } catch (err) {
                        console.error(`Import lecturer failed for row ${idx}:`, err);
                        failed += 1;
                    }
                    setImportProcessed(processed);
                    setImportProgress(Math.round((processed / total) * 100));
                }
            } else {
                const batchSize = 50;
                for (let i = 0; i < total; i += batchSize) {
                    const batch = transformed.slice(i, i + batchSize);
                    try {
                        await staffAPI.importLecturersExcel(batch, { dedupe: true });
                        processed += batch.length;
                    } catch (err) {
                        console.error('Batch import failed:', err);
                        failed += batch.length;
                    }
                    setImportProcessed(processed);
                    setImportProgress(Math.round((processed / total) * 100));
                }
            }

            if (processed > 0) {
                notifySuccess(`Import hoàn tất: ${processed} / ${total} giảng viên` + (failed ? `, ${failed} lỗi` : ""));
            } else {
                notifyError("Không có giảng viên nào được import. Kiểm tra lại tệp hoặc logs.");
            }

            onSuccess?.();
            onClose();
        } catch (err) {
            console.error("❌ Lỗi nhập Excel:", err);
            notifyError(err?.response?.data?.message || "Nhập giảng viên thất bại!");
        } finally {
            setImporting(false);
            setImportProgress(0);
            setImportProcessed(0);
            setImportTotal(0);
            setLoading(false);
        }
    };

    // Transform row helper (similar to studentTransform)
    const lecturerTransform = (row) => {
        if (!row) return null;
        const rawDob = row['Ngày sinh'] || row.dateOfBirth || row.dob || row.DOB || row.DateOfBirth;
        let dateOfBirth = '';
        try {
            const parsed = XLSX.SSF.parse_date_code(rawDob);
            if (parsed && parsed.y) {
                const dt = new Date(parsed.y, (parsed.m || 1) - 1, parsed.d, parsed.H || 0, parsed.M || 0, parsed.S || 0);
                if (!isNaN(dt.getTime())) dateOfBirth = dt.toISOString();
            } else if (rawDob instanceof Date) dateOfBirth = rawDob.toISOString();
            else if (rawDob) dateOfBirth = String(rawDob).trim();
        } catch (e) {
            dateOfBirth = rawDob ? String(rawDob).trim() : '';
        }

        return {
            firstName: (row['Tên'] || row.firstName || '').trim(),
            lastName: (row['Họ'] || row.lastName || '').trim(),
            citizenID: String(row['CCCD'] || row.citizenID || '').trim(),
            gender: String(row['Giới tính'] || row.gender || 'Nam').toLowerCase().includes('nam'),
            phone: String(row['Số điện thoại'] || row.phone || '').trim(),
            majorId: row['Ngành ID'] || row['Major ID'] || row.majorCode || row.majorId || '',
            curriculumId: row['Khung chương trình ID'] || row['Curriculum ID'] || row.curriculumName || row.curriculumId || '',
            lecturerAvatar: row.lecturerAvatar || row.avatar || '',
            address: row['Địa chỉ'] || row.address || '',
            dateOfBirth,
        };
    };

    // 🧩 Giao diện upload file Excel
    const renderExcelUpload = () => (
        <Box
            sx={{
                border: "2px dashed #94a3b8",
                borderRadius: 3,
                p: 5,
                textAlign: "center",
                backgroundColor: "#f8fafc",
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
                type="file"
                accept=".xls,.xlsx"
                onChange={(e) => {
                    const f = e.target.files[0];
                    if (!f) return;
                    setFile(f);
                    (async () => {
                        try {
                            const data = await f.arrayBuffer();
                            const workbook = XLSX.read(data, { type: 'array' });
                            const sheet = workbook.Sheets[workbook.SheetNames[0]];
                            const rows = XLSX.utils.sheet_to_json(sheet);
                            setPreviewRows(rows.slice(0, 200));
                            const transformed = (rows || []).map(lecturerTransform).filter(Boolean);
                            setPreviewTransformed(transformed.slice(0, 200));
                        } catch (err) {
                            console.error('Error parsing lecturer excel', err);
                            setPreviewRows([]);
                            setPreviewTransformed([]);
                        }
                    })();
                }}
                style={{ display: "none" }}
                id="excel-upload-lecturer"
            />
            <label htmlFor="excel-upload-lecturer">
                <Button
                    variant="contained"
                    component="span"
                    sx={{
                        backgroundColor: "#1e293b",
                        "&:hover": { backgroundColor: "#334155" },
                    }}
                >
                    Chọn tệp
                </Button>
            </label>

            {file && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    📄 {file.name}
                </Typography>
            )}

            {previewTransformed && previewTransformed.length > 0 && (
                <Paper sx={{ mt: 2, p: 1, maxHeight: 300, overflow: 'auto' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Xem trước {previewTransformed.length} dòng. Kiểm tra dữ liệu trước khi nhập.
                    </Typography>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Họ</TableCell>
                                <TableCell>Tên</TableCell>
                                <TableCell>CCCD</TableCell>
                                <TableCell>Giới tính</TableCell>
                                <TableCell>SĐT</TableCell>
                                <TableCell>Ngành</TableCell>
                                <TableCell>Khung chương trình</TableCell>
                                <TableCell>Địa chỉ</TableCell>
                                <TableCell>Ngày sinh</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {previewTransformed.slice(0, 50).map((r, idx) => (
                                <TableRow key={idx}>
                                    <TableCell>{r.lastName}</TableCell>
                                    <TableCell>{r.firstName}</TableCell>
                                    <TableCell>{r.citizenID}</TableCell>
                                    <TableCell>{r.gender ? 'Nam' : 'Nữ'}</TableCell>
                                    <TableCell>{r.phone}</TableCell>
                                    <TableCell>{r.majorId}</TableCell>
                                    <TableCell>{r.curriculumId}</TableCell>
                                    <TableCell>{r.address}</TableCell>
                                    <TableCell>{r.dateOfBirth ? (typeof r.dateOfBirth === 'string' ? r.dateOfBirth : new Date(r.dateOfBirth).toLocaleDateString()) : ''}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Paper>
            )}
            {/* Import progress */}
            {importing && (
                <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        {`Đang nhập... ${importProgress}% (${importProcessed}/${importTotal})`}
                    </Typography>
                    <LinearProgress variant="determinate" value={importProgress} sx={{ height: 10, borderRadius: 2 }} />
                </Box>
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
                disabled={loading || importing}
            >
                {importing ? `Đang nhập... ${importProgress}%` : loading ? "Đang nhập..." : "Nhập giảng viên từ Excel"}
            </Button>
        </Box>
    );

    // 🧩 Form tạo giảng viên thủ công
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
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Thêm giảng viên mới">
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

export default CreateLecturerModal;
