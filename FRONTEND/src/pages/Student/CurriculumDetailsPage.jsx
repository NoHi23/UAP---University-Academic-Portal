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
                    console.log('🔍 API Response grades:', gRes.data);
                    setGrades(gRes.data.grades || []);
                } catch (err) {
                    console.error('❌ Failed to load grades:', err);
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

    const findGradesForSubjectList = (subj) => {
        const result = (grades || []).filter(gr => {
            if (gr.subjectId) {
                const sid = typeof gr.subjectId === 'object' ? gr.subjectId._id : gr.subjectId;
                if (sid && (sid === subj.subjectId || sid === subj._id)) return true;
            }
            if (gr.subjectCode && subj.subjectCode && gr.subjectCode === subj.subjectCode) return true;
            if (gr.subjectName && subj.subjectName && gr.subjectName.toLowerCase() === subj.subjectName.toLowerCase()) return true;
            return false;
        });

        console.log(`🔍 Subject ${subj.subjectCode}:`, {
            subject: subj,
            foundGrades: result,
            allGrades: grades
        });

        return result;
    };

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

// Helper: compute averages using actual weightPercentage from database
const computeFixedAverageAndPresent = (componentGrades = []) => {
    console.log('🔍 computeFixedAverageAndPresent input:', componentGrades);
    // Normalize grades but keep items even if weight is missing so we can fallback
    const normalized = (componentGrades || []).map(g => ({
        name: g.componentId?.name || g.componentName || 'Điểm tổng kết',
        score: Number(String(g.score ?? g.mark ?? '').replace(',', '.')) || null,
        weight: (g.weightPercentage ?? g.weight) != null ? Number(String(g.weightPercentage ?? g.weight ?? '').replace(',', '.')) : null
    })).filter(g => g.score !== null); // keep items that have scores

    console.log('🔍 normalized grades (with possible missing weights):', normalized);

    // Sum only existing weights
    const totalWeight = normalized.reduce((sum, g) => sum + (g.weight || 0), 0);
    let avg = null;
    let present = [];

    if (totalWeight > 0) {
        const weightedSum = normalized.reduce((sum, g) => sum + ((g.score || 0) * (g.weight || 0)), 0);
        avg = weightedSum / totalWeight;
        present = normalized.map(g => ({ label: g.name, score: g.score, weight: g.weight }));
        console.log('🔍 calculation (weighted):', { totalWeight, weightedSum, avg });
    } else if (normalized.length > 0) {
        // Fallback: equal-weight average when no weights provided
        const n = normalized.length;
        const simpleSum = normalized.reduce((s, g) => s + (g.score || 0), 0);
        avg = simpleSum / n;
        const equalWeight = 100 / n;
        present = normalized.map(g => ({ label: g.name, score: g.score, weight: Number(equalWeight.toFixed(2)) }));
        console.log('🔍 calculation (equal-weight fallback):', { n, simpleSum, avg, equalWeight });
    }

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
        weight: (g.weightPercentage ?? g.weight) != null ? Number(String(g.weightPercentage ?? g.weight ?? '').replace(',', '.')) : null
    })).filter(g => g.score !== null);

    // Compute average with fallback to equal-weight when no weights present
    const totalWeight = normalized.reduce((s, g) => s + (g.weight || 0), 0);
    let actualWeightedAvg = null;
    let displayRows = [];
    if (totalWeight > 0) {
        const weightedSum = normalized.reduce((s, g) => s + ((g.score || 0) * (g.weight || 0)), 0);
        actualWeightedAvg = weightedSum / totalWeight;
        displayRows = normalized.map(g => ({ name: g.name, score: g.score, weight: g.weight }));
        console.log('🔍 DetailDialog weighted calc', { normalized, totalWeight, weightedSum: weightedSum, actualWeightedAvg });
    } else if (normalized.length > 0) {
        const n = normalized.length;
        const simpleSum = normalized.reduce((s, g) => s + (g.score || 0), 0);
        actualWeightedAvg = simpleSum / n;
        const equalWeight = Number((100 / n).toFixed(2));
        displayRows = normalized.map(g => ({ name: g.name, score: g.score, weight: equalWeight }));
        console.log('🔍 DetailDialog equal-weight fallback', { normalized, n, simpleSum, actualWeightedAvg, equalWeight });
    } else {
        console.log('🔍 DetailDialog: no component grades found', { componentGrades });
    }

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
                    {actualWeightedAvg != null && (
                        <Chip
                            icon={<GradeIcon />}
                            label={`Điểm TB: ${actualWeightedAvg.toFixed(2)}`}
                            color={actualWeightedAvg >= 5 ? 'success' : 'error'}
                        />
                    )}
                </Box>

                {displayRows.length > 0 && (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                            Điểm thành phần
                        </Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Loại điểm</TableCell>
                                        <TableCell align="center">Điểm số</TableCell>
                                        <TableCell align="center">Tỷ trọng (%)</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {displayRows.map((grade, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{grade.name}</TableCell>
                                            <TableCell align="center">{grade.score}</TableCell>
                                            <TableCell align="center">{grade.weight}%</TableCell>
                                        </TableRow>
                                    ))}
                                    <TableRow sx={{ bgcolor: 'grey.50', fontWeight: 'bold' }}>
                                        <TableCell sx={{ fontWeight: 600 }}>Tổng cộng</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600 }}>
                                            {actualWeightedAvg != null ? actualWeightedAvg.toFixed(2) : '-'}
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600 }}>
                                            {displayRows.reduce((s, r) => s + (r.weight || 0), 0)}%
                                        </TableCell>
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