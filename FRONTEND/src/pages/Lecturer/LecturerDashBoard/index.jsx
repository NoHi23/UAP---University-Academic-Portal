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
  Person as PersonIcon,
  CheckCircle as AttendanceIcon,
  MenuBook as MaterialIcon,
  Feedback as SuggestionIcon,
  Star as EvaluationIcon,
  Edit as GradeIcon,
  Image as ImageIcon,
  CalendarToday as CalendarIcon,
  BarChart as ChartIcon,
  Computer as ComputerIcon
} from '@mui/icons-material';

const LecturerDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // Dữ liệu giả lập
  const lecturerInfo = {
    name: "Nguyễn Văn A",
    birthDate: "DD/MM/YYYY",
    birthPlace: "Hà Nội",
    major: "Kỹ thuật phần mềm"
  };

  const stats = [
    { value: 4, label: "Lịch dạy trong tuần", color: "#4FC3F7" },
    { value: 0, label: "Lịch thi trong tuần", color: "#FF7043" }
  ];

  const menuItems = [
    { 
      title: "Chỉnh sửa thông tin cá nhân", 
      icon: <PersonIcon sx={{ fontSize: { xs: 30, sm: 35, md: 40 } }} />,
      route: "/lecturer/edit-personal-info"
    },
    { 
      title: "Xem thông tin lớp học", 
      icon: <ImageIcon sx={{ fontSize: { xs: 30, sm: 35, md: 40 } }} />,
      route: "/lecturer/view-class-info"
    },
    { 
      title: "Xem thời khóa biểu giảng dạy", 
      icon: <CalendarIcon sx={{ fontSize: { xs: 30, sm: 35, md: 40 } }} />,
      route: "/lecturer/view-teaching-schedule"
    },
    { 
      title: "Điểm danh sinh viên", 
      icon: <AttendanceIcon sx={{ fontSize: { xs: 30, sm: 35, md: 40 } }} />,
      route: "/lecturer/take-attendance"
    },
    { 
      title: "Xem giáo trình & tài liệu", 
      icon: <MaterialIcon sx={{ fontSize: { xs: 30, sm: 35, md: 40 } }} />,
      route: "/lecturer/access-course-materials"
    },
    { 
      title: "Gửi đóng góp ý kiến", 
      icon: <SuggestionIcon sx={{ fontSize: { xs: 30, sm: 35, md: 40 } }} />,
      route: "/lecturer/submit-suggestions"
    },
    { 
      title: "Xem đánh giá từ sinh viên", 
      icon: <EvaluationIcon sx={{ fontSize: { xs: 30, sm: 35, md: 40 } }} />,
      route: "/lecturer/view-student-evaluations"
    },
    { 
      title: "Nhập điểm cho sinh viên", 
      icon: <GradeIcon sx={{ fontSize: { xs: 30, sm: 35, md: 40 } }} />,
      route: "/lecturer/enter-student-grades"
    },
    { 
      title: "Xem điểm của sinh viên", 
      icon: <ChartIcon sx={{ fontSize: { xs: 30, sm: 35, md: 40 } }} />,
      route: "/lecturer/view-student-grades"
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
                  sx={{
                    width: { xs: 70, sm: 80, md: 90 },
                    height: { xs: 70, sm: 80, md: 90 },
                    backgroundColor: theme.palette.primary.main,
                    border: '3px solid #000',
                    flexShrink: 0
                  }}
                >
                  <SchoolIcon sx={{ fontSize: { xs: 35, sm: 40, md: 45 } }} />
                </Avatar>
                <Paper elevation={0} sx={{ flex: 1, backgroundColor: 'transparent' }}>
                  <Typography 
                    variant="h6" 
                    fontWeight={600} 
                    mb={1}
                    sx={{ fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' } }}
                  >
                    Họ và tên: {lecturerInfo.name}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    mb={0.5}
                    sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                  >
                    Ngày sinh: {lecturerInfo.birthDate}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    mb={0.5}
                    sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                  >
                    Nơi Sinh: {lecturerInfo.birthPlace}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                  >
                    Chuyên Ngành: {lecturerInfo.major}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#4FC3F7', 
                      cursor: 'pointer',
                      mt: 1,
                      textDecoration: 'underline',
                      fontSize: { xs: '0.8rem', sm: '0.875rem' }
                    }}
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
              <Grid item xs={6} sm={4} md={2.4} key={index}>
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
            <Grid item xs={12} md={6}>
              <Paper 
                elevation={3} 
                sx={{ 
                  p: { xs: 2, sm: 3 }, 
                  height: { xs: '250px', sm: '280px', md: '320px' },
                  width: '100%'
                }}
              >
                <Typography 
                  variant="h6" 
                  fontWeight={600} 
                  mb={3}
                  sx={{ fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' } }}
                >
                  Kết quả học tập
                </Typography>
                <Paper 
                  elevation={0}
                  sx={{ 
                    height: { xs: '180px', sm: '200px', md: '240px' },
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    gap: { xs: 0.5, sm: 1 },
                    backgroundColor: 'transparent',
                    position: 'relative'
                  }}
                >
                  {/* Bar Chart Simulation */}
                  {[30, 45, 60, 40, 80, 70, 90].map((height, index) => (
                    <Paper
                      key={index}
                      elevation={1}
                      sx={{
                        width: { xs: 15, sm: 20, md: 25 },
                        height: `${height}%`,
                        backgroundColor: theme.palette.success.main,
                        borderRadius: '4px 4px 0 0'
                      }}
                    />
                  ))}
                  {/* Line Chart Simulation */}
                  <Paper
                    elevation={0}
                    sx={{
                      position: 'absolute',
                      width: '80%',
                      height: '80%',
                      backgroundColor: 'transparent',
                      backgroundImage: `linear-gradient(45deg, ${theme.palette.info.main} 2px, transparent 2px)`,
                      backgroundSize: { xs: '15px 15px', sm: '20px 20px' },
                      opacity: 0.7,
                      pointerEvents: 'none'
                    }}
                  />
                </Paper>
              </Paper>
            </Grid>

            {/* Academic Progress */}
            <Grid item xs={12} md={6}>
              <Paper 
                elevation={3} 
                sx={{ 
                  p: { xs: 2, sm: 3 }, 
                  height: { xs: '250px', sm: '280px', md: '320px' },
                  width: '100%'
                }}
              >
                <Typography 
                  variant="h6" 
                  fontWeight={600} 
                  mb={3}
                  sx={{ fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' } }}
                >
                  Tiến độ học tập
                </Typography>
                <Paper 
                  elevation={0}
                  sx={{ 
                    height: { xs: '180px', sm: '200px', md: '240px' },
                    backgroundColor: '#f8f9fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 2
                  }}
                >
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                  >
                    Biểu đồ tiến độ học tập
                  </Typography>
                </Paper>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
};

export default LecturerDashboard;