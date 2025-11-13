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
    LinearProgress,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from '@mui/material';
import {
    School as SchoolIcon,
    Schedule as ScheduleIcon,
    Description as DescriptionIcon,
    Grade as GradeIcon
} from '@mui/icons-material';
import { useParams, Link } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const CurriculumDetailsPage = () => {
    const { id } = useParams();
    const [curriculum, setCurriculum] = useState(null);
    const [details, setDetails] = useState([]);
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await api.get(`/curriculums/${id}/details`);
                setCurriculum(res.data.curriculum || null);
                setDetails(res.data.details || []);
                try {
                    const gRes = await api.get('/student/grades');
                    setGrades(gRes.data.grades || []);
                } catch {
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

    const findGradesForSubjectList = (subj) =>
        (grades || []).filter(gr => {
            if (gr.subjectId) {
                const sid = typeof gr.subjectId === 'object' ? gr.subjectId._id : gr.subjectId;
                if (sid && (sid === subj.subjectId || sid === subj._id)) return true;
            }
            if (gr.subjectCode && subj.subjectCode && gr.subjectCode === subj.subjectCode) return true;
            if (gr.subjectName && subj.subjectName && gr.subjectName.toLowerCase() === subj.subjectName.toLowerCase()) return true;
            return false;
        });

    const computeAverageFromGradesList = (gradesForSubj) => {
        const normalized = (gradesForSubj || []).map(g => {
            const score = Number(String(g.score ?? g.mark ?? '').replace(',', '.')) || null;
            const w = Number(String(g.weightPercentage ?? g.weight ?? '').replace(',', '.')) || null;
            return { score, weight: w };
        });
        const totalW = normalized.reduce((s, c) => s + (c.weight || 0), 0);
        if (totalW > 0) {
            const weighted = normalized.reduce((s, c) => s + (c.score || 0) * (c.weight || 0), 0);
            return weighted / totalW;
        }
        const list = normalized.map(n => n.score).filter(v => v != null);
        if (list.length) return list.reduce((a, b) => a + b, 0) / list.length;
        return null;
    };

    const [openJson, setOpenJson] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const handleOpenJson = (detail) => { setSelectedDetail(detail); setOpenJson(true); };
    const handleCloseJson = () => { setOpenJson(false); setSelectedDetail(null); };

    return (
        <Container maxWidth="xl" sx={{ py: 4, position: 'relative' }}>
            <IconButton component={Link} to="/student/dashboard" sx={{ position: 'absolute', top: 20, left: 24 }}>
                <ArrowBackIcon />
            </IconButton>

            {loading ? (
                <Box sx={{ width: '100%' }}>
                    <LinearProgress />
                    <Typography sx={{ mt: 2, textAlign: 'center' }}>Đang tải thông tin chương trình...</Typography>
                </Box>
            ) : (
                <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <SchoolIcon sx={{ fontSize: 42, mr: 2, color: 'primary.main' }} />
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 600 }}>
                                {curriculum?.curriculumName || 'Chương trình học'}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                <Chip icon={<DescriptionIcon />} label={curriculum?.major} color="primary" variant="outlined" />
                                <Chip icon={<ScheduleIcon />} label={`${curriculum?.totalSemester} học kỳ`} color="secondary" variant="outlined" />
                            </Box>
                        </Box>
                    </Box>

                    <Divider sx={{ mb: 4 }} />

                    {Object.keys(groupedBySemester).sort((a, b) => a - b).map((sem) => (
                        <Box key={sem} sx={{ mb: 5 }}>
                            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ScheduleIcon color="primary" /> Học kỳ {sem}
                            </Typography>

                            {/* hiển thị 4 môn 1 hàng */}
                            <Grid container spacing={2}>
                                {groupedBySemester[sem].map((d) => {
                                    const gradesFor = findGradesForSubjectList(d);
                                    const fixed = computeFixedAverageAndPresent(gradesFor);
                                    const avg = fixed.avg != null ? fixed.avg : computeAverageFromGradesList(gradesFor);
                                    return (
                                        <Grid item xs={12} sm={6} md={3} key={d.curriculumDetailId || d._id}>
                                            <Card
                                                onClick={() => handleOpenJson(d)}
                                                sx={{
                                                    height: '100%',
                                                    cursor: 'pointer',
                                                    borderRadius: 3,
                                                    border: '1px solid #e0e0e0',
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': {
                                                        transform: 'translateY(-4px)',
                                                        boxShadow: 4,
                                                        borderColor: 'primary.light'
                                                    }
                                                }}
                                            >
                                                <CardContent>
                                                    <Typography
                                                        variant="subtitle1"
                                                        color="primary"
                                                        sx={{ fontWeight: 700, whiteSpace: 'pre-line' }}
                                                    >
                                                        {d.subjectCode}
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            fontWeight: 500,
                                                            whiteSpace: 'pre-line',
                                                            color: 'text.secondary',
                                                            minHeight: 48
                                                        }}
                                                    >
                                                        {d.subjectName}
                                                    </Typography>

                                                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                        {d.type && <Chip size="small" label={d.type} variant="outlined" />}
                                                        <Chip
                                                            size="small"
                                                            label={avg != null ? String(Number(avg).toFixed(2)) : '—'}
                                                            icon={<GradeIcon sx={{ fontSize: '1rem' }} />}
                                                            sx={{
                                                                minWidth: '70px',
                                                                bgcolor: (avg != null ? (avg >= 5 ? '#2E7D3215' : '#F4433615') : undefined),
                                                                color: (avg != null ? (avg >= 5 ? '#2E7D32' : '#F44336') : undefined),
                                                                borderColor: (avg != null ? (avg >= 5 ? '#2E7D3250' : '#F4433650') : undefined),
                                                                border: 1,
                                                                fontWeight: 600,
                                                                '& .MuiChip-icon': {
                                                                    color: (avg != null ? (avg >= 5 ? '#2E7D32' : '#F44336') : undefined)
                                                                }
                                                            }}
                                                        />
                                                    </Box>

                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        fullWidth
                                                        sx={{ mt: 1 }}
                                                        onClick={(e) => { e.stopPropagation(); handleOpenJson(d); }}
                                                    >
                                                        Xem chi tiết
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        </Box>
                    ))}
                </Paper>
            )}

            {/* Hộp thoại chi tiết */}
            <DetailDialog open={openJson} detail={selectedDetail} onClose={handleCloseJson} grades={grades} allDetails={details} />
        </Container>
    );
};

