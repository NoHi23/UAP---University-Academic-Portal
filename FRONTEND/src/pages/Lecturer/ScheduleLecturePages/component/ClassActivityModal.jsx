import React from 'react';
import { Dialog, DialogTitle, IconButton, DialogContent, Box, Card, CardContent, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GroupIcon from '@mui/icons-material/Group';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import { useNavigate } from 'react-router-dom';

const ClassActivityModal = ({ open, onClose, schedule }) => {
  const subject = schedule?.subjectId?.subjectName || schedule?.subjectId?.subjectCode || '';
  const className = schedule?.classId?.className || schedule?.classId?.name || '';
  const room = schedule?.roomId?.roomName || '';
  const time = schedule?.timeDisplay || '';

  const navigate = useNavigate();

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>Chi tiết hoạt động lớp học</Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {/* Left: View details */}
            <Card sx={{ flex: 1, cursor: 'pointer' }} onClick={() => {
                // close modal then navigate to detail page
                try {
                  const id = schedule?._id || schedule?.id;
                  onClose && onClose();
                  if (id) navigate(`/lecture/view-detail-schedule/${id}`);
                  else console.warn('No schedule id to navigate to', schedule);
                } catch (err) {
                  console.error(err);
                }
              }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                <Box sx={{ width: 96, height: 96, mb: 1, borderRadius: 2, backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GroupIcon sx={{ fontSize: 56, color: 'primary.main' }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Xem chi tiết</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                  {subject}{subject && (className || room || time) ? ' · ' : ''}{className}{className && room ? ' · ' : ''}{room}{(room && time) ? ' · ' : ''}{time}
                </Typography>
              </CardContent>
            </Card>

            {/* Right: Attendance */}
            <Card sx={{ flex: 1, cursor: 'pointer' }} onClick={() => { console.log('Open attendance for', schedule); }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                <Box sx={{ width: 96, height: 96, mb: 1, borderRadius: 2, backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HowToRegIcon sx={{ fontSize: 56, color: 'primary.main' }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Điểm Danh</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>Điểm danh lớp và theo dõi danh sách sinh viên</Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ClassActivityModal;
