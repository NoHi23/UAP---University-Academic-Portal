import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Box, Typography, Grid, Paper, Divider, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { useParams } from 'react-router-dom';

const CurriculumDetailsPage = () => {
    const { id } = useParams();
    const [curriculum, setCurriculum] = useState(null);
    const [details, setDetails] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await api.get(`curriculums/${id}/details`);
                setCurriculum(res.data.curriculum || null);
                setDetails(res.data.details || []);
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
            <DetailDialog open={openJson} detail={selectedDetail} onClose={handleCloseJson} />
        </Box>
    );
};

// Structured detail dialog
const DetailDialog = ({ open, detail, onClose }) => {
    if (!detail) return null;
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
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Đóng</Button>
            </DialogActions>
        </Dialog>
    );
};

export default CurriculumDetailsPage;
