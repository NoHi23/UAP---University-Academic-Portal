import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  CircularProgress,
  Box,
  Alert,
  IconButton,
  TextField
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../../services/api';
import './StudentClassmatesPage.css';

const StudentClassmatesPage = () => {
  const { classId } = useParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [className, setClassName] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // 🔹 thêm state tìm kiếm

  useEffect(() => {
    if (classId) {
      const fetchClassmates = async () => {
        setLoading(true);
        setError('');
        setStudents([]);
        try {
          const response = await api.get(`/student/classes/${classId}/classmates`);
          setStudents(response.data.data || []);
          setClassName(`Lớp: ${response.data.className}`);
        } catch (err) {
          setError('Không thể tải danh sách lớp.');
        } finally {
          setLoading(false);
        }
      };
      fetchClassmates();
    }
  }, [classId]);

  // 🔹 lọc sinh viên theo tên hoặc mã
  const filteredStudents = students.filter((student) => {
    const fullName = `${student.lastName} ${student.firstName}`.toLowerCase();
    const code = student.studentCode?.toLowerCase() || '';
    const keyword = searchTerm.toLowerCase();
    return fullName.includes(keyword) || code.includes(keyword);
  });

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Paper elevation={3} sx={{ p: 3, position: 'relative' }}>
        <IconButton
          component={Link}
          to="/student/schedule"
          sx={{ mb: 2, position: 'absolute', top: 16, left: 16 }}
        >
          <ArrowBackIcon />
        </IconButton>

        <Typography variant="h5" fontWeight={600} mb={3} align="center">
          Danh sách Sinh viên
          {className && (
            <Typography variant="body1" color="textSecondary">
              {className}
            </Typography>
          )}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <TextField
            label="Tìm sinh viên theo tên hoặc mã"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: '50%' }}
          />
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
            <CircularProgress />
          </Box>
        )}
        {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}

        {!loading && !error && (
          <Grid container spacing={3}>
            {filteredStudents.length === 0 ? (
              <Grid item xs={12}>
                <Typography color="textSecondary" align="center" sx={{ my: 4 }}>
                  Không tìm thấy sinh viên phù hợp.
                </Typography>
              </Grid>
            ) : (
              filteredStudents.map((student) => (
                <Grid item xs={12} sm={6} md={3} lg={2.4} key={student._id}>
                  <Card
                    className="student-card"
                    variant="outlined"
                    sx={{
                      p: 2,
                      transition: '0.3s',
                      '&:hover': { transform: 'scale(1.05)', boxShadow: 4 }
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Avatar
                        src={
                          student.studentAvatar?.startsWith('data:image')
                            ? student.studentAvatar
                            : undefined
                        }
                        sx={{
                          width: 80,
                          height: 80,
                          margin: '0 auto 16px auto',
                          fontSize: '2.2rem'
                        }}
                      >
                        {`${student.lastName?.charAt(0) || ''}${student.firstName?.charAt(0) || ''}`}
                      </Avatar>
                      <Typography variant="h6" fontSize="1.1rem" fontWeight={600}>
                        {student.lastName} {student.firstName}
                      </Typography>
                      <Typography variant="body1" color="textSecondary" sx={{ mt: 0.5 }}>
                        {student.studentCode}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        )}
      </Paper>
    </Container>
  );
};

export default StudentClassmatesPage;
