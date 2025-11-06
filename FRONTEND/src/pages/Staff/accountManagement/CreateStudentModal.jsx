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
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import Modal from "../../../components/Modal/Modal";
import staffAPI from "../../../api/staffAPI";
import majorAPI from "../../../api/majorAPI";
import curriculumAPI from "../../../api/curriculumAPI";  // import curriculumAPI
import { notifySuccess, notifyError } from "../../../services/notificationService";
import * as XLSX from "xlsx";

const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
const isGmail = (v) => gmailRegex.test((v || "").trim());



// ===============================
// Transform Excel row → student object
// ===============================
const studentTransform = (row) => {
    if (!row["Họ"] || !row["Tên"] || !row["CCCD"]) return null;

    // Normalize and convert date values: support Excel serials, SheetJS parse_date_code objects, Date objects and ISO strings
    let rawDob = row["Ngày sinh"] || row['ngaysinh'] || row['dob'] || row['DOB'] || row['DateOfBirth'];
    let dateOfBirth = "";
    if (rawDob) {
        try {
            // Try SheetJS parse (works if cell is a number/serialized date)
            const parsed = XLSX.SSF.parse_date_code(rawDob);
            if (parsed && parsed.y) {
                const dt = new Date(parsed.y, (parsed.m || 1) - 1, parsed.d, parsed.H || 0, parsed.M || 0, parsed.S || 0);
                if (!isNaN(dt.getTime())) dateOfBirth = dt.toISOString();
            } else if (rawDob instanceof Date) {
                dateOfBirth = rawDob.toISOString();
            } else {
                // fallback: keep original string (trim)
                dateOfBirth = String(rawDob).trim();
            }
        } catch (e) {
            dateOfBirth = String(rawDob).trim();
        }
    }

    return {
        firstName: (row["Tên"] || "").trim(),
        lastName: (row["Họ"] || "").trim(),
        citizenID: String(row["CCCD"] || row['citizenID'] || row['CMND'] || '').trim(),
        gender: String(row["Giới tính"] || "Nam").toLowerCase().includes("nam"),
        phone: String(row["Số điện thoại"] || row['SĐT'] || row['phone'] || "").trim(),
        majorId: row["Ngành ID"] || row["Major ID"] || row['majorCode'] || row['majorId'] || "",
        curriculumId: row["Khung chương trình ID"] || row["Curriculum ID"] || row['curriculumName'] || row['curriculumId'] || "",
        personalEmail: (row["Email cá nhân"] || row['email'] || "").trim().toLowerCase(),
        address: (row["Địa chỉ"] || row['address'] || "").trim(),
        dateOfBirth,
    };
};

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
        personalEmail: "",
        address: "",
        dateOfBirth: ""
    });
    const [file, setFile] = useState(null);
    const [previewRows, setPreviewRows] = useState([]);
    const [previewTransformed, setPreviewTransformed] = useState([]);
    const [majors, setMajors] = useState([]);
    const [curriculums, setCurriculums] = useState([]);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [importProcessed, setImportProcessed] = useState(0);
    const [importTotal, setImportTotal] = useState(0);
    const [loadingMajors, setLoadingMajors] = useState(false);
    const [loadingCurriculums, setLoadingCurriculums] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Fetch Majors
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

    // Handle File Change (for avatar)
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setForm((prev) => ({ ...prev, avatarBase64: reader.result }));
        reader.readAsDataURL(file);
    };

    // Handle form field changes
    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "citizenID") {
            const regex = /^[0-9]*$/;
            if (!regex.test(value)) return;
            if (value.length > 12) return;
        }

        if (name === "phone") {
            const regex = /^[0-9]*$/;
            if (!regex.test(value)) return;
            if (value.length > 10) return;
        }

        if (name === "personalEmail" && value.length > 100) {
            return;
        }

        setForm((prev) => ({ ...prev, [name]: value }));
    };

    // Submit form manually (without Excel)
    const handleSubmitManual = async (e) => {
        e.preventDefault();

        // Validate gmail format
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
                dateOfBirth: form.dateOfBirth,
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

    // Drag & Drop handlers for Excel
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


    // ===============================
    // Excel upload (new)
    // ===============================
    const handleExcelImport = async (file) => {
        try {
            setImportProgress(0);
            setImportProcessed(0);
            setImportTotal(0);
            setImporting(true);

            // Use previewTransformed if available (user already parsed file and saw preview)
            let transformed = previewTransformed;
            if (!transformed || transformed.length === 0) {
                // Fallback: try parsing file now
                const data = await file.arrayBuffer();
                const workbook = XLSX.read(data, { type: "array" });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet);
                if (!rows || rows.length === 0) {
                    notifyError("File Excel rỗng hoặc không có dữ liệu!");
                    setImporting(false);
                    return;
                }
                transformed = rows.map(studentTransform).filter(Boolean);
            }

            if (transformed.length === 0) {
                notifyError("Không có dòng hợp lệ để import!");
                setImporting(false);
                return;
            }

            const total = transformed.length;
            setImportTotal(total);

            // If total is small, send items one-by-one so UI progress increments smoothly.
            let processed = 0;
            let failed = 0;
            if (total <= 200) {
                for (let idx = 0; idx < total; idx++) {
                    const item = transformed[idx];
                    try {
                        // send single item as array (server expects array rows)
                        await staffAPI.importStudentsExcel([item], { dedupe: true });
                        processed += 1;
                    } catch (err) {
                        console.error(`Import failed for row ${idx}:`, err);
                        failed += 1;
                    }
                    setImportProcessed(processed);
                    setImportProgress(Math.round((processed / total) * 100));
                }
            } else {
                // Send in batches so we can show progress. Adjust batchSize as needed.
                const batchSize = 50;
                for (let i = 0; i < total; i += batchSize) {
                    const batch = transformed.slice(i, i + batchSize);
                    try {
                        await staffAPI.importStudentsExcel(batch, { dedupe: true });
                        processed += batch.length;
                    } catch (err) {
                        // Log and continue with next batch
                        console.error("Batch import failed:", err);
                        failed += batch.length;
                    }
                    setImportProcessed(processed);
                    setImportProgress(Math.round((processed / total) * 100));
                }
            }

            if (processed > 0) {
                notifySuccess(`Import hoàn tất: ${processed} / ${total} sinh viên` + (failed ? `, ${failed} lỗi` : ""));
            } else {
                notifyError("Không có sinh viên nào được import. Kiểm tra lại tệp hoặc logs.");
            }

            onSuccess?.();
            onClose();
        } catch (err) {
            console.error("❌ Lỗi nhập Excel:", err);
            notifyError("Nhập sinh viên thất bại! Kiểm tra lại tệp Excel.");
        } finally {
            setImporting(false);
            setImportProgress(0);
            setImportProcessed(0);
            setImportTotal(0);
            setLoading(false);
        }
    };

    const handleExcelFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
            notifyError("Vui lòng chọn file .xls hoặc .xlsx");
            return;
        }
        setFile(file);
        // parse file for preview
        (async () => {
            try {
                const data = await file.arrayBuffer();
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet);
                setPreviewRows(rows.slice(0, 200));
                const transformed = (rows || []).map(studentTransform).filter(Boolean);
                setPreviewTransformed(transformed.slice(0, 200));
            } catch (err) {
                console.error('Error parsing Excel for preview', err);
                setPreviewRows([]);
                setPreviewTransformed([]);
            }
        })();
    };

    // Render Excel upload section
    const renderExcelUpload = () => (
        <Box
            onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const f = e.dataTransfer.files?.[0];
                if (f) handleExcelFileChange({ target: { files: [f] } });
            }}
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
                Tải nguồn Excel
            </Typography>
            <Typography variant="body2" sx={{ mb: 3 }}>
                Kéo & thả hoặc <strong>chọn tệp</strong> Excel để nhập sinh viên
            </Typography>

            <input
                id="excel-upload"
                type="file"
                accept=".xls,.xlsx"
                style={{ display: "none" }}
                onChange={handleExcelFileChange}
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
            {/* Preview table: show transformed preview before import */}
            {previewTransformed && previewTransformed.length > 0 && (
                <Paper sx={{ mt: 2, p: 1, maxHeight: 300, overflow: 'auto' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Xem trước {previewTransformed.length} dòng (tối đa 200). Kiểm tra dữ liệu, sau đó nhấn "Nhập sinh viên từ Excel" để lưu vào cơ sở dữ liệu.
                    </Typography>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Họ</TableCell>
                                <TableCell>Tên</TableCell>
                                <TableCell>CCCD</TableCell>
                                <TableCell>Giới tính</TableCell>
                                <TableCell>SĐT</TableCell>
                                <TableCell>Ngành (ID/Mã)</TableCell>
                                <TableCell>Khung chương trình</TableCell>
                                <TableCell>Email</TableCell>
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
                                    <TableCell>{String(r.gender).toLowerCase().includes('nam') || r.gender === 1 || r.gender === true ? 'Nam' : 'Nữ'}</TableCell>
                                    <TableCell>{r.phone}</TableCell>
                                    <TableCell>{r.majorId}</TableCell>
                                    <TableCell>{r.curriculumId}</TableCell>
                                    <TableCell>{r.personalEmail}</TableCell>
                                    <TableCell sx={{ maxWidth: 200, wordBreak: 'break-word' }}>{r.address}</TableCell>
                                    <TableCell>{r.dateOfBirth ? (typeof r.dateOfBirth === 'string' ? r.dateOfBirth : (r.dateOfBirth instanceof Date ? new Date(r.dateOfBirth).toLocaleDateString() : JSON.stringify(r.dateOfBirth))) : ''}</TableCell>
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

            <Button
                variant="contained"
                fullWidth
                sx={{
                    mt: 4,
                    backgroundColor: "#2563eb",
                    "&:hover": { backgroundColor: "#1d4ed8" },
                    fontWeight: 600,
                }}
                onClick={() => handleExcelImport(file)}
                disabled={!file || loading || importing}
            >
                {importing ? `Đang nhập... ${importProgress}%` : loading ? "Đang nhập..." : "Nhập sinh viên từ Excel"}
            </Button>
        </Box>
    );

    // Render manual form
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
                                    {c.curriculumName || c.name || c.title || c.curriculumName || "Untitled"}
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
