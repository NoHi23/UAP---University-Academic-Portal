import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Avatar,
  useTheme
} from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import {
  School as SchoolIcon,
  MenuBook as MaterialIcon,
  Feedback as SuggestionIcon,
  Edit as GradeIcon,
  Image as ImageIcon,
  CalendarToday as CalendarIcon,
  BarChart as ChartIcon,
  Computer as ComputerIcon,
} from '@mui/icons-material';

import AssessmentIcon  from '@mui/icons-material/Assessment';

const LecturerDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // Dữ liệu giả lập
  const [lecturerInfo, setLecturerInfo] = React.useState(null);
  const [stats, setStats] = React.useState([
    { value: 0, label: "Lịch dạy trong tuần", color: "#4FC3F7" },
    { value: 0, label: "Lịch thi trong tuần", color: "#4FC3F7" }
  ]);

  // Load lecturer profile and weekly schedule count
  React.useEffect(() => {
    
    const load = async () => {
      try {
        // use api helper to include auth token
        const api = (await import('../../../services/api')).default;
        const profRes = await api.get('lecturer/profile');
        if (profRes?.data?.success) setLecturerInfo(profRes.data.data);
      } catch (err) {
        console.error('Load lecturer profile failed', err);
      }

      try {
        const api = (await import('../../../services/api')).default;
        const weekRes = await api.post('lecturer/schedules/my-week', {});
        if (weekRes?.data?.success && Array.isArray(weekRes.data.data)) {
          const cnt = weekRes.data.data.length;
          // backend now returns attendedCount (number of slots lecturer marked as taught)
          const attended = typeof weekRes.data.attendedCount === 'number' ? weekRes.data.attendedCount : weekRes.data.data.filter(s => s.taught).length;
          setStats(s => [ { ...s[0], value: cnt }, { ...s[1], value: attended } ]);
          if (weekRes.data.data.length > 0) {
            const first = weekRes.data.data[0];
            if (first.lecturer) setLecturerInfo(prev => prev ? prev : { firstName: first.lecturer.firstName, lastName: first.lecturer.lastName });
          }
        }
      } catch (err) {
        console.error('Load weekly schedule failed', err);
      }
    };
  load();
  return () => {};
  }, []);

  const menuItems = [
    // Personal info is shown in the top profile card, so remove duplicate quick-card
    {
      title: "Xem danh sách lớp học",
      icon: <ImageIcon sx={{ fontSize: { xs: 30, sm: 35, md: 40 } }} />,
      route: "/lecturer/my-list-class-charge"
    },
    {
      title: "Xem thời khóa biểu giảng dạy",
      icon: <CalendarIcon sx={{ fontSize: { xs: 30, sm: 35, md: 40 } }} />,
      route: "/lecturer/view-teaching-schedule"
    },
    // Attendance quick-card removed (detailed attendance pages are still available elsewhere)
    {
      title: "Xem giáo trình & tài liệu",
      icon: <MaterialIcon sx={{ fontSize: { xs: 30, sm: 35, md: 40 } }} />,
      route: "/lecturer/material"
    },
    {
      title: "Gửi đơn hỗ trợ",
      icon: <SuggestionIcon sx={{ fontSize: { xs: 30, sm: 35, md: 40 } }} />,
      route: "/lecturer/supports"
    },
    {
      title: "Xem đánh giá từ sinh viên",
      icon: <AssessmentIcon sx={{ fontSize: { xs: 30, sm: 35, md: 40 } }} />,
      route: "/lecturer/evaluations"
    },
    {
      title: "Nhập điểm cho sinh viên",
      icon: <GradeIcon sx={{ fontSize: { xs: 30, sm: 35, md: 40 } }} />,
      route: "/lecturer/enter-grades"
    },
    {
      title: "Xem điểm của sinh viên",
      icon: <ChartIcon sx={{ fontSize: { xs: 30, sm: 35, md: 40 } }} />,
      route: "/lecturer/view-grades"
    },
    {
      title: "Xem danh sách điểm danh",
      icon: <ComputerIcon sx={{ fontSize: { xs: 30, sm: 35, md: 40 } }} />,
      route: "/lecturer/view-attendance-list"
    }
  ];

  const handleMenuClick = (route) => {
    navigate(route);
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Section 1: Lecturer Info & Stats */}
        <Grid item xs={12}>
          <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 2, sm: 3 } }}>
            {/* Lecturer Profile */}
            <Grid item xs={12} lg={6}>
              <Paper
                elevation={3}
                sx={{
                  p: { xs: 2, sm: 3 },
                  height: { xs: 'auto', lg: '200px' },
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'center', sm: 'flex-start' },
                  gap: { xs: 2, sm: 3 },
                  textAlign: { xs: 'center', sm: 'left' },
                  width: '100%'
                }}
              >
                <Avatar
                  src={lecturerInfo?.lecturerAvatar || undefined}
                  sx={{
                    width: { xs: 70, sm: 80, md: 90 },
                    height: { xs: 70, sm: 80, md: 90 },
                    backgroundColor: theme.palette.primary.main,
                    border: '3px solid #000',
                    flexShrink: 0,
                    // dashboard should show circular avatar per preference B
                    borderRadius: '50%'
                  }}
                  imgProps={{ style: { objectFit: 'cover', width: '100%', height: '100%' } }}
                >
                  {!lecturerInfo?.lecturerAvatar && <SchoolIcon sx={{ fontSize: { xs: 35, sm: 40, md: 45 } }} />}
                </Avatar>
                <Paper elevation={0} sx={{ flex: 1, backgroundColor: 'transparent' }}>
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    mb={1}
                    sx={{ fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' } }}
                  >
                    Họ và tên: {lecturerInfo ? `${lecturerInfo.firstName || ''} ${lecturerInfo.lastName || ''}` : '—'}
                  </Typography>
                  {/* Birth date/place removed — data not present in Lecturer collection */}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    mb={0.5}
                    sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                  >
                    Email: {lecturerInfo?.account?.email || '—'}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                  >
                    Chuyên Ngành: {lecturerInfo?.majorId?.majorName || lecturerInfo?.major || '—'}
                  </Typography>
                  <Typography
                    component="div"
                    variant="body2"
                    sx={{
                      color: '#4FC3F7',
                      cursor: 'pointer',
                      mt: 1,
                      textDecoration: 'underline',
                      fontSize: { xs: '0.8rem', sm: '0.875rem' }
                    }}
                    onClick={() => navigate('/lecturer/profile')}
                  >
                    Xem chi tiết
                  </Typography>
                </Paper>
              </Paper>
            </Grid>

            {/* Stats */}
            <Grid item xs={12} lg={6}>
              <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ height: { xs: 'auto', lg: '200px' } }}>
                {stats.map((stat, index) => (
                  <Grid item xs={6} key={index}>
                    <Paper
                      elevation={3}
                      sx={{
                        p: { xs: 2, sm: 3 },
                        textAlign: 'center',
                        height: { xs: 'auto', lg: '100%' },
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        minHeight: { xs: '120px', sm: '140px' },
                        width: '100%'
                      }}
                    >
                      <Typography
                        variant="h1"
                        sx={{
                          fontSize: { xs: '2.5rem', sm: '3rem', md: '4rem' },
                          fontWeight: 'bold',
                          color: '#333',
                          mb: 1,
                          lineHeight: 1
                        }}
                      >
                        {stat.value}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        mb={1}
                        sx={{
                          fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                          lineHeight: 1.3
                        }}
                      >
                        {stat.label}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: stat.color,
                                cursor: 'pointer',
                                textDecoration: 'underline',
                          fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' }
                              }}
                          onClick={() => {
                            // If this is the "Lịch dạy trong tuần" card (index 0) -> go to teaching schedule
                            if (index === 0) navigate('/lecturer/view-teaching-schedule');
                            // If this is the "Lịch thi trong tuần" card (index 1) -> go to attendance list
                            if (index === 1) navigate('/lecturer/view-attendance-list');
                          }}
                      >
                        Xem chi tiết
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Section 2: Menu Items */}
        <Grid item xs={12}>
          <Grid container spacing={{ xs: 1, sm: 2 }}>
            {menuItems.map((item, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Paper
                  onClick={() => handleMenuClick(item.route)}
                  elevation={2}
                  sx={{
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    p: { xs: 1.5, sm: 2, md: 3 },
                    height: { xs: '100px', sm: '120px', md: '140px' },
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[6]
                    }
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      color: theme.palette.primary.main,
                      mb: { xs: 0.5, sm: 1 },
                      backgroundColor: 'transparent',
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'center'
                    }}
                  >
                    {item.icon}
                  </Paper>
                  <Typography
                    variant="body2"
                    fontWeight={500}
                    sx={{
                      lineHeight: 1.2,
                      fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
                      width: '100%'
                    }}
                  >
                    {item.title}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Section 3: Charts */}
        <Grid item xs={12}>
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            {/* Academic Results Chart */}
     
          
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
};

export default LecturerDashboard;