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
import * as XLSX from 'xlsx';

export default function CreateLectureImport({ onImported, readOnly }) {
    const [open, setOpen] = useState(false);
    const [lecturers, setLecturers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [majors, setMajors] = useState([]);
    const [curriculums, setCurriculums] = useState([]);

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

    const fetchLecturers = async () => {
        setLoading(true);
        try {
            const res = await staffAPI.listLecturers();
            const data = res.data?.data ?? res.data ?? [];
            setLecturers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setLecturers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLecturers();
    }, []);

    // transform similar to studentTransform, but for lecturers
    const lecturerTransform = (r) => {
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
            personalEmail: mapField(['personalEmail', 'email', 'PersonalEmail', 'Email cá nhân']) || '',
            address: mapField(['address', 'diachi', 'Address', 'Địa chỉ']) || '',
            dateOfBirth: mapField(['dateOfBirth', 'ngaysinh', 'dob', 'DateOfBirth', 'Ngày sinh']) || '',
        };
    };

    // handle import via ExcelImport component (ExcelImport will call staffAPI.importLecturersExcel when model='lecturers')
    // but we keep a fallback handler in case someone calls directly
    const handleExcelImport = async (file) => {
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet);

            if (!rows || rows.length === 0) {
                notifyError('File Excel rỗng hoặc không có dữ liệu!');
                return;
            }

            const transformed = rows.map(lecturerTransform).filter(Boolean);
            if (transformed.length === 0) {
                notifyError('Không có dòng hợp lệ để import!');
                return;
            }

            const res = await staffAPI.importLecturersExcel(transformed, { dedupe: true });
            // Handle partial failures returned by backend
            const inserted = res.data?.insertedCount || 0;
            const failed = res.data?.failed || res.data?.errors || [];
            if (inserted > 0) {
                notifySuccess(`Import thành công ${inserted} giảng viên`);
            }
            if (failed && failed.length > 0) {
                // show first few failures
                const sample = failed.slice(0, 5).map(f => `Row ${f.row ?? f.index ?? '?'}: ${f.error || (Array.isArray(f.errors) ? f.errors.join('; ') : JSON.stringify(f))}`);
                notifyError(`Có ${failed.length} dòng lỗi. Ví dụ: ${sample.join(' | ')}`);
            }
            setOpen(false);
            fetchLecturers();
            if (typeof onImported === 'function') onImported();
        } catch (err) {
            console.error('Import error:', err);
            notifyError(err?.response?.data?.message || 'Import thất bại! Kiểm tra file hoặc dữ liệu trong Excel.');
        }
    };

    return (
        <Box sx={{ mt: 3 }}>
            <Typography variant="h6">Danh sách giảng viên</Typography>

            {!readOnly && (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                    <Button variant="outlined" onClick={() => setOpen(true)}>
                        Import Giảng viên
                    </Button>
                </Box>
            )}

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth>
                <DialogTitle>Import danh sách giảng viên</DialogTitle>
                <DialogContent>
                    <ExcelImport
                        onImported={() => { setOpen(false); fetchLecturers(); onImported?.(); }}
                        model="lecturers"
                        transformRow={lecturerTransform}
                        requiredFields={[
                            'firstName', 'lastName', 'citizenID', 'gender', 'phone',
                            'majorId', 'curriculumId', 'personalEmail', 'address', 'dateOfBirth'
                        ]}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Đóng</Button>
                </DialogActions>
            </Dialog>

            {loading ? (
                <CircularProgress size={20} />
            ) : (
                <Paper sx={{ mt: 1, overflowX: 'auto' }}>
                    {lecturers.length === 0 ? (
                        <Box sx={{ p: 2 }}>Chưa có giảng viên.</Box>
                    ) : (
                        <Table size="small" sx={{ '& .MuiTableCell-root': { borderBottom: '1px solid rgba(224,224,224,1)' } }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Mã GV</TableCell>
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
                                {lecturers.map((s) => (
                                    <TableRow key={s._id} hover>
                                        <TableCell>{s.lecturerCode || s.staffCode || '-'}</TableCell>
                                        <TableCell>{`${s.lastName} ${s.firstName}`}</TableCell>
                                        <TableCell>{s.citizenID}</TableCell>
                                        <TableCell>{s.gender === 1 ? 'Nam' : 'Nữ'}</TableCell>
                                        <TableCell>{s.phone}</TableCell>
                                        <TableCell>{s.major?.majorName || '-'}</TableCell>
                                        <TableCell>{s.curriculum?.curriculumName || '-'}</TableCell>
                                        <TableCell>{s.personalEmail}</TableCell>
                                        <TableCell sx={{ maxWidth: 300, wordBreak: 'break-word' }}>{s.address}</TableCell>
                                        <TableCell>{s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString() : '-'}</TableCell>
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
