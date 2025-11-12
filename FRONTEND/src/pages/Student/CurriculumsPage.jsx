import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    Container,
    Paper,
    Chip,
    Divider,
    CircularProgress,
    Stack,
    IconButton
} from '@mui/material';
import { School as SchoolIcon, Grade as GradeIcon } from '@mui/icons-material';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const gradeColors = {
    'A+': '#2E7D32', // dark green
    'A': '#388E3C',  // slightly lighter green
    'B+': '#1976D2', // dark blue
    'B': '#2196F3',  // lighter blue
    'C+': '#F57C00', // dark orange
    'C': '#FF9800',  // orange
    'D+': '#D32F2F', // dark red
    'D': '#E57373',  // lighter red
    'F+': '#B71C1C', // very dark red
    'F': '#F44336',  // bright red
    '—': '#9e9e9e'   // grey for no grade
};

const CurriculumsPage = () => {
    const [curriculums, setCurriculums] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const fetch = async () => {
            try {
                const params = new URLSearchParams(location.search);
                const majorId = params.get('majorId');
                const url = majorId ? `curriculums?majorId=${majorId}` : 'curriculums';
                const res = await api.get(url);
                setCurriculums(res.data || []);
            } catch (err) {
                console.error('Failed to load curriculums', err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [location.search]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4, position: 'relative' }}>
            <IconButton component={Link} to="/student/dashboard" sx={{ position: 'absolute', top: 16, left: 16 }}>
                <ArrowBackIcon />
            </IconButton>
            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    mb: 4,
                    borderRadius: 3,
                    background: 'linear-gradient(to right, #f8f9fa, #f1f8ff)'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SchoolIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        Chương trình đào tạo
                    </Typography>
                </Box>
                <Divider sx={{ mb: 3 }} />

                {curriculums.length === 0 ? (
                    <Typography align="center" color="text.secondary">
                        Không có chương trình nào.
                    </Typography>
                ) : (
                    curriculums.map((curriculum) => (
                        <Paper
                            key={curriculum._id || curriculum.curriculumId}
                            elevation={2}
                            sx={{
                                p: 3,
                                mb: 4,
                                borderRadius: 3,
                                bgcolor: '#fff'
                            }}
                        >
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                {`Học kỳ ${curriculum.semester || '—'} | Năm học ${curriculum.year || '2024-2025'}`}
                            </Typography>

                            <Grid container spacing={3}>
                                {(curriculum.subjects || []).map((subj, idx) => (
                                    <Grid item xs={12} sm={6} md={3} key={idx}>
                                        <Card
                                            sx={{
                                                height: 160,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                borderRadius: 2,
                                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                                '&:hover': {
                                                    transform: 'translateY(-4px)',
                                                    boxShadow: 3
                                                }
                                            }}
                                        >
                                            <CardContent sx={{
                                                p: 2.5,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                height: '100%',
                                                justifyContent: 'space-between',
                                                '&:last-child': {
                                                    pb: 2.5
                                                }
                                            }}>
                                                <Box>
                                                    <Typography
                                                        variant="subtitle1"
                                                        sx={{
                                                            fontWeight: 600,
                                                            color: 'primary.main',
                                                            mb: 1,
                                                            height: '2.6em',
                                                            lineHeight: 1.3,
                                                            overflow: 'hidden',
                                                            display: '-webkit-box',
                                                            WebkitBoxOrient: 'vertical',
                                                            WebkitLineClamp: 2
                                                        }}
                                                    >
                                                        {subj.name}
                                                    </Typography>
                                                </Box>
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    alignItems="center"
                                                    justifyContent="space-between"
                                                >
                                                    <Chip
                                                        size="small"
                                                        label={`${subj.credit || 2} tín chỉ`}
                                                        variant="outlined"
                                                        sx={{
                                                            borderColor: 'rgba(0, 0, 0, 0.12)',
                                                            backgroundColor: 'white'
                                                        }}
                                                    />
                                                    <Chip
                                                        size="small"
                                                        label={subj.grade || '—'}
                                                        icon={<GradeIcon sx={{ fontSize: '1rem' }} />}
                                                        sx={{
                                                            minWidth: '70px',
                                                            bgcolor: gradeColors[subj.grade] ? gradeColors[subj.grade] + '15' : undefined,
                                                            color: gradeColors[subj.grade] || '#555',
                                                            borderColor: gradeColors[subj.grade] ? gradeColors[subj.grade] + '50' : undefined,
                                                            border: 1,
                                                            fontWeight: 600,
                                                            '& .MuiChip-icon': {
                                                                color: gradeColors[subj.grade] || '#555'
                                                            }
                                                        }}
                                                    />
                                                </Stack>
                                                {/* pass/fail indicator based on numeric grade (>= 5 = pass) */}
                                                {(() => {
                                                    const raw = subj.grade;
                                                    const numeric = raw === undefined || raw === null ? NaN : parseFloat(String(raw).replace(',', '.'));
                                                    if (!isNaN(numeric)) {
                                                        const passed = numeric >= 5;
                                                        return (
                                                            <Typography variant="body2" sx={{ mt: 1, fontWeight: 700, color: passed ? 'success.main' : 'error.main' }}>
                                                                {passed ? 'Đạt' : 'Không đạt'}
                                                            </Typography>
                                                        );
                                                    }
                                                    // if not numeric, show neutral text
                                                    return (
                                                        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                                                            {raw ? String(raw) : '—'}
                                                        </Typography>
                                                    );
                                                })()}
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </Paper>
                    ))
                )}
            </Paper>
        </Container>
    );
};

export default CurriculumsPage;
