import React from 'react';
import { Card, CardContent, Typography, Button, Box } from '@mui/material';
import dayjs from 'dayjs';

const ClassCard = ({ group, onOpen }) => {
  const { className, subjectName, startDate, endDate, totalSlots } = group;
  const fmt = d => d ? dayjs(d).format('DD/MM/YYYY') : '-';

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle1" fontWeight={600}>{className} {subjectName ? `- ${subjectName}` : ''}</Typography>
        <Box mt={1} mb={1}>
          <Typography variant="body2">Thời gian: {fmt(startDate)} — {fmt(endDate)}</Typography>
          <Typography variant="body2">Số buổi: {totalSlots}</Typography>
        </Box>
        <Box display="flex" justifyContent="flex-end">
          <Button size="small" onClick={onOpen}>Xem chi tiết</Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ClassCard;
