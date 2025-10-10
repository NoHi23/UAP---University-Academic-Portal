import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import WeekTimeTable from './component/WeekTimeTable ';

const ScheduleLecturePages = () => {

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" fontWeight={600} color="primary" gutterBottom>
                    Xem Thời Khóa Biểu Giảng Dạy
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Quản lý và xem lịch giảng dạy theo tuần
                </Typography>
            </Box>

            <WeekTimeTable />
        </Container>
    )
}
export default ScheduleLecturePages;