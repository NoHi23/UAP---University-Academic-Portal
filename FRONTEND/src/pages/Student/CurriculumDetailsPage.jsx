import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import {
    Box,
    Typography,
    Grid,
    Paper,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Container,
    Chip,
    Card,
    CardContent,
    LinearProgress
} from '@mui/material';
import {
    School as SchoolIcon,
    Schedule as ScheduleIcon,
    Description as DescriptionIcon,
    Grade as GradeIcon
} from '@mui/icons-material';
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
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {loading ? (
                <Box sx={{ width: '100%' }}>
                    <LinearProgress />
                    <Typography sx={{ mt: 2, textAlign: 'center' }}>Đang tải thông tin chương trình...</Typography>
                </Box>
            ) : (
                <>
                    <Paper sx={{ p: 4, mb: 4, borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <SchoolIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                            <Box>
                                <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                                    {curriculum?.curriculumName || 'Chương trình'}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip
                                        icon={<DescriptionIcon />}
                                        label={curriculum?.major}
                                        color="primary"
                                        variant="outlined"
                                    />
                                    <Chip
                                        icon={<ScheduleIcon />}
                                        label={`${curriculum?.totalSemester} kỳ`}
                                        color="secondary"
                                        variant="outlined"
                                    />
                                </Box>
                            </Box>
                        </Box>

                        {curriculum?.description && (
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5', mb: 3 }}>
                                <Typography variant="body1">{curriculum.description}</Typography>
                            </Paper>
                        )}

                        <Divider sx={{ mb: 4 }} />

                        {Object.keys(groupedBySemester).sort((a, b) => a - b).map((sem) => (
                            <Box key={sem} sx={{ mb: 4 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <ScheduleIcon sx={{ mr: 1, color: 'primary.main' }} />
                                    <Typography variant="h5" sx={{ fontWeight: 500 }}>
                                        Học kỳ {sem}
                                    </Typography>
                                </Box>
                                <Grid container spacing={2}>
                                    {groupedBySemester[sem].map((d) => (
                                        <Grid item xs={12} md={6} key={d.curriculumDetailId || d._id}>
                                            <Card
                                                sx={{
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    '&:hover': {
                                                        transform: 'translateY(-4px)',
                                                        boxShadow: 3
                                                    }
                                                }}
                                                onClick={() => handleOpenJson(d)}
                                            >
                                                <CardContent>
                                                    <Typography variant="h6" gutterBottom color="primary">
                                                        {d.subjectCode} — {d.subjectName}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                                        <Chip size="small" label={`${d.credits} tín chỉ`} />
                                                        {d.type && <Chip size="small" label={d.type} variant="outlined" />}
                                                        {d.lecturer && (
                                                            <Chip
                                                                size="small"
                                                                label={`GV: ${d.lecturer}`}
                                                                variant="outlined"
                                                                color="primary"
                                                            />
                                                        )}
                                                    </Box>
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
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        ))}
                    </Paper>
                </>
            )}
            {/* Detail dialog for selected curriculum item */}
            <DetailDialog open={openJson} detail={selectedDetail} onClose={handleCloseJson} grades={grades} allDetails={details} />
        </Container>
    );
};

// Structured detail dialog
const DetailDialog = ({ open, detail, onClose, grades = [], allDetails = [] }) => {
    if (!detail) return null;

    const idEq = (a, b) => {
        if (!a || !b) return false;
        try {
            return String(a) === String(b);
        } catch (e) {
            return false;
        }
    };

    const findComponentGrades = () => {
        return (grades || []).filter(g => {
            if (g.subjectId) {
                const subjId = (typeof g.subjectId === 'object') ? g.subjectId._id : g.subjectId;
                if (idEq(subjId, detail.subjectId) || idEq(subjId, detail._id)) return true;
            }
            if (g.subjectCode && detail.subjectCode &&
                String(g.subjectCode).toLowerCase() === String(detail.subjectCode).toLowerCase()) return true;
            if (g.subjectName && detail.subjectName &&
                String(g.subjectName).toLowerCase() === String(detail.subjectName).toLowerCase()) return true;
            return false;
        });
    };

    const resolvePrerequisite = (prereq) => {
        if (!prereq) return '';
        const byId = allDetails.find(d => idEq(d.subjectId, prereq) || idEq(d._id, prereq));
        if (byId) return `${byId.subjectCode || '-'} - ${byId.subjectName || '-'}`;
        const byCode = allDetails.find(d => d.subjectCode &&
            String(d.subjectCode).toLowerCase() === String(prereq).toLowerCase());
        return byCode ? `${byCode.subjectCode} - ${byCode.subjectName}` : String(prereq);
    };

    const componentGrades = findComponentGrades();
    const finalGrade = componentGrades.find(g => !g.componentId) || componentGrades[0];

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 2 }
            }}
        >
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <SchoolIcon color="primary" sx={{ fontSize: 32 }} />
                    <Box>
                        <Typography variant="h5" gutterBottom sx={{ mb: 0 }}>
                            {detail.subjectCode} — {detail.subjectName}
                        </Typography>
                        {detail.subjectEnglish && (
                            <Typography variant="subtitle2" color="text.secondary">
                                {detail.subjectEnglish}
                            </Typography>
                        )}
                    </Box>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        <Chip
                            size="small"
                            icon={<SchoolIcon />}
                            label={`${detail.credits} tín chỉ`}
                            color="primary"
                        />
                        {detail.type && (
                            <Chip
                                size="small"
                                icon={<DescriptionIcon />}
                                label={detail.type}
                                variant="outlined"
                            />
                        )}
                        {detail.lecturer && (
                            <Chip
                                size="small"
                                icon={<ScheduleIcon />}
                                label={`GV: ${detail.lecturer}`}
                                variant="outlined"
                            />
                        )}
                        {finalGrade && (
                            <Chip
                                size="small"
                                icon={<GradeIcon />}
                                label={`Điểm: ${finalGrade.score ?? finalGrade.mark ?? '-'}`}
                                color={Number(finalGrade.score || finalGrade.mark) >= 5 ? "success" : "error"}
                            />
                        )}
                    </Box>
                </Box>

                {detail.description && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                            Mô tả môn học
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                            <Typography variant="body2">
                                {detail.description}
                            </Typography>
                        </Paper>
                    </Box>
                )}

                {componentGrades.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                            Điểm thành phần
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Grid container spacing={2}>
                                {componentGrades.map((g, i) => (
                                    <Grid item xs={12} sm={6} key={i}>
                                        <Box sx={{
                                            p: 1.5,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: 1,
                                            bgcolor: 'background.paper'
                                        }}>
                                            <Typography variant="subtitle2" color="primary">
                                                {g.componentId?.name || g.componentName || 'Điểm tổng kết'}
                                            </Typography>
                                            <Typography variant="h6">
                                                {g.score ?? g.mark ?? '-'}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        </Paper>
                    </Box>
                )}

                {detail.learningOutcomes && detail.learningOutcomes.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                            Chuẩn đầu ra (Learning Outcomes)
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            {detail.learningOutcomes.map((lo, i) => (
                                <Box
                                    key={i}
                                    sx={{
                                        display: 'flex',
                                        gap: 1,
                                        mb: i < detail.learningOutcomes.length - 1 ? 1 : 0,
                                        "&:hover": {
                                            bgcolor: 'action.hover',
                                            borderRadius: 1
                                        },
                                        p: 1
                                    }}
                                >
                                    <Typography variant="body2" color="primary" sx={{ minWidth: 24 }}>
                                        {i + 1}.
                                    </Typography>
                                    <Typography variant="body2">{lo}</Typography>
                                </Box>
                            ))}
                        </Paper>
                    </Box>
                )}

                {detail.preRequisite && detail.preRequisite.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                            Môn học tiên quyết
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {detail.preRequisite.map((prereq, i) => (
                                    <Chip
                                        key={i}
                                        icon={<SchoolIcon fontSize="small" />}
                                        label={resolvePrerequisite(prereq)}
                                        variant="outlined"
                                        color="primary"
                                    />
                                ))}
                            </Box>
                        </Paper>
                    </Box>
                )}


            </DialogContent>

            <DialogActions sx={{ p: 2.5 }}>
                <Button variant="contained" onClick={onClose}>
                    Đóng
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CurriculumDetailsPage;
