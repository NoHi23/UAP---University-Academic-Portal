import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Box, Typography, Grid, Paper, Divider, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { useParams } from 'react-router-dom';

const CurriculumDetailsPage = () => {
    const { id } = useParams();
    const [curriculum, setCurriculum] = useState(null);
    const [details, setDetails] = useState([]);
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await api.get(`curriculums/${id}/details`);
                setCurriculum(res.data.curriculum || null);
                setDetails(res.data.details || []);
                // fetch student's grades as well
                try {
                    const gRes = await api.get('student/grades');
                    setGrades(gRes.data.grades || []);
                } catch (gErr) {
                    // non-fatal
                    console.warn('Could not fetch grades', gErr);
                    setGrades([]);
                }
            } catch (err) {
                console.error('Failed to load curriculum details', err);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetch();
    }, [id]);

    const groupedBySemester = details.reduce((acc, d) => {
        const sem = d.semester || 0;
        if (!acc[sem]) acc[sem] = [];
        acc[sem].push(d);
        return acc;
    }, {});

    const [openJson, setOpenJson] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);

    const handleOpenJson = (detail) => {
        setSelectedDetail(detail);
        setOpenJson(true);
    };

    const handleCloseJson = () => {
        setOpenJson(false);
        setSelectedDetail(null);
    };

    return (
        <Box sx={{ p: 3 }}>
            {loading ? (
                <Typography>Đang tải...</Typography>
            ) : (
                <>
                    <Typography variant="h4" gutterBottom>{curriculum?.curriculumName || 'Chương trình'}</Typography>
                    <Typography variant="subtitle1" color="text.secondary">{curriculum?.major} · {curriculum?.totalSemester} kỳ</Typography>
                    <Typography sx={{ mt: 2 }}>{curriculum?.description}</Typography>

                    <Divider sx={{ my: 2 }} />

                    {Object.keys(groupedBySemester).sort((a, b) => a - b).map((sem) => (
                        <Box key={sem} sx={{ mb: 3 }}>
                            <Typography variant="h6">Học kỳ {sem}</Typography>
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                {groupedBySemester[sem].map((d) => (
                                    <Grid item xs={12} md={6} key={d.curriculumDetailId || d._id}>
                                        <Paper sx={{ p: 2, cursor: 'pointer' }} onClick={() => handleOpenJson(d)}>
                                            <Typography variant="subtitle1">{d.subjectCode} — {d.subjectName}</Typography>
                                            <Typography variant="body2" color="text.secondary">Credits: {d.credits || '—'} · {d.type || ''} · Lecturer: {d.lecturer || '—'}</Typography>
                                            {/* show student's grade for this subject if available */}
                                            {grades && grades.length > 0 && (
                                                (() => {
                                                    const g = grades.find(gr => {
                                                        // grade may have populated subjectId
                                                        if (gr.subjectId) {
                                                            if (typeof gr.subjectId === 'object') return (gr.subjectId._id === d.subjectId || gr.subjectId._id === d._id || gr.subjectId._id === d.subjectId);
                                                            return (gr.subjectId === d.subjectId || gr.subjectId === d._id);
                                                        }
                                                        // fallback compare by subjectCode
                                                        return (gr.subjectCode && d.subjectCode && gr.subjectCode === d.subjectCode);
                                                    });
                                                    if (g) return <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>Điểm: {g.score ?? (g.mark ?? '-')}</Typography>;
                                                    return null;
                                                })()
                                            )}
                                            <Typography sx={{ mt: 1 }}>{d.description}</Typography>
                                            {d.learningOutcomes && d.learningOutcomes.length > 0 && (
                                                <Box sx={{ mt: 1 }}>
                                                    <Typography variant="subtitle2">Learning outcomes</Typography>
                                                    <ul>
                                                        {d.learningOutcomes.map((lo, i) => <li key={i}><Typography variant="body2">{lo}</Typography></li>)}
                                                    </ul>
                                                </Box>
                                            )}
                                            <Box sx={{ mt: 1 }}>
                                                <Button size="small" variant="outlined" onClick={(e) => { e.stopPropagation(); handleOpenJson(d); }}>Xem chi tiết</Button>
                                            </Box>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    ))}
                </>
            )}
            {/* Detail dialog for selected curriculum item */}
            <DetailDialog open={openJson} detail={selectedDetail} onClose={handleCloseJson} grades={grades} allDetails={details} />
        </Box>
    );
};

// Structured detail dialog
const DetailDialog = ({ open, detail, onClose, grades = [], allDetails = [] }) => {
    if (!detail) return null;

    // Helper: normalize id-like values to string for safe comparison
    const idEq = (a, b) => {
        if (!a || !b) return false;
        try {
            return String(a) === String(b);
        } catch (e) {
            return false;
        }
    };

    // Helper function to resolve prerequisite ID or code to subject name
    const resolvePrerequisite = (prereq) => {
        if (!prereq) return '';

        // Try to find by ID-like equality first
        const byId = allDetails.find(d => idEq(d.subjectId, prereq) || idEq(d._id, prereq));
        if (byId) return `${byId.subjectCode || '-'} - ${byId.subjectName || '-'}`;

        // Try to find by subject code (case-insensitive)
        const byCode = allDetails.find(d => d.subjectCode && String(d.subjectCode).toLowerCase() === String(prereq).toLowerCase());
        if (byCode) return `${byCode.subjectCode} - ${byCode.subjectName}`;

        // Fallback to raw string
        return String(prereq);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Chi tiết môn học</DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2">Mã môn</Typography>
                        <Typography>{detail.subjectCode || '-'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle2">Tên môn</Typography>
                        <Typography>{detail.subjectName || '-'}</Typography>
                    </Grid>
                    {detail.subjectEnglish && (
                        <Grid item xs={12}>
                            <Typography variant="subtitle2">Tên tiếng Anh</Typography>
                            <Typography>{detail.subjectEnglish}</Typography>
                        </Grid>
                    )}
                    <Grid item xs={12} sm={4}>
                        <Typography variant="subtitle2">Số tín chỉ</Typography>
                        <Typography>{detail.credits ?? '-'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Typography variant="subtitle2">Loại</Typography>
                        <Typography>{detail.type || '-'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Typography variant="subtitle2">Giảng viên</Typography>
                        <Typography>{detail.lecturer || '-'}</Typography>
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="subtitle2">Mô tả</Typography>
                        <Typography>{detail.description || '-'}</Typography>
                    </Grid>

                    <Grid item xs={12}>
                        <Typography variant="subtitle2">Chuẩn đầu ra (Learning Outcomes)</Typography>
                        {detail.learningOutcomes && detail.learningOutcomes.length > 0 ? (
                            <ol>
                                {detail.learningOutcomes.map((lo, i) => (
                                    <li key={i}><Typography variant="body2">{lo}</Typography></li>
                                ))}
                            </ol>
                        ) : (
                            <Typography>-</Typography>
                        )}
                    </Grid>

                    {/* Prerequisites section */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle2">Môn tiên quyết (Prerequisites)</Typography>
                        {detail.preRequisite && detail.preRequisite.length > 0 ? (
                            <Box sx={{ mt: 1 }}>
                                {detail.preRequisite.map((prereq, i) => (
                                    <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>
                                        • {resolvePrerequisite(prereq)}
                                    </Typography>
                                ))}
                            </Box>
                        ) : (
                            <Typography>Không có môn tiên quyết</Typography>
                        )}
                    </Grid>

                    {/* Grades for this subject (component-level) */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle2">Điểm sinh viên (chi tiết thành phần)</Typography>
                        {/** find grades for this subject from module-scoped grades state (closure) **/}
                        {(() => {
                            // find grades where subjectId/componentId match the detail subject
                            const matched = (grades || []).filter(g => {
                                // 1) subjectId may be populated object or plain id
                                if (g.subjectId) {
                                    const subjId = (typeof g.subjectId === 'object') ? g.subjectId._id : g.subjectId;
                                    if (idEq(subjId, detail.subjectId) || idEq(subjId, detail._id)) return true;
                                }

                                // 2) fallback: compare by subjectCode (case-insensitive) if available
                                if (g.subjectCode && detail.subjectCode && String(g.subjectCode).toLowerCase() === String(detail.subjectCode).toLowerCase()) return true;

                                // 3) sometimes grade objects include subjectName; fallback compare
                                if (g.subjectName && detail.subjectName && String(g.subjectName).toLowerCase() === String(detail.subjectName).toLowerCase()) return true;

                                return false;
                            });

                            if (!matched || matched.length === 0) return <Typography>-</Typography>;

                            return (
                                <Box sx={{ mt: 1 }}>
                                    {matched.map((mg, idx) => (
                                        <Box key={idx} sx={{ mb: 1 }}>
                                            <Typography variant="body2">Thành phần: {mg.componentId?.name || mg.componentName || 'Tổng'} — Điểm: {mg.score ?? mg.mark ?? '-'}</Typography>
                                        </Box>
                                    ))}
                                </Box>
                            );
                        })()}
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Đóng</Button>
            </DialogActions>
        </Dialog>
    );
};

export default CurriculumDetailsPage;