// Helper: compute fixed-column averages (Ass1, pt1, pt2, fe, pe)
const computeFixedAverageAndPresent = (componentGrades = []) => {
    const normalized = (componentGrades || []).map(g => ({
        name: g.componentId?.name || g.componentName || 'Điểm tổng kết',
        score: Number(String(g.score ?? g.mark ?? '').replace(',', '.')) || null,
        weight: Number(String(g.weightPercentage ?? g.weight ?? '').replace(',', '.')) || null
    }));

    const columns = [
        { key: 'ass1', label: 'Ass1', weight: 10 },
        { key: 'pt1', label: 'pt1', weight: 10 },
        { key: 'pt2', label: 'pt2', weight: 10 },
        { key: 'fe', label: 'fe', weight: 30 },
        { key: 'pe', label: 'pe', weight: 40 }
    ];

    const matchKey = (name) => {
        if (!name) return null;
        const n = name.toLowerCase();
        if (n.includes('ass')) return 'ass1';
        if (n.includes('pt1') || n.includes('test1') || n.includes('quiz1')) return 'pt1';
        if (n.includes('pt2') || n.includes('test2') || n.includes('quiz2')) return 'pt2';
        if (n.includes('fe') || n.includes('final')) return 'fe';
        if (n.includes('pe') || n.includes('practical') || n.includes('project')) return 'pe';
        return null;
    };

    const valuesByKey = {};
    normalized.forEach(c => {
        const k = matchKey(c.name) || matchKey(c.name?.replace(/\s/g, ''));
        if (k) valuesByKey[k] = c.score;
    });

    const present = columns.map(col => ({ ...col, score: (valuesByKey[col.key] != null ? valuesByKey[col.key] : null) }));
    const sumWeights = present.reduce((s, c) => s + (c.score != null ? c.weight : 0), 0);
    const weightedSum = present.reduce((s, c) => s + ((c.score != null ? c.score : 0) * (c.score != null ? c.weight : 0)), 0);
    const avg = sumWeights ? (weightedSum / sumWeights) : null;

    return { avg, present, normalized };
};

