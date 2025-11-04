import React, { useEffect, useState } from 'react';
import {
    Box, Button, Paper, Table, TableBody, TableCell,
    TableHead, TableRow, CircularProgress, Typography,
    Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import ExcelImport from './ExcelImport';
import staffAPI from '../../api/staffAPI';
import majorAPI from '../../api/majorAPI';
import curriculumAPI from '../../api/curriculumAPI';
import { notifySuccess, notifyError } from '../../services/notificationService';

export default function CreateStudentImport({ onImported, readOnly }) {
    const [open, setOpen] = useState(false);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [majors, setMajors] = useState([]);
    const [curriculums, setCurriculums] = useState([]);

    // ============================
    // Fetch majors & curriculums
    // ============================
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [majRes, curRes] = await Promise.all([
                    majorAPI.getAll(),
                    curriculumAPI.getAll(),
                ]);
                setMajors(majRes.data?.data || majRes.data || []);
                setCurriculums(curRes.data?.data || curRes.data || []);
            } catch (err) {
                console.error('Error fetching majors/curriculums:', err);
                notifyError('Không thể tải danh sách ngành hoặc khung chương trình');
            }
        };
        fetchData();
    }, []);

    // ============================
    // Fetch students
    // ============================
    const fetchStudents = async () => {
        setLoading(true);
        try {
            const res = await staffAPI.listStudents();
            const data = res.data?.data ?? res.data ?? [];
            setStudents(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setStudents([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    // ============================
    // Transform Excel row → API payload
    // ============================
    const studentTransform = (r) => {
        if (!r || typeof r !== 'object') return null;

        const keys = Object.keys(r);
        const mapField = (names) => {
            for (const n of names) {
                if (Object.prototype.hasOwnProperty.call(r, n)) return r[n];
                const matchKey = keys.find(
                    (k) => String(k).trim().toLowerCase() === String(n).trim().toLowerCase()
                );
                if (matchKey) return r[matchKey];
            }
            return undefined;
        };

        const majorInput = mapField(['major', 'majorName', 'majorCode', 'Mã ngành', 'Ngành']);
        const curriculumInput = mapField(['curriculum', 'curriculumName', 'Tên khung chương trình']);

        const foundMajor =
            majors.find(
                (m) =>
                    String(m.majorCode).toLowerCase() === String(majorInput).toLowerCase() ||
                    String(m.majorName).toLowerCase() === String(majorInput).toLowerCase()
            ) || null;

        const foundCurriculum =
            curriculums.find(
                (c) =>
                    String(c.curriculumName).toLowerCase() === String(curriculumInput).toLowerCase()
            ) || null;

        if (!foundMajor) throw new Error(`Không tìm thấy ngành: ${majorInput}`);
        if (!foundCurriculum) throw new Error(`Không tìm thấy khung chương trình: ${curriculumInput}`);

        return {
            firstName: mapField(['firstName', 'Họ', 'ho_dem', 'FirstName']) || '',
            lastName: mapField(['lastName', 'Tên', 'Ten', 'LastName']) || '',
            citizenID: mapField(['citizenID', 'CCCD', 'cmnd', 'Citizen ID']) || '',
            gender: String(mapField(['gender', 'Giới tính', 'Gender'])).toLowerCase() === 'nam' ? 1 : 0,
            phone: mapField(['phone', 'sdt', 'Phone', 'SĐT']) || '',
            majorId: foundMajor._id,
            curriculumId: foundCurriculum._id,
            personalEmail: mapField(['personalEmail', 'email', 'PersonalEmail']) || '',
            address: mapField(['address', 'diachi', 'Address']) || '',
            dateOfBirth: mapField(['dateOfBirth', 'ngaysinh', 'dob', 'DateOfBirth']) || '',
        };
    };

    // ============================
    // Handle Excel import
    // ============================
    const handleExcelImport = async (file) => {
        try {
            // 1️⃣ Đọc file Excel
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet);

            if (!rows || rows.length === 0) {
                notifyError('File Excel rỗng hoặc không có dữ liệu!');
                return;
            }

            // 2️⃣ Chuyển đổi từng dòng theo logic transform sẵn có
            const transformed = rows.map(studentTransform).filter(Boolean);

            if (transformed.length === 0) {
                notifyError('Không có dòng nào hợp lệ để import!');
                return;
            }

            // 3️⃣ Gọi API mới (backend nhận JSON)
            const res = await staffAPI.importStudentsExcel(transformed, { dedupe: true });

            // 4️⃣ Thông báo kết quả
            notifySuccess(`Import thành công ${res.data.insertedCount || transformed.length} sinh viên`);
            setOpen(false);
            fetchStudents();
            if (typeof onImported === 'function') onImported();
        } catch (err) {
            console.error('Import error:', err);
            notifyError('Import thất bại! Kiểm tra file hoặc dữ liệu trong Excel.');
        }
    };

    // ============================
    // Render UI
    // ============================
    return (
        <Box sx={{ mt: 3 }}>
            <Typography variant="h6">Danh sách sinh viên</Typography>

            {!readOnly && (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                    <Button variant="outlined" onClick={() => setOpen(true)}>
                        Import Sinh viên
                    </Button>
                </Box>
            )}

            {/* Dialog Import */}
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth>
                <DialogTitle>Import danh sách sinh viên</DialogTitle>
                <DialogContent>
                    <ExcelImport
                        onFileSelected={handleExcelImport}
                        model="students"
                        transformRow={studentTransform}
                        requiredFields={[
                            'firstName', 'lastName', 'citizenID', 'gender', 'phone',
                            'majorId', 'curriculumId', 'personalEmail',
                            'address', 'dateOfBirth'
                        ]}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Đóng</Button>
                </DialogActions>
            </Dialog>

            {/* Danh sách sinh viên */}
            {loading ? (
                <CircularProgress size={20} />
            ) : (
                <Paper sx={{ mt: 1, overflowX: 'auto' }}>
                    {students.length === 0 ? (
                        <Box sx={{ p: 2 }}>Chưa có sinh viên.</Box>
                    ) : (
                        <Table
                            size="small"
                            sx={{
                                '& .MuiTableCell-root': { borderBottom: '1px solid rgba(224,224,224,1)' },
                                '& .MuiTableRow-root > .MuiTableCell-root:not(:last-child)': {
                                    borderRight: '1px solid rgba(224,224,224,1)',
                                },
                            }}
                        >
                            <TableHead>
                                <TableRow>
                                    <TableCell>MSSV</TableCell>
                                    <TableCell>Họ tên</TableCell>
                                    <TableCell>CCCD</TableCell>
                                    <TableCell>Giới tính</TableCell>
                                    <TableCell>SĐT</TableCell>
                                    <TableCell>Ngành</TableCell>
                                    <TableCell>Khung chương trình</TableCell>
                                    <TableCell>Email cá nhân</TableCell>
                                    <TableCell>Địa chỉ</TableCell>
                                    <TableCell>Ngày sinh</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {students.map((s) => (
                                    <TableRow key={s._id} hover>
                                        <TableCell>{s.studentCode}</TableCell>
                                        <TableCell>{`${s.lastName} ${s.firstName}`}</TableCell>
                                        <TableCell>{s.citizenID}</TableCell>
                                        <TableCell>{s.gender === 1 ? 'Nam' : 'Nữ'}</TableCell>
                                        <TableCell>{s.phone}</TableCell>
                                        <TableCell>{s.major?.majorName || '-'}</TableCell>
                                        <TableCell>{s.curriculum?.curriculumName || '-'}</TableCell>
                                        <TableCell>{s.personalEmail}</TableCell>
                                        <TableCell sx={{ maxWidth: 300, wordBreak: 'break-word' }}>
                                            {s.address}
                                        </TableCell>
                                        <TableCell>
                                            {s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString() : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Paper>
            )}
        </Box>
    );
}