// === Chi tiết từng môn học ===
const DetailDialog = ({ open, detail, onClose, grades = [], allDetails = [] }) => {
    if (!detail) return null;
    const idEq = (a, b) => String(a) === String(b);
    const findComponentGrades = () =>
        (grades || []).filter(g => {
            const sid = typeof g.subjectId === 'object' ? g.subjectId._id : g.subjectId;
            return idEq(sid, detail.subjectId) || idEq(sid, detail._id) || g.subjectCode === detail.subjectCode;
        });

    const componentGrades = findComponentGrades();
    const normalized = componentGrades.map(g => ({
        name: g.componentId?.name || g.componentName || 'Điểm tổng kết',
        score: Number(String(g.score ?? g.mark ?? '').replace(',', '.')) || null,
        weight: Number(String(g.weightPercentage ?? g.weight ?? '').replace(',', '.')) || null
    }));

    // Fixed columns as requested
    const columns = [
        { key: 'ass1', label: 'Ass1', weight: 10 },
        { key: 'pt1', label: 'pt1', weight: 10 },
        { key: 'pt2', label: 'pt2', weight: 10 },
        { key: 'fe', label: 'fe', weight: 30 },
        { key: 'pe', label: 'pe', weight: 40 }
    ];

    const matchKey = (name) => {
        if (!name) return null;
        const n = name.toLowerCase();
        if (n.includes('ass')) return 'ass1';
        if (n.includes('pt1') || n.includes('test1') || n.includes('quiz1')) return 'pt1';
        if (n.includes('pt2') || n.includes('test2') || n.includes('quiz2')) return 'pt2';
        if (n.includes('fe') || n.includes('final')) return 'fe';
        if (n.includes('pe') || n.includes('practical') || n.includes('project')) return 'pe';
        return null;
    };

    const valuesByKey = {};
    normalized.forEach(c => {
        const k = matchKey(c.name) || matchKey(c.name?.replace(/\s/g, ''));
        if (k) valuesByKey[k] = c.score;
    });

    const present = columns.map(col => ({ ...col, score: (valuesByKey[col.key] != null ? valuesByKey[col.key] : null) }));
    const sumWeights = present.reduce((s, c) => s + (c.score != null ? c.weight : 0), 0);
    const weightedSum = present.reduce((s, c) => s + ((c.score != null ? c.score : 0) * (c.score != null ? c.weight : 0)), 0);
    const fixedWeightedAvg = sumWeights ? (weightedSum / sumWeights) : null;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {detail.subjectCode} — {detail.subjectName}
                </Typography>
            </DialogTitle>
            <DialogContent dividers>
                {/* Mô tả môn học (nếu có) */}
                {(detail.description || detail.subjectDescription || detail.note) && (
                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
                        {detail.description || detail.subjectDescription || detail.note}
                    </Typography>
                )}

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                    <Chip icon={<SchoolIcon />} label={`${detail.credits} tín chỉ`} color="primary" />
                    {fixedWeightedAvg != null && (
                        <Chip
                            icon={<GradeIcon />}
                            label={`Điểm TB: ${fixedWeightedAvg.toFixed(2)}`}
                            color={fixedWeightedAvg >= 5 ? 'success' : 'error'}
                        />
                    )}
                </Box>

                {normalized.length > 0 && (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                            Điểm thành phần
                        </Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        {present.map((col) => (
                                            <TableCell key={col.key} align="center">{`${col.label} (${col.weight}%)`}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <TableRow>
                                        {present.map((col) => (
                                            <TableCell key={col.key} align="center">{col.score != null ? col.score : '-'}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="contained">Đóng</Button>
            </DialogActions>
        </Dialog>
    );
};

export default CurriculumDetailsPage;